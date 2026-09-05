import {
  Customer,
  Product,
  Quotation,
  Invoice,
  FulfillmentOrder,
  QuotationStatus,
  InvoiceStatus,
  AuditEntry,
  WarehouseStock,
  WarehouseAllocation,
  CommercialSubscription,
  SubscriptionStatus,
} from '@/types/dealflow';
import {
  SEED_CUSTOMERS,
  SEED_PRODUCTS,
  SEED_QUOTATIONS,
  SEED_INVOICES,
  SEED_FULFILLMENT,
  SEED_WAREHOUSE_STOCK,
  SEED_SUBSCRIPTIONS,
} from './seed-data';

const STORAGE_KEYS = {
  QUOTATIONS: 'dealflow360_quotations_v1',
  CUSTOMERS: 'dealflow360_customers_v1',
  PRODUCTS: 'dealflow360_products_v1',
  INVOICES: 'dealflow360_invoices_v1',
  FULFILLMENT: 'dealflow360_fulfillment_v1',
  WAREHOUSE_STOCK: 'dealflow360_warehouse_stock_v1',
  SUBSCRIPTIONS: 'dealflow360_subscriptions_v1',
};

// In-memory fallback if running on server side
let memoryQuotations: Quotation[] = [...SEED_QUOTATIONS];
let memoryCustomers: Customer[] = [...SEED_CUSTOMERS];
let memoryProducts: Product[] = [...SEED_PRODUCTS];
let memoryInvoices: Invoice[] = [...SEED_INVOICES];
let memoryFulfillment: FulfillmentOrder[] = [...SEED_FULFILLMENT];
let memoryWarehouseStock: WarehouseStock[] = [...SEED_WAREHOUSE_STOCK];
let memorySubscriptions: CommercialSubscription[] = [...SEED_SUBSCRIPTIONS];

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
    return quotation;
  },

  updateQuotationStatus(
    id: string,
    newStatus: QuotationStatus,
    note?: string,
    actor: string = 'Authorized Approver'
  ): Quotation | null {
    const quotation = this.getQuotationById(id);
    if (!quotation) return null;

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: `Status updated to ${newStatus}`,
      details: note || `Quotation state transitioned to ${newStatus}.`,
      badgeType:
        newStatus === 'APPROVED' || newStatus === 'CONFIRMED'
          ? 'success'
          : newStatus === 'REJECTED'
          ? 'destructive'
          : 'warning',
    };

    const updatedQuotation: Quotation = {
      ...quotation,
      status: newStatus,
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

    return this.updateFulfillmentOrder(updated);
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

  resetToDefaults(): void {
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
      window.localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
      window.localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      window.localStorage.removeItem(STORAGE_KEYS.INVOICES);
      window.localStorage.removeItem(STORAGE_KEYS.FULFILLMENT);
      window.localStorage.removeItem(STORAGE_KEYS.WAREHOUSE_STOCK);
      window.localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
    }
    memoryQuotations = [...SEED_QUOTATIONS];
    memoryCustomers = [...SEED_CUSTOMERS];
    memoryProducts = [...SEED_PRODUCTS];
    memoryInvoices = [...SEED_INVOICES];
    memoryFulfillment = [...SEED_FULFILLMENT];
    memoryWarehouseStock = [...SEED_WAREHOUSE_STOCK];
    memorySubscriptions = [...SEED_SUBSCRIPTIONS];
  },
};
