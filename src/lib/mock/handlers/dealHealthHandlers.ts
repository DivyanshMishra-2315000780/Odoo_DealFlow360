import { delay } from '@/lib/api/apiClient';
import { getDB, enrichDealHealth } from '@/lib/mock/db';

export const mockDealHealthHandlers = {
  async getAll(filters: { severity?: string; status?: string; page?: number; pageSize?: number } = {}) {
    await delay(300);
    const db = getDB();
    let items = db.dealHealthEvents.map(d => enrichDealHealth(d, db));

    if (filters.severity && filters.severity !== 'ALL') {
      items = items.filter(d => d.severity === filters.severity);
    }
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(d => d.status === filters.status);
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
};
