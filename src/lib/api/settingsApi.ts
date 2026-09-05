import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { DiscountRule } from '@/types';

export const settingsApi = {
  getDiscountRules: async () => {
    if (isMockMode) return mockApi.settings.getDiscountRules();
    const { data } = await apiClient.get('/settings/discount-rules');
    return data;
  },
  updateDiscountRule: async (id: string, payload: Partial<DiscountRule>) => {
    if (isMockMode) return mockApi.settings.updateDiscountRule(id, payload);
    const { data } = await apiClient.patch(`/settings/discount-rules/${id}`, payload);
    return data;
  }
};
