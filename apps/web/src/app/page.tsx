import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          TeamFlow
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Ship together. Stay aligned.
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          A modern team collaboration and task management platform built for remote teams.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Go to app</Link>
        </Button>
      </div>
    </main>
  );
}
