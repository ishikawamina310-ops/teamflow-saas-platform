import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

import { PrismaService } from '@/infrastructure/database/prisma.service';

import type { LoginInput, RegisterInput } from '@teamflow/shared';

import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterInput, ctx: { userAgent?: string; ipAddress?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'An account with this email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, AuthService.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
      },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });

    return this.issueSession(user, ctx);
  }

  async login(input: LoginInput, ctx: { userAgent?: string; ipAddress?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueSession(
      { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
      ctx,
    );
  }

  async refresh(args: {
    userId: string;
    jti: string;
    rawToken: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    await this.refreshTokens.consume({
      userId: args.userId,
      jti: args.jti,
      rawToken: args.rawToken,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: args.userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({ code: 'USER_NOT_ACTIVE' });
    }

    return this.issueSession(user, args);
  }

  async logout(userId: string, jti?: string): Promise<void> {
    if (jti) {
      await this.refreshTokens.revokeByJti(jti);
    } else {
      await this.refreshTokens.revokeAllForUser(userId);
    }
  }

  private async issueSession(
    user: { id: string; email: string; name: string; role: 'ADMIN' | 'USER'; avatarUrl: string | null },
    ctx: { userAgent?: string; ipAddress?: string },
  ) {
    const signed = await this.tokens.signTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshExpiresIn = this.config.getOrThrow<string>('jwt.refreshExpiresIn');
    const expiresAt = this.computeExpiry(refreshExpiresIn);

    await this.refreshTokens.store({
      userId: user.id,
      jti: signed.jti,
      token: signed.refreshToken,
      expiresAt,
      userAgent: ctx.userAgent,
      ipAddress: ctx.ipAddress,
    });

    return {
      user,
      accessToken: signed.accessToken,
      refreshToken: signed.refreshToken,
      expiresIn: signed.accessExpiresInSec,
    };
  }

  private computeExpiry(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd]?)$/);
    if (!match) return new Date(Date.now() + 30 * 86_400_000);
    const value = Number(match[1]);
    const unit = match[2] || 's';
    const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return new Date(Date.now() + value * (multipliers[unit] ?? 1000));
  }
}
