import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from '../../../common/utils/create-zod-dto';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from '@teamflow/shared';

export class RegisterDto extends createZodDto(registerSchema) {
  @ApiProperty({ example: 'user@example.com' })
  declare email: string;
  @ApiProperty({ example: 'StrongP@ss1', minLength: 8 })
  declare password: string;
  @ApiProperty({ example: 'Yuki Tanaka' })
  declare name: string;
}

export class LoginDto extends createZodDto(loginSchema) {
  @ApiProperty({ example: 'user@example.com' })
  declare email: string;
  @ApiProperty({ example: 'StrongP@ss1' })
  declare password: string;
}

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {
  @ApiProperty()
  declare refreshToken: string;
}

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {
  @ApiProperty({ example: 'user@example.com' })
  declare email: string;
}

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {
  @ApiProperty()
  declare token: string;
  @ApiProperty()
  declare password: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user!: { id: string; email: string; name: string; role: string; avatarUrl: string | null };

  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token TTL in seconds' })
  expiresIn!: number;
}
