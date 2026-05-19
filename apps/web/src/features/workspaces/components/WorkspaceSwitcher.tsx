'use client';

import { Building2, Check, ChevronsUpDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/features/i18n/hooks/useI18n';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace.store';

import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import {
  useCurrentWorkspace,
  useDeleteWorkspace,
  useSetCurrentWorkspace,
  useWorkspaces,
} from '../hooks/useWorkspaces';

interface WorkspaceSwitcherProps {
  onDropdownOpenChange?: (open: boolean) => void;
}

export function WorkspaceSwitcher({ onDropdownOpenChange }: WorkspaceSwitcherProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const { current } = useCurrentWorkspace();
  const setCurrentWorkspace = useSetCurrentWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspace);

  const handleDeleteWorkspace = () => {
    if (!current) return;
    if (!window.confirm(t('workspace.deleteConfirm', { name: current.name }))) return;
    deleteWorkspace.mutate(current.id);
    handleOpenChange(false);
    router.push('/dashboard' as never);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onDropdownOpenChange?.(next);
  };

  useEffect(() => {
    if (!workspaces?.length) return;
    const exists = workspaces.some((w) => w.id === currentWorkspaceId);
    if (!currentWorkspaceId || !exists) {
      setCurrentWorkspaceId(workspaces[0]!.id);
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspaceId]);

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-start" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('workspace.loading')}
      </Button>
    );
  }

  if (isError) {
    return (
      <Button variant="outline" className="w-full justify-start text-destructive" disabled>
        {t('workspace.failedLoad')}
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={handleOpenChange} modal>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="flex items-center gap-2 truncate">
              <Building2 className="h-4 w-4 shrink-0 opacity-70" />
              <span className="truncate">{current?.name ?? t('workspace.selectWorkspace')}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[14rem] bg-popover"
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={8}
        >
          <DropdownMenuLabel>{t('workspace.workspaces')}</DropdownMenuLabel>
          {workspaces?.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              className="bg-popover focus:bg-accent"
              onSelect={() => {
                setCurrentWorkspace(workspace);
                handleOpenChange(false);
                const wsRouteMatch = pathname.match(/^\/workspaces\/[^/]+(.*)$/);
                if (wsRouteMatch) {
                  const subPath = wsRouteMatch[1] || '';
                  router.push(`/workspaces/${workspace.id}${subPath}` as never);
                }
              }}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  current?.id === workspace.id ? 'opacity-100' : 'opacity-0',
                )}
              />
              <span className="truncate">{workspace.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{workspace.role}</span>
            </DropdownMenuItem>
          ))}
          {workspaces?.length === 0 && (
            <DropdownMenuItem disabled className="bg-popover">
              {t('workspace.noWorkspaces')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="bg-popover focus:bg-accent"
            onSelect={() => {
              handleOpenChange(false);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('workspace.createWorkspace')}
          </DropdownMenuItem>
          {current && current.role === 'OWNER' && (
            <DropdownMenuItem
              className="bg-popover text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={handleDeleteWorkspace}
              disabled={deleteWorkspace.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('workspace.delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
