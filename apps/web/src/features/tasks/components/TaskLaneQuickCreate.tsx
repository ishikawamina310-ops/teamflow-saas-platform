'use client';

import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/features/i18n/hooks/useI18n';
import { cn } from '@/lib/utils';

import type { KanbanStatus } from '../lib/kanban.constants';

interface TaskLaneQuickCreateProps {
  laneLabel: string;
  status: KanbanStatus;
  existingCount?: number;
  disabled?: boolean;
  isPending?: boolean;
  onCreate: (status: KanbanStatus, title: string) => Promise<void>;
}

export function TaskLaneQuickCreate({
  status,
  disabled = false,
  isPending = false,
  onCreate,
}: TaskLaneQuickCreateProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setTitle('');
  };

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed || isPending || disabled) return;
    await onCreate(status, trimmed);
    close();
  };

  if (!open) {
    return (
      <button
        type="button"
        disabled={disabled}
        className="flex h-6 w-full items-center gap-1 rounded text-[11px] text-muted-foreground/70 hover:text-muted-foreground disabled:opacity-50"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        <span>{t('tasks.addTask')}</span>
      </button>
    );
  }

  return (
    <div className="mt-1">
      <Input
        ref={inputRef}
        value={title}
        placeholder={t('tasks.taskTitlePlaceholder')}
        className={cn(
          'h-7 border-zinc-800/60 bg-zinc-900/60 text-xs placeholder:text-muted-foreground/60',
          isFocused && 'border-zinc-700 ring-1 ring-zinc-700/50',
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
          if (e.key === 'Enter') {
            e.preventDefault();
            void submit();
          }
        }}
      />
      <div className="mt-1.5 flex items-center justify-end gap-1">
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={close}
          aria-label={t('tasks.cancelQuickCreate')}
        >
          {t('common.cancel')}
        </button>
        <Button
          type="button"
          size="sm"
          className={cn('h-6 px-2 text-[11px]', isPending && 'opacity-80')}
          onClick={() => void submit()}
          disabled={!title.trim() || isPending || disabled}
        >
          {isPending ? t('tasks.adding') : t('tasks.add')}
        </Button>
      </div>
    </div>
  );
}
