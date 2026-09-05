import {
  User, Customer, Product, Quotation, Approval, FulfillmentOrder,
  Invoice, Subscription, DealHealthEvent, DiscountRule, NegotiationMessage,
  NegotiationRequest, Notification, SubscriptionPlan, Payment,
  TierPrice, ProductVariant, InvoiceLine, WarehouseAllocation,
  ApprovalAuditEntry, BillingRecord,
} from '@/types';

// ── Seed Data ─────────────────────────────────────────────
export const SEED_USERS: User[] = [
  {
    id: 'u-customer-1',
    name: 'Alice Chen',
    email: 'customer@acme.com',
    role: 'CUSTOMER',
    customerId: 'c-1',
    companyName: 'Acme Corp',
    createdAt: '2023-01-15T10:00:00Z',
    isActive: true,
  },
  {
    id: 'u-admin-1',
    name: 'Dev Admin',
    email: 'admin@dealflow360.com',
    role: 'ADMIN',
    createdAt: '2023-01-01T10:00:00Z',
    isActive: true,
  },
  {
    id: 'u-sales-exec-1',
    name: 'J. Rao',
    email: 'sales@dealflow360.com',
    role: 'SALES_EXECUTIVE',
    createdAt: '2023-01-10T10:00:00Z',
    isActive: true,
  },
  {
    id: 'u-sales-mgr-1',
    name: 'S. Mehta',
    email: 'manager@dealflow360.com',
    role: 'SALES_MANAGER',
    createdAt: '2023-01-10T10:00:00Z',
    isActive: true,
  },
  {
    id: 'u-finance-1',
    name: 'R. Sharma',
    email: 'finance@dealflow360.com',
    role: 'FINANCE_OFFICER',
    createdAt: '2023-01-10T10:00:00Z',
    isActive: true,
  },
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    name: 'Acme Corp',
    tier: 'GOLD',
    contactName: 'Alice Chen',
    contactEmail: 'customer@acme.com',
    phone: '+1-555-0101',
    status: 'ACTIVE',
    createdAt: '2023-01-15T10:00:00Z',
    activeDeals: 3,
    pipeline: 12400,
    revenue: 48000,
  },
  {
    id: 'c-2',
    name: 'Beta Industries',
    tier: 'SILVER',
    contactName: 'Bob Williams',
    contactEmail: 'bob@beta.com',
    phone: '+1-555-0102',
    status: 'ACTIVE',
    createdAt: '2023-02-10T10:00:00Z',
    activeDeals: 2,
    pipeline: 8200,
    revenue: 22000,
  },
  {
    id: 'c-3',
    name: 'Delta LLC',
    tier: 'BRONZE',
    contactName: 'Charlie Davis',
    contactEmail: 'charlie@delta.com',
    phone: '+1-555-0103',
    status: 'ACTIVE',
    createdAt: '2023-03-05T10:00:00Z',
    activeDeals: 1,
    pipeline: 3200,
    revenue: 9000,
  },
  {
    id: 'c-4',
    name: 'Zenith Co',
    tier: 'SILVER',
    contactName: 'Diana Park',
    contactEmail: 'diana@zenith.com',
    phone: '+1-555-0104',
    status: 'ACTIVE',
    createdAt: '2023-04-01T10:00:00Z',
    activeDeals: 1,
    pipeline: 5100,
    revenue: 15000,
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    sku: 'HW-LAP-14',
    name: 'Laptop Pro 14',
    category: 'Hardware',
    basePrice: 1200,
    unit: 'Item',
    taxPercentage: 10,
    description: 'High-performance 14" laptop for professional use',
    isSubscription: false,
    status: 'ACTIVE',
    tierPrices: [
      { tier: 'BRONZE', price: 1200, discountPercentage: 5 },
      { tier: 'SILVER', price: 1200, discountPercentage: 10 },
      { tier: 'GOLD', price: 1200, discountPercentage: 15 },
    ],
    variants: [
      { id: 'v-1', productId: 'p-1', name: 'RAM', value: '16GB' },
      { id: 'v-2', productId: 'p-1', name: 'RAM', value: '32GB' },
    ],
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: 'p-2',
    sku: 'SV-ONSITE',
    name: 'Onsite Setup',
    category: 'Services',
    basePrice: 450,
    unit: 'Hour',
    taxPercentage: 18,
    description: 'Professional onsite setup and installation service',
    isSubscription: false,
    status: 'ACTIVE',
    tierPrices: [
      { tier: 'BRONZE', price: 450, discountPercentage: 5 },
      { tier: 'SILVER', price: 450, discountPercentage: 8 },
      { tier: 'GOLD', price: 450, discountPercentage: 10 },
    ],
    variants: [],
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: 'p-3',
    sku: 'SUB-CARE-2Y',
    name: 'Care Plan 2yr',
    category: 'Subscription',
    basePrice: 46,
    unit: 'Month',
    taxPercentage: 18,
    description: '2-year hardware care and support subscription',
    isSubscription: true,
    status: 'ACTIVE',
    tierPrices: [
      { tier: 'BRONZE', price: 46, discountPercentage: 0 },
      { tier: 'SILVER', price: 46, discountPercentage: 5 },
      { tier: 'GOLD', price: 46, discountPercentage: 10 },
    ],
    variants: [],
    createdAt: '2023-01-01T10:00:00Z',
  },
  {
    id: 'p-4',
    sku: 'HW-MON-27',
    name: 'UltraView 27"',
    category: 'Hardware',
    basePrice: 680,
    unit: 'Item',
    taxPercentage: 10,
    description: '27" 4K IPS monitor for professional use',
    isSubscription: false,
    status: 'ACTIVE',
    tierPrices: [
      { tier: 'BRONZE', price: 680, discountPercentage: 5 },
      { tier: 'SILVER', price: 680, discountPercentage: 10 },
      { tier: 'GOLD', price: 680, discountPercentage: 15 },
    ],
    variants: [
      { id: 'v-3', productId: 'p-4', name: 'Color', value: 'Black' },
      { id: 'v-4', productId: 'p-4', name: 'Color', value: 'Silver' },
    ],
    createdAt: '2023-01-01T10:00:00Z',
  },
];

export const SEED_QUOTES: Quotation[] = [
  {
    id: 'q-1042',
    quoteNumber: 'Q-1042',
    customerId: 'c-1',
    salesExecutiveId: 'u-sales-exec-1',
    status: 'DRAFT',
    amount: 2730,
    riskLevel: 'HIGH',
    notes: 'Customer requested urgent delivery.',
    createdAt: '2023-08-20T10:00:00Z',
    updatedAt: '2023-08-20T10:00:00Z',
    expiresAt: '2023-09-20T10:00:00Z',
    lines: [
      {
        id: 'ql-1',
        productId: 'p-1',
        quantity: 2,
        unitPrice: 1200,
        discountPercentage: 12,
        allowedDiscountPercentage: 15,
        lineTotal: 2112,
        riskLevel: 'LOW',
        deliveryDate: '2023-09-05T00:00:00Z',
      },
      {
        id: 'ql-2',
        productId: 'p-2',
        quantity: 1,
        unitPrice: 450,
        discountPercentage: 18,
        allowedDiscountPercentage: 10,
        lineTotal: 369,
        riskLevel: 'HIGH',
        deliveryDate: '2023-09-05T00:00:00Z',
      },
      {
        id: 'ql-3',
        productId: 'p-3',
        quantity: 1,
        unitPrice: 180,
        discountPercentage: 10,
        allowedDiscountPercentage: 10,
        lineTotal: 162,
        riskLevel: 'LOW',
        deliveryDate: '2023-09-05T00:00:00Z',
      },
    ],
  },
  {
    id: 'q-1043',
    quoteNumber: 'Q-1043',
    customerId: 'c-2',
    salesExecutiveId: 'u-sales-exec-1',
    status: 'DRAFT',
    amount: 5200,
    riskLevel: 'LOW',
    createdAt: '2023-08-18T10:00:00Z',
    updatedAt: '2023-08-18T10:00:00Z',
    expiresAt: '2023-09-18T10:00:00Z',
    lines: [
      {
        id: 'ql-4',
        productId: 'p-4',
        quantity: 4,
        unitPrice: 680,
        discountPercentage: 8,
        allowedDiscountPercentage: 10,
        lineTotal: 2499.2,
        riskLevel: 'LOW',
      },
      {
        id: 'ql-5',
        productId: 'p-1',
        quantity: 2,
        unitPrice: 1200,
        discountPercentage: 9,
        allowedDiscountPercentage: 10,
        lineTotal: 2184,
        riskLevel: 'LOW',
      },
    ],
  },
];

export const SEED_APPROVALS: Approval[] = [];

export const SEED_FULFILLMENT: FulfillmentOrder[] = [];

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-1001',
    quotationId: 'q-1042',
    customerId: 'c-1',
    amount: 2730,
    paidAmount: 0,
    status: 'UNPAID',
    dueDate: '2023-09-10T00:00:00Z',
    createdAt: '2023-08-25T00:00:00Z',
    lines: [
      { id: 'il-1', description: 'Laptop Pro 14 x2 (12% disc)', quantity: 2, unitPrice: 1200, amount: 2112 },
      { id: 'il-2', description: 'Onsite Setup x1 (18% disc)', quantity: 1, unitPrice: 450, amount: 369 },
      { id: 'il-3', description: 'Care Plan 2yr x1 (10% disc)', quantity: 1, unitPrice: 180, amount: 162 },
    ],
    payments: [],
    shipmentReference: 'SHIP-0012',
  },
];

export const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub-1',
    customerId: 'c-1',
    planId: 'plan-pro',
    planName: 'Pro',
    billingFrequency: 'MONTHLY',
    amount: 999,
    currency: 'USD',
    status: 'ACTIVE',
    startDate: '2023-01-15T00:00:00Z',
    nextBillingDate: '2023-09-15T00:00:00Z',
    billingHistory: [
      { id: 'bh-1', subscriptionId: 'sub-1', amount: 999, status: 'PAID', billedAt: '2023-08-15T00:00:00Z' },
      { id: 'bh-2', subscriptionId: 'sub-1', amount: 999, status: 'PAID', billedAt: '2023-07-15T00:00:00Z' },
    ],
  },
];

export const SEED_DEAL_HEALTH: DealHealthEvent[] = [
  {
    id: 'dh-1',
    quotationId: 'q-1043',
    quoteNumber: 'Q-1043',
    customerId: 'c-4',
    issueType: 'STALLED',
    issue: 'Idle 9 days with no activity',
    severity: 'MEDIUM',
    ageDays: 9,
    recommendedAction: 'Nudge Sales Rep',
    status: 'OPEN',
    createdAt: '2023-08-15T00:00:00Z',
  },
  {
    id: 'dh-2',
    quotationId: 'q-1042',
    quoteNumber: 'Q-1042',
    customerId: 'c-3',
    issueType: 'DISCOUNT_ANOMALY',
    issue: 'Discount exceeds category limit by +8%',
    severity: 'HIGH',
    ageDays: 3,
    recommendedAction: 'Escalate to Manager',
    status: 'OPEN',
    createdAt: '2023-08-21T00:00:00Z',
  },
];

export const SEED_DISCOUNT_RULES: DiscountRule[] = [
  { id: 'dr-1', tier: 'BRONZE', category: 'Hardware', maxDiscountPercentage: 5, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-2', tier: 'SILVER', category: 'Hardware', maxDiscountPercentage: 10, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-3', tier: 'GOLD', category: 'Hardware', maxDiscountPercentage: 15, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-4', tier: 'BRONZE', category: 'Services', maxDiscountPercentage: 5, requiresManagerApproval: true, requiresFinanceApproval: false },
  { id: 'dr-5', tier: 'SILVER', category: 'Services', maxDiscountPercentage: 8, requiresManagerApproval: true, requiresFinanceApproval: false },
  { id: 'dr-6', tier: 'GOLD', category: 'Services', maxDiscountPercentage: 10, requiresManagerApproval: true, requiresFinanceApproval: true },
  { id: 'dr-7', tier: 'BRONZE', category: 'Subscription', maxDiscountPercentage: 0, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-8', tier: 'SILVER', category: 'Subscription', maxDiscountPercentage: 5, requiresManagerApproval: false, requiresFinanceApproval: false },
  { id: 'dr-9', tier: 'GOLD', category: 'Subscription', maxDiscountPercentage: 10, requiresManagerApproval: false, requiresFinanceApproval: false },
];

export const SEED_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    price: 499,
    currency: 'USD',
    billingFrequency: 'MONTHLY',
    features: [
      'Basic quotation access',
      'Customer portal',
      'Invoice tracking',
      'Email support',
    ],
  },
  {
    id: 'plan-pro',
    name: 'Pro',
    price: 999,
    currency: 'USD',
    billingFrequency: 'MONTHLY',
    features: [
      'Advanced quotation management',
      'Negotiation portal',
      'Priority support',
      'Basic analytics',
      'Custom pricing',
    ],
    isPopular: true,
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    price: 1999,
    currency: 'USD',
    billingFrequency: 'MONTHLY',
    features: [
      'Everything in Pro',
      'Advanced analytics & reports',
      'Dedicated account manager',
      'Custom approval workflows',
      'API access',
      'SLA guarantee',
    ],
  },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    userId: 'u-sales-mgr-1',
    title: 'Approval Required',
    message: 'Q-1042 submitted for approval by J. Rao',
    type: 'APPROVAL',
    isRead: false,
    link: '/sales-manager/approvals',
    createdAt: '2023-08-21T10:30:00Z',
  },
  {
    id: 'n-2',
    userId: 'u-customer-1',
    title: 'Quotation Ready',
    message: 'Q-1042 is ready for your review',
    type: 'QUOTE',
    isRead: false,
    link: '/portal/quotations/q-1042',
    createdAt: '2023-08-20T10:00:00Z',
  },
];

// ── Mock DB Store ─────────────────────────────────────────
const STORAGE_KEY = 'dealflow360_mock_db';

export interface MockDB {
  users: User[];
  customers: Customer[];
  products: Product[];
  quotes: Quotation[];
  approvals: Approval[];
  fulfillmentOrders: FulfillmentOrder[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  subscriptionPlans: SubscriptionPlan[];
  dealHealthEvents: DealHealthEvent[];
  discountRules: DiscountRule[];
  negotiations: NegotiationMessage[];
  negotiationRequests: NegotiationRequest[];
  notifications: Notification[];
  nextIds: Record<string, number>;
}

function getInitialDB(): MockDB {
  return {
    users: SEED_USERS,
    customers: SEED_CUSTOMERS,
    products: SEED_PRODUCTS,
    quotes: SEED_QUOTES,
    approvals: SEED_APPROVALS,
    fulfillmentOrders: SEED_FULFILLMENT,
    invoices: SEED_INVOICES,
    subscriptions: SEED_SUBSCRIPTIONS,
    subscriptionPlans: SEED_SUBSCRIPTION_PLANS,
    dealHealthEvents: SEED_DEAL_HEALTH,
    discountRules: SEED_DISCOUNT_RULES,
    negotiations: [],
    negotiationRequests: [],
    notifications: SEED_NOTIFICATIONS,
    nextIds: { quote: 1044, approval: 1, fulfillment: 1, invoice: 1002, subscription: 2, customer: 5, user: 6, product: 5 },
  };
}

let _db: MockDB | null = null;

export function getDB(): MockDB {
  if (!_db) {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          _db = JSON.parse(stored) as MockDB;
        }
      } catch {}
    }
    if (!_db) {
      _db = getInitialDB();
    }
  }
  return _db;
}

export function saveDB(): void {
  if (typeof window !== 'undefined' && _db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
    } catch {}
  }
}

export function resetDB(): void {
  _db = getInitialDB();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function nextId(collection: string): string {
  const db = getDB();
  const current = db.nextIds[collection] ?? 1;
  db.nextIds[collection] = current + 1;
  saveDB();
  return String(current);
}

// ── Computed helpers ───────────────────────────────────────
export function computeQuoteRisk(lines: { discountPercentage: number; allowedDiscountPercentage: number }[]): 'LOW' | 'MEDIUM' | 'HIGH' {
  const hasHigh = lines.some(l => l.discountPercentage > l.allowedDiscountPercentage);
  const hasMedium = lines.some(l => l.discountPercentage > l.allowedDiscountPercentage * 0.85 && l.discountPercentage <= l.allowedDiscountPercentage);
  if (hasHigh) return 'HIGH';
  if (hasMedium) return 'MEDIUM';
  return 'LOW';
}

export function computeLineRisk(line: { discountPercentage: number; allowedDiscountPercentage: number }): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (line.discountPercentage > line.allowedDiscountPercentage) return 'HIGH';
  if (line.discountPercentage > line.allowedDiscountPercentage * 0.85) return 'MEDIUM';
  return 'LOW';
}

export function computeLineTotal(quantity: number, unitPrice: number, discountPct: number): number {
  return parseFloat((quantity * unitPrice * (1 - discountPct / 100)).toFixed(2));
}

export function enrichQuote(q: Quotation, db: MockDB): Quotation {
  return {
    ...q,
    customer: db.customers.find(c => c.id === q.customerId),
    salesExecutive: db.users.find(u => u.id === q.salesExecutiveId),
    lines: q.lines.map(l => ({
      ...l,
      product: db.products.find(p => p.id === l.productId),
    })),
  };
}

export function enrichApproval(a: Approval, db: MockDB): Approval {
  const quote = db.quotes.find(q => q.id === a.quotationId);
  return {
    ...a,
    quotation: quote ? enrichQuote(quote, db) : undefined,
  };
}

export function enrichInvoice(inv: Invoice, db: MockDB): Invoice {
  return {
    ...inv,
    customer: db.customers.find(c => c.id === inv.customerId),
  };
}

export function enrichFulfillment(f: FulfillmentOrder, db: MockDB): FulfillmentOrder {
  const quote = db.quotes.find(q => q.id === f.quotationId);
  return {
    ...f,
    quoteNumber: quote?.quoteNumber,
    customer: quote ? db.customers.find(c => c.id === quote.customerId) : undefined,
  };
}

export function enrichSubscription(s: Subscription, db: MockDB): Subscription {
  return {
    ...s,
    customer: db.customers.find(c => c.id === s.customerId),
  };
}

export function enrichDealHealth(d: DealHealthEvent, db: MockDB): DealHealthEvent {
  return {
    ...d,
    customer: db.customers.find(c => c.id === d.customerId),
  };
}
