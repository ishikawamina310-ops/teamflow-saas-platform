'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { LoginInput, RegisterInput } from '@teamflow/shared';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

import { authApi } from '../api/auth.api';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (res) => {
      setSession(res);
      qc.invalidateQueries();
      router.push('/dashboard');
    },
    onError: (err: unknown) => {
      const message = extractErrorMessage(err);
      toast.error(message);
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (res) => {
      setSession(res);
      router.push('/dashboard');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const clearWorkspace = useWorkspaceStore((s) => s.clear);
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clear();
      clearWorkspace();
      router.push('/login');
    },
  });
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    return data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}
