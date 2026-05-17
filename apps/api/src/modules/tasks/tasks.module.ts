import { Module } from '@nestjs/common';

import { WorkspaceRolesGuard } from '@/common/guards/workspace-roles.guard';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, WorkspaceRolesGuard],
  exports: [TasksService],
})
export class TasksModule {}
