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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type CreateWorkspaceInput,
  type InviteMemberInput,
  type UpdateWorkspaceInput,
  createWorkspaceSchema,
  inviteMemberSchema,
  updateWorkspaceSchema,
} from '@teamflow/shared';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentWorkspaceMember } from '@/common/decorators/workspace-member.decorator';
import { WorkspaceRoles } from '@/common/decorators/workspace-roles.decorator';
import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import type { WorkspaceMembership } from '@/common/types/workspace-membership.type';

import {
  CreateWorkspaceDto,
  InviteMemberDto,
  InviteMemberResultDto,
  WorkspaceDashboardOverviewDto,
  UpdateWorkspaceDto,
  WorkspaceMemberDto,
  WorkspaceSummaryDto,
} from './dto/workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@ApiBearerAuth('access-token')
@Controller({ path: 'workspaces', version: '1' })
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspaces for the current user' })
  @ApiResponse({ status: 200, type: [WorkspaceSummaryDto] })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.workspaces.listForUser(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiBody({ type: CreateWorkspaceDto })
  @ApiResponse({ status: 201, type: WorkspaceSummaryDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createWorkspaceSchema)) body: CreateWorkspaceInput,
  ) {
    return this.workspaces.create(user.id, body);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceRolesGuard)
  @ApiOperation({ summary: 'Get workspace details' })
  @ApiParam({ name: 'workspaceId', description: 'Workspace CUID' })
  @ApiResponse({ status: 200, type: WorkspaceSummaryDto })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspaces.findById(workspaceId, user.id);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles('ADMIN')
  @ApiOperation({ summary: 'Update workspace settings' })
  @ApiParam({ name: 'workspaceId' })
  @ApiBody({ type: UpdateWorkspaceDto })
  @ApiResponse({ status: 200, type: WorkspaceSummaryDto })
  update(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateWorkspaceSchema)) body: UpdateWorkspaceInput,
  ) {
    return this.workspaces.update(workspaceId, user.id, body);
  }

  @Get(':workspaceId/members')
  @UseGuards(WorkspaceRolesGuard)
  @ApiOperation({ summary: 'List workspace members' })
  @ApiParam({ name: 'workspaceId' })
  @ApiResponse({ status: 200, type: [WorkspaceMemberDto] })
  listMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspaces.listMembers(workspaceId);
  }

  @Get(':workspaceId/dashboard')
  @UseGuards(WorkspaceRolesGuard)
  @ApiOperation({ summary: 'Get dashboard overview for a workspace' })
  @ApiParam({ name: 'workspaceId' })
  @ApiResponse({ status: 200, type: WorkspaceDashboardOverviewDto })
  dashboardOverview(@Param('workspaceId') workspaceId: string) {
    return this.workspaces.getDashboardOverview(workspaceId);
  }

  @Post(':workspaceId/members/invite')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite a user to the workspace by email' })
  @ApiParam({ name: 'workspaceId' })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({ status: 201, type: InviteMemberResultDto })
  inviteMember(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(inviteMemberSchema)) body: InviteMemberInput,
  ) {
    return this.workspaces.inviteMember(workspaceId, user.id, body);
  }

  @Delete(':workspaceId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles('OWNER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a workspace (owner only)' })
  @ApiParam({ name: 'workspaceId' })
  @ApiResponse({ status: 204 })
  deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workspaces.deleteWorkspace(workspaceId, user.id);
  }

  @Delete(':workspaceId/members/:userId')
  @UseGuards(WorkspaceRolesGuard)
  @WorkspaceRoles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the workspace' })
  @ApiParam({ name: 'workspaceId' })
  @ApiParam({ name: 'userId', description: 'User CUID to remove' })
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
    @CurrentWorkspaceMember() membership: WorkspaceMembership,
  ) {
    return this.workspaces.removeMember(
      workspaceId,
      user.id,
      membership.role,
      targetUserId,
    );
  }
}
