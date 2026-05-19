'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTaskInput,
  MoveTaskInput,
  PaginatedResult,
  TaskSummary,
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
    mutationFn: (variables: {
      projectId: string;
      projectName?: string;
      input: CreateTaskInput;
    }) => tasksApi.create(workspaceId!, variables.projectId, variables.input),
    onMutate: async ({ projectId, projectName, input }) => {
      const listQueryKey = [...taskKeys.all, 'list', workspaceId];
      await qc.cancelQueries({ queryKey: listQueryKey });

      const previous = qc.getQueriesData<PaginatedResult<TaskSummary>>({
        queryKey: listQueryKey,
      });

      previous.forEach(([key, data]) => {
        if (!data) return;
        const laneMaxPosition = data.items
          .filter((task) => task.status === (input.status ?? 'TODO'))
          .reduce((max, task) => Math.max(max, task.position), 0);

        const optimisticTask: TaskSummary = {
          id: `temp-${crypto.randomUUID()}`,
          workspaceId: workspaceId!,
          projectId,
          projectName: projectName ?? 'Project',
          title: input.title,
          description: input.description ?? null,
          status: input.status ?? 'TODO',
          priority: input.priority ?? 'MEDIUM',
          position: input.position ?? laneMaxPosition + 1000,
          labels: input.labels ?? [],
          dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
          authorId: 'optimistic',
          assigneeId: input.assigneeId ?? null,
          assignee: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        qc.setQueryData<PaginatedResult<TaskSummary>>(key, {
          ...data,
          items: [optimisticTask, ...data.items],
          total: data.total + 1,
        });
      });

      return { previous };
    },
    onSuccess: () => {
      toast.success('Task created');
    },
    onError: (err: unknown, _variables, context) => {
      context?.previous.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error(extractErrorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
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
    onMutate: async ({ taskId, input }) => {
      const listQueryKey = [...taskKeys.all, 'list', workspaceId];
      await qc.cancelQueries({ queryKey: listQueryKey });

      const previous = qc.getQueriesData<PaginatedResult<TaskSummary>>({
        queryKey: listQueryKey,
      });

      previous.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<PaginatedResult<TaskSummary>>(key, {
          ...data,
          items: data.items.map((task) =>
            task.id === taskId ? { ...task, status: input.status, position: input.position } : task,
          ),
        });
      });

      return { previous };
    },
    onError: (err: unknown, _variables, context) => {
      context?.previous.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error(extractErrorMessage(err));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: taskKeys.all });
    },
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
