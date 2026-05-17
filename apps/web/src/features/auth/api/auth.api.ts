import type {
  LoginInput,
  RegisterInput,
  SessionUser,
} from '@teamflow/shared';

import { apiGet, apiPost } from '@/lib/api/client';

export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const authApi = {
  login: (body: LoginInput) => apiPost<AuthResponse>('/auth/login', body),
  register: (body: RegisterInput) => apiPost<AuthResponse>('/auth/register', body),
  logout: () => apiPost<void>('/auth/logout'),
  me: () => apiGet<SessionUser>('/users/me'),
};
