import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { WorkspaceMembership } from '@/common/types/workspace-membership.type';

export const CurrentWorkspaceMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): WorkspaceMembership => {
    const req = ctx.switchToHttp().getRequest<{ workspaceMembership?: WorkspaceMembership }>();
    const membership = req.workspaceMembership;
    if (!membership) {
      throw new Error(
        'Workspace membership not found on request — is WorkspaceRolesGuard applied?',
      );
    }
    return membership;
  },
);
