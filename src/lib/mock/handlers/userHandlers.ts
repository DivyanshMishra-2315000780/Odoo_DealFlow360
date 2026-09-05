import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, nextId } from '@/lib/mock/db';
import { User, UserRole } from '@/types';

export const mockUserHandlers = {
  async getAll(filters: { role?: string; search?: string; page?: number; pageSize?: number } = {}) {
    await delay(300);
    const db = getDB();
    let items = db.users;

    if (filters.role && filters.role !== 'ALL') {
      items = items.filter(u => u.role === filters.role);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const total = items.length;
    const data = items.slice((page - 1) * pageSize, page * pageSize);

    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  },

  async getById(id: string) {
    await delay(200);
    const db = getDB();
    const u = db.users.find(u => u.id === id);
    if (!u) throw new Error('User not found');
    return u;
  },

  async update(id: string, data: Partial<User>) {
    await delay(500);
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    db.users[idx] = { ...db.users[idx], ...data };
    saveDB();
    return db.users[idx];
  },

  async disable(id: string) {
    await delay(400);
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');

    db.users[idx] = { ...db.users[idx], isActive: false };
    saveDB();
    return db.users[idx];
  }
};
