'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, type CreateProjectInput, type ProjectSummary } from '@teamflow/shared';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useCurrentWorkspace } from '@/features/workspaces/hooks/useWorkspaces';

import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '../hooks/useProjects';

export function ProjectsPageContent({ workspaceId }: { workspaceId?: string }) {
  const { t } = useI18n();
  const { current, isLoading: workspaceLoading } = useCurrentWorkspace();
  const effectiveWorkspaceId = workspaceId ?? current?.id;
  const { data, isLoading, isError } = useProjects(effectiveWorkspaceId);
  const deleteProject = useDeleteProject(effectiveWorkspaceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);

  const projects = useMemo(() => data?.items ?? [], [data?.items]);

  if (workspaceLoading || isLoading) {
    return <div className="text-sm text-muted-foreground">Loading projects…</div>;
  }

  if (!effectiveWorkspaceId) {
    return <div className="text-sm text-muted-foreground">{t('projects.selectWorkspace')}</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t('projects.failedLoad')}
      </div>
    );
  }

  const openCreate = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const openEdit = (project: ProjectSummary) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('projects.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {current ? `${t('common.workspaceLabel')}: ${current.name}` : t('projects.workspaceProjects')}
          </p>
        </div>
        <Button onClick={openCreate}>{t('projects.newProject')}</Button>
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={effectiveWorkspaceId}
        editingProject={editingProject}
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t('projects.empty')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <CardDescription>{project.description || t('projects.noDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {t('projects.status')}: {project.status}
                  </span>
                  <span>{t('projects.taskCount', { count: project.taskCount })}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(project)}>
                    {t('projects.edit')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteProject.isPending}
                    onClick={() => deleteProject.mutate(project.id)}
                  >
                    {t('projects.delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectDialog({
  open,
  onOpenChange,
  workspaceId,
  editingProject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
  editingProject: ProjectSummary | null;
}) {
  const { t } = useI18n();
  const createProject = useCreateProject(workspaceId);
  const updateProject = useUpdateProject(workspaceId, editingProject?.id);
  const isEditMode = Boolean(editingProject);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#334155',
      status: 'ACTIVE' as const,
    },
  });

  useEffect(() => {
    if (open && editingProject) {
      reset({
        name: editingProject.name,
        description: editingProject.description ?? '',
        color: editingProject.color ?? '#334155',
        status: editingProject.status,
      });
      return;
    }

    if (open && !editingProject) {
      reset({
        name: '',
        description: '',
        color: '#334155',
        status: 'ACTIVE',
      });
    }
  }, [editingProject, open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (isEditMode && editingProject) {
      await updateProject.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        color: values.color || undefined,
        status: values.status,
      });
    } else {
      await createProject.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        color: values.color || undefined,
        status: values.status,
      });
    }
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('projects.editProject') : t('projects.createProject')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? t('projects.updateProjectDetails') : t('projects.addProjectDesc')}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="project-name">{t('projects.name')}</Label>
            <Input id="project-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">{t('projects.description')}</Label>
            <Input id="project-description" {...register('description')} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-color">{t('projects.color')}</Label>
              <Input id="project-color" {...register('color')} />
              {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">{t('projects.projectStatus')}</Label>
              <select
                id="project-status"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                {...register('status')}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createProject.isPending || updateProject.isPending}>
              {createProject.isPending || updateProject.isPending
                ? t('projects.saving')
                : isEditMode
                  ? t('common.saveChanges')
                  : t('projects.creating')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

