import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

interface ErrorPayload {
  statusCode: number;
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const payload = this.toPayload(exception, request.url);

    if (payload.statusCode >= 500) {
      this.logger.error(
        { path: request.url, code: payload.code, message: payload.message },
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn({ path: request.url, code: payload.code, message: payload.message });
    }

    response.status(payload.statusCode).json(payload);
  }

  private toPayload(exception: unknown, path: string): ErrorPayload {
    const base = {
      timestamp: new Date().toISOString(),
      path,
    };

    if (exception instanceof ZodError) {
      return {
        ...base,
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: exception.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const body =
        typeof response === 'object' && response !== null
          ? (response as Record<string, unknown>)
          : null;
      const message =
        typeof response === 'string'
          ? response
          : (body?.message as string) || exception.message;
      const code =
        body && 'code' in body ? String(body.code) : HttpStatus[status] || 'HTTP_EXCEPTION';
      const details = Array.isArray(body?.details)
        ? (body.details as Array<{ path: string; message: string }>)
        : undefined;
      return { ...base, statusCode: status, code, message, ...(details ? { details } : {}) };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, base);
    }

    return {
      ...base,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    };
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    base: Pick<ErrorPayload, 'timestamp' | 'path'>,
  ): ErrorPayload {
    switch (error.code) {
      case 'P2002':
        return {
          ...base,
          statusCode: HttpStatus.CONFLICT,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'Resource already exists',
          details: (error.meta?.target as string[] | undefined)?.map((t) => ({
            path: t,
            message: 'must be unique',
          })),
        };
      case 'P2025':
        return {
          ...base,
          statusCode: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Resource not found',
        };
      default:
        return {
          ...base,
          statusCode: HttpStatus.BAD_REQUEST,
          code: `PRISMA_${error.code}`,
          message: error.message.split('\n').pop() ?? 'Database error',
        };
    }
  }
}
