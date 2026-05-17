'use client';

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskSummary } from '@teamflow/shared';

import { TaskCard } from './TaskCard';

const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
type Status = (typeof STATUSES)[number];

interface TaskKanbanProps {
  tasks: TaskSummary[];
  onTaskSelect: (task: TaskSummary) => void;
  onTaskMove: (taskId: string, status: Status, position: number) => Promise<void>;
}

function SortableTask({
  task,
  onClick,
}: {
  task: TaskSummary;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { task },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

export function TaskKanban({ tasks, onTaskSelect, onTaskMove }: TaskKanbanProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const tasksByStatus = STATUSES.reduce(
    (acc, status) => {
      acc[status] = tasks
        .filter((task) => task.status === status)
        .sort((a, b) => a.position - b.position);
      return acc;
    },
    {} as Record<Status, TaskSummary[]>,
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceTask = tasks.find((task) => task.id === active.id);
    if (!sourceTask) return;

    const overTask = tasks.find((task) => task.id === over.id);
    const targetStatus = (overTask?.status ?? sourceTask.status) as Status;
    const lane = tasksByStatus[targetStatus];
    const targetIndex = overTask ? lane.findIndex((task) => task.id === overTask.id) : lane.length;
    const before = lane[targetIndex - 1];
    const after = lane[targetIndex];

    let position = sourceTask.position;
    if (!before && !after) position = 1000;
    else if (!before && after) position = after.position / 2;
    else if (before && !after) position = before.position + 1000;
    else if (before && after) position = (before.position + after.position) / 2;

    await onTaskMove(sourceTask.id, targetStatus, position);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {STATUSES.map((status) => {
          const laneTasks = tasksByStatus[status];
          return (
            <div key={status} className="rounded-xl border bg-muted/20 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{status.replaceAll('_', ' ')}</h3>
                <span className="rounded bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {laneTasks.length}
                </span>
              </div>
              <SortableContext
                items={laneTasks.map((task) => task.id)}
                strategy={rectSortingStrategy}
              >
                <div className="space-y-2">
                  {laneTasks.map((task) => (
                    <SortableTask key={task.id} task={task} onClick={() => onTaskSelect(task)} />
                  ))}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}
