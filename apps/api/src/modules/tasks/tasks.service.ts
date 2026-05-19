import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, type Prisma, type TaskPriority, type TaskStatus } from '@prisma/client';
import {
  type CreateTaskInput,
  type MoveTaskInput,
  type PaginatedResult,
  type TaskListQuery,
  type TaskSummary,
  type UpdateTaskInput,
  taskListQuerySchema,
} from '@teamflow/shared';

import { ActivityLogService } from '@/infrastructure/activity/activity-log.service';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogService,
  ) {}

  async list(
    workspaceId: string,
    rawQuery: unknown,
  ): Promise<PaginatedResult<TaskSummary>> {
    const query = taskListQuerySchema.parse(rawQuery) as TaskListQuery;
    const where = {
      deletedAt: null as null,
      project: {
        workspaceId,
        deletedAt: null as null,
      },
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status as TaskStatus } : {}),
      ...(query.priority ? { priority: query.priority as TaskPriority } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, workspaceId: true } },
          assignee: { select: { id: true, email: true, name: true, avatarUrl: true } },
        },
        orderBy: this.buildOrderBy(query),
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map((task) => this.toSummary(task)),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  async create(
    workspaceId: string,
    projectId: string,
    actorId: string,
    input: CreateTaskInput,
  ): Promise<TaskSummary> {
    await this.ensureProjectInWorkspace(workspaceId, projectId);
    if (input.assigneeId) {
      await this.ensureAssigneeInWorkspace(workspaceId, input.assigneeId);
    }

    const nextPosition = await this.getDefaultPosition(projectId, input.status ?? 'TODO');

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        labels: input.labels ?? [],
        authorId: actorId,
        position: input.position ?? nextPosition,
      },
      include: {
        project: { select: { id: true, name: true, workspaceId: true } },
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.CREATED,
      targetType: 'TASK',
      targetId: task.id,
      workspaceId,
      metadata: { projectId: task.projectId, title: task.title },
    });

    return this.toSummary(task);
  }

  async findById(workspaceId: string, taskId: string): Promise<TaskSummary> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        project: { workspaceId, deletedAt: null },
      },
      include: {
        project: { select: { id: true, name: true, workspaceId: true } },
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found in the workspace.',
      });
    }

    return this.toSummary(task);
  }

  async update(
    workspaceId: string,
    taskId: string,
    actorId: string,
    input: UpdateTaskInput,
  ): Promise<TaskSummary> {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null, project: { workspaceId, deletedAt: null } },
      include: { project: { select: { id: true } } },
    });

    if (!existing) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found in the workspace.',
      });
    }
    if (input.assigneeId) {
      await this.ensureAssigneeInWorkspace(workspaceId, input.assigneeId);
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        labels: input.labels,
        position: input.position,
      },
      include: {
        project: { select: { id: true, name: true, workspaceId: true } },
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.UPDATED,
      targetType: 'TASK',
      targetId: task.id,
      workspaceId,
      metadata: { fields: Object.keys(input) },
    });

    return this.toSummary(task);
  }

  async move(
    workspaceId: string,
    taskId: string,
    actorId: string,
    input: MoveTaskInput,
  ): Promise<TaskSummary> {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null, project: { workspaceId, deletedAt: null } },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found in the workspace.',
      });
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: input.status, position: input.position },
      include: {
        project: { select: { id: true, name: true, workspaceId: true } },
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true } },
      },
    });

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.STATUS_CHANGED,
      targetType: 'TASK',
      targetId: task.id,
      workspaceId,
      metadata: { status: input.status, position: input.position },
    });

    return this.toSummary(task);
  }

  async softDelete(workspaceId: string, taskId: string, actorId: string): Promise<void> {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null, project: { workspaceId, deletedAt: null } },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found in the workspace.',
      });
    }

    await this.prisma.task.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      actorId,
      action: ActivityAction.DELETED,
      targetType: 'TASK',
      targetId: taskId,
      workspaceId,
    });
  }

  private async ensureProjectInWorkspace(workspaceId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException({
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found in the workspace.',
      });
    }
  }

  private async ensureAssigneeInWorkspace(
    workspaceId: string,
    assigneeId: string,
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
      select: { id: true },
    });
    if (!member) {
      throw new BadRequestException({
        code: 'ASSIGNEE_NOT_IN_WORKSPACE',
        message: 'Assignee must be a workspace member.',
      });
    }
  }

  private async getDefaultPosition(projectId: string, status: TaskStatus): Promise<number> {
    const lastTask = await this.prisma.task.findFirst({
      where: { projectId, status, deletedAt: null },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (lastTask?.position ?? 0) + 1000;
  }

  private toSummary(task: {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    position: number;
    labels: string[];
    dueDate: Date | null;
    authorId: string;
    assigneeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    project: { id: string; name: string; workspaceId: string };
    assignee: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    } | null;
  }): TaskSummary {
    return {
      id: task.id,
      workspaceId: task.project.workspaceId,
      projectId: task.project.id,
      projectName: task.project.name,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      position: task.position,
      labels: task.labels,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      authorId: task.authorId,
      assigneeId: task.assigneeId,
      assignee: task.assignee,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private buildOrderBy(query: TaskListQuery): Prisma.TaskOrderByWithRelationInput[] {
    const sortOrder = query.sortOrder ?? 'desc';

    switch (query.sortBy) {
      case 'createdAt':
        return [{ createdAt: sortOrder }];
      case 'dueDate':
        return [{ dueDate: sortOrder }, { updatedAt: 'desc' }];
      case 'priority':
        return [{ priority: sortOrder }, { updatedAt: 'desc' }];
      case 'title':
        return [{ title: sortOrder }];
      case 'status':
        return [{ status: sortOrder }, { position: 'asc' }];
      case 'position':
        return [{ position: sortOrder }];
      case 'updatedAt':
      default:
        return [{ status: 'asc' }, { position: 'asc' }, { updatedAt: 'desc' }];
    }
  }
}
