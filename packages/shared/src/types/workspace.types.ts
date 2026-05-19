export type WorkspaceMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  role: WorkspaceMemberRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberView {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface WorkspaceInviteView {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceMemberRole;
  expiresAt: string;
  createdAt: string;
}

export type InviteMemberResult =
  | { type: 'member'; member: WorkspaceMemberView }
  | { type: 'invite'; invite: WorkspaceInviteView };

export interface WorkspaceDashboardStats {
  memberCount: number;
  projectCount: number;
  totalTaskCount: number;
  todoTaskCount: number;
  inProgressTaskCount: number;
  reviewTaskCount: number;
  doneTaskCount: number;
  overdueTaskCount: number;
}

export interface WorkspaceDashboardRecentTask {
  id: string;
  title: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  projectName: string;
  assigneeName: string | null;
  dueDate: string | null;
  updatedAt: string;
}

export interface WorkspaceDashboardActivity {
  id: string;
  action:
    | 'CREATED'
    | 'UPDATED'
    | 'DELETED'
    | 'ASSIGNED'
    | 'COMMENTED'
    | 'STATUS_CHANGED'
    | 'JOINED'
    | 'LEFT'
    | 'INVITED';
  targetType: string;
  targetId: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}

export interface WorkspaceDashboardOverview {
  workspaceId: string;
  workspaceName: string;
  stats: WorkspaceDashboardStats;
  recentTasks: WorkspaceDashboardRecentTask[];
  recentActivities: WorkspaceDashboardActivity[];
}
