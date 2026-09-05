import { apiClient, isMockMode } from './apiClient';
import { mockApi } from '../mock/mockApi';

export const dashboardApi = {
  getKpis: async () => {
    if (isMockMode) return mockApi.dashboard.getKpis();
    const { data } = await apiClient.get('/dashboard/kpis');
    return data;
  },

  getPriorityCustomers: async () => {
    if (isMockMode) return mockApi.dashboard.getPriorityCustomers();
    const { data } = await apiClient.get('/dashboard/priority-customers');
    return data;
  },

  getCharts: async () => {
    if (isMockMode) return mockApi.dashboard.getCharts();
    const { data } = await apiClient.get('/dashboard/charts');
    return data;
  }
};
