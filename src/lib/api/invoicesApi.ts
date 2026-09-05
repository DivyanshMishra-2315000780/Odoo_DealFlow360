import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { PaymentMethod } from '@/types';

export const invoicesApi = {
  getInvoices: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.invoices.getAll(filters);
    const { data } = await apiClient.get('/invoices', { params: filters });
    return data;
  },
  getInvoice: async (id: string) => {
    if (isMockMode) return mockApi.invoices.getById(id);
    const { data } = await apiClient.get(`/invoices/${id}`);
    return data;
  },
  recordPayment: async (id: string, amount: number, method: PaymentMethod, reference: string, recordedById: string) => {
    if (isMockMode) return mockApi.invoices.recordPayment(id, amount, method, reference, recordedById);
    const { data } = await apiClient.post(`/invoices/${id}/payments`, { amount, method, reference, recordedById });
    return data;
  }
};
