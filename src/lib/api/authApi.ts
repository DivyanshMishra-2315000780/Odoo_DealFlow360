import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';
import { UserRole, CustomerTier } from '@/types';

export const authApi = {
  login: async (email: string, password: string) => {
    if (isMockMode) return mockApi.auth.login(email, password);
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },
  
  getCurrentUser: async () => {
    if (isMockMode) return mockApi.auth.getCurrentUser();
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  logout: async () => {
    if (isMockMode) return mockApi.auth.logout();
    const { data } = await apiClient.post('/auth/logout');
    return data;
  },

  signupCustomer: async (payload: { fullName: string; email: string; companyName: string; tier: CustomerTier; subscriptionPlanId?: string }) => {
    if (isMockMode) return mockApi.auth.signupCustomer(payload);
    const { data } = await apiClient.post('/auth/signup/customer', payload);
    return data;
  },

  signupInternal: async (payload: { fullName: string; email: string; role: UserRole }) => {
    if (isMockMode) return mockApi.auth.signupInternal(payload);
    const { data } = await apiClient.post('/auth/signup/internal', payload);
    return data;
  }
};
