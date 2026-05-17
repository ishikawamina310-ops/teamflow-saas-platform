'use client';

import type { TaskSummary } from '@teamflow/shared';
import { CalendarClock, Flag } from 'lucide-react';

interface TaskCardProps {
  task: TaskSummary;
  onClick?: () => void;
}

const priorityStyles: Record<string, string> = {
  LOW: 'text-emerald-600',
  MEDIUM: 'text-blue-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border bg-card p-3 text-left shadow-sm transition hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium">{task.title}</p>
        <Flag className={`h-4 w-4 ${priorityStyles[task.priority]}`} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{task.projectName}</span>
        {task.dueDate ? (
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span>No due date</span>
        )}
      </div>
    </button>
  );
}
