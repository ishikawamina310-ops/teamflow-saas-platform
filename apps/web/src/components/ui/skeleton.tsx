import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gradient-to-r from-muted via-accent/70 to-muted', className)}
      {...props}
    />
  );
}
