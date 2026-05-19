import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { WorkspaceMemberRole } from '@prisma/client';
import type {
  CreateWorkspaceInput,
  InviteMemberInput,
  InviteMemberResult,
  UpdateWorkspaceInput,
  WorkspaceDashboardOverview,
  WorkspaceMemberView,
  WorkspaceSummary,
} from '@teamflow/shared';
import { canRemoveMember } from '@teamflow/shared';
import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '@/infrastructure/database/prisma.service';

const workspaceInclude = {
  _count: { select: { members: true } },
} as const;

@Injectable()
export class WorkspacesService {
  private static readonly INVITE_TTL_DAYS = 7;

  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<WorkspaceSummary[]> {
    const rows = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: { include: workspaceInclude },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return rows.map((row) =>
      this.toSummary(row.workspace, row.role, row.workspace._count.members),
    );
  }

  async create(userId: string, input: CreateWorkspaceInput): Promise<WorkspaceSummary> {
    const slugTaken = await this.prisma.workspace.findUnique({ where: { slug: input.slug } });
    if (slugTaken) {
      throw new ConflictException({
        code: 'WORKSPACE_SLUG_TAKEN',
        message: 'This workspace URL slug is already in use.',
      });
    }

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          ownerId: userId,
        },
        include: workspaceInclude,
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId,
          role: 'OWNER',
        },
      });

      return created;
    });

    return this.toSummary(workspace, 'OWNER', workspace._count.members);
  }

  async findById(workspaceId: string, userId: string): Promise<WorkspaceSummary> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        workspace: { include: workspaceInclude },
      },
    });

    if (!membership) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found or you are not a member.',
      });
    }

    return this.toSummary(
      membership.workspace,
      membership.role,
      membership.workspace._count.members,
    );
  }

  async update(
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceInput,
  ): Promise<WorkspaceSummary> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found or you are not a member.',
      });
    }

    if (Object.keys(input).length === 0) {
      const workspace = await this.getWorkspaceRecord(workspaceId);
      return this.toSummary(workspace, membership.role, workspace._count.members);
    }

    if (input.slug) {
      const conflict = await this.prisma.workspace.findFirst({
        where: { slug: input.slug, NOT: { id: workspaceId } },
      });
      if (conflict) {
        throw new ConflictException({
          code: 'WORKSPACE_SLUG_TAKEN',
          message: 'This workspace URL slug is already in use.',
        });
      }
    }

    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
      include: workspaceInclude,
    });

    return this.toSummary(workspace, membership.role, workspace._count.members);
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMemberView[]> {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members.map((m) => this.toMemberView(m));
  }

  async getDashboardOverview(workspaceId: string): Promise<WorkspaceDashboardOverview> {
    const [
      workspace,
      projectCount,
      backlogTaskCount,
      todoTaskCount,
      inProgressTaskCount,
      reviewTaskCount,
      doneTaskCount,
      overdueTaskCount,
      recentTasks,
      recentActivities,
    ] = await this.prisma.$transaction([
        this.prisma.workspace.findUnique({
          where: { id: workspaceId },
          include: {
            _count: {
              select: { members: true },
            },
          },
        }),
        this.prisma.project.count({
          where: {
            workspaceId,
            deletedAt: null,
          },
        }),
        this.prisma.task.count({
          where: {
            deletedAt: null,
            status: 'BACKLOG',
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        }),
        this.prisma.task.count({
          where: {
            deletedAt: null,
            status: 'TODO',
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        }),
        this.prisma.task.count({
          where: {
            deletedAt: null,
            status: 'IN_PROGRESS',
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        }),
        this.prisma.task.count({
          where: {
            deletedAt: null,
            status: 'IN_REVIEW',
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        }),
        this.prisma.task.count({
          where: {
            deletedAt: null,
            status: 'DONE',
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        }),
        this.prisma.task.count({
          where: {
            deletedAt: null,
            dueDate: { lt: new Date() },
            status: { not: 'DONE' },
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
        }),
        this.prisma.task.findMany({
          where: {
            deletedAt: null,
            project: {
              workspaceId,
              deletedAt: null,
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            assignee: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 8,
        }),
        this.prisma.activityLog.findMany({
          where: { workspaceId },
          include: {
            actor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    if (!workspace) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found.',
      });
    }

    const todoCount = backlogTaskCount + todoTaskCount;
    const totalTaskCount =
      backlogTaskCount + todoTaskCount + inProgressTaskCount + reviewTaskCount + doneTaskCount;

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      stats: {
        memberCount: workspace._count.members,
        projectCount,
        totalTaskCount,
        todoTaskCount: todoCount,
        inProgressTaskCount,
        reviewTaskCount,
        doneTaskCount,
        overdueTaskCount,
      },
      recentTasks: recentTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectId: task.project.id,
        projectName: task.project.name,
        assigneeName: task.assignee?.name ?? null,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        updatedAt: task.updatedAt.toISOString(),
      })),
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        action: activity.action,
        targetType: activity.targetType,
        targetId: activity.targetId,
        actorId: activity.actor.id,
        actorName: activity.actor.name,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  }

  async inviteMember(
    workspaceId: string,
    invitedById: string,
    input: InviteMemberInput,
  ): Promise<InviteMemberResult> {
    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: { email: input.email },
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    if (existingMember) {
      throw new ConflictException({
        code: 'MEMBER_ALREADY_EXISTS',
        message: 'This user is already a member of the workspace.',
      });
    }

    const pendingInvite = await this.prisma.workspaceInvite.findFirst({
      where: {
        workspaceId,
        email: input.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      throw new ConflictException({
        code: 'INVITE_ALREADY_PENDING',
        message: 'An invitation for this email is already pending.',
      });
    }

    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (user) {
      const member = await this.prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: user.id,
          role: input.role,
        },
        include: {
          user: { select: { id: true, email: true, name: true, avatarUrl: true } },
        },
      });

      return { type: 'member', member: this.toMemberView(member) };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + WorkspacesService.INVITE_TTL_DAYS);

    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: input.email,
        role: input.role,
        tokenHash,
        invitedById,
        expiresAt,
      },
    });

    return {
      type: 'invite',
      invite: {
        id: invite.id,
        workspaceId: invite.workspaceId,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString(),
      },
    };
  }

  async removeMember(
    workspaceId: string,
    actorUserId: string,
    actorRole: WorkspaceMemberRole,
    targetUserId: string,
  ): Promise<void> {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException({
        code: 'CANNOT_REMOVE_SELF',
        message: 'You cannot remove yourself from the workspace. Transfer ownership first.',
      });
    }

    const target = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    if (!target) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found in this workspace.',
      });
    }

    if (!canRemoveMember(actorRole, target.role)) {
      throw new ForbiddenException({
        code: 'INSUFFICIENT_WORKSPACE_ROLE',
        message: 'You do not have permission to remove this member.',
      });
    }

    await this.prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found.',
      });
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException({
        code: 'WORKSPACE_DELETE_FORBIDDEN',
        message: 'Only the workspace owner can delete the workspace.',
      });
    }

    await this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  private async getWorkspaceRecord(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: workspaceInclude,
    });

    if (!workspace) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found.',
      });
    }

    return workspace;
  }

  private toSummary(
    workspace: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      logoUrl: string | null;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
    },
    role: WorkspaceMemberRole,
    memberCount: number,
  ): WorkspaceSummary {
    return {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      description: workspace.description,
      logoUrl: workspace.logoUrl,
      ownerId: workspace.ownerId,
      role,
      memberCount,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }

  private toMemberView(member: {
    id: string;
    workspaceId: string;
    userId: string;
    role: WorkspaceMemberRole;
    joinedAt: Date;
    user: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    };
  }): WorkspaceMemberView {
    return {
      id: member.id,
      workspaceId: member.workspaceId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: member.user,
    };
  }
}
