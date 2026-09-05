import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';

export const subscriptionsApi = {
  getSubscriptions: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.subscriptions.getAll(filters);
    const { data } = await apiClient.get('/subscriptions', { params: filters });
    return data;
  },
  getSubscription: async (id: string) => {
    if (isMockMode) return mockApi.subscriptions.getById(id);
    const { data } = await apiClient.get(`/subscriptions/${id}`);
    return data;
  },
  getPlans: async () => {
    if (isMockMode) return mockApi.subscriptions.getPlans();
    const { data } = await apiClient.get('/subscriptions/plans');
    return data;
  },
  pauseSubscription: async (id: string) => {
    if (isMockMode) return mockApi.subscriptions.pause(id);
    const { data } = await apiClient.post(`/subscriptions/${id}/pause`);
    return data;
  },
  resumeSubscription: async (id: string) => {
    if (isMockMode) return mockApi.subscriptions.resume(id);
    const { data } = await apiClient.post(`/subscriptions/${id}/resume`);
    return data;
  },
  cancelSubscription: async (id: string) => {
    if (isMockMode) return mockApi.subscriptions.cancel(id);
    const { data } = await apiClient.post(`/subscriptions/${id}/cancel`);
    return data;
  }
};
