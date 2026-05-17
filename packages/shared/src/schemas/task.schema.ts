import { z } from 'zod';

import { cuidSchema, paginationQuerySchema } from './common.schema';

export const taskStatusSchema = z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(10_000).optional(),
  status: taskStatusSchema.default('TODO'),
  priority: taskPrioritySchema.default('MEDIUM'),
  assigneeId: cuidSchema.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  position: z.number().nonnegative().optional(),
  labels: z.array(z.string().trim().max(30)).max(10).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const moveTaskSchema = z.object({
  status: taskStatusSchema,
  position: z.number().nonnegative(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const taskListQuerySchema = paginationQuerySchema.extend({
  projectId: cuidSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: cuidSchema.optional(),
});

export const taskParamsSchema = z.object({
  workspaceId: cuidSchema,
  taskId: cuidSchema,
});

export const createTaskParamsSchema = z.object({
  workspaceId: cuidSchema,
  projectId: cuidSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
