'use client';

import {
  DragOverlay,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TaskSummary } from '@teamflow/shared';
import { GripVertical } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useI18n } from '@/features/i18n/hooks/useI18n';
import { cn } from '@/lib/utils';

import { useKanbanColumnOrder } from '../hooks/useKanbanColumnOrder';
import {
  KANBAN_STATUSES,
  type KanbanStatus,
  toBoardStatus,
} from '../lib/kanban.constants';

import { TaskCard } from './TaskCard';
import { TaskLaneQuickCreate } from './TaskLaneQuickCreate';

const COLUMN_ID_PREFIX = 'kanban-column:';

function getColumnLabel(t: ReturnType<typeof useI18n>['t'], status: KanbanStatus): string {
  const labels = {
    TODO: t('tasks.columnTodo'),
    IN_PROGRESS: t('tasks.columnInProgress'),
    IN_REVIEW: t('tasks.columnReview'),
    DONE: t('tasks.columnDone'),
  };
  return labels[status];
}

interface TaskKanbanProps {
  tasks: TaskSummary[];
  workspaceId: string;
  onTaskSelect: (task: TaskSummary) => void;
  onTaskDelete?: (task: TaskSummary) => void;
  onTaskMove: (taskId: string, status: KanbanStatus, position: number) => Promise<void>;
  onQuickCreate?: (status: KanbanStatus, title: string) => Promise<void>;
  isCreatingTask?: boolean;
  isMovingTask?: boolean;
  quickCreateDisabled?: boolean;
}

function SortableTask({
  task,
  onClick,
  onDelete,
  isDragging,
}: {
  task: TaskSummary;
  onClick: () => void;
  onDelete?: (task: TaskSummary) => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-none', isDragging && 'opacity-40')}
    >
      <TaskCard task={task} onClick={onClick} onDelete={onDelete} />
    </div>
  );
}

function SortableColumn({
  status,
  tasks,
  onTaskSelect,
  onTaskDelete,
  onQuickCreate,
  isCreatingTask,
  quickCreateDisabled,
  isDropTarget,
  activeTaskId,
}: {
  status: KanbanStatus;
  tasks: TaskSummary[];
  onTaskSelect: (task: TaskSummary) => void;
  onTaskDelete?: (task: TaskSummary) => void;
  onQuickCreate?: (status: KanbanStatus, title: string) => Promise<void>;
  isCreatingTask?: boolean;
  quickCreateDisabled?: boolean;
  isDropTarget: boolean;
  activeTaskId: string | null;
}) {
  const { t } = useI18n();
  const columnLabel = getColumnLabel(t, status);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: toColumnId(status),
    data: { type: 'column', status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn(
        'min-w-[240px] flex-1 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 transition-colors',
        isDropTarget && 'border-primary/40 bg-primary/[0.04]',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            className="rounded p-0.5 text-muted-foreground/70 hover:bg-zinc-800 hover:text-muted-foreground"
            {...attributes}
            {...listeners}
            aria-label={t('tasks.reorderColumn', { column: columnLabel })}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <h3 className="truncate text-[13px] font-medium text-foreground/90">{columnLabel}</h3>
        </div>
        <span className="rounded-md bg-zinc-800/70 px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={rectSortingStrategy}>
        <div
          className={cn(
            'min-h-[420px] space-y-2 rounded-md transition-colors',
            tasks.length === 0 && 'flex items-center justify-center border border-dashed border-zinc-800/60 p-4',
          )}
        >
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('tasks.dropTasksHere')}</p>
          ) : (
            tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                onClick={() => onTaskSelect(task)}
                onDelete={onTaskDelete}
                isDragging={task.id === activeTaskId}
              />
            ))
          )}
        </div>
      </SortableContext>

      {onQuickCreate && (
        <div className="mt-2 border-t border-border/40 pt-2">
          <TaskLaneQuickCreate
            laneLabel={columnLabel}
            status={status}
            existingCount={tasks.length}
            disabled={quickCreateDisabled}
            isPending={isCreatingTask}
            onCreate={onQuickCreate}
          />
        </div>
      )}
    </section>
  );
}

export function TaskKanban({
  tasks,
  workspaceId,
  onTaskSelect,
  onTaskDelete,
  onTaskMove,
  onQuickCreate,
  isCreatingTask = false,
  isMovingTask = false,
  quickCreateDisabled = false,
}: TaskKanbanProps) {
  const { t } = useI18n();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { columnOrder, updateColumnOrder } = useKanbanColumnOrder(workspaceId);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanStatus | null>(null);
  const [overStatus, setOverStatus] = useState<KanbanStatus | null>(null);

  const tasksByStatus = useMemo(
    () =>
      KANBAN_STATUSES.reduce(
        (acc, status) => {
          acc[status] = tasks
            .filter((task) => toBoardStatus(task.status) === status)
            .sort((a, b) => a.position - b.position);
          return acc;
        },
        {} as Record<KanbanStatus, TaskSummary[]>,
      ),
    [tasks],
  );

  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) ?? null : null;

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type;
    if (type === 'task') {
      setActiveTaskId(String(event.active.id));
      return;
    }
    if (type === 'column') {
      const status = getStatusFromColumnId(String(event.active.id));
      if (status) setActiveColumn(status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverStatus(null);
      return;
    }

    const overId = String(over.id);
    const overTask = tasks.find((task) => task.id === overId);
    setOverStatus(overTask ? toBoardStatus(overTask.status) : getStatusFromColumnId(overId));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    setActiveColumn(null);
    setOverStatus(null);

    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type;

    if (activeType === 'column') {
      const activeStatus = getStatusFromColumnId(String(active.id));
      const overStatus = getStatusFromColumnId(String(over.id));

      if (!activeStatus || !overStatus || activeStatus === overStatus) return;

      const from = columnOrder.indexOf(activeStatus);
      const to = columnOrder.indexOf(overStatus);
      if (from === -1 || to === -1) return;
      updateColumnOrder(arrayMove(columnOrder, from, to));
      return;
    }

    const sourceTask = tasks.find((task) => task.id === String(active.id));
    if (!sourceTask) return;

    const overId = String(over.id);
    const overTask = tasks.find((task) => task.id === overId);
    const statusFromColumnDrop = getStatusFromColumnId(overId);
    const targetStatus = (overTask
      ? toBoardStatus(overTask.status)
      : statusFromColumnDrop ?? toBoardStatus(sourceTask.status)) as KanbanStatus;
    const sourceLane = tasksByStatus[toBoardStatus(sourceTask.status)] ?? [];
    const targetLane = tasksByStatus[targetStatus] ?? [];

    const overTaskIndex = overTask ? targetLane.findIndex((task) => task.id === overTask.id) : -1;
    const initialTargetIndex = overTaskIndex >= 0 ? overTaskIndex : targetLane.length;
    const laneWithoutSource = targetLane.filter((task) => task.id !== sourceTask.id);
    const targetIndex =
      overTask && toBoardStatus(sourceTask.status) === targetStatus
        ? laneWithoutSource.findIndex((task) => task.id === overTask.id)
        : initialTargetIndex;
    const normalizedTargetIndex =
      targetIndex >= 0 ? Math.min(targetIndex, laneWithoutSource.length) : laneWithoutSource.length;
    const before = laneWithoutSource[normalizedTargetIndex - 1];
    const after = laneWithoutSource[normalizedTargetIndex];

    let position = sourceTask.position;
    if (!before && !after) position = 1000;
    else if (!before && after) position = after.position / 2;
    else if (before && !after) position = before.position + 1000;
    else if (before && after) position = (before.position + after.position) / 2;

    if (toBoardStatus(sourceTask.status) === targetStatus && sourceLane.length <= 1) return;

    await onTaskMove(sourceTask.id, targetStatus, position);
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    setActiveColumn(null);
    setOverStatus(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={columnOrder.map((status) => toColumnId(status))}
        strategy={horizontalListSortingStrategy}
      >
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3">
            {columnOrder.map((status) => (
              <SortableColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onTaskSelect={onTaskSelect}
                onTaskDelete={onTaskDelete}
                onQuickCreate={onQuickCreate}
                isCreatingTask={isCreatingTask}
                quickCreateDisabled={quickCreateDisabled}
                isDropTarget={Boolean(activeTaskId && overStatus === status)}
                activeTaskId={activeTaskId}
              />
            ))}
          </div>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask ? (
          <div className="w-[280px]">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : activeColumn ? (
          <div className="w-[280px] rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-[13px] font-medium shadow-xl">
            {getColumnLabel(t, activeColumn)}
          </div>
        ) : null}
      </DragOverlay>

      {isMovingTask ? (
        <div className="mt-3 text-xs text-muted-foreground">{t('tasks.savingBoardChanges')}</div>
      ) : null}
    </DndContext>
  );
}

function toColumnId(status: KanbanStatus): string {
  return `${COLUMN_ID_PREFIX}${status}`;
}

function getStatusFromColumnId(id: string): KanbanStatus | null {
  if (!id.startsWith(COLUMN_ID_PREFIX)) return null;
  const status = id.replace(COLUMN_ID_PREFIX, '') as KanbanStatus;
  return KANBAN_STATUSES.includes(status) ? status : null;
}
