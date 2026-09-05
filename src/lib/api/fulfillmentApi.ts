import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { WarehouseAllocation } from '@/types';

export const fulfillmentApi = {
  getOrders: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.fulfillment.getAll(filters);
    const { data } = await apiClient.get('/fulfillment', { params: filters });
    return data;
  },
  getOrder: async (id: string) => {
    if (isMockMode) return mockApi.fulfillment.getById(id);
    const { data } = await apiClient.get(`/fulfillment/${id}`);
    return data;
  },
  acceptSplit: async (id: string) => {
    if (isMockMode) return mockApi.fulfillment.acceptSplit(id);
    const { data } = await apiClient.post(`/fulfillment/${id}/accept`);
    return data;
  },
  manualSplit: async (id: string, allocations: WarehouseAllocation[]) => {
    if (isMockMode) return mockApi.fulfillment.manualSplit(id, allocations);
    const { data } = await apiClient.post(`/fulfillment/${id}/manual`, { allocations });
    return data;
  }
};
