'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type TaskSummary, updateTaskSchema } from '@teamflow/shared';
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

import { useUpdateTask } from '../hooks/useTasks';

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
  const updateTask = useUpdateTask(workspaceId, task?.id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (task && open) {
      reset({
        title: task.title,
        description: task.description ?? '',
      });
    }
  }, [task, open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!task) return;
    await updateTask.mutateAsync({
      title: values.title,
      description: values.description || undefined,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Task details</DialogTitle>
          <DialogDescription>Review and edit task information.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Input id="task-description" {...register('description')} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={updateTask.isPending}>
              {updateTask.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
