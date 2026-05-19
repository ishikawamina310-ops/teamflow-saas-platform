'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { LanguageSwitcher } from '@/features/i18n/components/LanguageSwitcher';
import { useI18n } from '@/features/i18n/hooks/useI18n';
import { WorkspaceSwitcher } from '@/features/workspaces/components/WorkspaceSwitcher';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useWorkspaceStore } from '@/stores/workspace.store';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
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
        {t('common.loading')}
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <aside className="relative z-20 hidden w-60 shrink-0 border-r border-zinc-800/60 bg-zinc-950 p-5 md:block">
        <div className="text-base font-semibold tracking-tight text-foreground/95">TeamFlow</div>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
          {t('dashboard.sidebarTagline')}
        </p>
        <div className="relative z-30 mt-4">
          <WorkspaceSwitcher onDropdownOpenChange={setWorkspaceMenuOpen} />
        </div>
        <LanguageSwitcher className="mt-3" />
        <nav
          className={cn(
            'mt-6 space-y-0.5 text-[13px] text-muted-foreground transition-opacity',
            workspaceMenuOpen && 'pointer-events-none opacity-0',
          )}
        >
          <Link className="block rounded-md px-2.5 py-1.5 hover:bg-zinc-800/70 hover:text-foreground" href="/dashboard">
            {t('common.dashboard')}
          </Link>
          <Link
            className="block rounded-md px-2.5 py-1.5 hover:bg-zinc-800/70 hover:text-foreground"
            href={
              currentWorkspaceId
                ? `/workspaces/${currentWorkspaceId}/projects`
                : '/projects'
            }
          >
            {t('common.projects')}
          </Link>
          <Link
            className="block rounded-md px-2.5 py-1.5 hover:bg-zinc-800/70 hover:text-foreground"
            href={
              currentWorkspaceId
                ? `/workspaces/${currentWorkspaceId}/tasks`
                : '/tasks'
            }
          >
            {t('common.tasks')}
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-zinc-950 p-5 sm:p-7">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
