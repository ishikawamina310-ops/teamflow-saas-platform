import { Injectable, NotFoundException } from '@nestjs/common';
import { ActivityAction, type Prisma, type ProjectStatus } from '@prisma/client';
import type {
  CreateProjectInput,
  PaginatedResult,
  ProjectListQuery,
  ProjectSummary,
  UpdateProjectInput,
} from '@teamflow/shared';
import { projectListQuerySchema } from '@teamflow/shared';

import { ActivityLogService } from '@/infrastructure/activity/activity-log.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogService,
  ) {}

  async list(
    workspaceId: string,
    rawQuery: unknown,
  ): Promise<PaginatedResult<ProjectSummary>> {
    const query = projectListQuerySchema.parse(rawQuery) as ProjectListQuery;
    const where = {
      workspaceId,
      deletedAt: null as null,
      ...(query.status ? { status: query.status as ProjectStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: {
          _count: {
            select: {
              tasks: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: this.buildOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((project) => this.toSummary(project)),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async create(
    workspaceId: string,
    actorId: string,
    input: CreateProjectInput,
  ): Promise<ProjectSummary> {
    const project = await this.prisma.project.create({
      data: {
        workspaceId,
        name: input.name,
        description: input.description,
        color: input.color,
        status: input.status,
      },
      include: {
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.CREATED,
      targetType: 'PROJECT',
      targetId: project.id,
      workspaceId,
      metadata: { name: project.name },
    });

    return this.toSummary(project);
  }

  async findById(workspaceId: string, projectId: string): Promise<ProjectSummary> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      include: {
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found in the workspace.',
      });
    }

    return this.toSummary(project);
  }

  async update(
    workspaceId: string,
    projectId: string,
    actorId: string,
    input: UpdateProjectInput,
  ): Promise<ProjectSummary> {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found in the workspace.',
      });
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        status: input.status,
      },
      include: {
        _count: { select: { tasks: { where: { deletedAt: null } } } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.UPDATED,
      targetType: 'PROJECT',
      targetId: project.id,
      workspaceId,
      metadata: { fields: Object.keys(input) },
    });

    return this.toSummary(project);
  }

  async softDelete(workspaceId: string, projectId: string, actorId: string): Promise<void> {
    const existing = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found in the workspace.',
      });
    }

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.task.updateMany({
        where: { projectId, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.DELETED,
      targetType: 'PROJECT',
      targetId: projectId,
      workspaceId,
    });
  }

  private toSummary(project: {
    id: string;
    workspaceId: string;
    name: string;
    description: string | null;
    color: string | null;
    status: ProjectStatus;
    createdAt: Date;
    updatedAt: Date;
    _count: { tasks: number };
  }): ProjectSummary {
    return {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      taskCount: project._count.tasks,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private buildOrderBy(query: ProjectListQuery): Prisma.ProjectOrderByWithRelationInput {
    const sortOrder = query.sortOrder ?? 'desc';

    switch (query.sortBy) {
      case 'createdAt':
        return { createdAt: sortOrder };
      case 'name':
        return { name: sortOrder };
      case 'status':
        return { status: sortOrder };
      case 'updatedAt':
      default:
        return { updatedAt: sortOrder };
    }
  }
}
