// ============================================================
// COMPLETE TYPE DEFINITIONS FOR DEALFLOW360
// ============================================================

// ── Enums ─────────────────────────────────────────────────
export type UserRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_EXECUTIVE'
  | 'FINANCE_OFFICER';

export type CustomerTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type QuotationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'RETURNED'
  | 'APPROVED'
  | 'NEGOTIATION'
  | 'CONFIRMED'
  | 'FULFILLMENT'
  | 'PARTIALLY_SHIPPED'
  | 'SHIPPED'
  | 'INVOICED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED';

export type ApprovalStage = 'SALES_MANAGER' | 'FINANCE_OFFICER' | 'COMPLETED';

export type FulfillmentStatus = 'PENDING' | 'PARTIAL' | 'BACKORDER' | 'SHIPPED' | 'COMPLETED';

export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'NOT_SUBSCRIBED';

export type BillingFrequency = 'MONTHLY' | 'YEARLY';

export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CARD' | 'CHEQUE' | 'CASH' | 'OTHER';

export type ProductCategory = 'Hardware' | 'Software' | 'Services' | 'Subscription';

export type ProductStatus = 'ACTIVE' | 'ARCHIVED';

export type DealHealthSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

// ── User & Auth ────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customerId?: string;
  companyName?: string;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthSession {
  user: User;
  isAuthenticated: boolean;
}

// ── Customer ───────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  tier: CustomerTier;
  contactName: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  // computed / aggregated
  activeDeals?: number;
  pipeline?: number;
  revenue?: number;
}

// ── Product ────────────────────────────────────────────────
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
}

export interface TierPrice {
  tier: CustomerTier;
  price: number;
  discountPercentage: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  unit: string;
  taxPercentage: number;
  description?: string;
  isSubscription: boolean;
  status: ProductStatus;
  tierPrices: TierPrice[];
  variants: ProductVariant[];
  createdAt: string;
}

// ── Quotation ──────────────────────────────────────────────
export interface QuotationLine {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  allowedDiscountPercentage: number;
  lineTotal: number;
  riskLevel: RiskLevel;
  deliveryDate?: string;
  notes?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer?: Customer;
  salesExecutiveId: string;
  salesExecutive?: User;
  status: QuotationStatus;
  amount: number;
  riskLevel: RiskLevel;
  priceList?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lines: QuotationLine[];
}

// ── Approval ───────────────────────────────────────────────
export interface ApprovalAuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  comment?: string;
  timestamp: string;
}

export interface Approval {
  id: string;
  quotationId: string;
  quotation?: Quotation;
  status: ApprovalStatus;
  currentStage: ApprovalStage;
  requestedById: string;
  requestedByName: string;
  createdAt: string;
  updatedAt: string;
  auditTrail: ApprovalAuditEntry[];
  salesManagerApproved?: boolean;
  financeApproved?: boolean;
  returnReason?: string;
  rejectReason?: string;
}

// ── Negotiation ────────────────────────────────────────────
export interface NegotiationMessage {
  id: string;
  quotationId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  timestamp: string;
  isInternal: boolean;
}

export interface NegotiationRequest {
  id: string;
  quotationId: string;
  customerId: string;
  lineId?: string;
  requestedDiscount?: number;
  requestedDeliveryDate?: string;
  comment: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

// ── Fulfillment ────────────────────────────────────────────
export interface WarehouseAllocation {
  warehouseId: string;
  warehouseName: string;
  quantityAvailable: number;
  quantityAllocated: number;
  estimatedShipmentDays: number;
  shippingCost: number;
}

export interface FulfillmentOrder {
  id: string;
  quotationId: string;
  quoteNumber?: string;
  customer?: Customer;
  status: FulfillmentStatus;
  totalItems: number;
  warehouseAllocations: WarehouseAllocation[];
  backorderUnits: number;
  expectedShipment: string;
  acceptedAt?: string;
  createdAt: string;
}

// ── Invoice & Payment ──────────────────────────────────────
export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  paidAt: string;
  recordedById: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  fulfillmentId?: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  lines: InvoiceLine[];
  payments: Payment[];
  shipmentReference?: string;
}

// ── Subscription ───────────────────────────────────────────
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingFrequency: BillingFrequency;
  features: string[];
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  customer?: Customer;
  planId: string;
  planName: string;
  billingFrequency: BillingFrequency;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate: string;
  billingHistory: BillingRecord[];
}

export interface BillingRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  status: 'PAID' | 'FAILED' | 'PENDING';
  billedAt: string;
}

// ── Deal Health ────────────────────────────────────────────
export interface DealHealthEvent {
  id: string;
  quotationId: string;
  quoteNumber: string;
  customerId: string;
  customer?: Customer;
  issueType: 'STALLED' | 'DISCOUNT_ANOMALY' | 'DELIVERY_SLIPPAGE' | 'RISK_ESCALATION';
  issue: string;
  severity: DealHealthSeverity;
  ageDays: number;
  recommendedAction: string;
  status: 'OPEN' | 'NUDGED' | 'ESCALATED' | 'RESOLVED';
  createdAt: string;
}

// ── Discount Rules ─────────────────────────────────────────
export interface DiscountRule {
  id: string;
  tier: CustomerTier;
  category: ProductCategory;
  maxDiscountPercentage: number;
  requiresManagerApproval: boolean;
  requiresFinanceApproval: boolean;
}

// ── Dashboard KPIs ─────────────────────────────────────────
export interface DashboardKPIs {
  pendingApprovals: number;
  openQuotations: number;
  atRiskDeals: number;
  revenue: number;
  unpaidInvoices: number;
  activeSubscriptions?: number;
  totalCustomers?: number;
  pendingFinanceApprovals?: number;
  totalInvoiced?: number;
  overdueInvoices?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'APPROVAL' | 'QUOTE' | 'NEGOTIATION' | 'PAYMENT' | 'SUBSCRIPTION' | 'SHIPMENT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ── API Response types ─────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
