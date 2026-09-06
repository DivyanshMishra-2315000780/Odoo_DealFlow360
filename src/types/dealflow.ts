export type CustomerTier = 'Bronze' | 'Silver' | 'Gold';

export type ProductCategory = 'Hardware' | 'Services';

export const CUSTOMER_TIER_LIMITS: Record<CustomerTier, number> = {
  Bronze: 5,
  Silver: 10,
  Gold: 15,
};

export const CATEGORY_DISCOUNT_LIMITS: Record<ProductCategory, number> = {
  Hardware: 15,
  Services: 10,
};

export interface DiscountPolicyConfig {
  tierLimits: {
    Bronze: number;
    Silver: number;
    Gold: number;
  };
  categoryLimits: {
    Hardware: number;
    Services: number;
  };
  workflowRules: {
    withinLimit: string;
    overLimit: string;
    highRisk: string;
    mixedCategory: string;
    highRiskThresholdPoints: number;
    criticalRiskThresholdPoints: number;
  };
  updatedAt: string;
  updatedBy: string;
}

export interface RuleAuditLogEntry {
  id: string;
  rule: string;
  category: 'Customer Tier' | 'Category Limit' | 'Workflow Rule';
  previousValue: string;
  newValue: string;
  changedBy: string;
  timestamp: string;
  reason?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  color?: string;
  ram?: string;
  manufacturer?: string;
  priceAdjustment: number;
  availableStock: number;
}

export interface TierPriceEntry {
  usd: number;
  eur: number;
  discountPercent: number;
}

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
export type ProductBillingFrequency = 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface Product {
  categoryId?: string;
  baseCost?: number;
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  currency?: 'USD' | 'EUR';
  description: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'LEAD_TIME_REQUIRED';
  availableStock?: number;
  status?: ProductStatus;
  isSubscription?: boolean;
  billingFrequency?: ProductBillingFrequency;
  recurringPrice?: number;
  variants?: ProductVariant[];
  tierPricing?: {
    Bronze: TierPriceEntry;
    Silver: TierPriceEntry;
    Gold: TierPriceEntry;
  };
}

export interface Customer {
  id: string;
  name: string;
  tier: CustomerTier;
  industry: string;
  contactEmail: string;
  contactPerson: string;
  accountManager: string;
  activeDealsCount: number;
  totalLifetimeValue: number;
  creditLimit: number;
  phone?: string;
  address?: string;
  website?: string;
  creditRating?: string;
  dealHealthScore?: number;
  notes?: string;
}

export interface QuotationLineItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  effectiveLimit: number;
  isViolation: boolean;
  excessPercent: number; // percentage points over allowed limit
  lineTotal: number;
}

// ──────────────────────────────────────────────────────────────────────
// Quotation Status — aligned with backend state machine (13 states)
// Lifecycle: DRAFT → PENDING_APPROVAL → APPROVED → SENT →
//            UNDER_NEGOTIATION ↔ RE_APPROVAL_REQUIRED →
//            CONFIRMED → FULFILLMENT → BILLING → COMPLETED
// Terminal: REJECTED, REVISION_REQUIRED, CANCELLED
// ──────────────────────────────────────────────────────────────────────
export type QuotationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'         // Unified: replaces PENDING_DISCOUNT_APPROVAL & PENDING_FINANCE_APPROVAL
  | 'APPROVED'
  | 'SENT'                     // Quote dispatched to customer portal
  | 'UNDER_NEGOTIATION'        // Customer counter-offer in progress (replaces IN_NEGOTIATION)
  | 'RE_APPROVAL_REQUIRED'     // After negotiation, needs re-approval before re-sending
  | 'CONFIRMED'                // Customer accepted & bound
  | 'FULFILLMENT'              // Warehouse allocation & shipping (replaces FULFILLED)
  | 'BILLING'                  // Invoice generated
  | 'COMPLETED'                // Payment received, deal closed
  | 'REJECTED'                 // Approval denied
  | 'REVISION_REQUIRED'        // Returned for revision (replaces RETURNED)
  | 'CANCELLED';               // Deal cancelled at any stage

// Legacy status aliases for backward compatibility during migration
export type LegacyQuotationStatus =
  | 'PENDING_FINANCE_APPROVAL'
  | 'PENDING_DISCOUNT_APPROVAL'
  | 'IN_NEGOTIATION'
  | 'RETURNED'
  | 'FULFILLED';

/** Maps legacy frontend status names to the backend-canonical status */
export function normalizeQuotationStatus(status: string): QuotationStatus {
  const LEGACY_MAP: Record<string, QuotationStatus> = {
    'PENDING_FINANCE_APPROVAL': 'PENDING_APPROVAL',
    'PENDING_DISCOUNT_APPROVAL': 'PENDING_APPROVAL',
    'IN_NEGOTIATION': 'UNDER_NEGOTIATION',
    'RETURNED': 'REVISION_REQUIRED',
    'FULFILLED': 'FULFILLMENT',
  };
  return (LEGACY_MAP[status] ?? status) as QuotationStatus;
}

export const PRICE_LISTS = [
  'Standard Commercial 2026',
  'Enterprise Tech Volume',
  'Global Partner Direct',
] as const;

export type PriceList = (typeof PRICE_LISTS)[number];

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskDiagnosis {
  level: RiskLevel;
  whatHappened: string;
  whyItMatters: string;
  nextAction: string;
  requiresFinanceApproval: boolean;
  requiresExecutiveApproval: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  badgeType?: 'default' | 'warning' | 'success' | 'destructive';
}

export type RequirementStatus = 'NEW' | 'IN_REVIEW' | 'QUOTATION_CREATED' | 'CLOSED';
export type RequirementPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface RequirementItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  category?: ProductCategory;
  notes?: string;
}

export interface CustomerRequirement {
  id: string; // e.g. "REQ-001"
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  title: string;
  description: string;
  items: RequirementItem[];
  priority: RequirementPriority;
  expectedDeliveryDays: number;
  additionalNotes?: string;
  status: RequirementStatus;
  assignedSalesExecutive: string;
  quotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  approvalRole?: string;
  negotiation?: { customerNotes: string; changes: Array<{quotationLineId:string;fieldChanged:string;originalValue:string;requestedValue:string}> };

  id: string; // e.g. "Q-1042"
  requirementId?: string; // Originating requirement link
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  title: string;
  items: QuotationLineItem[];
  subtotal: number;
  totalDiscountAmount: number;
  grandTotal: number;
  status: QuotationStatus;
  riskDiagnosis: RiskDiagnosis;
  auditTrail: AuditEntry[];
  createdAt: string;
  updatedAt: string;
  dealHealthScore: number; // 0 to 100
  notes?: string;
  owner?: string; // Assigned Sales Rep / AE
  priceList?: string;
  deliveryDate?: string;
  salesManagerApproved?: boolean;
  financeApproved?: boolean;
  reapprovalRequired?: boolean;
  reapprovalReason?: string;
  fulfillmentStatus?: string;
}

// ──────────────────────────────────────────────────────────────────────
// Invoice Status — aligned with backend enum
// ──────────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';
// Legacy aliases
export type LegacyInvoiceStatus = 'ISSUED';

export function normalizeInvoiceStatus(status: string): InvoiceStatus {
  const LEGACY_MAP: Record<string, InvoiceStatus> = {
    'ISSUED': 'ISSUED',
  };
  return (LEGACY_MAP[status] ?? status) as InvoiceStatus;
}

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'ISSUED';

export type InvoiceLifecycleStage = 'ORDER_CONFIRMED' | 'SHIPPED' | 'INVOICED' | 'PAID';
export type ChargeType = 'ONE_TIME' | 'RECURRING';

export interface InvoiceLineItem {
  id: string;
  description: string;
  chargeType: ChargeType;
  quantity: number;
  unitPrice: number;
  total: number;
  period?: string; // e.g. 'Annual License', 'Monthly Retainer'
  isDelivered?: boolean;
}

export interface Invoice {
  invoiceNumber?: string;
  currency?: string;
  id: string; // e.g. "INV-1042"
  quotationId: string;
  customerName: string;
  customerId?: string;
  customerTier: CustomerTier;
  amount: number; // Grand Total
  subtotal: number;
  taxAmount?: number;
  paidAmount: number;
  remainingAmount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: string;

  // Lifecycle & Shipment Enforcement
  lifecycleStage: InvoiceLifecycleStage;
  isShipped: boolean; // IMPORTANT: Do not show an invoice as payable before shipment
  shipmentStatus: 'NOT_SHIPPED' | 'PARTIAL_DELIVERY' | 'SHIPPED' | 'DELIVERED';
  isPartialDelivery?: boolean;
  partialDeliveryNotes?: string;

  items: InvoiceLineItem[];
  notes?: string;
}

// ──────────────────────────────────────────────────────────────────────
// Fulfillment Status — aligned with backend enum + UI stages
// ──────────────────────────────────────────────────────────────────────
export type FulfillmentStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'ALLOCATED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'BACKORDERED'
  | 'PREPARING'
  | 'IN_TRANSIT';

// Legacy aliases
export function normalizeFulfillmentStatus(status: string): FulfillmentStatus {
  const LEGACY_MAP: Record<string, FulfillmentStatus> = {
    'PREPARING': 'PARTIAL',
    'IN_TRANSIT': 'SHIPPED',
  };
  return (LEGACY_MAP[status] ?? status) as FulfillmentStatus;
}

export interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  location: string;
  productId: string;
  productName: string;
  stock: number;
  reserved: number;
  available: number;
}

export interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  units: number;
  shipmentNumber: number;
  trackingNumber?: string;
  carrier?: string;
  status: 'SCHEDULED' | 'DISPATCHED' | 'DELIVERED';
}

export interface FulfillmentOrder {
  id: string; // e.g. "FUL-801"
  quotationId: string;
  customerName: string;
  customerId?: string;
  productId: string;
  productName: string;
  orderedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  primaryWarehouse: string;
  status: FulfillmentStatus;
  hasBackorder: boolean;
  backorderQuantity: number;
  suggestedAction?: string;
  allocations: WarehouseAllocation[];
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery: string;
  shippedAt?: string;
  notes?: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';
export type BillingFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface SubscriptionInvoiceItem {
  id: string; // e.g. "INV-1044"
  date: string;
  amount: number;
  status: 'PAID' | 'ISSUED' | 'PARTIALLY_PAID';
  period: string; // e.g. "Aug 1 - Aug 31, 2026"
}

export interface CommercialSubscription {
  id: string; // e.g. "SUB-201"
  customerName: string;
  customerId: string;
  customerTier: CustomerTier;
  planName: string; // e.g. "Enterprise Mission-Critical Care"
  productService: string; // e.g. "Acme Care Plan", "Beta Support SLA"
  contractDuration: string; // e.g. "2 Years", "1 Year", "3 Years"
  billingFrequency: BillingFrequency;
  recurringAmount: number; // e.g. $3,000 / month, or $4,550 / quarter
  status: SubscriptionStatus;
  startDate: string; // e.g. "2025-09-01"
  nextBillingDate: string; // e.g. "2026-10-01"
  renewalDate: string; // e.g. "2027-09-01"
  seatsOrLicenses?: number;
  autoRenew: boolean;
  includedServices: string[];
  invoiceHistory: SubscriptionInvoiceItem[];
  notes?: string;
}

export interface EmployeeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE' | 'FINANCE_OFFICER' | 'CUSTOMER';
  active: boolean;
  department?: string;
  createdAt: string;
  updatedAt?: string;
}
