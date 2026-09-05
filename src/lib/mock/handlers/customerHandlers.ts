import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB } from '@/lib/mock/db';

export const mockCustomerHandlers = {
  async getAll(filters: { tier?: string; search?: string; page?: number; pageSize?: number } = {}) {
    await delay(300);
    const db = getDB();
    let items = db.customers;

    if (filters.tier && filters.tier !== 'ALL') {
      items = items.filter(c => c.tier === filters.tier);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(c => c.name.toLowerCase().includes(s) || c.contactName.toLowerCase().includes(s));
    }

    // Sort by priority (Gold first)
    const tierWeight: Record<string, number> = { GOLD: 3, SILVER: 2, BRONZE: 1 };
    items.sort((a, b) => (tierWeight[b.tier] ?? 0) - (tierWeight[a.tier] ?? 0));

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(id: string) {
    await delay(200);
    const db = getDB();
    const c = db.customers.find(c => c.id === id);
    if (!c) throw new Error('Customer not found');
    return c;
  }
};
