import { Injectable } from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@/infrastructure/database/prisma.service';

interface LogActivityInput {
  actorId: string;
  action: ActivityAction;
  targetType: string;
  targetId: string;
  workspaceId?: string;
  metadata?: Prisma.JsonObject;
}

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogActivityInput): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        workspaceId: input.workspaceId,
        metadata: input.metadata,
      },
    });
  }
}
