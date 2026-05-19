'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tasks route error:', error);
  }, [error]);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Tasks could not be loaded</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A temporary issue occurred while loading the board. Please try again.
        </p>
        <Button onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
