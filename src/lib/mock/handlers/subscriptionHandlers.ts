import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, enrichSubscription } from '@/lib/mock/db';

export const mockSubscriptionHandlers = {
  async getAll(filters: { status?: string; customerId?: string; page?: number; pageSize?: number } = {}) {
    await delay(400);
    const db = getDB();
    let items = db.subscriptions.map(s => enrichSubscription(s, db));

    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(s => s.status === filters.status);
    }
    if (filters.customerId) {
        items = items.filter(s => s.customerId === filters.customerId);
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
    const s = db.subscriptions.find(s => s.id === id);
    if (!s) throw new Error('Subscription not found');
    return enrichSubscription(s, db);
  },

  async getPlans() {
    await delay(200);
    const db = getDB();
    return db.subscriptionPlans;
  },

  async pause(id: string) {
    await delay(500);
    const db = getDB();
    const idx = db.subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');

    db.subscriptions[idx] = { ...db.subscriptions[idx], status: 'PAUSED' };
    saveDB();
    return enrichSubscription(db.subscriptions[idx], db);
  },

  async resume(id: string) {
    await delay(500);
    const db = getDB();
    const idx = db.subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');

    db.subscriptions[idx] = { ...db.subscriptions[idx], status: 'ACTIVE' };
    saveDB();
    return enrichSubscription(db.subscriptions[idx], db);
  },

  async cancel(id: string) {
    await delay(500);
    const db = getDB();
    const idx = db.subscriptions.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Subscription not found');

    db.subscriptions[idx] = { ...db.subscriptions[idx], status: 'CANCELLED' };
    saveDB();
    return enrichSubscription(db.subscriptions[idx], db);
  }
};
