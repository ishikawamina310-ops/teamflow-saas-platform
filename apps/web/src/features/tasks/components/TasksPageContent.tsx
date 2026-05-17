'use client';

import type { TaskSummary } from '@teamflow/shared';
import { useMemo, useState } from 'react';

import { useProjects } from '@/features/projects/hooks/useProjects';
import { useCurrentWorkspace } from '@/features/workspaces/hooks/useWorkspaces';

import { CreateTaskInline } from './CreateTaskInline';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskKanban } from './TaskKanban';
import { useMoveTask, useTasks } from '../hooks/useTasks';

export function TasksPageContent({ workspaceId }: { workspaceId?: string }) {
  const { current, isLoading: workspaceLoading } = useCurrentWorkspace();
  const effectiveWorkspaceId = workspaceId ?? current?.id;
  const { data: tasksData, isLoading, isError } = useTasks(effectiveWorkspaceId, { limit: 100 });
  const { data: projectsData } = useProjects(effectiveWorkspaceId, { limit: 100 });
  const moveTask = useMoveTask(effectiveWorkspaceId);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const tasks = useMemo(() => tasksData?.items ?? [], [tasksData?.items]);
  const projects = useMemo(() => projectsData?.items ?? [], [projectsData?.items]);
  const defaultProject = projects[0] ?? null;

  if (workspaceLoading || isLoading) {
    return <div className="text-sm text-muted-foreground">Loading tasks…</div>;
  }

  if (!effectiveWorkspaceId) {
    return <div className="text-sm text-muted-foreground">Select a workspace to continue.</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load tasks for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          {current ? `Workspace: ${current.name}` : 'Workspace tasks'}
        </p>
      </div>

      <CreateTaskInline workspaceId={effectiveWorkspaceId} project={defaultProject} />

      <TaskKanban
        tasks={tasks}
        onTaskSelect={(task) => {
          setSelectedTask(task);
          setModalOpen(true);
        }}
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
