'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkspaceInput, WorkspaceSummary } from '@teamflow/shared';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

import { workspacesApi } from '../api/workspaces.api';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspaceKeys.all, 'list'] as const,
  detail: (id: string) => [...workspaceKeys.all, 'detail', id] as const,
  members: (id: string) => [...workspaceKeys.all, 'members', id] as const,
  dashboardOverview: (id: string) => [...workspaceKeys.all, 'dashboard-overview', id] as const,
};

export function useWorkspaces() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: workspacesApi.list,
    enabled: hasHydrated && isAuthenticated,
    retry: (failureCount, error) => {
      if (
        typeof error === 'object' &&
        error &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 401
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCurrentWorkspace() {
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const { data: workspaces, ...rest } = useWorkspaces();

  const current =
    workspaces?.find((w) => w.id === currentWorkspaceId) ?? workspaces?.[0] ?? null;

  return { current, workspaces: workspaces ?? [], currentWorkspaceId, ...rest };
}

export function useSetCurrentWorkspace() {
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  return (workspace: WorkspaceSummary) => {
    setCurrentWorkspace(workspace.id);
  };
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => workspacesApi.create(input),
    onSuccess: (workspace) => {
      setCurrentWorkspace(workspace.id);
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
      toast.success(`Workspace "${workspace.name}" created`);
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace);

  return useMutation({
    mutationFn: (workspaceId: string) => workspacesApi.delete(workspaceId),
    onSuccess: (_data, deletedId) => {
      if (currentWorkspaceId === deletedId) {
        setCurrentWorkspace('');
      }
      qc.invalidateQueries({ queryKey: workspaceKeys.list() });
      toast.success('Workspace deleted');
    },
    onError: (err: unknown) => {
      toast.error(extractErrorMessage(err));
    },
  });
}

export function useWorkspaceDashboardOverview(workspaceId?: string) {
  return useQuery({
    queryKey: workspaceKeys.dashboardOverview(workspaceId ?? 'none'),
    queryFn: () => workspacesApi.getDashboardOverview(workspaceId!),
    enabled: Boolean(workspaceId),
  });
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'response' in err) {
    const data = (err as {
      response?: {
        data?: {
          message?: string;
          details?: Array<{ path: string; message: string }>;
        };
      };
    }).response?.data;

    if (data?.details?.length) {
      return data.details.map((d) => `${d.path}: ${d.message}`).join(', ');
    }
    return data?.message ?? 'Something went wrong';
  }
  return 'Something went wrong';
}
