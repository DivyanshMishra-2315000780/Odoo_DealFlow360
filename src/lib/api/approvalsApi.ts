import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';

export const approvalsApi = {
  getApprovals: async (filters: Record<string, any> = {}) => {
    if (isMockMode) return mockApi.approvals.getAll(filters);
    const { data } = await apiClient.get('/approvals', { params: filters });
    return data;
  },
  getApproval: async (id: string) => {
    if (isMockMode) return mockApi.approvals.getById(id);
    const { data } = await apiClient.get(`/approvals/${id}`);
    return data;
  },
  approveQuote: async (id: string, comment?: string, userId?: string, userName?: string) => {
    if (isMockMode) return mockApi.approvals.approve(id, comment, userId, userName);
    const { data } = await apiClient.post(`/approvals/${id}/approve`, { comment, userId, userName });
    return data;
  },
  returnQuote: async (id: string, reason: string, userId?: string, userName?: string) => {
    if (isMockMode) return mockApi.approvals.returnForRevision(id, reason, userId, userName);
    const { data } = await apiClient.post(`/approvals/${id}/return`, { reason, userId, userName });
    return data;
  },
  rejectQuote: async (id: string, reason: string, userId?: string, userName?: string) => {
    if (isMockMode) return mockApi.approvals.reject(id, reason, userId, userName);
    const { data } = await apiClient.post(`/approvals/${id}/reject`, { reason, userId, userName });
    return data;
  }
};
