import axios, {
  create,
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient: AxiosInstance = create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInflight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) return null;

      const { data } = await axios.post<{
        data: { accessToken: string; refreshToken: string; expiresIn: number };
      }>(`${API_URL}/auth/refresh`, { refreshToken });

      useAuthStore.getState().setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
      return data.data.accessToken;
    } catch (err) {
      // Only clear session when the server rejects refresh — not on network/API-down errors.
      if (isAxiosError(err) && err.response?.status === 401) {
        useAuthStore.getState().clear();
      }
      return null;
    } finally {
      refreshInflight = null;
    }
  })();

  return refreshInflight;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || original._retry || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (original.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retry = true;
    const newToken = await refreshAccessToken();
    if (!newToken) {
      // API unreachable or refresh failed without auth rejection — keep the session.
      if (!error.response) return Promise.reject(error);
      if (error.response.status === 401) {
        useAuthStore.getState().clear();
      }
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.get<{ data: T }>(url, config);
  return data.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await apiClient.post<{ data: T }>(url, body, config);
  return data.data;
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await apiClient.patch<{ data: T }>(url, body, config);
  return data.data;
}

export async function apiDelete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.delete<{ data: T }>(url, config);
  return data.data;
}
