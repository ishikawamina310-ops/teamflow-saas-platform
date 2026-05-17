import type {
  CreateWorkspaceInput,
  InviteMemberInput,
  InviteMemberResult,
  UpdateWorkspaceInput,
  WorkspaceMemberView,
  WorkspaceSummary,
} from '@teamflow/shared';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client';

export const workspacesApi = {
  list: () => apiGet<WorkspaceSummary[]>('/workspaces'),

  get: (workspaceId: string) => apiGet<WorkspaceSummary>(`/workspaces/${workspaceId}`),

  create: (body: CreateWorkspaceInput) => apiPost<WorkspaceSummary>('/workspaces', body),

  update: (workspaceId: string, body: UpdateWorkspaceInput) =>
    apiPatch<WorkspaceSummary>(`/workspaces/${workspaceId}`, body),

  listMembers: (workspaceId: string) =>
    apiGet<WorkspaceMemberView[]>(`/workspaces/${workspaceId}/members`),

  inviteMember: (workspaceId: string, body: InviteMemberInput) =>
    apiPost<InviteMemberResult>(`/workspaces/${workspaceId}/members/invite`, body),

  removeMember: (workspaceId: string, userId: string) =>
    apiDelete<void>(`/workspaces/${workspaceId}/members/${userId}`),
};
