'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, type ProjectSummary } from '@teamflow/shared';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useCreateTask } from '../hooks/useTasks';

interface CreateTaskInlineProps {
  workspaceId: string;
  project: ProjectSummary | null;
}

export function CreateTaskInline({ workspaceId, project }: CreateTaskInlineProps) {
  const createTask = useCreateTask(workspaceId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!project) return;
    await createTask.mutateAsync({
      projectId: project.id,
      input: {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
      },
    });
    reset();
  });

  return (
    <form className="rounded-lg border bg-card p-4" onSubmit={onSubmit}>
      <p className="mb-3 text-sm font-semibold">Quick add task</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="new-task-title">Title</Label>
          <Input id="new-task-title" placeholder="Implement API pagination" {...register('title')} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-task-description">Description</Label>
          <Input
            id="new-task-description"
            placeholder="Add robust cursor-based listing"
            {...register('description')}
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={!project || createTask.isPending}>
          {createTask.isPending ? 'Creating…' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
