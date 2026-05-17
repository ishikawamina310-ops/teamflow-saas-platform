'use client';

import { Building2, Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores/workspace.store';

import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';
import {
  useCurrentWorkspace,
  useSetCurrentWorkspace,
  useWorkspaces,
} from '../hooks/useWorkspaces';

interface WorkspaceSwitcherProps {
  onDropdownOpenChange?: (open: boolean) => void;
}

export function WorkspaceSwitcher({ onDropdownOpenChange }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const { current } = useCurrentWorkspace();
  const setCurrentWorkspace = useSetCurrentWorkspace();
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);
  const setCurrentWorkspaceId = useWorkspaceStore((s) => s.setCurrentWorkspace);

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
        Loading workspaces…
      </Button>
    );
  }

  if (isError) {
    return (
      <Button variant="outline" className="w-full justify-start text-destructive" disabled>
        Failed to load workspaces
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
              <span className="truncate">{current?.name ?? 'Select workspace'}</span>
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
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces?.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              className="bg-popover focus:bg-accent"
              onSelect={() => {
                setCurrentWorkspace(workspace);
                handleOpenChange(false);
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
              No workspaces yet
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
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
