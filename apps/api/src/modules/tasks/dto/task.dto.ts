import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  createTaskSchema,
  moveTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from '@teamflow/shared';

import { createZodDto } from '@/common/utils/create-zod-dto';

export class CreateTaskDto extends createZodDto(createTaskSchema) {
  @ApiProperty({ example: 'Design onboarding flow' })
  declare title: string;

  @ApiPropertyOptional({ example: 'Add happy-path and edge states' })
  declare description?: string;

  @ApiPropertyOptional({ enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  declare status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  declare priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ nullable: true })
  declare assigneeId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  declare dueDate?: Date | null;

  @ApiPropertyOptional()
  declare position?: number;

  @ApiPropertyOptional({ type: [String] })
  declare labels?: string[];
}

export class UpdateTaskDto extends createZodDto(updateTaskSchema) {
  @ApiPropertyOptional()
  declare title?: string;

  @ApiPropertyOptional()
  declare description?: string;

  @ApiPropertyOptional({ enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  declare status?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  declare priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional({ nullable: true })
  declare assigneeId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  declare dueDate?: Date | null;

  @ApiPropertyOptional()
  declare position?: number;

  @ApiPropertyOptional({ type: [String] })
  declare labels?: string[];
}

export class MoveTaskDto extends createZodDto(moveTaskSchema) {
  @ApiProperty({ enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  declare status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

  @ApiProperty({ minimum: 0, example: 2500 })
  declare position: number;
}

export class TaskListQueryDto extends createZodDto(taskListQuerySchema) {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  declare page: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  declare limit: number;

  @ApiPropertyOptional()
  declare search?: string;

  @ApiPropertyOptional()
  declare projectId?: string;

  @ApiPropertyOptional({ enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  declare status?: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  declare priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiPropertyOptional()
  declare assigneeId?: string;

  @ApiPropertyOptional({
    enum: ['updatedAt', 'createdAt', 'dueDate', 'priority', 'title', 'status', 'position'],
  })
  declare sortBy?:
    | 'updatedAt'
    | 'createdAt'
    | 'dueDate'
    | 'priority'
    | 'title'
    | 'status'
    | 'position';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  declare sortOrder: 'asc' | 'desc';
}

export class TaskAssigneeDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;
}

export class TaskSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  projectName!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  status!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  priority!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty({ type: [String] })
  labels!: string[];

  @ApiProperty({ nullable: true })
  dueDate!: string | null;

  @ApiProperty()
  authorId!: string;

  @ApiProperty({ nullable: true })
  assigneeId!: string | null;

  @ApiPropertyOptional({ type: TaskAssigneeDto })
  assignee!: TaskAssigneeDto | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedTaskDto {
  @ApiProperty({ type: [TaskSummaryDto] })
  items!: TaskSummaryDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
