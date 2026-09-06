# DealFlow360

### End-to-End Sales Operations — From Requirement to Payment
**Odoo Hackathon | Team THE BOYS**

**DealFlow360** is an intelligent sales-operations platform designed to connect the complete B2B deal lifecycle into a governed, traceable workflow. Instead of treating quotation, approval, fulfillment, billing, and customer interaction as fragmented silos, DealFlow360 unites them through a single, policy-governed deal journey.

The platform natively integrates customer intake requirements, multi-line quotation creation, pricing catalogs, discount governance, upsell/cross-sell recommendations, margin and risk analysis, approval routing, customer negotiation, warehouse fulfillment, subscription billing, payments, deal health diagnostics, and audit reporting.

> **Core Philosophy**: Critical business rules and discount policies are enforced by application logic rather than being merely displayed as advisory text by the frontend.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [End-to-End Workflow](#-end-to-end-workflow)
- [Customer Requirement Flow](#-customer-requirement-flow)
- [Core Features](#-core-features)
  - [Authentication & Role-Based Access](#-authentication--role-based-access)
  - [Customer Tier Management](#-customer-tier-management)
  - [Pricing & Discount Governance](#-pricing--discount-governance)
  - [Upsell & Cross-Sell Engine](#-upsell--cross-sell)
  - [Deal Guardian Risk Analysis](#-deal-guardian)
  - [Approval Routing Engine](#-approval-engine)
  - [Customer Negotiation Portal](#-customer-negotiation)
  - [Multi-Warehouse Fulfillment](#-fulfillment)
  - [Hybrid Billing & Proration](#-subscription--billing)
  - [Invoicing & Settlement](#-invoice--payment)
  - [Deal Health & Velocity Radar](#-deal-health)
  - [Audit Trail & Traceability](#-audit-trail)
- [Quotation State Machine](#-quotation-state-machine)
- [Architecture & Tech Stack](#-architecture)
- [Project Directory Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Hackathon Demo Script (5-Minute Flow)](#-hackathon-demo-flow)
- [Hackathon Requirement Coverage](#-hackathon-requirement-coverage)
- [Team & Acknowledgement](#-team-the-boys)

---

## 🎯 Problem Statement

Traditional B2B enterprise sales systems handle quotations, approvals, inventory allocations, billing schedules, and customer negotiations as disconnected processes across disparate tools.

This fragmentation creates critical operational challenges:
* **Unauthorized or Inconsistent Discounts**: Sales reps apply arbitrary discounts without cross-category margin controls.
* **Slow Approval Cycles**: Bureaucratic email threads create bottlenecks for routine concessions.
* **Lack of Margin Visibility**: Unclear cost structures obscure negative-margin deals.
* **Missed Upsell / Cross-Sell Opportunities**: Reps quote single hardware items without attaching high-margin services or warranty plans.
* **Complex Multi-Warehouse Fulfillment**: Manual stock allocation leads to split-shipment delays and inventory deficits.
* **Hybrid Billing Friction**: Inability to manage one-time hardware shipments and recurring SaaS subscriptions on a unified contract.
* **Proration Errors**: Complex mid-cycle subscription modifications result in billing discrepancies.
* **External Negotiation Chaos**: Offline email or phone price adjustments lack governance and bypass re-approval.
* **Blind Spots on Stalled Deals**: Sales leadership lacks real-time warnings for idle, at-risk, or anomaly-laden deals.

### Key Challenges Addressed

| Challenge | DealFlow360 Approach |
| :--- | :--- |
| **Discount Governance** | Strict $\min(\text{Customer Tier}, \text{Product Category})$ formula enforcement |
| **Approval Delays** | Automated 2-tier approval hierarchy (Sales Manager $\to$ Finance Controller) |
| **Pricing** | Multi-tier price lists (Bronze 5%, Silver 10%, Gold 15%, USD/EUR schedules) |
| **Upselling** | Contextual pairing rules with real-time margin lift calculations |
| **Margin Visibility** | Real-time line-by-line and aggregate deal margin impact gauges |
| **Risk Analysis** | Deal Guardian 3-question deterministic risk diagnosis |
| **Fulfillment** | Intelligent warehouse stock evaluation and split-dispatch ledger |
| **Billing** | Unified billing engine for one-time fulfillment invoices + recurring subscriptions |
| **Subscription Changes** | Exact-day proration engine calculating instantaneous charges and credits |
| **Negotiation** | Dedicated customer procurement portal with real-time counter-proposal policy checks |
| **Re-Approval** | State machine automatically returns over-limit counter-offers to `PENDING_APPROVAL` |
| **Deal Monitoring** | Deal Health Radar tracking velocity, stalled days, and discount anomalies |
| **Traceability** | Immutable append-only audit trail logging actors, timestamps, and reason codes |

---

## 💡 Solution Overview

DealFlow360 transforms fragmented sales operations into a single continuous pipeline where commercial commitments made during intake or quotation remain governed and connected through approval, fulfillment, billing, and settlement.

### Role-Based Experiences

* **Customer (Procurement)**:
  * Submit demand requirements without dealing with pricing catalogs.
  * Review formal quotations in a restricted, clean portal.
  * Negotiate line-level terms and propose counter-discounts.
  * Accept and legally confirm approved quotations.
  * View invoices and execute online ACH payments.
  * Manage SaaS seats and view system-assigned tier qualification metrics.
* **Sales Executive (AE / Rep)**:
  * Review inbound customer requirements queue (`/requirements`).
  * 1-Click convert requirements into pre-populated quotations (`/quotes/new?requirementId=REQ-xxx`).
  * Add products, services, and subscriptions with live discount variance feedback.
  * View contextual upsell/cross-sell suggestions with margin lift calculations.
  * Submit proposals for approval or save drafts.
* **Sales Manager / Approver**:
  * Commercial approval command center (`/approvals`).
  * Inspect deal risk radar, line-level discount exceptions, and audit logs.
  * Approve, reject, or return proposals for revision with mandatory reason notes.
* **Finance Controller**:
  * Sign off on high/critical policy breaches (discounts exceeding category caps).
  * Verify cashflow ledger and pre-shipment invoice generation (`/invoices`).
  * Track recurring subscription revenue (MRR) and aging receivables.
* **Administrator / Sales Ops**:
  * Configure tier discount ceilings and product category caps (`/settings/discount-rules`).
  * Manage product catalog variants and multi-currency price lists.
  * Monitor global deal health velocity and revenue intelligence reports (`/reports`).

---

## 🔄 End-to-End Workflow

```
Customer Requirement (Intake)
       │
       ▼
Sales Executive Desk (Review & Sizing)
       │
       ▼
Quotation Builder (Pre-population & Mapping)
       │
       ▼
Pricing Engine + Upsell/Cross-Sell Recommendations
       │
       ▼
Deal Guardian Evaluation
  ├── Discount Governance: min(Tier, Category)
  ├── Margin & Profitability Analysis
  └── Blended Risk Diagnosis
       │
       ▼
Approval Hierarchy Engine
  ├── Within Policy Limits  ───────► Auto-Cleared
  ├── Sales Manager Sign-Off ──────► PENDING_APPROVAL
  └── Finance Controller Sign-Off ──► PENDING_FINANCE_APPROVAL
       │
       ▼
Customer Procurement Portal
  ├── Accept & Legally Confirm ───► CONFIRMED
  └── Negotiate Terms / Counter-Discount
         │
         ▼
     Re-Evaluation & Policy Check
         │
         ├── Within Limits ───────► Updated Terms
         └── Over Limits ─────────► Re-Approval Required
       │
       ▼
Confirmed Commercial Order
       │
       ▼
Fulfillment & Warehouse Allocation
  ├── Single Warehouse Allocation
  └── Multi-Warehouse Split Dispatch
       │
       ▼
Billing & Settlement Engine
  ├── One-Time Fulfillment Invoice
  └── Recurring SaaS Subscription + Proration Engine
       │
       ▼
Online Payment Settlement (ACH / Card)
       │
       ▼
Deal Completion & Health Radar
  └── Velocity Tracking + Anomaly Monitoring + Immutable Audit Trail
```

---

## 📝 Customer Requirement Flow

> **Core Business Rule**: **Customers do not create commercial quotations.** The customer submits a **Requirement** (*"What does the customer need?"*), and the assigned Sales Executive reviews and models that requirement into a **Quotation** (*"What is the seller offering, at what price, with what terms?"*).

### Workflow Walkthrough:
1. **Intake**: Customer submits a requirement via `/portal/requirements/new` (e.g. ABC Manufacturing requests 10 Laptops, Onsite Setup, 1-Year Support, SLA: 14 Days, High Priority).
2. **Session Security**: Customer organization identity is derived automatically from the authenticated session (`CUST-006` ABC Manufacturing) to prevent impersonation.
3. **Desk Review**: Sales Executive accesses `/requirements`, reviews requirement details at `/requirements/REQ-001`, and clicks **"Create Quotation from Requirement"**.
4. **Intelligent Pre-Population**: The quotation creator (`/quotes/new?requirementId=REQ-001`) automatically selects the customer, imports line items mapped to catalog SKUs (`PROD-101`, `PROD-103`, `PROD-105`), attaches SLA delivery schedules, and records `requirementId`.
5. **Bidirectional State Linking**:
   * Storing the quotation updates `CustomerRequirement.status = 'QUOTATION_CREATED'` and links `CustomerRequirement.quotationId = 'Q-1042'`.
   * The quotation detail view links back to `REQ-001`, and the customer portal displays a direct link to the newly modeled quotation.

---

## ⚙️ Core Features

### 🏷️ Customer Tier Management
Customer tiers are **system-managed** based on verifiable metrics (lifetime spend, closed deal frequency, and credit rating). Customers cannot choose or alter their tier during signup.
* **Bronze**: 5% maximum discount ceiling (Introductory tier, spend $< \$100\text{k}$)
* **Silver**: 10% maximum discount ceiling (Mid-market, spend $\ge \$100\text{k}$, 1+ deal, rating $\ge$ A)
* **Gold**: 15% maximum discount ceiling (Strategic enterprise, spend $\ge \$300\text{k}$, 3+ deals, rating $\ge$ AA)

### 💰 Pricing & Discount Governance
The effective discount ceiling is calculated using the strict governance formula:
$$\text{Effective Limit} = \min(\text{Customer Tier Limit}, \text{Product Category Limit})$$

* **Hardware Limit**: 15%
* **Services Limit**: 10%

> [!IMPORTANT]
> **Customer Tier Never Bypasses Category Caps.** A **Gold Tier (15%)** account requesting an **18% discount** on **Onsite Setup (Services capped at 10%)** will be flagged with **+8% excess variance**, triggering mandatory Finance Controller escalation.

### 📈 Upsell & Cross-Sell
Contextual product pairing recommendations assist Sales Executives in attaching high-margin items:
* **Thunderbolt 4 Docking Hub**: Attached to laptop bundles (`+4.2%` margin lift).
* **24/7 Enterprise Care Plan**: Attached to mission-critical hardware (`+6.8%` gross service margin lift).
* **3-Year Extended Warranty**: Attached to protect margin buffers (`+3.5%` lift).
* Clicking **"Add Item"** immediately updates line totals, blended risk, and margin health.

### 🛡️ Deal Guardian
The real-time commercial control system answers three vital operational questions on every deal:
1. *What happened?* (e.g. "Onsite Setup has an 18% discount, exceeding the 10% Services limit by +8 pts.")
2. *Why does it matter?* (e.g. "Erodes gross services margin below the 60% minimum hurdle.")
3. *What should you do next?* (e.g. "Reduce discount to 10% or obtain Finance Controller sign-off.")

### 📦 Fulfillment
* Real-time multi-warehouse inventory visibility (Main Tech Warehouse, East Coast Depot, West Coast Staging).
* Split-dispatch recommendation algorithm (e.g. 10 Laptops split into 6 units from Main WH + 4 units from East Depot).
* One-click backorder consolidation for deficit clearance.

### 🔄 Subscription & Billing Proration
* Supports unified hybrid contracts containing both one-time hardware lines and recurring SaaS software subscriptions.
* **Deterministic Proration Formula**:
  $$\text{Daily Delta} = \frac{\text{New Plan Rate} - \text{Current Plan Rate}}{\text{Days in Billing Cycle}}$$
  $$\text{Prorated Adjustment} = \text{Daily Delta} \times \text{Days Remaining}$$

---

## 🔁 Quotation State Machine

```
   [DRAFT]
      │ (Submit for Approval)
      ▼
[PENDING_APPROVAL] / [PENDING_FINANCE_APPROVAL]
      │
      ├── (Approve) ────────► [APPROVED]
      ├── (Reject)  ────────► [REJECTED]
      └── (Return)  ────────► [RETURNED] ──► [DRAFT]
                                 │
                                 ▼ (Send to Customer)
                          [IN_NEGOTIATION]
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼ (Counter-Offer Exceeds Limits)                ▼ (Accept & Sign)
   [RE-APPROVAL REQUIRED]                          [CONFIRMED]
   (Status returns to PENDING_APPROVAL)                  │
                                                         ▼
                                                   [FULFILLMENT]
                                                         │
                                                         ▼
                                                [PARTIALLY_SHIPPED] / [SHIPPED]
                                                         │
                                                         ▼
                                                     [INVOICED]
                                                         │
                                                         ▼
                                                     [PAID]
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       Client Browser                         │
│   (Customer Portal / Sales Desk / Approvals / Health Radar)  │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│               Next.js 16.3.4 (Turbopack) UI                  │
│       Tailwind CSS v4 • Lucide Icons • React Hook Form       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  TanStack Query Client Layer                 │
│              Cache Management • Mutation Triggers            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    API Abstraction Layer                     │
│         src/services/api.ts (Mock API / Real API Switch)     │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 Reactive State & Store Layer                 │
│    src/mock/store.ts • localStorage • In-Memory Fallback    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼ (Ready for Phase 2)
┌──────────────────────────────────────────────────────────────┐
│                    Odoo ERP Integration                     │
│    Sales / Inventory / Accounting / Subscriptions / Contacts │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout with QueryProvider + AuthProvider + AppShell
│   ├── page.tsx                     # Executive Sales Dashboard & Deal Governance Center
│   ├── requirements/                # Sales Executive Customer Intake Queue
│   │   ├── page.tsx                 # Inbound demands list with KPI cards & filters
│   │   └── [id]/page.tsx            # Requirement review & "Create Quotation" action
│   ├── quotes/                      # Enterprise Quotation Management
│   │   ├── page.tsx                 # 9-column quotation ledger with search, sort & pagination
│   │   ├── new/page.tsx             # Multi-line quotation builder with live policy math
│   │   └── [id]/page.tsx            # Quotation detail, policy variance & approval stepper
│   ├── approvals/                   # Commercial Approval Command Center
│   │   ├── page.tsx                 # Approval queue with hierarchy tabs & risk filtering
│   │   └── [id]/page.tsx            # Approval decision command center with reason logging
│   ├── fulfillment/                 # Warehouse Inventory & Split Dispatch
│   │   ├── page.tsx                 # Inventory stock levels & fulfillment order ledger
│   │   └── [id]/page.tsx            # Multi-warehouse allocation & backorder consolidation
│   ├── invoices/                    # Commercial Invoices & Cashflow Ledger
│   │   ├── page.tsx                 # Invoice ledger with payment status indicators
│   │   └── [id]/page.tsx            # Invoice settlement & lifecycle enforcement
│   ├── subscriptions/               # Commercial Subscriptions & MRR Dashboard
│   │   ├── page.tsx                 # Active subscriptions & contract renewals
│   │   └── [id]/page.tsx            # Subscription detail & proration schedule
│   ├── deal-health/page.tsx         # Deal Health Radar & anomaly detection
│   ├── customers/                   # Customer 360 Command Center
│   ├── products/                    # Enterprise Product Catalog & Variant Builder
│   ├── price-lists/page.tsx         # Multi-tier price lists (USD / EUR)
│   ├── reports/page.tsx             # Revenue intelligence & pipeline conversion reports
│   ├── settings/discount-rules/     # Admin policy configuration & audit history
│   ├── login/page.tsx               # Enterprise login with 1-click demo role pills
│   ├── signup/page.tsx              # Enterprise registration with system tier rules
│   └── portal/                      # Dedicated Customer Procurement Portal
│       ├── layout.tsx               # Customer portal header & navigation
│       ├── page.tsx                 # Portal overview & assigned AE communication feed
│       ├── requirements/            # Customer requirements ledger & intake form
│       ├── quotations/              # Customer quotation review & negotiation panel
│       ├── invoices/                # Customer online payment settlement
│       └── profile/page.tsx         # System tier standing & SaaS subscription management
├── components/
│   ├── layout/app-shell.tsx         # Enterprise sidebar, top bar & role switcher
│   ├── ui/                          # Design system primitives (Button, Card, Table, Badges)
│   └── subscriptions/               # Prorated subscription management dialogs
├── hooks/use-dealflow.ts            # TanStack Query query and mutation hooks
├── lib/
│   ├── auth.tsx                     # Role-based auth provider with demo accounts
│   ├── customer-tier.ts             # Deterministic tier qualification engine
│   ├── discount-engine.ts           # Core governance formula & risk diagnostics
│   └── proration.ts                 # Billing cycle exact-day proration engine
└── mock/
    ├── seed-data.ts                 # Realistic B2B seed data (Acme, Beta, Nova, Zenith, ABC)
    └── store.ts                     # Reactive browser storage & reset capability
```

---

## 🚀 Setup & Installation

### Prerequisites
* **Node.js**: v18.18.0 or higher (v20+ recommended)
* **Package Manager**: `npm`

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/DivyanshMishra-2315000780/Odoo_DealFlow360.git
cd Odoo_DealFlow360
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Verification
```bash
# Type check without emitting files
npx tsc --noEmit

# Production Turbopack build
npm run build
```

---

## 🎬 Hackathon Demo Flow

Follow this exact **5-minute demo sequence** for presentation to hackathon judges:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (ABC Mfg)
    actor SalesRep as Sales Executive (Marcus)
    actor Approver as Finance Controller (Sarah)
    participant DealFlow as DealFlow360 Engine

    Customer->>DealFlow: 1. Submit Requirement (10 Laptops + Setup + Care Plan)
    SalesRep->>DealFlow: 2. Review Intake & Click "Create Quotation"
    DealFlow->>SalesRep: 3. Pre-populate items; apply 18% discount on Setup
    Note over SalesRep,DealFlow: Deal Guardian flags +8% excess (Services capped at 10%)
    SalesRep->>DealFlow: 4. Submit for Approval (Routed to PENDING_FINANCE_APPROVAL)
    Approver->>DealFlow: 5. Review Risk Radar & Approve Deal
    Customer->>DealFlow: 6. Open Portal & Counter-propose 12% discount
    Note over Customer,DealFlow: Re-evaluation triggers Re-Approval requirement
    Customer->>DealFlow: 7. Confirm & Accept Approved Quotation
    SalesRep->>DealFlow: 8. Fulfillment allocates split dispatch (6 Main / 4 East)
    Customer->>DealFlow: 9. Online ACH Payment settlement
    SalesRep->>DealFlow: 10. Inspect Deal Health & Immutable Audit Trail
```

1. **Step 1: Role-Based Login**: Log in as `Marcus Vance` (Account Executive) or use the 1-click demo pill on `/login`.
2. **Step 2: Customer Requirement Intake**: Navigate to `/portal/requirements/new`. Click **"⚡ 1-Click Demo Fill: ABC Manufacturing"** (10 Laptops, Onsite Setup, 24/7 Care Plan, SLA: 14 Days, High Priority). Submit the requirement.
3. **Step 3: Sales Executive Review**: Switch to Sales Executive view. Navigate to `/requirements`. Open `REQ-001` and click **"Create Quotation from Requirement"**.
4. **Step 4: Real-Time Governance**: Notice how the quotation creator pre-populates the customer, title, and lines. Increase the discount on **Onsite Setup** to **18%**. The UI immediately triggers a red `OVER LIMIT (+8% excess)` variance banner and escalates risk to **Critical**.
5. **Step 5: Approval Routing**: Click **"Submit for Approval"**. Quotation transitions to `PENDING_FINANCE_APPROVAL`. Log in as `Sarah Sterling` (Finance Controller), inspect `/approvals`, and approve the deal.
6. **Step 6: Customer Negotiation & Re-Approval**: Open the quotation in Customer Portal (`/portal/quotations`). Show how proposing counter-terms exceeding category bounds automatically flags the quote for re-approval. Confirm the quotation.
7. **Step 7: Warehouse Allocation**: View `/fulfillment/FUL-801` to demonstrate automatic inventory splitting between Main Tech Warehouse and East Coast Depot.
8. **Step 8: Billing, Proration & Payment**: Navigate to `/portal/invoices` and execute instant ACH settlement. Open `/portal/profile` to showcase prorated SaaS plan adjustments.
9. **Step 9: Deal Health Radar**: Visit `/deal-health` to display stalled deal warnings, discount anomaly detection, and the complete append-only audit trail.

---

## 📊 Hackathon Requirement Coverage

| Track / Feature | Implementation in DealFlow360 | Status |
| :--- | :--- | :---: |
| **Customer Requirement Intake** | Dedicated Customer Portal requirement submission (`/portal/requirements/new`) with 1-click demo fill | ✅ Implemented |
| **Intake to Quote Conversion** | Sales Executive desk queue (`/requirements`) with automated pre-population and SKU mapping | ✅ Implemented |
| **System-Managed Customer Tiers** | Bronze (5%), Silver (10%), Gold (15%) with strict spend/deal qualification engine | ✅ Implemented |
| **Discount Governance** | Strict $\min(\text{Customer Tier}, \text{Product Category})$ enforcement; category limits cannot be bypassed | ✅ Implemented |
| **Approval Routing Engine** | Multi-level approval hierarchy (Sales Manager $\to$ Finance Controller) with audit reason notes | ✅ Implemented |
| **Deal Guardian Risk Radar** | Real-time 3-question deterministic risk diagnosis (*What happened? Why it matters? Next action?*) | ✅ Implemented |
| **Upsell & Cross-Sell** | Contextual hardware/service recommendations with real-time margin lift calculations | ✅ Implemented |
| **Customer Portal & Negotiation** | Restricted procurement room with real-time counter-proposal variance checks & re-approval guardrails | ✅ Implemented |
| **Multi-Warehouse Fulfillment** | Multi-depot stock allocation, split shipments, and backorder consolidation | ✅ Implemented |
| **Hybrid Invoicing & Proration** | Combined one-time + subscription billing with exact-day proration engine and ACH settlement | ✅ Implemented |
| **Deal Health & Audit Trail** | Velocity watchdog, stalled deal anomaly alerts, and immutable append-only event trail | ✅ Implemented |
| **Odoo Integration Readiness** | Service layer abstraction (`api.ts`) ready for direct JSON-RPC / REST connector binding | 🟡 Integration-Ready |

---

## 👥 Team THE BOYS

Built with passion for the **Odoo Hackathon**:

| Member | Role | Core Responsibility |
| :--- | :--- | :--- |
| **Divyansh Mishra** | **Team Lead** | Frontend Architecture, Product Workflow Coordination & Team Management |
| **Yash Raj Srivastava** | **UI & Frontend** | Design System, UI/UX Implementation, Component Engineering |
| **Ayushman Yadav** | **Backend** | Business Logic, API Contracts, Rule Validation & State Machine |
| **Saksham Kumar** | **Backend** | Data Modeling, API Layer, Integration & System Architecture |

---

## 🏁 Acknowledgement

Special thanks to the **Odoo Hackathon Mentors & Organizing Committee** for hosting a competition focused on solving real-world enterprise sales operations challenges.

**DealFlow360** — *From Customer Requirement to Payment — One Connected Deal.*
