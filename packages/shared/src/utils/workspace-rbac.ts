import type { WorkspaceMemberRole } from '../types/workspace.types';

const ROLE_RANK: Record<WorkspaceMemberRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

/** True when `role` meets or exceeds `minimum` in the workspace hierarchy. */
export function hasWorkspaceRole(
  role: WorkspaceMemberRole,
  minimum: WorkspaceMemberRole,
): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canManageMembers(role: WorkspaceMemberRole): boolean {
  return hasWorkspaceRole(role, 'ADMIN');
}

export function canRemoveMember(
  actorRole: WorkspaceMemberRole,
  targetRole: WorkspaceMemberRole,
): boolean {
  if (targetRole === 'OWNER') return false;
  if (actorRole === 'OWNER') return true;
  if (actorRole === 'ADMIN') {
    return targetRole === 'MEMBER' || targetRole === 'VIEWER';
  }
  return false;
}
