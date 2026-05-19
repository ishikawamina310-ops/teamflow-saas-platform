import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  createWorkspaceSchema,
  inviteMemberSchema,
  updateWorkspaceSchema,
} from '@teamflow/shared';

import { createZodDto } from '@/common/utils/create-zod-dto';

export class CreateWorkspaceDto extends createZodDto(createWorkspaceSchema) {
  @ApiProperty({ example: 'Acme Corp' })
  declare name: string;

  @ApiProperty({ example: 'acme-corp' })
  declare slug: string;

  @ApiPropertyOptional({ example: 'Our main workspace' })
  declare description?: string;
}

export class UpdateWorkspaceDto extends createZodDto(updateWorkspaceSchema) {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  declare name?: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  declare slug?: string;

  @ApiPropertyOptional()
  declare description?: string;
}

export class InviteMemberDto extends createZodDto(inviteMemberSchema) {
  @ApiProperty({ example: 'colleague@example.com' })
  declare email: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER', 'VIEWER'], example: 'MEMBER' })
  declare role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export class WorkspaceSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] })
  role!: string;

  @ApiProperty()
  memberCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class WorkspaceMemberUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;
}

export class WorkspaceMemberDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] })
  role!: string;

  @ApiProperty()
  joinedAt!: string;

  @ApiProperty({ type: WorkspaceMemberUserDto })
  user!: WorkspaceMemberUserDto;
}

export class WorkspaceInviteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] })
  role!: string;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  createdAt!: string;
}

export class InviteMemberResultDto {
  @ApiProperty({ enum: ['member', 'invite'] })
  type!: 'member' | 'invite';

  @ApiPropertyOptional({ type: WorkspaceMemberDto })
  member?: WorkspaceMemberDto;

  @ApiPropertyOptional({ type: WorkspaceInviteDto })
  invite?: WorkspaceInviteDto;
}

export class WorkspaceDashboardStatsDto {
  @ApiProperty({ example: 8 })
  memberCount!: number;

  @ApiProperty({ example: 3 })
  projectCount!: number;

  @ApiProperty({ example: 24 })
  totalTaskCount!: number;

  @ApiProperty({ example: 10 })
  todoTaskCount!: number;

  @ApiProperty({ example: 6 })
  inProgressTaskCount!: number;

  @ApiProperty({ example: 4 })
  reviewTaskCount!: number;

  @ApiProperty({ example: 4 })
  doneTaskCount!: number;

  @ApiProperty({ example: 2 })
  overdueTaskCount!: number;
}

export class WorkspaceDashboardRecentTaskDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] })
  status!: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiProperty()
  projectId!: string;

  @ApiProperty()
  projectName!: string;

  @ApiProperty({ nullable: true })
  assigneeName!: string | null;

  @ApiProperty({ nullable: true })
  dueDate!: string | null;

  @ApiProperty()
  updatedAt!: string;
}

export class WorkspaceDashboardActivityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: ['CREATED', 'UPDATED', 'DELETED', 'ASSIGNED', 'COMMENTED', 'STATUS_CHANGED', 'JOINED', 'LEFT', 'INVITED'],
  })
  action!:
    | 'CREATED'
    | 'UPDATED'
    | 'DELETED'
    | 'ASSIGNED'
    | 'COMMENTED'
    | 'STATUS_CHANGED'
    | 'JOINED'
    | 'LEFT'
    | 'INVITED';

  @ApiProperty()
  targetType!: string;

  @ApiProperty()
  targetId!: string;

  @ApiProperty()
  actorId!: string;

  @ApiProperty()
  actorName!: string;

  @ApiProperty()
  createdAt!: string;
}

export class WorkspaceDashboardOverviewDto {
  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  workspaceName!: string;

  @ApiProperty({ type: WorkspaceDashboardStatsDto })
  stats!: WorkspaceDashboardStatsDto;

  @ApiProperty({ type: [WorkspaceDashboardRecentTaskDto] })
  recentTasks!: WorkspaceDashboardRecentTaskDto[];

  @ApiProperty({ type: [WorkspaceDashboardActivityDto] })
  recentActivities!: WorkspaceDashboardActivityDto[];
}
