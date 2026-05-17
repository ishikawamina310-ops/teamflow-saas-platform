import type {
  CreateProjectInput,
  PaginatedResult,
  ProjectListQuery,
  ProjectSummary,
  UpdateProjectInput,
} from '@teamflow/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';

function toQueryString(query?: Partial<ProjectListQuery>): string {
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

export const projectsApi = {
  list: (workspaceId: string, query?: Partial<ProjectListQuery>) =>
    apiGet<PaginatedResult<ProjectSummary>>(
      `/workspaces/${workspaceId}/projects${toQueryString(query)}`,
    ),

  get: (workspaceId: string, projectId: string) =>
    apiGet<ProjectSummary>(`/workspaces/${workspaceId}/projects/${projectId}`),

  create: (workspaceId: string, body: CreateProjectInput) =>
    apiPost<ProjectSummary>(`/workspaces/${workspaceId}/projects`, body),

  update: (workspaceId: string, projectId: string, body: UpdateProjectInput) =>
    apiPatch<ProjectSummary>(`/workspaces/${workspaceId}/projects/${projectId}`, body),

  remove: (workspaceId: string, projectId: string) =>
    apiDelete<void>(`/workspaces/${workspaceId}/projects/${projectId}`),
};
