import {
  Customer,
  CustomerTier,
  Product,
  Quotation,
  QuotationLineItem,
  Invoice,
  FulfillmentOrder,
  QuotationStatus,
  InvoiceStatus,
  AuditEntry,
  WarehouseStock,
  WarehouseAllocation,
  CommercialSubscription,
  SubscriptionStatus,
  DiscountPolicyConfig,
  RuleAuditLogEntry,
  CustomerRequirement,
  RequirementStatus,
  RequirementItem,
  RequirementPriority,
} from '@/types/dealflow';
import { evaluateQuotationRisk } from '@/lib/discount-engine';
import {
  SEED_CUSTOMERS,
  SEED_PRODUCTS,
  SEED_QUOTATIONS,
  SEED_INVOICES,
  SEED_FULFILLMENT,
  SEED_WAREHOUSE_STOCK,
  SEED_SUBSCRIPTIONS,
  SEED_DISCOUNT_RULES,
  SEED_RULE_AUDIT_LOG,
  SEED_REQUIREMENTS,
} from './seed-data';

const STORAGE_KEYS = {
  QUOTATIONS: 'dealflow360_quotations_v1',
  CUSTOMERS: 'dealflow360_customers_v1',
  PRODUCTS: 'dealflow360_products_v1',
  INVOICES: 'dealflow360_invoices_v1',
  FULFILLMENT: 'dealflow360_fulfillment_v1',
  WAREHOUSE_STOCK: 'dealflow360_warehouse_stock_v1',
  SUBSCRIPTIONS: 'dealflow360_subscriptions_v1',
  DISCOUNT_RULES: 'dealflow360_discount_rules_v1',
  DISCOUNT_AUDIT: 'dealflow360_discount_audit_v1',
  REQUIREMENTS: 'dealflow360_requirements_v1',
};

// In-memory fallback if running on server side
let memoryQuotations: Quotation[] = [...SEED_QUOTATIONS];
let memoryCustomers: Customer[] = [...SEED_CUSTOMERS];
let memoryProducts: Product[] = [...SEED_PRODUCTS];
let memoryInvoices: Invoice[] = [...SEED_INVOICES];
let memoryFulfillment: FulfillmentOrder[] = [...SEED_FULFILLMENT];
let memoryWarehouseStock: WarehouseStock[] = [...SEED_WAREHOUSE_STOCK];
let memorySubscriptions: CommercialSubscription[] = [...SEED_SUBSCRIPTIONS];
let memoryRequirements: CustomerRequirement[] = [...SEED_REQUIREMENTS];
let memoryDiscountRules: DiscountPolicyConfig = { ...SEED_DISCOUNT_RULES };
let memoryRuleAuditLog: RuleAuditLogEntry[] = [...SEED_RULE_AUDIT_LOG];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore local storage quota issues
  }
}

export const mockStore = {
  getCustomers(): Customer[] {
    if (isBrowser()) {
      return loadFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    }
    return memoryCustomers;
  },

  getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find((c) => c.id === id);
  },

  getProducts(): Product[] {
    if (isBrowser()) {
      return loadFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
    }
    return memoryProducts;
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  },

  saveProduct(product: Product): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...products];
      updated[index] = product;
    } else {
      updated = [product, ...products];
    }
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.PRODUCTS, updated);
    } else {
      memoryProducts = updated;
    }
    return product;
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts();
    const updated = products.filter((p) => p.id !== id);
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.PRODUCTS, updated);
    } else {
      memoryProducts = updated;
    }
    return true;
  },

  getQuotations(): Quotation[] {
    if (isBrowser()) {
      return loadFromStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, SEED_QUOTATIONS);
    }
    return memoryQuotations;
  },

  getQuotationById(id: string): Quotation | undefined {
    return this.getQuotations().find((q) => q.id === id);
  },

  saveQuotation(quotation: Quotation): Quotation {
    const current = this.getQuotations();
    const index = current.findIndex((q) => q.id === quotation.id);
    let updated: Quotation[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = {
        ...quotation,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [quotation, ...current];
    }
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.QUOTATIONS, updated);
    } else {
      memoryQuotations = updated;
    }

    // Automatically synchronize originating requirement status
    if (quotation.requirementId) {
      this.updateRequirementStatus(quotation.requirementId, 'QUOTATION_CREATED', quotation.id);
    }

    return quotation;
  },

  updateQuotationStatus(
    id: string,
    newStatus: QuotationStatus,
    note?: string,
    actor: string = 'Authorized Approver',
    meta?: {
      salesManagerApproved?: boolean;
      financeApproved?: boolean;
      reapprovalRequired?: boolean;
      reapprovalReason?: string;
      deliveryDate?: string;
      dealHealthScore?: number;
      items?: QuotationLineItem[];
    }
  ): Quotation | null {
    const quotation = this.getQuotationById(id);
    if (!quotation) return null;

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: meta?.reapprovalRequired
        ? 'Re-Approval Required (Policy Exceeded)'
        : `Status updated to ${newStatus}`,
      details: note || `Quotation state transitioned to ${newStatus}.`,
      badgeType:
        newStatus === 'APPROVED' || newStatus === 'CONFIRMED'
          ? 'success'
          : newStatus === 'REJECTED'
          ? 'destructive'
          : 'warning',
    };

    let items = quotation.items;
    let subtotal = quotation.subtotal;
    let totalDiscountAmount = quotation.totalDiscountAmount;
    let grandTotal = quotation.grandTotal;
    let riskDiagnosis = quotation.riskDiagnosis;
    let dealHealthScore = meta?.dealHealthScore !== undefined
      ? meta.dealHealthScore
      : quotation.dealHealthScore;

    if (meta?.items && meta.items.length > 0) {
      items = meta.items;
      const riskEval = evaluateQuotationRisk(items, quotation.customerTier);
      subtotal = riskEval.subtotal;
      totalDiscountAmount = riskEval.totalDiscountAmount;
      grandTotal = riskEval.grandTotal;
      riskDiagnosis = riskEval.riskDiagnosis;
      if (meta?.dealHealthScore === undefined) {
        dealHealthScore = riskEval.dealHealthScore;
      }
    }

    let salesManagerApproved = meta?.salesManagerApproved !== undefined
      ? meta.salesManagerApproved
      : quotation.salesManagerApproved;

    let financeApproved = meta?.financeApproved !== undefined
      ? meta.financeApproved
      : quotation.financeApproved;

    let reapprovalRequired = meta?.reapprovalRequired !== undefined
      ? meta.reapprovalRequired
      : quotation.reapprovalRequired;

    let reapprovalReason = meta?.reapprovalReason !== undefined
      ? meta.reapprovalReason
      : quotation.reapprovalReason;

    if (newStatus === 'APPROVED') {
      salesManagerApproved = true;
      financeApproved = true;
      reapprovalRequired = false;
      reapprovalReason = undefined;
      dealHealthScore = Math.max(dealHealthScore, 92);
    } else if (newStatus === 'CONFIRMED') {
      reapprovalRequired = false;
      reapprovalReason = undefined;
      dealHealthScore = 98;

      // Auto-ensure linked Fulfillment Order exists
      const existingFulfillment = this.getFulfillmentOrders().find((f) => f.quotationId === quotation.id);
      if (!existingFulfillment) {
        const hardwareItems = items.filter((i) => i.category === 'Hardware');
        const totalQty = hardwareItems.reduce((sum, i) => sum + i.quantity, 0) || items.reduce((sum, i) => sum + i.quantity, 0) || 1;
        const mainWhQty = Math.max(1, Math.floor(totalQty * 0.75));
        const secondaryQty = totalQty - mainWhQty;

        const newFulfillment: FulfillmentOrder = {
          id: `FUL-${Math.floor(800 + Math.random() * 100)}`,
          quotationId: quotation.id,
          customerName: quotation.customerName,
          customerId: quotation.customerId,
          productId: hardwareItems[0]?.productId || items[0]?.productId || 'PROD-101',
          productName: hardwareItems[0]?.productName || items[0]?.productName || 'Enterprise Hardware Bundle',
          orderedQuantity: totalQty,
          reservedQuantity: totalQty,
          availableQuantity: totalQty + 4,
          primaryWarehouse: 'Multi-Facility Split (Auto-Staged)',
          status: 'PREPARING',
          hasBackorder: secondaryQty > 0 && totalQty > 20,
          backorderQuantity: secondaryQty > 0 && totalQty > 20 ? secondaryQty : 0,
          suggestedAction: 'Consolidate remaining backorder from secondary depot buffer',
          allocations: [
            {
              warehouseId: 'WH-01',
              warehouseName: 'Main Warehouse',
              units: mainWhQty,
              shipmentNumber: 1,
              carrier: 'FedEx Priority Overnight',
              trackingNumber: `1Z-CHI-${Math.floor(100000 + Math.random() * 900000)}`,
              status: 'SCHEDULED',
            },
            ...(secondaryQty > 0
              ? [
                  {
                    warehouseId: 'WH-02',
                    warehouseName: 'East Depot',
                    units: secondaryQty,
                    shipmentNumber: 2,
                    carrier: 'UPS Express Freight',
                    trackingNumber: `1Z-NWK-${Math.floor(100000 + Math.random() * 900000)}`,
                    status: 'SCHEDULED' as const,
                  },
                ]
              : []),
          ],
          estimatedDelivery: quotation.deliveryDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          notes: 'Auto-staged upon customer contract confirmation.',
        };
        this.updateFulfillmentOrder(newFulfillment);
      }

      // Auto-ensure linked Invoice exists
      const existingInvoice = this.getInvoices().find((inv) => inv.quotationId === quotation.id);
      if (!existingInvoice) {
        const newInvoice: Invoice = {
          id: `INV-${Math.floor(1040 + Math.random() * 100)}`,
          quotationId: quotation.id,
          customerName: quotation.customerName,
          customerId: quotation.customerId,
          customerTier: quotation.customerTier,
          amount: grandTotal,
          subtotal,
          taxAmount: 0,
          paidAmount: 0,
          remainingAmount: grandTotal,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'UNPAID',
          paymentStatus: 'UNPAID',
          lifecycleStage: 'ORDER_CONFIRMED',
          isShipped: false,
          shipmentStatus: 'NOT_SHIPPED',
          isPartialDelivery: false,
          items: items.map((it, idx) => ({
            id: `ITEM-${idx + 1}`,
            description: `${it.productName} (${it.quantity} Units, ${it.discountPercent}% Concession)`,
            chargeType: 'ONE_TIME',
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.lineTotal,
            isDelivered: false,
          })),
        };
        const allInvoices = this.getInvoices();
        if (isBrowser()) {
          saveToStorage(STORAGE_KEYS.INVOICES, [newInvoice, ...allInvoices]);
        } else {
          memoryInvoices = [newInvoice, ...allInvoices];
        }
      }
    }

    const updatedQuotation: Quotation = {
      ...quotation,
      status: newStatus,
      items,
      subtotal,
      totalDiscountAmount,
      grandTotal,
      riskDiagnosis,
      salesManagerApproved,
      financeApproved,
      reapprovalRequired,
      reapprovalReason,
      dealHealthScore,
      deliveryDate: meta?.deliveryDate || quotation.deliveryDate,
      auditTrail: [newAuditEntry, ...quotation.auditTrail],
      updatedAt: new Date().toISOString(),
    };

    return this.saveQuotation(updatedQuotation);
  },

  getInvoices(): Invoice[] {
    if (isBrowser()) {
      return loadFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, SEED_INVOICES);
    }
    return memoryInvoices;
  },

  getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id);
  },

  updateInvoiceStatus(id: string, status: InvoiceStatus, paymentMethod?: string): Invoice | null {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const updatedInvoice: Invoice = {
      ...invoices[idx],
      status,
      paymentStatus: status === 'PAID' ? 'PAID' : status === 'PARTIALLY_PAID' ? 'PARTIALLY_PAID' : 'UNPAID',
      paymentMethod: paymentMethod || invoices[idx].paymentMethod,
      paidAt: status === 'PAID' ? new Date().toISOString() : invoices[idx].paidAt,
      lifecycleStage: status === 'PAID' ? 'PAID' : invoices[idx].lifecycleStage,
    };

    invoices[idx] = updatedInvoice;
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    } else {
      memoryInvoices = invoices;
    }
    return updatedInvoice;
  },

  recordInvoicePayment(
    id: string,
    amount: number,
    paymentMethod: string,
    paymentReference: string
  ): Invoice | null {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;

    const invoice = invoices[idx];

    // IMPORTANT BUSINESS RULE: Do not allow payment before shipment
    if (!invoice.isShipped) {
      throw new Error('Pre-shipment lock: Invoice cannot accept payment before shipment verification.');
    }

    const currentPaid = invoice.paidAmount || 0;
    const newPaidAmount = Math.min(invoice.amount, currentPaid + amount);
    const remainingAmount = Math.max(0, invoice.amount - newPaidAmount);

    const isFullyPaid = remainingAmount === 0;
    const isPartiallyPaid = !isFullyPaid && newPaidAmount > 0;

    const updatedInvoice: Invoice = {
      ...invoice,
      paidAmount: newPaidAmount,
      remainingAmount,
      status: isFullyPaid ? 'PAID' : isPartiallyPaid ? 'PARTIALLY_PAID' : 'UNPAID',
      paymentStatus: isFullyPaid ? 'PAID' : isPartiallyPaid ? 'PARTIALLY_PAID' : 'UNPAID',
      paymentMethod,
      paymentReference,
      paidAt: new Date().toISOString(),
      lifecycleStage: isFullyPaid ? 'PAID' : invoice.lifecycleStage,
    };

    invoices[idx] = updatedInvoice;
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.INVOICES, invoices);
    } else {
      memoryInvoices = invoices;
    }

    // Synchronize linked quotation deal health & activity
    if (isFullyPaid && invoice.quotationId) {
      const quote = this.getQuotationById(invoice.quotationId);
      if (quote) {
        const paymentAudit: AuditEntry = {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: 'Finance Settlement Desk',
          action: 'Payment Succeeded (PAID)',
          details: `Invoice ${invoice.id} settled in full (${paymentMethod}, Ref #${paymentReference}). Deal completed.`,
          badgeType: 'success',
        };
        this.saveQuotation({
          ...quote,
          dealHealthScore: 100,
          auditTrail: [paymentAudit, ...quote.auditTrail],
        });
      }
    }

    return updatedInvoice;
  },

  getFulfillmentOrders(): FulfillmentOrder[] {
    const orders = isBrowser()
      ? loadFromStorage<FulfillmentOrder[]>(STORAGE_KEYS.FULFILLMENT, SEED_FULFILLMENT)
      : memoryFulfillment;
    return (orders || []).map((o) => ({
      ...o,
      allocations: Array.isArray(o.allocations) ? o.allocations : [],
    }));
  },

  getFulfillmentOrderById(id: string): FulfillmentOrder | undefined {
    return this.getFulfillmentOrders().find((f) => f.id === id);
  },

  getWarehouseStock(): WarehouseStock[] {
    if (isBrowser()) {
      return loadFromStorage<WarehouseStock[]>(STORAGE_KEYS.WAREHOUSE_STOCK, SEED_WAREHOUSE_STOCK);
    }
    return memoryWarehouseStock;
  },

  updateFulfillmentOrder(order: FulfillmentOrder): FulfillmentOrder {
    const orders = this.getFulfillmentOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    let updated: FulfillmentOrder[];
    if (idx >= 0) {
      updated = [...orders];
      updated[idx] = order;
    } else {
      updated = [order, ...orders];
    }
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.FULFILLMENT, updated);
    } else {
      memoryFulfillment = updated;
    }
    return order;
  },

  createShipment(
    id: string,
    carrier: string,
    trackingNumber: string
  ): FulfillmentOrder | null {
    const order = this.getFulfillmentOrderById(id);
    if (!order) return null;

    const updatedAllocations = order.allocations.map((a) => ({
      ...a,
      carrier: a.carrier || carrier,
      trackingNumber: a.trackingNumber || trackingNumber,
      status: 'DISPATCHED' as const,
    }));

    const updated: FulfillmentOrder = {
      ...order,
      status: 'IN_TRANSIT',
      carrier,
      trackingNumber,
      shippedAt: new Date().toISOString(),
      allocations: updatedAllocations,
    };

    this.updateFulfillmentOrder(updated);

    // Synchronize linked invoice(s): unlock pre-shipment hold & mark INVOICED
    const invoices = this.getInvoices();
    let invoiceUpdated = false;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.quotationId === order.quotationId) {
        invoiceUpdated = true;
        return {
          ...inv,
          isShipped: true,
          shipmentStatus: 'SHIPPED' as const,
          lifecycleStage: 'INVOICED' as const,
          notes: `Carrier dispatch verified: ${carrier} (Tracking #${trackingNumber}). Commercial invoice released for payment.`,
        };
      }
      return inv;
    });

    if (invoiceUpdated) {
      if (isBrowser()) {
        saveToStorage(STORAGE_KEYS.INVOICES, updatedInvoices);
      } else {
        memoryInvoices = updatedInvoices;
      }
    }

    // Synchronize linked quotation: update fulfillmentStatus & audit log
    const quote = this.getQuotationById(order.quotationId);
    if (quote) {
      const shipAudit: AuditEntry = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'Logistics Center (Main WH & East Depot)',
        action: 'Shipment Dispatched & Invoice Released',
        details: `Dispatched 24 units (${carrier} #${trackingNumber}). Invoice generated and released for settlement.`,
        badgeType: 'success',
      };
      this.saveQuotation({
        ...quote,
        fulfillmentStatus: 'IN_TRANSIT',
        auditTrail: [shipAudit, ...quote.auditTrail],
      });
    }

    return updated;
  },

  // Subscriptions & Recurring Revenue
  getSubscriptions(): CommercialSubscription[] {
    if (isBrowser()) {
      return loadFromStorage<CommercialSubscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, SEED_SUBSCRIPTIONS);
    }
    return memorySubscriptions;
  },

  getSubscriptionById(id: string): CommercialSubscription | undefined {
    return this.getSubscriptions().find((s) => s.id === id);
  },

  updateSubscriptionStatus(id: string, status: SubscriptionStatus): CommercialSubscription | null {
    const subscriptions = this.getSubscriptions();
    const idx = subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const updated: CommercialSubscription = {
      ...subscriptions[idx],
      status,
      nextBillingDate: status === 'CANCELLED' ? 'Terminated' : subscriptions[idx].nextBillingDate,
    };

    subscriptions[idx] = updated;
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
    } else {
      memorySubscriptions = subscriptions;
    }
    return updated;
  },

  modifySubscription(sub: CommercialSubscription): CommercialSubscription {
    const subscriptions = this.getSubscriptions();
    const idx = subscriptions.findIndex((s) => s.id === sub.id);
    let updated: CommercialSubscription[];
    if (idx >= 0) {
      updated = [...subscriptions];
      updated[idx] = sub;
    } else {
      updated = [sub, ...subscriptions];
    }
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, updated);
    } else {
      memorySubscriptions = updated;
    }
    return sub;
  },

  getDiscountRules(): DiscountPolicyConfig {
    return loadFromStorage<DiscountPolicyConfig>(STORAGE_KEYS.DISCOUNT_RULES, memoryDiscountRules);
  },

  getDiscountAuditLogs(): RuleAuditLogEntry[] {
    return loadFromStorage<RuleAuditLogEntry[]>(STORAGE_KEYS.DISCOUNT_AUDIT, memoryRuleAuditLog);
  },

  updateDiscountRules(
    newConfig: DiscountPolicyConfig,
    changedBy = 'Marcus Vance (Sales Operations)',
    reason = 'Administrative policy revision'
  ): { config: DiscountPolicyConfig; audits: RuleAuditLogEntry[] } {
    const current = this.getDiscountRules();
    const currentAudits = this.getDiscountAuditLogs();
    const newAudits: RuleAuditLogEntry[] = [];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Compare Bronze
    if (current.tierLimits.Bronze !== newConfig.tierLimits.Bronze) {
      newAudits.push({
        id: `AUD-RUL-${Date.now()}-1`,
        rule: 'Bronze Customer Tier Cap',
        category: 'Customer Tier',
        previousValue: `${current.tierLimits.Bronze}%`,
        newValue: `${newConfig.tierLimits.Bronze}%`,
        changedBy,
        timestamp: now,
        reason,
      });
    }
    // Compare Silver
    if (current.tierLimits.Silver !== newConfig.tierLimits.Silver) {
      newAudits.push({
        id: `AUD-RUL-${Date.now()}-2`,
        rule: 'Silver Customer Tier Cap',
        category: 'Customer Tier',
        previousValue: `${current.tierLimits.Silver}%`,
        newValue: `${newConfig.tierLimits.Silver}%`,
        changedBy,
        timestamp: now,
        reason,
      });
    }
    // Compare Gold
    if (current.tierLimits.Gold !== newConfig.tierLimits.Gold) {
      newAudits.push({
        id: `AUD-RUL-${Date.now()}-3`,
        rule: 'Gold Customer Tier Cap',
        category: 'Customer Tier',
        previousValue: `${current.tierLimits.Gold}%`,
        newValue: `${newConfig.tierLimits.Gold}%`,
        changedBy,
        timestamp: now,
        reason,
      });
    }
    // Compare Hardware
    if (current.categoryLimits.Hardware !== newConfig.categoryLimits.Hardware) {
      newAudits.push({
        id: `AUD-RUL-${Date.now()}-4`,
        rule: 'Hardware Discount Ceiling',
        category: 'Category Limit',
        previousValue: `${current.categoryLimits.Hardware}%`,
        newValue: `${newConfig.categoryLimits.Hardware}%`,
        changedBy,
        timestamp: now,
        reason,
      });
    }
    // Compare Services
    if (current.categoryLimits.Services !== newConfig.categoryLimits.Services) {
      newAudits.push({
        id: `AUD-RUL-${Date.now()}-5`,
        rule: 'Services Discount Ceiling',
        category: 'Category Limit',
        previousValue: `${current.categoryLimits.Services}%`,
        newValue: `${newConfig.categoryLimits.Services}%`,
        changedBy,
        timestamp: now,
        reason,
      });
    }

    const updatedConfig: DiscountPolicyConfig = {
      ...newConfig,
      updatedAt: now,
      updatedBy: changedBy,
    };

    const updatedAudits = [...newAudits, ...currentAudits];

    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.DISCOUNT_RULES, updatedConfig);
      saveToStorage(STORAGE_KEYS.DISCOUNT_AUDIT, updatedAudits);
    } else {
      memoryDiscountRules = updatedConfig;
      memoryRuleAuditLog = updatedAudits;
    }

    return { config: updatedConfig, audits: updatedAudits };
  },

  // Customer Requirements
  getRequirements(customerId?: string): CustomerRequirement[] {
    const all = isBrowser()
      ? loadFromStorage<CustomerRequirement[]>(STORAGE_KEYS.REQUIREMENTS, SEED_REQUIREMENTS)
      : memoryRequirements;

    if (!customerId) return all;
    return all.filter(
      (r) =>
        r.customerId === customerId ||
        r.customerName.toLowerCase().includes(customerId.toLowerCase())
    );
  },

  getRequirementById(id: string): CustomerRequirement | undefined {
    return this.getRequirements().find((r) => r.id === id);
  },

  saveRequirement(req: CustomerRequirement): CustomerRequirement {
    const all = this.getRequirements();
    const idx = all.findIndex((r) => r.id === req.id);
    let updated: CustomerRequirement[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = {
        ...req,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updated = [req, ...all];
    }
    if (isBrowser()) {
      saveToStorage(STORAGE_KEYS.REQUIREMENTS, updated);
    } else {
      memoryRequirements = updated;
    }
    return req;
  },

  createRequirement(payload: {
    customerId: string;
    customerName: string;
    customerTier: CustomerTier;
    title: string;
    description: string;
    items: RequirementItem[];
    priority: RequirementPriority;
    expectedDeliveryDays: number;
    additionalNotes?: string;
    assignedSalesExecutive?: string;
  }): CustomerRequirement {
    const all = this.getRequirements();
    const newId = `REQ-${String(all.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();
    const newReq: CustomerRequirement = {
      id: newId,
      customerId: payload.customerId,
      customerName: payload.customerName,
      customerTier: payload.customerTier,
      title: payload.title,
      description: payload.description,
      items: payload.items,
      priority: payload.priority,
      expectedDeliveryDays: payload.expectedDeliveryDays,
      additionalNotes: payload.additionalNotes,
      status: 'NEW',
      assignedSalesExecutive: payload.assignedSalesExecutive || 'Marcus Vance',
      createdAt: now,
      updatedAt: now,
    };
    return this.saveRequirement(newReq);
  },

  updateRequirementStatus(
    id: string,
    status: RequirementStatus,
    quotationId?: string
  ): CustomerRequirement | null {
    const req = this.getRequirementById(id);
    if (!req) return null;
    const updated: CustomerRequirement = {
      ...req,
      status,
      quotationId: quotationId !== undefined ? quotationId : req.quotationId,
      updatedAt: new Date().toISOString(),
    };
    return this.saveRequirement(updated);
  },

  resetToDefaults(): void {
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
      window.localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      window.localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      window.localStorage.removeItem(STORAGE_KEYS.INVOICES);
      window.localStorage.removeItem(STORAGE_KEYS.FULFILLMENT);
      window.localStorage.removeItem(STORAGE_KEYS.WAREHOUSE_STOCK);
      window.localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
      window.localStorage.removeItem(STORAGE_KEYS.DISCOUNT_RULES);
      window.localStorage.removeItem(STORAGE_KEYS.DISCOUNT_AUDIT);
      window.localStorage.removeItem(STORAGE_KEYS.REQUIREMENTS);
    }
    memoryQuotations = [...SEED_QUOTATIONS];
    memoryCustomers = [...SEED_CUSTOMERS];
    memoryProducts = [...SEED_PRODUCTS];
    memoryInvoices = [...SEED_INVOICES];
    memoryFulfillment = [...SEED_FULFILLMENT];
    memoryWarehouseStock = [...SEED_WAREHOUSE_STOCK];
    memorySubscriptions = [...SEED_SUBSCRIPTIONS];
    memoryRequirements = [...SEED_REQUIREMENTS];
    memoryDiscountRules = { ...SEED_DISCOUNT_RULES };
    memoryRuleAuditLog = [...SEED_RULE_AUDIT_LOG];
  },
};
