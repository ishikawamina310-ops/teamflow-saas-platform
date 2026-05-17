import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasWorkspaceRole, type WorkspaceMemberRole } from '@teamflow/shared';

import { WORKSPACE_ROLES_KEY } from '@/common/decorators/workspace-roles.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import type { WorkspaceMembership } from '@/common/types/workspace-membership.type';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      params: { workspaceId?: string };
      user?: AuthenticatedUser;
      workspaceMembership?: WorkspaceMembership;
    }>();

    const workspaceId = req.params.workspaceId;
    if (!workspaceId) return true;

    const user = req.user;
    if (!user) {
      throw new ForbiddenException({
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      });
    }

    const row = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      select: { id: true, workspaceId: true, userId: true, role: true },
    });

    if (!row) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found or you are not a member.',
      });
    }

    const membership: WorkspaceMembership = {
      membershipId: row.id,
      workspaceId: row.workspaceId,
      userId: row.userId,
      role: row.role,
    };
    req.workspaceMembership = membership;

    const required = this.reflector.getAllAndOverride<WorkspaceMemberRole[] | undefined>(
      WORKSPACE_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const allowed = required.some((minimum) => hasWorkspaceRole(membership.role, minimum));

    if (!allowed) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_WORKSPACE_ROLE',
        message: 'You do not have permission to perform this action in the workspace.',
      });
    }

    return true;
  }
}
