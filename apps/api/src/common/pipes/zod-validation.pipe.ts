import { type ArgumentMetadata, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validates request bodies with Zod.
 * When used at method level via `@UsePipes`, only the `@Body()` parameter is validated
 * (skips `@CurrentUser()`, `@Req()`, `@Param()`, etc.).
 */
@Injectable()
export class ZodValidationPipe<TSchema extends ZodSchema> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body') {
      return value;
    }
    return this.schema.parse(value);
  }
}
