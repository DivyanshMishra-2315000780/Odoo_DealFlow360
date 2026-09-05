import { delay } from '@/lib/api/apiClient';
import { getDB, saveDB } from '@/lib/mock/db';
import { DiscountRule } from '@/types';

export const mockSettingsHandlers = {
  async getDiscountRules() {
    await delay(300);
    const db = getDB();
    return db.discountRules;
  },

  async updateDiscountRule(id: string, data: Partial<DiscountRule>) {
    await delay(500);
    const db = getDB();
    const idx = db.discountRules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Rule not found');

    db.discountRules[idx] = { ...db.discountRules[idx], ...data };
    saveDB();
    return db.discountRules[idx];
  }
};
