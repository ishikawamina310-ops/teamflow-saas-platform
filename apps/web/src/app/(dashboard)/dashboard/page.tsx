'use client';

import { Activity, CheckCircle2, ClipboardList, FolderKanban, Users } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/features/i18n/hooks/useI18n';
import {
  useCurrentWorkspace,
  useWorkspaceDashboardOverview,
} from '@/features/workspaces/hooks/useWorkspaces';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardPage() {
  const { locale, t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { current, isLoading: isWorkspaceLoading } = useCurrentWorkspace();
  const { data, isLoading, isError } = useWorkspaceDashboardOverview(current?.id);

  if (isWorkspaceLoading || isLoading) {
    return <DashboardLoadingState />;
  }

  if (!current) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('common.dashboard')}</h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('dashboard.selectWorkspace')}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('common.dashboard')}</h1>
        <Card className="border-destructive/40">
          <CardContent className="py-10 text-center text-sm text-destructive">
            {t('dashboard.failedLoad')}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data.stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('auth.welcomeBack')}, {user?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.overviewFor', { workspace: data.workspaceName })}
          .
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          label={t('dashboard.members')}
          value={stats.memberCount}
          helper={t('dashboard.activeWorkspaceMembers')}
        />
        <MetricCard
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
          label={t('dashboard.projects')}
          value={stats.projectCount}
          helper={t('dashboard.nonArchivedProjectScope')}
        />
        <MetricCard
          icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}
          label={t('dashboard.totalTasks')}
          value={stats.totalTaskCount}
          helper={t('dashboard.includingCompletedWork')}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          label={t('dashboard.overdueTasks')}
          value={stats.overdueTaskCount}
          helper={t('dashboard.overdueAndNotDone')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TaskStatCard label={t('dashboard.todo')} value={stats.todoTaskCount} />
        <TaskStatCard label={t('dashboard.inProgress')} value={stats.inProgressTaskCount} />
        <TaskStatCard label={t('dashboard.reviewDone')} value={stats.reviewTaskCount + stats.doneTaskCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('dashboard.recentTasks')}</CardTitle>
            <CardDescription>{t('dashboard.recentTaskUpdates')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentTasks.length === 0 ? (
              <EmptySection text={t('dashboard.noTasksYet')} />
            ) : (
              data.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.projectName}
                      {task.assigneeName ? ` · ${task.assigneeName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      {formatStatus(task.status, locale)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {task.dueDate ? formatDate(task.dueDate, locale) : t('dashboard.noDueDate')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>{t('dashboard.recentActivityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivities.length === 0 ? (
              <EmptySection text={t('dashboard.noActivityYet')} />
            ) : (
              data.recentActivities.map((activity) => (
                <div key={activity.id} className="rounded-lg border bg-background px-3 py-3">
                  <p className="text-sm">
                    <span className="font-medium">{activity.actorName}</span>{' '}
                    <span className="text-muted-foreground">
                      {formatAction(activity.action, locale)} {activity.targetType.toLowerCase()}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelativeTime(activity.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link className="underline underline-offset-4 hover:text-foreground" href="/tasks">
          {t('dashboard.viewAllTasks')}
        </Link>
        <span>·</span>
        <Link className="underline underline-offset-4 hover:text-foreground" href="/projects">
          {t('dashboard.viewProjects')}
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function TaskStatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((__, rowIdx) => (
                <Skeleton key={rowIdx} className="h-14 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatStatus(status: string, locale: 'ja' | 'en') {
  if (locale === 'ja') {
    const statusMap: Record<string, string> = {
      TODO: '未着手',
      IN_PROGRESS: '進行中',
      IN_REVIEW: 'レビュー中',
      DONE: '完了',
    };
    return statusMap[status] ?? status;
  }
  return status.toLowerCase().replaceAll('_', ' ');
}

function formatAction(action: string, locale: 'ja' | 'en') {
  if (locale === 'ja') {
    const actionMap: Record<string, string> = {
      CREATED: '作成',
      UPDATED: '更新',
      DELETED: '削除',
      MOVED: '移動',
      ASSIGNED: '割り当て',
    };
    return actionMap[action] ?? action.toLowerCase().replaceAll('_', ' ');
  }
  return action.toLowerCase().replaceAll('_', ' ');
}

function formatDate(date: string, locale: 'ja' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function formatRelativeTime(date: string) {
  const diffMs = new Date(date).getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absMs < 60_000) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (absMs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), 'minute');
  if (absMs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), 'hour');
  return rtf.format(Math.round(diffMs / 86_400_000), 'day');
}
