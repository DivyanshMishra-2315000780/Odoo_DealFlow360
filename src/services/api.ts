import {
  Customer,
  Product,
  Quotation,
  Invoice,
  FulfillmentOrder,
  QuotationStatus,
  InvoiceStatus,
  WarehouseStock,
  CommercialSubscription,
  SubscriptionStatus,
} from '@/types/dealflow';
import { mockStore } from '@/mock/store';

// Simulates slight network latency for authentic enterprise UX (spinners, optimistic updates)
const NETWORK_DELAY_MS = 150;

function simulateDelay<T>(data: T, ms = NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), ms);
  });
}

/**
 * DealFlow360 API Service Layer
 * Clean abstraction: All TanStack Query hooks call these methods.
 * When backend is connected, replace simulateDelay / mockStore with axios calls.
 */
export const dealflowApi = {
  // Customers
  async getCustomers(): Promise<Customer[]> {
    return simulateDelay(mockStore.getCustomers());
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const customer = mockStore.getCustomerById(id);
    return simulateDelay(customer || null);
  },

  // Products
  async getProducts(): Promise<Product[]> {
    return simulateDelay(mockStore.getProducts());
  },

  async getProductById(id: string): Promise<Product | null> {
    const product = mockStore.getProductById(id);
    return simulateDelay(product || null);
  },

  async saveProduct(product: Product): Promise<Product> {
    return simulateDelay(mockStore.saveProduct(product));
  },

  async deleteProduct(id: string): Promise<boolean> {
    return simulateDelay(mockStore.deleteProduct(id));
  },

  // Quotations
  async getQuotations(): Promise<Quotation[]> {
    return simulateDelay(mockStore.getQuotations());
  },

  async getQuotationById(id: string): Promise<Quotation | null> {
    const quotation = mockStore.getQuotationById(id);
    return simulateDelay(quotation || null);
  },

  async saveQuotation(quotation: Quotation): Promise<Quotation> {
    return simulateDelay(mockStore.saveQuotation(quotation), 200);
  },

  async updateQuotationStatus(
    id: string,
    status: QuotationStatus,
    note?: string,
    actor?: string
  ): Promise<Quotation> {
    const updated = mockStore.updateQuotationStatus(id, status, note, actor);
    if (!updated) {
      throw new Error(`Quotation ${id} not found`);
    }
    return simulateDelay(updated, 200);
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return simulateDelay(mockStore.getInvoices());
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoice = mockStore.getInvoiceById(id);
    return simulateDelay(invoice || null);
  },

  async updateInvoiceStatus(
    id: string,
    status: InvoiceStatus,
    paymentMethod?: string
  ): Promise<Invoice> {
    const updated = mockStore.updateInvoiceStatus(id, status, paymentMethod);
    if (!updated) {
      throw new Error(`Invoice ${id} not found`);
    }
    return simulateDelay(updated, 200);
  },

  async recordInvoicePayment(
    id: string,
    amount: number,
    paymentMethod: string,
    paymentReference: string
  ): Promise<Invoice> {
    const updated = mockStore.recordInvoicePayment(id, amount, paymentMethod, paymentReference);
    if (!updated) {
      throw new Error(`Invoice ${id} not found`);
    }
    return simulateDelay(updated, 200);
  },

  // Fulfillment & Warehouse Logistics
  async getFulfillmentOrders(): Promise<FulfillmentOrder[]> {
    return simulateDelay(mockStore.getFulfillmentOrders());
  },

  async getFulfillmentOrderById(id: string): Promise<FulfillmentOrder | null> {
    const order = mockStore.getFulfillmentOrderById(id);
    return simulateDelay(order || null);
  },

  async getWarehouseStock(): Promise<WarehouseStock[]> {
    return simulateDelay(mockStore.getWarehouseStock());
  },

  async updateFulfillmentOrder(order: FulfillmentOrder): Promise<FulfillmentOrder> {
    const updated = mockStore.updateFulfillmentOrder(order);
    return simulateDelay(updated, 200);
  },

  async createShipment(
    id: string,
    carrier: string,
    trackingNumber: string
  ): Promise<FulfillmentOrder> {
    const updated = mockStore.createShipment(id, carrier, trackingNumber);
    if (!updated) {
      throw new Error(`Fulfillment order ${id} not found`);
    }
    return simulateDelay(updated, 200);
  },

  // Subscriptions & Recurring Revenue
  async getSubscriptions(): Promise<CommercialSubscription[]> {
    return simulateDelay(mockStore.getSubscriptions());
  },

  async getSubscriptionById(id: string): Promise<CommercialSubscription | null> {
    const sub = mockStore.getSubscriptionById(id);
    return simulateDelay(sub || null);
  },

  async updateSubscriptionStatus(
    id: string,
    status: SubscriptionStatus
  ): Promise<CommercialSubscription> {
    const updated = mockStore.updateSubscriptionStatus(id, status);
    if (!updated) {
      throw new Error(`Subscription ${id} not found`);
    }
    return simulateDelay(updated, 200);
  },

  async modifySubscription(sub: CommercialSubscription): Promise<CommercialSubscription> {
    const updated = mockStore.modifySubscription(sub);
    return simulateDelay(updated, 200);
  },

  // System Utility
  async resetDemoData(): Promise<{ success: boolean }> {
    mockStore.resetToDefaults();
    return simulateDelay({ success: true }, 100);
  },
};
