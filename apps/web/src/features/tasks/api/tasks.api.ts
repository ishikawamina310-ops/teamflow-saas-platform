import type {
  CreateTaskInput,
  MoveTaskInput,
  PaginatedResult,
  TaskListQuery,
  TaskSummary,
  UpdateTaskInput,
} from '@teamflow/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';

function toQueryString(query?: Partial<TaskListQuery>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const tasksApi = {
  list: (workspaceId: string, query?: Partial<TaskListQuery>) =>
    apiGet<PaginatedResult<TaskSummary>>(`/workspaces/${workspaceId}/tasks${toQueryString(query)}`),

  get: (workspaceId: string, taskId: string) =>
    apiGet<TaskSummary>(`/workspaces/${workspaceId}/tasks/${taskId}`),

  create: (workspaceId: string, projectId: string, body: CreateTaskInput) =>
    apiPost<TaskSummary>(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, body),

  update: (workspaceId: string, taskId: string, body: UpdateTaskInput) =>
    apiPatch<TaskSummary>(`/workspaces/${workspaceId}/tasks/${taskId}`, body),

  move: (workspaceId: string, taskId: string, body: MoveTaskInput) =>
    apiPatch<TaskSummary>(`/workspaces/${workspaceId}/tasks/${taskId}/move`, body),

  remove: (workspaceId: string, taskId: string) =>
    apiDelete<void>(`/workspaces/${workspaceId}/tasks/${taskId}`),
};
