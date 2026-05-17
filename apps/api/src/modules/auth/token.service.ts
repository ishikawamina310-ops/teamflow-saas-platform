import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@teamflow/shared';
import { nanoid } from 'nanoid';

import type {
  JwtAccessPayload,
  JwtRefreshPayload,
} from '@/common/types/authenticated-user.type';

export interface SignedTokens {
  accessToken: string;
  refreshToken: string;
  jti: string;
  accessExpiresInSec: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signTokens(args: { userId: string; email: string; role: UserRole }): Promise<SignedTokens> {
    const jti = nanoid(21);

    const accessPayload: JwtAccessPayload = {
      sub: args.userId,
      email: args.email,
      role: args.role,
    };
    const refreshPayload: JwtRefreshPayload = {
      sub: args.userId,
      jti,
    };

    const accessExpiresIn = this.config.getOrThrow<string>('jwt.accessExpiresIn');
    const refreshExpiresIn = this.config.getOrThrow<string>('jwt.refreshExpiresIn');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      jti,
      accessExpiresInSec: this.toSeconds(accessExpiresIn),
    };
  }

  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    return this.jwt.verifyAsync<JwtRefreshPayload>(token, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
    });
  }

  private toSeconds(duration: string): number {
    // Accepts: "60", "60s", "15m", "1h", "30d"
    const match = duration.match(/^(\d+)([smhd]?)$/);
    if (!match) return 900;
    const value = Number(match[1]);
    const unit = match[2] || 's';
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 1);
  }
}
