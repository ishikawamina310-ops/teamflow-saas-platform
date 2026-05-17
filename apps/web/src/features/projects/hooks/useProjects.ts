'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput, ProjectListQuery, UpdateProjectInput } from '@teamflow/shared';
import { toast } from 'sonner';

import { projectsApi } from '../api/projects.api';

export const projectKeys = {
  all: ['projects'] as const,
  list: (workspaceId: string, query?: Partial<ProjectListQuery>) =>
    [...projectKeys.all, 'list', workspaceId, query ?? {}] as const,
  detail: (workspaceId: string, projectId: string) =>
    [...projectKeys.all, 'detail', workspaceId, projectId] as const,
};

export function useProjects(workspaceId?: string, query?: Partial<ProjectListQuery>) {
  return useQuery({
    queryKey: projectKeys.list(workspaceId ?? 'none', query),
    queryFn: () => projectsApi.list(workspaceId!, query),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateProject(workspaceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(workspaceId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project created');
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateProject(workspaceId?: string, projectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectsApi.update(workspaceId!, projectId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project updated');
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteProject(workspaceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.remove(workspaceId!, projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success('Project removed');
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  });
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return 'Something went wrong';
}
