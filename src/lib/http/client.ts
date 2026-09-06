import axios from 'axios';
export const http = axios.create({ baseURL: '/api', withCredentials: true, timeout: 30000 });
let refreshing: Promise<unknown> | null = null;
http.interceptors.response.use(response => response, async error => {
  const config = error.config;
  if (error.response?.status === 401 && config && !config._retried && !config.url?.includes('/auth/')) {
    config._retried = true;
    try {
      refreshing ??= http.post('/auth/refresh').finally(() => { refreshing = null; });
      await refreshing;
      return await http.request(config);
    } catch { if (typeof window !== 'undefined') window.location.assign('/login'); }
  }
  const body = error.response?.data;
  return Promise.reject(new Error((typeof body?.error === 'string' ? body.error : body?.error?.message) ?? body?.message ?? error.message ?? 'Request failed'));
});
export async function request<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await http.request({ url: url.replace(/^\/api/, ''), method: options.method ?? 'GET', data: options.body ? JSON.parse(String(options.body)) : undefined });
  return response.data?.data ?? response.data;
}
