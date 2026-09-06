import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { chromium } from "@playwright/test";
const origin = process.env.SMOKE_ORIGIN ?? "http://localhost:3000";
const accounts = [
  ...fs
    .readFileSync("src/scripts/seed.ts", "utf8")
    .matchAll(
      /email: '([^']+)',\s*passwordHash: await bcrypt.hash\('([^']+)'/g,
    ),
];
let id;
let browser;
const tag = "catalog-smoke-" + randomUUID();
let checks = 0;
async function call(cookie, path, method = "GET", body, status = 200) {
  const response = await fetch(origin + "/api" + path, {
    method,
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  assert.equal(response.status, status, JSON.stringify(result));
  checks++;
  return {
    data: result.data ?? result,
    cookie: response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; "),
  };
}
try {
  const admin = (
    await call("", "/auth/login", "POST", {
      email: accounts[0][1],
      password: accounts[0][2],
    })
  ).cookie;
  const sales = (
    await call("", "/auth/login", "POST", {
      email: accounts[2][1],
      password: accounts[2][2],
    })
  ).cookie;
  const input = {
    name: tag,
    sku: tag,
    category: "Hardware",
    basePrice: 100,
    baseCost: 60,
    currency: "USD",
    isSubscription: false,
    billingFrequency: "NONE",
    availableStock: 3,
    status: "ACTIVE",
    variants: [],
  };
  const created = (await call(admin, "/catalog", "POST", input)).data;
  id = created.id;
  assert.equal(created.availableStock, 3);
  checks++;
  await call(sales, "/catalog", "POST", input, 403);
  await call(admin, "/warehouse-stock", "PATCH", {
    productId: id,
    availableStock: 5,
    expectedAvailableStock: 3,
  });
  await call(
    admin,
    "/warehouse-stock",
    "PATCH",
    { productId: id, availableStock: 9, expectedAvailableStock: 3 },
    409,
  );
  await call(
    admin,
    "/warehouse-stock",
    "PATCH",
    { productId: id, availableStock: -1, expectedAvailableStock: 5 },
    400,
  );
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.request.post(origin + "/api/auth/login", {
    data: { email: accounts[0][1], password: accounts[0][2] },
  });
  const page = await context.newPage();
  await page.goto(origin + "/products/" + id, { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").textContent(), tag);
  checks++;
  await page.getByRole("button", { name: "Add variant", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("Smoke option");
  await page.getByLabel("SKU", { exact: true }).fill(tag + "-V");
  await page.getByRole("button", { name: "Save variant", exact: true }).click();
  await page
    .getByRole("heading", { name: "Smoke option", exact: true })
    .waitFor();
  checks++;
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(
    await page
      .getByRole("heading", { name: "Smoke option", exact: true })
      .count(),
    1,
  );
  checks++;
  await page
    .getByRole("button", { name: "Adjust available stock", exact: true })
    .click();
  await page.getByLabel("Available units", { exact: true }).fill("7");
  await page.getByRole("button", { name: "Save stock", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  checks++;
  const saved = (await call(admin, "/catalog")).data.find((p) => p.id === id);
  assert.equal(saved.availableStock, 7);
  assert.equal(saved.variants[0].name, "Smoke option");
  checks += 2;
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 2,
    ),
    false,
  );
  checks++;
  await call(admin, "/admin/products/" + id, "DELETE");
  assert.equal(
    (await call(sales, "/catalog")).data.some((p) => p.id === id),
    false,
  );
  checks++;
  assert.equal(
    (await call(admin, "/catalog")).data.find((p) => p.id === id).status,
    "ARCHIVED",
  );
  checks++;
  console.log(
    "PASS: " +
      checks +
      " catalog checks, including browser variant creation, reload persistence, stock adjustment, stale-write rejection, archiving, and mobile layout.",
  );
} finally {
  await browser?.close();
  if (id) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const db = await pool.connect();
    try {
      await db.query("BEGIN");
      const owned = await db.query(
        "select id from products where id=$1 and sku=$2",
        [id, tag],
      );
      assert.equal(owned.rowCount, 1);
      await db.query("delete from inventory where product_id=$1", [id]);
      await db.query("delete from price_list_items where product_id=$1", [id]);
      await db.query("delete from products where id=$1 and sku=$2", [id, tag]);
      await db.query("delete from audit_logs where entity_id=$1", [id]);
      await db.query("COMMIT");
      console.log("Removed only the generated catalog fixture.");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally {
      db.release();
      await pool.end();
    }
  }
}
