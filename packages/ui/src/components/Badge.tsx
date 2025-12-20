import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        success: 'bg-green-100 text-green-800 border-green-200 border',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 border',
        error: 'bg-red-100 text-red-800 border-red-200 border',
        info: 'bg-blue-100 text-blue-800 border-blue-200 border',
        default: 'bg-gray-100 text-gray-800 border-gray-200 border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
