import { Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';

import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class RefreshTokenService {
  private static readonly HASH_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  async store(args: {
    userId: string;
    jti: string;
    token: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    const tokenHash = await bcrypt.hash(args.token, RefreshTokenService.HASH_ROUNDS);
    await this.prisma.refreshToken.create({
      data: {
        userId: args.userId,
        jti: args.jti,
        tokenHash,
        expiresAt: args.expiresAt,
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      },
    });
  }

  /**
   * Validates a refresh token and revokes it (single-use rotation).
   * If the token is reused (already revoked), all sessions for the user are
   * revoked as a security measure.
   */
  async consume(args: { userId: string; jti: string; rawToken: string }) {
    const record = await this.prisma.refreshToken.findUnique({ where: { jti: args.jti } });

    if (!record || record.userId !== args.userId) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    if (record.revokedAt) {
      // Reuse detection — burn all sessions.
      await this.revokeAllForUser(args.userId);
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REUSED' });
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_EXPIRED' });
    }

    const matches = await bcrypt.compare(args.rawToken, record.tokenHash);
    if (!matches) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return record;
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.prisma.refreshToken
      .update({ where: { jti }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
