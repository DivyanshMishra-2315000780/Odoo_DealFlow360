/**
 * API Adapter Layer — DealFlow360
 * Transforms backend DB response shapes into frontend interface types.
 *
 * The backend returns Drizzle ORM row shapes with snake_case and numeric strings.
 * The frontend expects camelCase interfaces with numbers and computed fields.
 */
import type {
  Customer,
  CustomerTier,
  Product,
  ProductCategory,
  Quotation,
  QuotationLineItem,
  QuotationStatus,
  RiskDiagnosis,
  RiskLevel,
  AuditEntry,
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  FulfillmentOrder,
  FulfillmentStatus,
  WarehouseStock,
  WarehouseAllocation,
  CommercialSubscription,
  SubscriptionStatus,
  BillingFrequency,
  CustomerRequirement,
  RequirementStatus,
  RequirementPriority,
  RequirementItem,
  DiscountPolicyConfig,
  RuleAuditLogEntry,
  PaymentStatus,
} from '@/types/dealflow';
import { CUSTOMER_TIER_LIMITS, CATEGORY_DISCOUNT_LIMITS } from '@/types/dealflow';

// ──────────────────────────────────────────────────────────────────────
// Utility helpers
// ──────────────────────────────────────────────────────────────────────
function num(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

function str(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function tierCase(tier: string): CustomerTier {
  const map: Record<string, CustomerTier> = {
    'BRONZE': 'Bronze', 'SILVER': 'Silver', 'GOLD': 'Gold',
    'Bronze': 'Bronze', 'Silver': 'Silver', 'Gold': 'Gold',
  };
  return map[tier] ?? 'Bronze';
}

function categoryFromName(name: string): ProductCategory {
  const lower = name.toLowerCase();
  if (lower.includes('setup') || lower.includes('warranty') || lower.includes('care') || lower.includes('support') || lower.includes('service') || lower.includes('consult')) {
    return 'Services';
  }
  return 'Hardware';
}

// ──────────────────────────────────────────────────────────────────────
// Customer Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptCustomer(raw: any): Customer {
  return {
    id: raw.id,
    name: raw.name ?? raw.companyName ?? '',
    tier: tierCase(raw.tier ?? 'BRONZE'),
    industry: raw.industry ?? '',
    contactEmail: raw.contactEmail ?? '',
    contactPerson: raw.contactPerson ?? raw.contactName ?? '',
    accountManager: raw.accountManagerName ?? raw.accountManager ?? raw.accountManagerId ?? '',
    activeDealsCount: num(raw.activeDealsCount ?? 0),
    totalLifetimeValue: num(raw.totalLifetimeValue ?? raw.lifetimeValue ?? 0),
    creditLimit: num(raw.creditLimit ?? 0),
    phone: raw.phone,
    address: raw.address,
    website: raw.website,
    creditRating: raw.creditRating,
    dealHealthScore: num(raw.dealHealthScore ?? 0),
    notes: raw.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptCustomers(rawList: any[]): Customer[] {
  return rawList.map(adaptCustomer);
}

// ──────────────────────────────────────────────────────────────────────
// Product Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptProduct(raw: any): Product {
  return {
    categoryId:raw.categoryId,baseCost:raw.baseCost==null?undefined:num(raw.baseCost),
    id: raw.id,
    sku: raw.sku ?? '',
    name: raw.name ?? '',
    category: raw.categoryName ? categoryFromName(raw.categoryName) : categoryFromName(raw.name ?? ''),
    basePrice: num(raw.unitPrice ?? raw.basePrice ?? 0),
    currency: raw.currency ?? 'USD',
    description: raw.description ?? '',
    stockStatus: raw.stockStatus ?? (num(raw.availableStock)===0?'LEAD_TIME_REQUIRED':num(raw.availableStock)<15?'LOW_STOCK':'IN_STOCK'),
    availableStock: raw.availableStock,
    status: raw.status ?? (raw.active === false ? 'ARCHIVED' : 'ACTIVE'),
    isSubscription: raw.isRecurring ?? false,
    billingFrequency: raw.billingFrequency ?? (raw.isRecurring ? 'MONTHLY' : 'NONE'),
    recurringPrice: num(raw.recurringPrice ?? 0),
    variants: raw.variants ?? [],
    tierPricing: raw.tierPricing,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptProducts(rawList: any[]): Product[] {
  return rawList.map(adaptProduct);
}

// ──────────────────────────────────────────────────────────────────────
// Quotation Adapter
// ──────────────────────────────────────────────────────────────────────
function buildRiskDiagnosis(
  riskScore: number,
  riskLevel: string,
  riskReasons: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lines: any[]
): RiskDiagnosis {
  const level = (riskLevel ?? 'LOW') as RiskLevel;
  const reasons = Array.isArray(riskReasons) ? riskReasons : [];
  const violationLines = lines.filter((l) => l.isViolation || l.discountStatus === 'EXCEEDED');

  let whatHappened = 'All line items are within approved discount policy limits.';
  let whyItMatters = 'No governance intervention required.';
  let nextAction = 'Proceed with standard approval workflow.';

  if (violationLines.length > 0) {
    const itemNames = violationLines.map((l) => l.productName ?? l.productId).join(', ');
    whatHappened = `${violationLines.length} line item(s) exceed approved discount ceilings: ${itemNames}. ${reasons.join('; ')}`;
    whyItMatters = `Discount violations erode margin and require escalated governance sign-off. Risk score: ${riskScore}/100 (${level}).`;
    nextAction = level === 'CRITICAL' || level === 'HIGH'
      ? 'Escalate to Finance Controller for exception sign-off before customer dispatch.'
      : 'Review discount justification and submit for manager approval.';
  }

  return {
    level,
    whatHappened,
    whyItMatters,
    nextAction,
    requiresFinanceApproval: level === 'CRITICAL' || level === 'HIGH',
    requiresExecutiveApproval: level === 'CRITICAL',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptQuotationLine(raw: any, customerTier: CustomerTier): QuotationLineItem {
  const discountPct = num(raw.discountPercentage ?? raw.discountPercent ?? 0);
  const category = raw.categoryName ? categoryFromName(raw.categoryName) : categoryFromName(raw.productName ?? raw.productId ?? '');
  const tierLimit = CUSTOMER_TIER_LIMITS[customerTier] ?? 5;
  const categoryLimit = CATEGORY_DISCOUNT_LIMITS[category] ?? 15;
  const effectiveLimit = num(raw.allowedDiscount ?? (discountPct - num(raw.excessDiscountPct)));
  const excessPercent = Math.max(0, discountPct - effectiveLimit);
  const isViolation = discountPct > effectiveLimit || raw.discountStatus === 'EXCEEDED';

  return {
    id: raw.id,
    productId: raw.productId ?? '',
    productName: raw.productName ?? raw.productId ?? '',
    category,
    unitPrice: num(raw.unitPrice),
    quantity: num(raw.quantity),
    discountPercent: discountPct,
    effectiveLimit,
    isViolation,
    excessPercent,
    lineTotal: num(raw.netAmount ?? raw.lineTotal ?? 0),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptQuotation(raw: any): Quotation {
  const customerTier = tierCase(raw.customer?.tier ?? raw.customerTier ?? 'BRONZE');
  const lines = (raw.lines ?? raw.items ?? []).map((l: unknown) => adaptQuotationLine(l, customerTier));
  const riskScore = num(raw.riskScore ?? 0);
  const riskLevel = str(raw.riskLevel ?? 'LOW');
  const status = str(raw.status) as QuotationStatus;

  return {
    id: raw.id ?? raw.quoteNumber ?? '',
    approvalRole: raw.approvalRole,
    negotiation: raw.negotiation,
    requirementId: raw.quoteRequestId ?? raw.requirementId,
    customerId: raw.customerId ?? '',
    customerName: raw.customer?.name ?? raw.customerName ?? '',
    customerTier,
    title: raw.title ?? raw.quoteNumber ?? `Quotation ${raw.id ?? ''}`,
    items: lines,
    subtotal: num(raw.subtotal),
    totalDiscountAmount: num(raw.totalDiscount ?? raw.totalDiscountAmount ?? 0),
    grandTotal: num(raw.totalAmount ?? raw.grandTotal ?? 0),
    status,
    riskDiagnosis: buildRiskDiagnosis(riskScore, riskLevel, raw.riskReasons, lines),
    auditTrail: adaptAuditTrail(raw.auditTrail ?? raw.auditLogs ?? []),
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
    dealHealthScore: num(raw.dealHealthScore ?? raw.healthScore ?? 75),
    notes: raw.notes ?? raw.paymentTerms,
    owner: raw.salesExecName ?? raw.owner ?? '',
    priceList: raw.priceListName ?? raw.priceList,
    deliveryDate: raw.deliveryDate ?? raw.validityDate,
    salesManagerApproved: raw.salesManagerApproved,
    financeApproved: raw.financeApproved,
    reapprovalRequired: raw.reapprovalRequired,
    reapprovalReason: raw.reapprovalReason,
    fulfillmentStatus: raw.fulfillmentStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptQuotations(rawList: any[]): Quotation[] {
  return rawList.map(adaptQuotation);
}

// ──────────────────────────────────────────────────────────────────────
// Audit Trail Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptAuditEntry(raw: any): AuditEntry {
  return {
    id: raw.id ?? '',
    timestamp: raw.createdAt ?? raw.timestamp ?? new Date().toISOString(),
    actor: raw.actorName ?? raw.actorId ?? raw.actor ?? 'System',
    action: raw.action ?? '',
    details: raw.details ?? raw.action ?? '',
    badgeType: raw.badgeType ?? 'default',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptAuditTrail(rawList: any[]): AuditEntry[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(adaptAuditEntry);
}

// ──────────────────────────────────────────────────────────────────────
// Invoice Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptInvoice(raw: any): Invoice {
  raw = raw.invoice ? {...raw.invoice, lines:raw.lines, payments:raw.payments, customerName:raw.customer?.name, isShipped:!raw.invoice.orderId || raw.fulfillment?.status === 'DELIVERED'} : raw;
  const amount = num(raw.total ?? raw.totalAmount ?? raw.amount ?? 0);
  const lastPayment=raw.payments?.find((payment:{status:string})=>payment.status==='SUCCESS');
  const paidAmount = raw.amountDue != null ? amount - num(raw.amountDue) : num(raw.paidAmount);

  return {
    id: raw.id ?? raw.invoiceNumber ?? '',
    invoiceNumber: raw.invoiceNumber,
    currency: raw.currency ?? 'USD',
    quotationId: raw.quotationId ?? raw.orderId ?? '',
    customerName: raw.customerName ?? '',
    customerId: raw.customerId,
    customerTier: tierCase(raw.customerTier ?? 'BRONZE'),
    amount,
    subtotal: num(raw.subtotal ?? amount),
    taxAmount: num(raw.tax ?? raw.taxAmount),
    paidAmount,
    remainingAmount: amount - paidAmount,
    issueDate: raw.issuedAt ?? raw.issueDate ?? raw.createdAt ?? '',
    dueDate: raw.dueDate ?? '',
    status: (raw.status ?? 'ISSUED') as InvoiceStatus,
    paymentStatus: (raw.paymentStatus ?? (raw.status === 'PAID' ? 'PAID' : 'PENDING')) as PaymentStatus,
    paymentMethod: raw.paymentMethod ?? lastPayment?.paymentMethod,
    paymentReference: raw.paymentReference ?? lastPayment?.gatewayReference,
    paidAt: raw.paidAt ?? lastPayment?.updatedAt,
    lifecycleStage: raw.lifecycleStage ?? (raw.status === 'PAID' ? 'PAID' : 'INVOICED'),
    isShipped: raw.isShipped ?? false,
    shipmentStatus: raw.shipmentStatus ?? 'NOT_SHIPPED',
    isPartialDelivery: raw.isPartialDelivery,
    partialDeliveryNotes: raw.partialDeliveryNotes,
    items: (raw.lines ?? raw.items ?? []).map(adaptInvoiceLine),
    notes: raw.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptInvoiceLine(raw: any): InvoiceLineItem {
  return {
    id: raw.id ?? '',
    description: raw.description ?? raw.productName ?? '',
    chargeType: raw.chargeType ?? (raw.isRecurring ? 'RECURRING' : 'ONE_TIME'),
    quantity: num(raw.quantity ?? 1),
    unitPrice: num(raw.unitPrice ?? raw.amount),
    total: num(raw.amount ?? raw.total ?? raw.lineAmount ?? 0),
    period: raw.period,
    isDelivered: raw.isDelivered,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptInvoices(rawList: any[]): Invoice[] {
  return rawList.map(adaptInvoice);
}

// ──────────────────────────────────────────────────────────────────────
// Fulfillment Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptFulfillmentOrder(raw: any): FulfillmentOrder {
  if(raw.fulfillment){const items=raw.items??[];raw={...raw.fulfillment,quotationId:raw.quotation.id,customerId:raw.quotation.customerId,customerName:raw.customer?.name,
    productId:items[0]?.productId,productName:items.map((i:{productName:string})=>i.productName).join(', '),orderedQuantity:items.reduce((n:number,i:{quantity:number})=>n+i.quantity,0),
    reservedQuantity:raw.allocations?.reduce((n:number,a:{allocatedQty:number})=>n+a.allocatedQty,0),allocations:raw.allocations,hasBackorder:raw.backorders?.length>0,
    backorderQuantity:raw.backorders?.reduce((n:number,b:{backorderedQty:number})=>n+b.backorderedQty,0),primaryWarehouse:raw.allocations?.map((a:{warehouseName:string})=>a.warehouseName).join(', ')};}

  return {
    id: raw.id ?? '',
    quotationId: raw.quotationId ?? raw.orderId ?? '',
    customerName: raw.customerName ?? '',
    customerId: raw.customerId,
    productId: raw.productId ?? '',
    productName: raw.productName ?? '',
    orderedQuantity: num(raw.orderedQuantity ?? raw.quantity ?? 0),
    reservedQuantity: num(raw.reservedQuantity ?? 0),
    availableQuantity: num(raw.availableQuantity ?? 0),
    primaryWarehouse: raw.primaryWarehouse ?? raw.warehouseName ?? '',
    status: (raw.status ?? 'PENDING') as FulfillmentStatus,
    hasBackorder: raw.hasBackorder ?? false,
    backorderQuantity: num(raw.backorderQuantity ?? 0),
    suggestedAction: raw.suggestedAction,
    allocations: (raw.allocations ?? []).map(adaptWarehouseAllocation),
    trackingNumber: raw.trackingNumber,
    carrier: raw.carrier,
    estimatedDelivery: raw.estimatedDelivery ?? '',
    shippedAt: raw.shippedAt,
    notes: raw.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptWarehouseAllocation(raw: any): WarehouseAllocation {
  return {
    warehouseId: raw.warehouseId ?? '',
    warehouseName: raw.warehouseName ?? '',
    units: num(raw.units ?? raw.allocatedQty ?? 0),
    shipmentNumber: num(raw.shipmentNumber ?? 1),
    trackingNumber: raw.trackingNumber,
    carrier: raw.carrier,
    status: raw.status ?? 'SCHEDULED',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptFulfillmentOrders(rawList: any[]): FulfillmentOrder[] {
  return rawList.map(adaptFulfillmentOrder);
}

// ──────────────────────────────────────────────────────────────────────
// Warehouse Stock Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptWarehouseStock(raw: any): WarehouseStock {
  const available = num(raw.quantityAvailable ?? raw.stock ?? 0);
  const reserved = num(raw.quantityReserved ?? raw.reserved ?? 0);
  return {
    warehouseId: raw.warehouseId ?? raw.id ?? '',
    warehouseName: raw.warehouseName ?? raw.name ?? '',
    location: raw.location ?? '',
    productId: raw.productId ?? '',
    productName: raw.productName ?? '',
    stock: available,
    reserved,
    available: available - reserved,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptWarehouseStocks(rawList: any[]): WarehouseStock[] {
  return rawList.map(adaptWarehouseStock);
}

// ──────────────────────────────────────────────────────────────────────
// Subscription Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptSubscription(raw: any): CommercialSubscription {
  raw = raw.subscription ? {...raw.subscription, plan:raw.plan, planName:raw.plan.name, billingCycle:raw.plan.billingCycle, customerName:raw.customer?.name} : raw;
  return {
    id: raw.id ?? '',
    customerName: raw.customerName ?? '',
    customerId: raw.customerId ?? '',
    customerTier: tierCase(raw.customerTier ?? 'BRONZE'),
    planName: raw.planName ?? raw.plan?.name ?? '',
    productService: raw.productService ?? raw.planName ?? '',
    contractDuration: raw.contractDuration ?? '1 Year',
    billingFrequency: (raw.billingCycle ?? raw.billingFrequency ?? 'MONTHLY') as BillingFrequency,
    recurringAmount: num(raw.recurringAmt ?? raw.recurringAmount ?? raw.amount ?? 0),
    status: (raw.status === 'CANCELED' ? 'CANCELLED' : raw.status ?? 'ACTIVE') as SubscriptionStatus,
    startDate: raw.startDate ?? raw.createdAt ?? '',
    nextBillingDate: raw.nextBillingDate ?? '',
    renewalDate: raw.renewalDate ?? '',
    seatsOrLicenses: raw.seatsOrLicenses ?? raw.quantity,
    autoRenew: raw.autoRenew ?? true,
    includedServices: raw.includedServices ?? [],
    invoiceHistory: raw.invoiceHistory ?? [],
    notes: raw.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptSubscriptions(rawList: any[]): CommercialSubscription[] {
  return rawList.map(adaptSubscription);
}

// ──────────────────────────────────────────────────────────────────────
// Customer Requirement Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptRequirement(raw: any): CustomerRequirement {
  return {
    id: raw.id ?? '',
    customerId: raw.customerId ?? '',
    customerName: raw.customerName ?? raw.customer?.name ?? '',
    customerTier: tierCase(raw.customerTier ?? raw.customer?.tier ?? 'BRONZE'),
    title: raw.title ?? '',
    description: raw.description ?? '',
    items: (raw.items ?? []).map(adaptRequirementItem),
    priority: (raw.metadata?.priority ?? raw.priority ?? 'MEDIUM') as RequirementPriority,
    expectedDeliveryDays: num(raw.metadata?.expectedDeliveryDays ?? raw.expectedDeliveryDays ?? raw.deliveryDays ?? 30),
    additionalNotes: raw.metadata?.additionalNotes ?? raw.additionalNotes ?? raw.notes,
    status: ({SUBMITTED:'NEW',ASSIGNED:'IN_REVIEW',QUOTED:'QUOTATION_CREATED',CLOSED:'CLOSED'}[raw.status as string] ?? raw.status ?? 'NEW') as RequirementStatus,
    assignedSalesExecutive: raw.assignedSalesExecId ?? raw.assignedSalesExecutive ?? '',
    quotationId: raw.quotationId,
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? raw.createdAt ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adaptRequirementItem(raw: any): RequirementItem {
  return {
    id: raw.id ?? '',
    name: raw.description ?? raw.name ?? raw.productName ?? '',
    quantity: num(raw.quantity),
    category: raw.category,
    notes: raw.notes,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptRequirements(rawList: any[]): CustomerRequirement[] {
  return rawList.map(adaptRequirement);
}

// ──────────────────────────────────────────────────────────────────────
// Discount Rules Adapter
// ──────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptDiscountRules(rawList: any[]): DiscountPolicyConfig {
  // Backend returns an array of rule rows; transform to frontend config shape
  const tierLimits = { Bronze: 5, Silver: 10, Gold: 15 };
  const categoryLimits = { Hardware: 15, Services: 10 };

  for (const rule of rawList) {
    const pct = num(rule.maxDiscountPct);
    if (rule.customerTier === 'BRONZE') tierLimits.Bronze = pct;
    else if (rule.customerTier === 'SILVER') tierLimits.Silver = pct;
    else if (rule.customerTier === 'GOLD') tierLimits.Gold = pct;
    // Category rules (using name or metadata)
    if (rule.name?.toLowerCase().includes('hardware')) categoryLimits.Hardware = pct;
    if (rule.name?.toLowerCase().includes('service')) categoryLimits.Services = pct;
  }

  return {
    tierLimits,
    categoryLimits,
    workflowRules: {
      withinLimit: 'Standard approval — Sales Manager review',
      overLimit: 'Escalated approval — Finance Controller sign-off',
      highRisk: 'Executive approval — VP Commercial Operations',
      mixedCategory: 'Strictest limit applies per line item',
      highRiskThresholdPoints: 50,
      criticalRiskThresholdPoints: 75,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: 'System',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function adaptRuleAuditLogs(rawList: any[]): RuleAuditLogEntry[] {
  return rawList.map((raw) => ({
    id: raw.id ?? '',
    rule: raw.rule ?? raw.entity ?? '',
    category: raw.category ?? 'Customer Tier',
    previousValue: str(raw.previousValue),
    newValue: str(raw.newValue),
    changedBy: raw.changedBy ?? raw.actorRole ?? raw.actorId ?? '',
    timestamp: raw.timestamp ?? raw.createdAt ?? '',
    reason: raw.reason ?? raw.newValue?.reason,
  }));
}
