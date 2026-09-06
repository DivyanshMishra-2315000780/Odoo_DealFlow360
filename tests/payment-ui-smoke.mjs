import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const origin = process.env.SMOKE_ORIGIN ?? "http://localhost:3100";
const browser = await chromium.launch({ channel: "msedge", headless: true });
let checks = 0;
try {
  for (const scenario of [
    "success",
    "cancel",
    "failure",
    "verification-retry",
    "reload-recovery",
    "unconfigured",
    "script-failure",
    "paid",
    "undelivered",
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    let checkoutCalls = 0,
      verifyCalls = 0,
      paid = scenario === "paid";
    const errors = [];
    await context.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data = [];
      let status = 200;
      if (path === "/api/auth/me") {
        await route.fulfill({
          json: {
            user: {
              userId: "payment-test-user",
              customerId: "payment-test-customer",
              email: "test@example.invalid",
              role: "CUSTOMER",
              firstName: "Payment",
              lastName: "Test",
              sessionId: "test-session",
            },
          },
        });
        return;
      }
      if (path === "/api/customer/profile")
        data = {
          customer: {
            id: "payment-test-customer",
            name: "Payment Test",
            tier: "BRONZE",
          },
          user: {
            firstName: "Payment",
            lastName: "Test",
            email: "test@example.invalid",
          },
        };
      if (path === "/api/invoices")
        data = [
          {
            invoice: {
              id: "invoice-test",
              invoiceNumber: "INV-TEST",
              customerId: "payment-test-customer",
              orderId: "order-test",
              status: paid ? "PAID" : "PARTIALLY_PAID",
              total: "20.00",
              amountDue: paid ? "0" : "12.34",
              currency: "USD",
              createdAt: "2026-09-01",
              dueDate: "2026-09-30",
            },
            fulfillment: {
              status: scenario === "undelivered" ? "PENDING" : "DELIVERED",
            },
            lines: [],
            payments: [],
          },
        ];
      if (path === "/api/payments/checkout") {
        checkoutCalls++;
        assert.deepEqual(route.request().postDataJSON(), {
          invoiceId: "invoice-test",
        });
        checks++;
        if (scenario === "unconfigured") {
          status = 503;
          data = undefined;
        } else
          data = {
            paymentId: "payment-test",
            keyId: "rzp_test_mock",
            orderId: "provider-order",
            amount: 1234,
            currency: "USD",
          };
      }
      if (path === "/api/payments/verify") {
        verifyCalls++;
        assert.equal(route.request().postDataJSON().paymentId, "payment-test");
        checks++;
        if (
          ["verification-retry", "reload-recovery"].includes(scenario) &&
          verifyCalls === 1
        ) {
          status = 502;
          data = undefined;
        } else {
          paid = true;
          data = { status: "SUCCESS" };
        }
      }
      await route.fulfill({
        status,
        json:
          status === 200
            ? { data }
            : {
                error:
                  scenario === "unconfigured"
                    ? "Razorpay is not configured"
                    : "Verification temporarily unavailable",
              },
      });
    });
    await context.route(
      "https://checkout.razorpay.com/v1/checkout.js",
      (route) =>
        scenario === "script-failure"
          ? route.abort()
          : route.fulfill({
              contentType: "application/javascript",
              body:
                "window.Razorpay=class {constructor(options){this.options=options;window.checkoutOptions=options;}on(event,handler){this.failure=handler;}close(){}open(){setTimeout(()=>{const scenario=" +
                JSON.stringify(scenario) +
                ';if(scenario==="cancel")this.options.modal.ondismiss();else if(scenario==="failure")this.failure({error:{description:"Card declined"}});else this.options.handler({razorpay_order_id:"provider-order",razorpay_payment_id:"provider-payment",razorpay_signature:"a".repeat(64)});},30);}};',
            }),
    );
    // Fail the test if the implementation tries another third-party network request.
    await context.route("https://api.razorpay.com/**", (route) => {
      errors.push("Unexpected live provider request");
      return route.abort();
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin + "/portal/invoices", { waitUntil: "networkidle" });
    if (["paid", "undelivered"].includes(scenario)) {
      assert.equal(
        await page.getByRole("button", { name: "Pay securely" }).count(),
        0,
      );
      checks++;
    } else {
      await page.getByRole("button", { name: "Pay securely" }).click();
      if (scenario === "success") {
        await page
          .getByText("Payment verified. Your invoice balance has been updated.")
          .waitFor();
        assert.equal(
          await page.getByRole("button", { name: "Pay securely" }).count(),
          0,
        );
        checks++;
      }
      if (scenario === "cancel") {
        await page
          .getByText("Checkout closed. No payment has been confirmed.")
          .waitFor();
        assert.equal(verifyCalls, 0);
        assert.equal(
          await page.getByRole("button", { name: "Pay securely" }).isEnabled(),
          true,
        );
        checks += 2;
      }
      if (scenario === "failure") {
        await page.getByText("Card declined", { exact: true }).waitFor();
        assert.equal(verifyCalls, 0);
        checks++;
      }
      if (["verification-retry", "reload-recovery"].includes(scenario)) {
        await page
          .getByRole("button", { name: "Retry verification" })
          .waitFor();
        await page.getByText(/If you were charged, do not pay again/).waitFor();
        if (scenario === "reload-recovery")
          await page.reload({ waitUntil: "networkidle" });
        await page.getByRole("button", { name: "Retry verification" }).click();
        await page
          .getByText("Payment verified. Your invoice balance has been updated.")
          .waitFor();
        assert.equal(checkoutCalls, 1);
        assert.equal(verifyCalls, 2);
        checks += 2;
      }
      if (scenario === "unconfigured")
        await page
          .getByText("Razorpay is not configured", { exact: true })
          .last()
          .waitFor();
      if (scenario === "script-failure") {
        await page
          .getByText(
            "Payment checkout could not load. Check your connection and try again.",
          )
          .waitFor();
        assert.equal(checkoutCalls, 0);
        checks++;
      }
    }
    assert.deepEqual(errors, []);
    checks++;
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 2,
      ),
      false,
    );
    checks++;
    console.log("PASS " + scenario);
    await context.close();
  }
  console.log(
    "PASS: " +
      checks +
      " payment UI assertions across 9 scenarios. All checkout and payment API responses mocked; no funds moved.",
  );
} finally {
  await browser.close();
}
