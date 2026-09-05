import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { User } from '@/types';

export const usersApi = {
  getUsers: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.users.getAll(filters);
    const { data } = await apiClient.get('/users', { params: filters });
    return data;
  },
  getUser: async (id: string) => {
    if (isMockMode) return mockApi.users.getById(id);
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },
  updateUser: async (id: string, payload: Partial<User>) => {
    if (isMockMode) return mockApi.users.update(id, payload);
    const { data } = await apiClient.patch(`/users/${id}`, payload);
    return data;
  },
  disableUser: async (id: string) => {
    if (isMockMode) return mockApi.users.disable(id);
    const { data } = await apiClient.post(`/users/${id}/disable`);
    return data;
  }
};
