import type { TaskSummary } from '@teamflow/shared';

export const KANBAN_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export const KANBAN_STATUS_LABELS: Record<KanbanStatus, string> = {
  TODO: 'Todo',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'Review',
  DONE: 'Done',
};

export const PRIORITY_BADGE_VARIANT: Record<
  TaskSummary['priority'],
  'outline' | 'secondary' | 'default' | 'destructive'
> = {
  LOW: 'outline',
  MEDIUM: 'secondary',
  HIGH: 'default',
  URGENT: 'destructive',
};

export function toBoardStatus(status: TaskSummary['status']): KanbanStatus {
  return status === 'BACKLOG' ? 'TODO' : status;
}
