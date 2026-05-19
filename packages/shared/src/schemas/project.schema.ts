import { z } from 'zod';
import { cuidSchema, paginationQuerySchema } from './common.schema';

export const projectStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']);

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6})$/, 'Must be a hex color like #1E40AF')
    .optional(),
  status: projectStatusSchema.default('ACTIVE'),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectListQuerySchema = paginationQuerySchema.extend({
  status: projectStatusSchema.optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'name', 'status']).optional(),
});

export const projectParamsSchema = z.object({
  workspaceId: cuidSchema,
  projectId: cuidSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
