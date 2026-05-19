'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type TaskSummary, type UpdateTaskInput, updateTaskSchema } from '@teamflow/shared';
import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/features/i18n/hooks/useI18n';

import { useDeleteTask, useUpdateTask } from '../hooks/useTasks';

interface TaskDetailModalProps {
  workspaceId: string;
  task: TaskSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({
  workspaceId,
  task,
  open,
  onOpenChange,
}: TaskDetailModalProps) {
  const { t } = useI18n();
  const updateTask = useUpdateTask(workspaceId, task?.id);
  const deleteTask = useDeleteTask(workspaceId);

  const handleDelete = async () => {
    if (!task) return;
    if (!window.confirm(t('tasks.deleteConfirm', { title: task.title }))) return;
    await deleteTask.mutateAsync(task.id);
    onOpenChange(false);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: null,
    },
  });

  useEffect(() => {
    if (task && open) {
      const dueDateStr = task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : '';
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        dueDate: dueDateStr as unknown as Date,
      });
    }
  }, [task, open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!task) return;
    await updateTask.mutateAsync({
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      dueDate: values.dueDate ?? undefined,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 pb-4 pt-6 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <DialogTitle>{t('tasks.detailsTitle')}</DialogTitle>
              <DialogDescription>{t('tasks.detailsDescription')}</DialogDescription>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={!task || deleteTask.isPending || updateTask.isPending}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteTask.isPending ? t('tasks.deleting') : t('tasks.delete')}
            </Button>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">{t('tasks.titleField')}</Label>
              <Input id="task-title" {...register('title')} />
              {errors.title && (
                <p className="text-xs text-destructive">{t('tasks.validationTitleMin')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">{t('tasks.descriptionField')}</Label>
              <Input id="task-description" {...register('description')} />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">{t('tasks.priority')}</Label>
                <select
                  id="task-priority"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('priority')}
                >
                  <option value="LOW">{t('tasks.priorityLow')}</option>
                  <option value="MEDIUM">{t('tasks.priorityMedium')}</option>
                  <option value="HIGH">{t('tasks.priorityHigh')}</option>
                  <option value="URGENT">{t('tasks.priorityUrgent')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-duedate">{t('tasks.dueDate')}</Label>
                <Input
                  id="task-duedate"
                  type="date"
                  {...register('dueDate', {
                    setValueAs: (v: string) => (v ? new Date(v) : null),
                  })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border/60 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('tasks.close')}
            </Button>
            <Button type="submit" disabled={updateTask.isPending || deleteTask.isPending}>
              {updateTask.isPending ? t('tasks.saving') : t('common.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
