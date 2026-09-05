import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, enrichFulfillment } from '@/lib/mock/db';
import { FulfillmentOrder, WarehouseAllocation } from '@/types';

export const mockFulfillmentHandlers = {
  async getAll(filters: { status?: string; page?: number; pageSize?: number } = {}) {
    await delay(400);
    const db = getDB();
    let items = db.fulfillmentOrders.map(f => enrichFulfillment(f, db));
    
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(f => f.status === filters.status);
    }
    
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);
    
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(id: string) {
    await delay(300);
    const db = getDB();
    const f = db.fulfillmentOrders.find(f => f.id === id);
    if (!f) throw new Error('Fulfillment order not found');
    return enrichFulfillment(f, db);
  },

  async acceptSplit(id: string) {
    await delay(600);
    const db = getDB();
    const idx = db.fulfillmentOrders.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Fulfillment order not found');
    
    db.fulfillmentOrders[idx] = {
      ...db.fulfillmentOrders[idx],
      status: 'SHIPPED',
      acceptedAt: new Date().toISOString(),
    };
    
    // Update quote status
    const qIdx = db.quotes.findIndex(q => q.id === db.fulfillmentOrders[idx].quotationId);
    if (qIdx !== -1) {
      db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'SHIPPED', updatedAt: new Date().toISOString() };
    }

    saveDB();
    return enrichFulfillment(db.fulfillmentOrders[idx], db);
  },

  async manualSplit(id: string, allocations: WarehouseAllocation[]) {
    await delay(800);
    const db = getDB();
    const idx = db.fulfillmentOrders.findIndex(f => f.id === id);
    if (idx === -1) throw new Error('Fulfillment order not found');
    
    db.fulfillmentOrders[idx] = {
      ...db.fulfillmentOrders[idx],
      status: 'SHIPPED',
      warehouseAllocations: allocations,
      acceptedAt: new Date().toISOString(),
    };
    
    const qIdx = db.quotes.findIndex(q => q.id === db.fulfillmentOrders[idx].quotationId);
    if (qIdx !== -1) {
      db.quotes[qIdx] = { ...db.quotes[qIdx], status: 'SHIPPED', updatedAt: new Date().toISOString() };
    }

    saveDB();
    return enrichFulfillment(db.fulfillmentOrders[idx], db);
  }
};
