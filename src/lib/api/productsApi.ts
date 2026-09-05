import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { Product } from '@/types';

export const productsApi = {
  getProducts: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.products.getAll(filters);
    const { data } = await apiClient.get('/products', { params: filters });
    return data;
  },
  getProduct: async (id: string) => {
    if (isMockMode) return mockApi.products.getById(id);
    const { data } = await apiClient.get(`/products/${id}`);
    return data;
  },
  createProduct: async (payload: Partial<Product>) => {
    if (isMockMode) return mockApi.products.create(payload);
    const { data } = await apiClient.post('/products', payload);
    return data;
  },
  updateProduct: async (id: string, payload: Partial<Product>) => {
    if (isMockMode) return mockApi.products.update(id, payload);
    const { data } = await apiClient.patch(`/products/${id}`, payload);
    return data;
  },
  archiveProduct: async (id: string) => {
    if (isMockMode) return mockApi.products.archive(id);
    const { data } = await apiClient.post(`/products/${id}/archive`);
    return data;
  }
};
