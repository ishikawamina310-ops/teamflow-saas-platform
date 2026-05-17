import type { ZodSchema, z } from 'zod';

/**
 * Marker base class generated from a Zod schema.
 *
 * The schema lives in `@teamflow/shared` (single source of truth, shared with FE);
 * this helper produces a class so it can be referenced from NestJS controllers
 * and decorated with `@ApiProperty()` for Swagger.
 *
 * Actual validation happens in `ZodValidationPipe`, not via class-validator.
 */
export function createZodDto<TSchema extends ZodSchema>(
  schema: TSchema,
): new () => z.infer<TSchema> {
  class ZodDto {
    static schema: TSchema = schema;
  }
  return ZodDto as unknown as new () => z.infer<TSchema>;
}
