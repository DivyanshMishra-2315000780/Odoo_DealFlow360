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

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  description: string;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'LEAD_TIME_REQUIRED';
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

export type QuotationStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PENDING_DISCOUNT_APPROVAL'
  | 'PENDING_FINANCE_APPROVAL'
  | 'APPROVED'
  | 'IN_NEGOTIATION'
  | 'CONFIRMED'
  | 'RETURNED'
  | 'REJECTED'
  | 'FULFILLED';

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

export interface Quotation {
  id: string; // e.g. "Q-1042"
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
}

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
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

export type FulfillmentStatus = 'PENDING' | 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED';

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
  status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
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
