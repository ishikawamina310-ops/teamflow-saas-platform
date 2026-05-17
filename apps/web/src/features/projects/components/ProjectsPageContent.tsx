'use client';

import { useMemo } from 'react';

import { useCurrentWorkspace } from '@/features/workspaces/hooks/useWorkspaces';

import { useProjects } from '../hooks/useProjects';

export function ProjectsPageContent({ workspaceId }: { workspaceId?: string }) {
  const { current, isLoading: workspaceLoading } = useCurrentWorkspace();
  const effectiveWorkspaceId = workspaceId ?? current?.id;
  const { data, isLoading, isError } = useProjects(effectiveWorkspaceId);

  const projects = useMemo(() => data?.items ?? [], [data?.items]);

  if (workspaceLoading || isLoading) {
    return <div className="text-sm text-muted-foreground">Loading projects…</div>;
  }

  if (!effectiveWorkspaceId) {
    return <div className="text-sm text-muted-foreground">Select a workspace to continue.</div>;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load projects for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-muted-foreground">
          {current ? `Workspace: ${current.name}` : 'Workspace projects'}
        </p>
      </div>
      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No projects yet. Create one from the API or upcoming project form.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border bg-card p-4">
              <p className="font-medium">{project.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description || 'No description'}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Status: {project.status}</span>
                <span>{project.taskCount} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
