'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTaskInput,
  MoveTaskInput,
  TaskListQuery,
  UpdateTaskInput,
} from '@teamflow/shared';
import { toast } from 'sonner';

import { tasksApi } from '../api/tasks.api';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (workspaceId: string, query?: Partial<TaskListQuery>) =>
    [...taskKeys.all, 'list', workspaceId, query ?? {}] as const,
  detail: (workspaceId: string, taskId: string) =>
    [...taskKeys.all, 'detail', workspaceId, taskId] as const,
};

export function useTasks(workspaceId?: string, query?: Partial<TaskListQuery>) {
  return useQuery({
    queryKey: taskKeys.list(workspaceId ?? 'none', query),
    queryFn: () => tasksApi.list(workspaceId!, query),
    enabled: Boolean(workspaceId),
  });
}

export function useTask(workspaceId?: string, taskId?: string) {
  return useQuery({
    queryKey: taskKeys.detail(workspaceId ?? 'none', taskId ?? 'none'),
    queryFn: () => tasksApi.get(workspaceId!, taskId!),
    enabled: Boolean(workspaceId && taskId),
  });
}

export function useCreateTask(workspaceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: CreateTaskInput }) =>
      tasksApi.create(workspaceId!, projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task created');
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateTask(workspaceId?: string, taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => tasksApi.update(workspaceId!, taskId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task updated');
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  });
}

export function useMoveTask(workspaceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: MoveTaskInput }) =>
      tasksApi.move(workspaceId!, taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteTask(workspaceId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => tasksApi.remove(workspaceId!, taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
      toast.success('Task removed');
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
