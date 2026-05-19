'use client';

import { useEffect, useMemo, useState } from 'react';

import { KANBAN_STATUSES, type KanbanStatus } from '../lib/kanban.constants';

const STORAGE_KEY = 'teamflow.kanban.column-order';

function isKanbanStatus(value: string): value is KanbanStatus {
  return KANBAN_STATUSES.includes(value as KanbanStatus);
}

export function useKanbanColumnOrder(workspaceId?: string) {
  const [columnOrder, setColumnOrder] = useState<KanbanStatus[]>([...KANBAN_STATUSES]);

  useEffect(() => {
    if (!workspaceId) {
      setColumnOrder([...KANBAN_STATUSES]);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setColumnOrder([...KANBAN_STATUSES]);
        return;
      }

      const parsed = JSON.parse(raw) as Record<string, string[]>;
      const current = parsed[workspaceId];

      if (!current || !Array.isArray(current)) {
        setColumnOrder([...KANBAN_STATUSES]);
        return;
      }

      const normalized = current.filter(isKanbanStatus);
      if (normalized.length !== KANBAN_STATUSES.length) {
        setColumnOrder([...KANBAN_STATUSES]);
        return;
      }

      setColumnOrder(normalized);
    } catch {
      setColumnOrder([...KANBAN_STATUSES]);
    }
  }, [workspaceId]);

  const updateColumnOrder = useMemo(
    () => (next: KanbanStatus[]) => {
      setColumnOrder(next);
      if (!workspaceId) return;

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
        parsed[workspaceId] = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // no-op: persistence failure should not break board interaction
      }
    },
    [workspaceId],
  );

  return { columnOrder, updateColumnOrder };
}
