'use client';

import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'destructive' | 'secondary' | 'outline';
}

const variantStyles: Record<string, string> = {
  default: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  destructive: 'bg-red-500 text-white',
  secondary: 'bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-slate-100',
  outline: 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-transparent',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';
