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
