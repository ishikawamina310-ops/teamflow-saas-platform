'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, type ProjectSummary } from '@teamflow/shared';
import { CalendarClock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/features/i18n/hooks/useI18n';

import { useCreateTask } from '../hooks/useTasks';

interface CreateTaskInlineProps {
  workspaceId: string;
  project: ProjectSummary | null;
  ensureProject: () => Promise<ProjectSummary>;
  isPreparingProject?: boolean;
}

export function CreateTaskInline({
  workspaceId,
  project,
  ensureProject,
  isPreparingProject = false,
}: CreateTaskInlineProps) {
  const createTask = useCreateTask(workspaceId);
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      dueDate: null as Date | null,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const targetProject = project ?? (await ensureProject());
    await createTask.mutateAsync({
      projectId: targetProject.id,
      input: {
        title: values.title,
        description: values.description || undefined,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ?? undefined,
      },
    });
    reset();
    setExpanded(false);
  });

  return (
    <form
      className="rounded-md border border-border/60 bg-card/50 px-3 py-2"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Input
          placeholder={t('tasks.newTaskPlaceholder')}
          className="h-7 flex-1 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
          {...register('title')}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setExpanded(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={createTask.isPending || isPreparingProject}
          className="h-6 px-2.5 text-xs"
        >
          {createTask.isPending ? t('tasks.creating') : t('tasks.create')}
        </Button>
      </div>

      {isSubmitted && errors.title && (
        <p className="mt-1 pl-5 text-xs text-destructive">{t('tasks.validationTitleMin')}</p>
      )}

      {expanded && (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2 pl-5">
          <select
            className="h-6 rounded border border-border/50 bg-background px-2 text-xs text-muted-foreground"
            aria-label={t('tasks.priority')}
            {...register('priority')}
          >
            <option value="LOW">{t('tasks.priorityLow')}</option>
            <option value="MEDIUM">{t('tasks.priorityMedium')}</option>
            <option value="HIGH">{t('tasks.priorityHigh')}</option>
            <option value="URGENT">{t('tasks.priorityUrgent')}</option>
          </select>
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              className="h-6 w-32 border-border/50 bg-background pl-6 text-xs"
              aria-label={t('tasks.dueDate')}
              {...register('dueDate', {
                setValueAs: (v: string) => (v ? new Date(v) : null),
              })}
            />
          </div>
          <Input
            placeholder={t('tasks.descriptionOptional')}
            className="h-6 min-w-[140px] flex-1 border-border/50 bg-background text-xs"
            {...register('description')}
          />
          <button
            type="button"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(false)}
          >
            {t('tasks.collapse')}
          </button>
        </div>
      )}
    </form>
  );
}
