import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { Quotation, QuotationLine } from '@/types';

export const quotesApi = {
  getQuotes: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.quotes.getAll(filters);
    const { data } = await apiClient.get('/quotes', { params: filters });
    return data;
  },
  getQuote: async (id: string) => {
    if (isMockMode) return mockApi.quotes.getById(id);
    const { data } = await apiClient.get(`/quotes/${id}`);
    return data;
  },
  createQuote: async (payload: Partial<Quotation> & { lines: Partial<QuotationLine>[] }) => {
    if (isMockMode) return mockApi.quotes.create(payload);
    const { data } = await apiClient.post('/quotes', payload);
    return data;
  },
  updateQuote: async (id: string, payload: Partial<Quotation> & { lines?: Partial<QuotationLine>[] }) => {
    if (isMockMode) return mockApi.quotes.update(id, payload);
    const { data } = await apiClient.patch(`/quotes/${id}`, payload);
    return data;
  },
  submitQuote: async (id: string, submittedById: string, submittedByName: string) => {
    if (isMockMode) return mockApi.quotes.submit(id, submittedById, submittedByName);
    const { data } = await apiClient.post(`/quotes/${id}/submit`, { submittedById, submittedByName });
    return data;
  },
  sendToCustomer: async (id: string) => {
    if (isMockMode) return mockApi.quotes.sendToCustomer(id);
    const { data } = await apiClient.post(`/quotes/${id}/send`);
    return data;
  },
  confirmQuote: async (id: string) => {
    if (isMockMode) return mockApi.quotes.confirm(id);
    const { data } = await apiClient.post(`/quotes/${id}/confirm`);
    return data;
  }
};
