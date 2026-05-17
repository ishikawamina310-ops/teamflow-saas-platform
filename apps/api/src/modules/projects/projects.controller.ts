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
  type CreateProjectInput,
  type UpdateProjectInput,
  createProjectSchema,
  projectListQuerySchema,
  updateProjectSchema,
} from '@teamflow/shared';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { WorkspaceRoles } from '@/common/decorators/workspace-roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';

import {
  CreateProjectDto,
  PaginatedProjectDto,
  ProjectSummaryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth('access-token')
@Controller({ path: 'workspaces/:workspaceId/projects', version: '1' })
@UseGuards(WorkspaceRolesGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects for a workspace' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace CUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'ARCHIVED', 'COMPLETED'] })
  @ApiResponse({ status: 200, type: PaginatedProjectDto })
  list(@Param('workspaceId') workspaceId: string, @Query() query: unknown) {
    const parsed = projectListQuerySchema.parse(query);
    return this.projects.list(workspaceId, parsed);
  }

  @Post()
  @WorkspaceRoles('MEMBER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a project in a workspace' })
  @ApiParam({ name: 'workspaceId' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, type: ProjectSummaryDto })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createProjectSchema)) body: CreateProjectInput,
  ) {
    return this.projects.create(workspaceId, user.id, body);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project details' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiResponse({ status: 200, type: ProjectSummaryDto })
  findOne(@Param('workspaceId') workspaceId: string, @Param('projectId') projectId: string) {
    return this.projects.findById(workspaceId, projectId);
  }

  @Patch(':projectId')
  @WorkspaceRoles('MEMBER')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, type: ProjectSummaryDto })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProjectSchema)) body: UpdateProjectInput,
  ) {
    return this.projects.update(workspaceId, projectId, user.id, body);
  }

  @Delete(':projectId')
  @WorkspaceRoles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a project' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'projectId' })
  async remove(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.projects.softDelete(workspaceId, projectId, user.id);
  }
}
