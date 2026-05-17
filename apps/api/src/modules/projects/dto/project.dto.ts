import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  createProjectSchema,
  projectListQuerySchema,
  updateProjectSchema,
} from '@teamflow/shared';

import { createZodDto } from '@/common/utils/create-zod-dto';

export class CreateProjectDto extends createZodDto(createProjectSchema) {
  @ApiProperty({ example: 'Platform Revamp' })
  declare name: string;

  @ApiPropertyOptional({ example: 'Major 2026 product refresh' })
  declare description?: string;

  @ApiPropertyOptional({ example: '#1E40AF' })
  declare color?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'], example: 'ACTIVE' })
  declare status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
}

export class UpdateProjectDto extends createZodDto(updateProjectSchema) {
  @ApiPropertyOptional({ example: 'Platform Revamp' })
  declare name?: string;

  @ApiPropertyOptional({ example: 'Major 2026 product refresh' })
  declare description?: string;

  @ApiPropertyOptional({ example: '#1E40AF' })
  declare color?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'], example: 'ARCHIVED' })
  declare status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
}

export class ProjectListQueryDto extends createZodDto(projectListQuerySchema) {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  declare page: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  declare limit: number;

  @ApiPropertyOptional({ example: 'platform' })
  declare search?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'] })
  declare status?: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
}

export class ProjectSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workspaceId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  color!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'] })
  status!: string;

  @ApiProperty()
  taskCount!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedProjectDto {
  @ApiProperty({ type: [ProjectSummaryDto] })
  items!: ProjectSummaryDto[];

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}
