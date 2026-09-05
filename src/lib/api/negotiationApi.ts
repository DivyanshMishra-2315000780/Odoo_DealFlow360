import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';

export const negotiationApi = {
  getMessages: async (quotationId: string) => {
    if (isMockMode) return mockApi.negotiations.getMessages(quotationId);
    const { data } = await apiClient.get(`/quotes/${quotationId}/negotiations`);
    return data;
  },
  sendMessage: async (payload: { quotationId: string; message: string; authorId: string; authorName: string; authorRole: any; isInternal: boolean }) => {
    if (isMockMode) return mockApi.negotiations.sendMessage(payload);
    const { data } = await apiClient.post(`/quotes/${payload.quotationId}/negotiations`, payload);
    return data;
  },
  requestNegotiation: async (payload: { quotationId: string; customerId: string; requestedDiscount?: number; requestedDeliveryDate?: string; comment: string }) => {
    if (isMockMode) return mockApi.negotiations.requestNegotiation(payload);
    const { data } = await apiClient.post(`/quotes/${payload.quotationId}/negotiations/request`, payload);
    return data;
  }
};
