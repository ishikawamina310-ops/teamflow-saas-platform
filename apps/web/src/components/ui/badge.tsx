import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-px text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/40 bg-primary/20 text-primary',
        secondary: 'border-white/10 bg-secondary/75 text-secondary-foreground',
        destructive: 'border-destructive/40 bg-destructive/15 text-destructive',
        outline: 'border-white/20 bg-transparent text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
