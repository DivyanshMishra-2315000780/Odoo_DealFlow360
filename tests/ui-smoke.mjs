import { chromium } from "@playwright/test";
import fs from "node:fs";
import assert from "node:assert/strict";
const origin = process.env.SMOKE_ORIGIN ?? "http://localhost:3000";
const accounts = [
  ...fs
    .readFileSync("src/scripts/seed.ts", "utf8")
    .matchAll(
      /email: '([^']+)',\s*passwordHash: await bcrypt.hash\('([^']+)'/g,
    ),
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
fs.mkdirSync("test-results/ui", { recursive: true });
const failures = [];
let checks = 0;
try {
  for (const [index, role, paths] of [
    [
      2,
      "sales",
      [
        "/",
        "/quotes",
        "/quotes/new",
        "/customers",
        "/requirements",
        "/fulfillment",
        "/invoices",
        "/subscriptions",
        "/reports",
        "/deal-health",
      ],
    ],
    [
      0,
      "admin",
      [
        "/products",
        "/products/new",
        "/price-lists",
        "/settings/discount-rules",
        "/settings/employees",
      ],
    ],
    [3, "finance", ["/approvals", "/invoices", "/subscriptions"]],
    [
      4,
      "customer",
      [
        "/portal",
        "/portal/requirements",
        "/portal/requirements/new",
        "/portal/quotations",
        "/portal/invoices",
        "/portal/subscriptions",
        "/portal/profile",
      ],
    ],
  ]) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => failures.push(role + ": " + error.message));
    const response = await context.request.post(origin + "/api/auth/login", {
      data: { email: accounts[index][1], password: accounts[index][2] },
    });
    assert.equal(response.status(), 200);
    for (const route of paths) {
      await page.goto(origin + route, {
        waitUntil: "networkidle",
        timeout: 90000,
      });
      const heading = await page
        .locator("h1")
        .first()
        .textContent({ timeout: 15000 })
        .catch(() => null);
      if (!heading)
        failures.push(role + " " + route + ": missing page heading");
      if (page.url().includes("/login"))
        failures.push(role + " " + route + ": unexpected login redirect");
      const alerts = await page.getByRole("alert").allTextContents();
      if (
        alerts.some((t) =>
          /failed|not authorized|missing required|internal server|invalid/i.test(
            t,
          ),
        )
      )
        failures.push(role + " " + route + ": " + alerts.join(" "));
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 2,
      );
      if (overflow)
        failures.push(role + " " + route + ": desktop horizontal overflow");
      checks++;
      if (route === "/" || route === "/reports" || route === "/portal")
        await page.screenshot({
          path:
            "test-results/ui/" +
            role +
            "-" +
            (route === "/"
              ? "dashboard"
              : route.slice(1).replaceAll("/", "-")) +
            ".png",
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of paths.filter((p) =>
      [
        "/",
        "/quotes/new",
        "/products/new",
        "/portal",
        "/portal/requirements/new",
        "/settings/employees",
      ].includes(p),
    )) {
      await page.goto(origin + route, {
        waitUntil: "networkidle",
        timeout: 90000,
      });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 2,
        )
      )
        failures.push(role + " " + route + ": mobile horizontal overflow");
      await page.screenshot({
        path:
          "test-results/ui/" +
          role +
          "-mobile-" +
          (route === "/" ? "dashboard" : route.slice(1).replaceAll("/", "-")) +
          ".png",
        fullPage: true,
      });
      checks++;
    }
    await context.request.post(origin + "/api/auth/logout");
    await context.close();
  }
  console.log("Browser checked " + checks + " desktop/mobile route views.");
  if (failures.length) {
    for (const failure of [...new Set(failures)]) console.error(failure);
    process.exitCode = 1;
  } else
    console.log(
      "PASS: no runtime errors, unexpected redirects, or horizontal page overflow.",
    );
} finally {
  await browser.close();
}
