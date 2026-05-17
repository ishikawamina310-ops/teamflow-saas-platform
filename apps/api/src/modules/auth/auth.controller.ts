import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '@teamflow/shared';
import type { Request } from 'express';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';

import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { RefreshRequestUser } from './strategies/jwt-refresh.strategy';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @UsePipes(new ZodValidationPipe(registerSchema))
  register(@Body() body: RegisterDto, @Req() req: Request) {
    return this.auth.register(body, this.contextFromReq(req));
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @UsePipes(new ZodValidationPipe(loginSchema))
  login(@Body() body: LoginDto, @Req() req: Request) {
    return this.auth.login(body, this.contextFromReq(req));
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @UsePipes(new ZodValidationPipe(refreshTokenSchema))
  refresh(@Body() _body: RefreshTokenDto, @Req() req: Request) {
    const tokenUser = req.user as RefreshRequestUser;
    return this.auth.refresh({
      userId: tokenUser.sub,
      jti: tokenUser.jti,
      rawToken: tokenUser.rawToken,
      ...this.contextFromReq(req),
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke all refresh tokens for the current user' })
  async logout(@CurrentUser() user: AuthenticatedUser) {
    await this.auth.logout(user.id);
  }

  private contextFromReq(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress:
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
        req.socket.remoteAddress ??
        undefined,
    };
  }
}
