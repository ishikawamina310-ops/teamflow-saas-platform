import type { WorkspaceMemberRole } from '@teamflow/shared';

export interface WorkspaceMembership {
  membershipId: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
}
