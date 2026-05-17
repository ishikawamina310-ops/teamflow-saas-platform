'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { WorkspaceSwitcher } from '@/features/workspaces/components/WorkspaceSwitcher';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken && s.user));
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="relative z-20 hidden w-64 shrink-0 border-r bg-muted/30 p-6 md:block">
        <div className="text-lg font-semibold">TeamFlow</div>
        <div className="relative z-30 mt-4">
          <WorkspaceSwitcher onDropdownOpenChange={setWorkspaceMenuOpen} />
        </div>
        <nav
          className={cn(
            'mt-8 space-y-1 text-sm text-muted-foreground transition-opacity',
            workspaceMenuOpen && 'pointer-events-none opacity-0',
          )}
        >
          <Link className="block rounded px-3 py-2 hover:bg-accent" href="/dashboard">
            Dashboard
          </Link>
          <a
            className="block rounded px-3 py-2 hover:bg-accent"
            href={
              currentWorkspaceId
                ? `/workspaces/${currentWorkspaceId}/projects`
                : '/projects'
            }
          >
            Projects
          </a>
          <a
            className="block rounded px-3 py-2 hover:bg-accent"
            href={
              currentWorkspaceId
                ? `/workspaces/${currentWorkspaceId}/tasks`
                : '/tasks'
            }
          >
            Tasks
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
