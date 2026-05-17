import { SetMetadata } from '@nestjs/common';
import type { WorkspaceMemberRole } from '@teamflow/shared';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';

/** Minimum workspace role required (OWNER > ADMIN > MEMBER > VIEWER). */
export const WorkspaceRoles = (...roles: WorkspaceMemberRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
