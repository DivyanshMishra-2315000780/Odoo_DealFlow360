# Workflow validation

The UI uses Axios and TanStack Query with authenticated backend requests. Internal approvals run in order: Sales Manager, then Finance Officer. Customer counters require reevaluation and both approvals again. Delivery precedes invoicing; confirmed payment completes the deal.

## Run locally

Use a development database with the seeded role accounts, start the application with npm run dev, then run:

- npm run typecheck
- npm run lint
- npm run build
- npm run test:workflow
- npm run test:catalog
- npm run test:ui

The smoke tests default to http://localhost:3000. Override SMOKE_ORIGIN for another port. Browser tests use the installed Microsoft Edge through Playwright. Workflow and catalog tests create uniquely named fixtures and clean up their own records; the workflow test restores inventory consumed by its test order. They never initiate a payment gateway transfer.

## Database migration

The additive workflow-product-details migration stores product metadata and quotation titles. The existing database was validated against the previous migration snapshot before its previously empty migration history was baselined. Existing application records were retained. The baseline script defaults to validation only and refuses to overwrite nonempty migration history. Do not reseed an existing database to apply this migration; use npm run db:migrate.

## Current boundaries

- Customer invoices support Razorpay Standard Checkout. RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured on the server. The browser only receives the public key. Successful checkout receipts are verified by the backend before invoice balances change; failed verification can be retried after reload in the same browser tab. Finance can also record payments already received.
- Run npm run test:payments against the local server (SMOKE_ORIGIN defaults to port 3100 for this isolated suite). All checkout and payment API responses are mocked: no gateway requests or funds are sent. Live capture and webhook reconciliation require separate gateway-environment validation.
- Password recovery requires an administrator; email recovery is not configured.
- Catalog variants persist as configuration. Quotation pricing and warehouse reservations use the base product.
- Commercial writes currently use a transaction-wide advisory lock for correctness. This serializes writes and should be refined if deployment throughput requires it.

## Verified

Full RFQ-to-payment workflow: 68 checks. Catalog API and mobile interactions: 21 checks. Desktop/mobile views: 31 checks. Production build and TypeScript check pass. Source lint has no errors; existing unused-code and hook-dependency warnings remain.

Payment implementation reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
