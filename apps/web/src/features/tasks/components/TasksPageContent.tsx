'use client';

import type { ProjectSummary, TaskSummary } from '@teamflow/shared';
import { useCallback, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/features/i18n/hooks/useI18n';
import { useCreateProject, useProjects } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/hooks/useWorkspaces';

import { useCreateTask, useDeleteTask, useMoveTask, useTasks } from '../hooks/useTasks';
import type { KanbanStatus } from '../lib/kanban.constants';

import { CreateTaskInline } from './CreateTaskInline';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskKanban } from './TaskKanban';

export function TasksPageContent({ workspaceId }: { workspaceId?: string }) {
  const { t } = useI18n();
  const { current, isLoading: workspaceLoading } = useCurrentWorkspace();
  const effectiveWorkspaceId = workspaceId ?? current?.id;
  const { data: tasksData, isLoading, isError } = useTasks(effectiveWorkspaceId, { limit: 100 });
  const { data: projectsData } = useProjects(effectiveWorkspaceId, { limit: 100 });
  const createTask = useCreateTask(effectiveWorkspaceId);
  const createProject = useCreateProject(effectiveWorkspaceId);
  const deleteTask = useDeleteTask(effectiveWorkspaceId);
  const moveTask = useMoveTask(effectiveWorkspaceId);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<
    'all' | 'today' | 'this_week' | 'overdue' | 'no_due_date'
  >('all');
  const [search, setSearch] = useState('');
  const [seedProject, setSeedProject] = useState<ProjectSummary | null>(null);

  const tasks = useMemo(() => tasksData?.items ?? [], [tasksData?.items]);
  const projects = useMemo(() => projectsData?.items ?? [], [projectsData?.items]);
  const defaultProject = projects[0] ?? seedProject ?? null;
  const ensureTaskProject = useCallback(async () => {
    if (defaultProject) return defaultProject;
    const created = await createProject.mutateAsync({
      name: t('tasks.inboxProjectName'),
      description: t('tasks.inboxProjectDescription'),
      color: '#6366F1',
      status: 'ACTIVE',
    });
    setSeedProject(created);
    return created;
  }, [createProject, defaultProject, t]);
  const assigneeOptions = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.assigneeId && task.assignee?.name) {
        map.set(task.assigneeId, task.assignee.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tasks]);

  const handleDeleteTask = useCallback(
    async (task: TaskSummary) => {
      if (!window.confirm(t('tasks.deleteConfirm', { title: task.title }))) return;
      await deleteTask.mutateAsync(task.id);
      if (selectedTask?.id === task.id) {
        setModalOpen(false);
        setSelectedTask(null);
      }
    },
    [deleteTask, selectedTask?.id, t],
  );

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    return tasks.filter((task) => {
      if (search.trim()) {
        const keyword = search.trim().toLowerCase();
        const matched =
          task.title.toLowerCase().includes(keyword) ||
          task.projectName.toLowerCase().includes(keyword) ||
          (task.assignee?.name ?? '').toLowerCase().includes(keyword);
        if (!matched) return false;
      }

      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && task.assigneeId) return false;
        if (assigneeFilter !== 'unassigned' && task.assigneeId !== assigneeFilter) return false;
      }

      if (dueDateFilter === 'all') return true;
      if (!task.dueDate) return dueDateFilter === 'no_due_date';

      const due = new Date(task.dueDate);
      const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (dueDateFilter === 'today') return dueDateOnly.getTime() === todayOnly.getTime();
      if (dueDateFilter === 'overdue')
        return dueDateOnly.getTime() < todayOnly.getTime() && task.status !== 'DONE';
      if (dueDateFilter === 'this_week') return due >= now && due <= endOfWeek;
      if (dueDateFilter === 'no_due_date') return false;
      return true;
    });
  }, [assigneeFilter, dueDateFilter, search, tasks]);

  if (workspaceLoading || isLoading) {
    return <TasksBoardLoading />;
  }

  if (!effectiveWorkspaceId) {
    return <div className="text-sm text-muted-foreground">{t('tasks.selectWorkspace')}</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {t('tasks.failedLoad')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium text-foreground/95">{t('tasks.title')}</h1>
        <p className="text-[13px] text-muted-foreground/80">
          {current ? `${t('common.workspaceLabel')}: ${current.name}` : t('tasks.workspaceTasks')}
        </p>
      </div>

      <CreateTaskInline
        workspaceId={effectiveWorkspaceId}
        project={defaultProject}
        ensureProject={ensureTaskProject}
        isPreparingProject={createProject.isPending}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('tasks.searchPlaceholder')}
          className="h-8 w-56 border-zinc-800/60 bg-zinc-900/50 text-xs placeholder:text-muted-foreground/60"
        />
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="h-8 rounded-md border border-zinc-800/60 bg-zinc-900/50 px-2 text-xs text-muted-foreground"
          aria-label={t('tasks.filterByAssignee')}
        >
          <option value="all">{t('tasks.allAssignees')}</option>
          <option value="unassigned">{t('tasks.unassigned')}</option>
          {assigneeOptions.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>
        <select
          value={dueDateFilter}
          onChange={(e) => setDueDateFilter(e.target.value as typeof dueDateFilter)}
          className="h-8 rounded-md border border-zinc-800/60 bg-zinc-900/50 px-2 text-xs text-muted-foreground"
          aria-label={t('tasks.filterByDueDate')}
        >
          <option value="all">{t('tasks.allDates')}</option>
          <option value="today">{t('tasks.dueToday')}</option>
          <option value="this_week">{t('tasks.dueThisWeek')}</option>
          <option value="overdue">{t('tasks.overdue')}</option>
          <option value="no_due_date">{t('common.noDueDate')}</option>
        </select>
        <span className="ml-auto text-[11px] text-muted-foreground/70">
          {t('tasks.showingCount', { filtered: filteredTasks.length, total: tasks.length })}
        </span>
        {(search || assigneeFilter !== 'all' || dueDateFilter !== 'all') && (
          <button
            type="button"
            className="text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch('');
              setAssigneeFilter('all');
              setDueDateFilter('all');
            }}
          >
            {t('common.resetFilters')}
          </button>
        )}
      </div>

      <TaskKanban
        tasks={filteredTasks}
        workspaceId={effectiveWorkspaceId}
        quickCreateDisabled={createProject.isPending}
        isCreatingTask={createTask.isPending}
        isMovingTask={moveTask.isPending}
        onQuickCreate={async (status: KanbanStatus, title: string) => {
          const project = await ensureTaskProject();
          await createTask.mutateAsync({
            projectId: project.id,
            projectName: project.name,
            input: { title, status, priority: 'MEDIUM' },
          });
        }}
        onTaskSelect={(task) => {
          setSelectedTask(task);
          setModalOpen(true);
        }}
        onTaskDelete={(task) => void handleDeleteTask(task)}
        onTaskMove={async (taskId, status, position) => {
          await moveTask.mutateAsync({ taskId, input: { status, position } });
        }}
      />

      <TaskDetailModal
        workspaceId={effectiveWorkspaceId}
        task={selectedTask}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

function TasksBoardLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="w-[300px]">
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
