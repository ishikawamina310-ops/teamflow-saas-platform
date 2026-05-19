'use client';

import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/features/i18n/hooks/useI18n';

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="particle-bg relative min-h-screen overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-12 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-8 top-20 h-44 w-44 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-background/55 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {t('home.badge')}
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              TeamFlow
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              {t('home.headingLine1')}
              <br />
              {t('home.headingLine2')}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              {t('home.description')}
            </p>
          </div>
        </div>

        <div className="mx-auto flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/login">
              {t('home.signIn')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">{t('home.openDashboard')}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/tasks">{t('home.openKanban')}</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[t('home.point1'), t('home.point2'), t('home.point3')].map((point) => (
            <Card key={point} className="border bg-card/85 backdrop-blur-sm">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{point}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
