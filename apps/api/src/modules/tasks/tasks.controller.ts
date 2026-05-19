import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type CreateTaskInput,
  type MoveTaskInput,
  type UpdateTaskInput,
  createTaskSchema,
  moveTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from '@teamflow/shared';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WorkspaceRoles } from '@/common/decorators/workspace-roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';

import {
  CreateTaskDto,
  MoveTaskDto,
  PaginatedTaskDto,
  TaskSummaryDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth('access-token')
@UseGuards(WorkspaceRolesGuard)
@Controller({ version: '1' })
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('workspaces/:workspaceId/tasks')
  @ApiOperation({ summary: 'List tasks in a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace CUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'projectId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  @ApiQuery({ name: 'assigneeId', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['updatedAt', 'createdAt', 'dueDate', 'priority', 'title', 'status', 'position'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, type: PaginatedTaskDto })
  list(@Param('workspaceId') workspaceId: string, @Query() query: unknown) {
    const parsed = taskListQuerySchema.parse(query);
    return this.tasks.list(workspaceId, parsed);
  }

  @Post('workspaces/:workspaceId/projects/:projectId/tasks')
  @WorkspaceRoles('MEMBER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task in a project' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, type: TaskSummaryDto })
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskInput,
  ) {
    return this.tasks.create(workspaceId, projectId, user.id, body);
  }

  @Get('workspaces/:workspaceId/tasks/:taskId')
  @ApiOperation({ summary: 'Get task details' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'taskId' })
  @ApiResponse({ status: 200, type: TaskSummaryDto })
  findOne(@Param('workspaceId') workspaceId: string, @Param('taskId') taskId: string) {
    return this.tasks.findById(workspaceId, taskId);
  }

  @Patch('workspaces/:workspaceId/tasks/:taskId')
  @WorkspaceRoles('MEMBER')
  @ApiOperation({ summary: 'Update task fields' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'taskId' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, type: TaskSummaryDto })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTaskInput,
  ) {
    return this.tasks.update(workspaceId, taskId, user.id, body);
  }

  @Patch('workspaces/:workspaceId/tasks/:taskId/move')
  @WorkspaceRoles('MEMBER')
  @ApiOperation({ summary: 'Move task to a status lane and position' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'taskId' })
  @ApiBody({ type: MoveTaskDto })
  @ApiResponse({ status: 200, type: TaskSummaryDto })
  move(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(moveTaskSchema)) body: MoveTaskInput,
  ) {
    return this.tasks.move(workspaceId, taskId, user.id, body);
  }

  @Delete('workspaces/:workspaceId/tasks/:taskId')
  @WorkspaceRoles('MEMBER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a task' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'taskId' })
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.tasks.softDelete(workspaceId, taskId, user.id);
  }
}
