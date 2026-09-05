import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';

export const dealHealthApi = {
  getEvents: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.dealHealth.getAll(filters);
    const { data } = await apiClient.get('/deal-health', { params: filters });
    return data;
  }
};
