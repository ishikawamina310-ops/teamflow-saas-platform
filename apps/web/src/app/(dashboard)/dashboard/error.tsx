'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard route error:', error);
  }, [error]);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Dashboard data could not be loaded</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A temporary issue occurred while loading workspace insights. Please try again.
        </p>
        <Button onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
