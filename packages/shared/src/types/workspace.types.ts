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
