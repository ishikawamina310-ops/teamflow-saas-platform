'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createWorkspaceSchema, type CreateWorkspaceInput } from '@teamflow/shared';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/features/i18n/hooks/useI18n';

import { useCreateWorkspace } from '../hooks/useWorkspaces';

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  const { t } = useI18n();
  const createWorkspace = useCreateWorkspace();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  const watchedName = watch('name');

  useEffect(() => {
    if (open) {
      reset({ name: '', slug: '', description: '' });
    }
  }, [open, reset]);

  useEffect(() => {
    if (!dirtyFields.slug && watchedName) {
      setValue('slug', slugifyName(watchedName), { shouldValidate: true });
    }
  }, [watchedName, dirtyFields.slug, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    await createWorkspace.mutateAsync({
      name: values.name,
      slug: values.slug,
      description: values.description?.trim() ? values.description.trim() : undefined,
    });
    reset();
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
          <DialogDescription>{t('workspace.createDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">{t('workspace.name')}</Label>
            <Input
              id="workspace-name"
              placeholder={t('workspace.namePlaceholder')}
              autoComplete="off"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-slug">{t('workspace.slug')}</Label>
            <Input
              id="workspace-slug"
              placeholder={t('workspace.slugPlaceholder')}
              autoComplete="off"
              {...register('slug')}
            />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-description">{t('workspace.description')}</Label>
            <Input
              id="workspace-description"
              placeholder={t('workspace.descriptionPlaceholder')}
              autoComplete="off"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('workspace.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || createWorkspace.isPending}>
              {createWorkspace.isPending ? t('workspace.creating') : t('workspace.createWorkspace')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
