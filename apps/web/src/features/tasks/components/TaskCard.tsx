'use client';

import type { TaskSummary } from '@teamflow/shared';
import { AlertTriangle, CalendarClock, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/features/i18n/hooks/useI18n';
import { cn } from '@/lib/utils';

import { PRIORITY_BADGE_VARIANT } from '../lib/kanban.constants';

export interface TaskCardProps {
  task: TaskSummary;
  onClick?: () => void;
  onDelete?: (task: TaskSummary) => void;
  className?: string;
  isDragging?: boolean;
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'DONE') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export function TaskCard({ task, onClick, onDelete, className, isDragging }: TaskCardProps) {
  const { locale, t } = useI18n();
  const assigneeInitials = task.assignee?.name
    ? task.assignee.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'NA';
  const unassignedLabel = t('tasks.unassigned');
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      className={cn(
        'group relative w-full rounded-lg border border-zinc-800/70 bg-zinc-900/80 transition-all hover:border-zinc-700 hover:bg-zinc-800/60',
        isDragging && 'rotate-1 scale-[1.02] border-primary/50 shadow-lg ring-1 ring-primary/30',
        overdue && 'border-destructive/30',
        className,
      )}
    >
      {onDelete && (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 rounded-md p-1 text-muted-foreground opacity-100 transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={t('tasks.delete')}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-grab px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2 pr-6">
          <p className="line-clamp-2 text-[13px] font-normal leading-5 text-foreground/95">{task.title}</p>
          <Badge
            variant={PRIORITY_BADGE_VARIANT[task.priority]}
            className="shrink-0 px-1.5 py-0 text-[10px] uppercase tracking-wide"
          >
            {task.priority === 'URGENT' && <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />}
            {task.priority}
          </Badge>
        </div>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Badge variant="secondary" className="max-w-[65%] truncate px-1.5 py-0 text-[10px]">
            {task.projectName}
          </Badge>
          <Avatar className="h-5 w-5">
            <AvatarImage
              src={task.assignee?.avatarUrl ?? undefined}
              alt={task.assignee?.name ?? unassignedLabel}
            />
            <AvatarFallback className="text-[9px]">{assigneeInitials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="truncate">{task.assignee?.name ?? unassignedLabel}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 whitespace-nowrap',
              overdue ? 'font-medium text-destructive' : 'text-muted-foreground',
            )}
          >
            <CalendarClock className={cn('h-3 w-3', overdue && 'text-destructive')} />
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString(locale, {
                  month: 'short',
                  day: 'numeric',
                })
              : t('common.noDueDate')}
          </span>
        </div>
      </button>
    </div>
  );
}
