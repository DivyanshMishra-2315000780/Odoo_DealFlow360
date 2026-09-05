import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB, nextId } from '@/lib/mock/db';
import { Product } from '@/types';

export const mockProductHandlers = {
  async getAll(filters: { category?: string; status?: string; search?: string; page?: number; pageSize?: number } = {}) {
    await delay(300);
    const db = getDB();
    let items = db.products;

    if (filters.category && filters.category !== 'ALL') {
      items = items.filter(p => p.category === filters.category);
    }
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter(p => p.status === filters.status);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      items = items.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
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
    const p = db.products.find(p => p.id === id);
    if (!p) throw new Error('Product not found');
    return p;
  },

  async create(data: Partial<Product>) {
    await delay(500);
    const db = getDB();
    const newProduct: Product = {
      id: `p-${nextId('product')}`,
      sku: data.sku ?? `SKU-${Date.now()}`,
      name: data.name ?? 'New Product',
      category: data.category ?? 'Hardware',
      basePrice: data.basePrice ?? 0,
      unit: data.unit ?? 'Item',
      taxPercentage: data.taxPercentage ?? 0,
      description: data.description,
      isSubscription: data.isSubscription ?? false,
      status: 'ACTIVE',
      tierPrices: data.tierPrices ?? [
        { tier: 'BRONZE', price: data.basePrice ?? 0, discountPercentage: 0 },
        { tier: 'SILVER', price: data.basePrice ?? 0, discountPercentage: 5 },
        { tier: 'GOLD', price: data.basePrice ?? 0, discountPercentage: 10 },
      ],
      variants: data.variants ?? [],
      createdAt: new Date().toISOString(),
    };
    db.products.push(newProduct);
    saveDB();
    return newProduct;
  },

  async update(id: string, data: Partial<Product>) {
    await delay(400);
    const db = getDB();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    db.products[idx] = { ...db.products[idx], ...data };
    saveDB();
    return db.products[idx];
  },

  async archive(id: string) {
    await delay(400);
    const db = getDB();
    const idx = db.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    db.products[idx] = { ...db.products[idx], status: 'ARCHIVED' };
    saveDB();
    return db.products[idx];
  }
};
