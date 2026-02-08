import axios, { AxiosError } from 'axios';
import { API_URL } from '../constants';
import { useAuthStore } from '../stores/authStore';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type ApiErrorResponse = { error?: string; code?: string };

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    const data = error.response?.data;
    const message = data?.error ?? error.message ?? 'Request failed';
    const e = new Error(message) as Error & { apiResponse?: ApiErrorResponse; status?: number };
    e.apiResponse = data;
    e.status = error.response?.status;
    return Promise.reject(e);
  }
);
