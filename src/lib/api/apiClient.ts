import axios from 'axios';

export const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling could go here
    return Promise.reject(error);
  }
);

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
