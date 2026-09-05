import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';

export const customersApi = {
  getCustomers: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.customers.getAll(filters);
    const { data } = await apiClient.get('/customers', { params: filters });
    return data;
  },
  getCustomer: async (id: string) => {
    if (isMockMode) return mockApi.customers.getById(id);
    const { data } = await apiClient.get(`/customers/${id}`);
    return data;
  }
};
