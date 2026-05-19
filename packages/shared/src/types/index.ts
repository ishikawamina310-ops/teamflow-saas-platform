export type UserRole = 'ADMIN' | 'USER';

export type { WorkspaceMemberRole } from './workspace.types';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMMENTED'
  | 'PROJECT_INVITE'
  | 'WORKSPACE_INVITE'
  | 'MENTION';

export interface ApiSuccess<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
  timestamp: string;
  path: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

export type {
  InviteMemberResult,
  WorkspaceDashboardActivity,
  WorkspaceDashboardOverview,
  WorkspaceDashboardRecentTask,
  WorkspaceDashboardStats,
  WorkspaceInviteView,
  WorkspaceMemberView,
  WorkspaceSummary,
} from './workspace.types';
export type { PaginatedResult, ProjectSummary, TaskSummary } from './project-task.types';
