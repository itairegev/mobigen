import * as React from 'react';
import { cn } from '../utils/cn';
import type { SyncStatus } from './types';

export interface SyncStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  status: SyncStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SyncStatusIndicator = React.forwardRef<HTMLDivElement, SyncStatusIndicatorProps>(
  ({ className, status, showLabel = true, size = 'md', ...props }, ref) => {
    const getStatusConfig = (status: SyncStatus) => {
      switch (status) {
        case 'synced':
          return {
            color: 'bg-green-500',
            label: 'Synced',
            icon: (
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            textColor: 'text-green-700',
          };
        case 'syncing':
          return {
            color: 'bg-blue-500',
            label: 'Syncing...',
            icon: (
              <svg
                className="w-full h-full animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ),
            textColor: 'text-blue-700',
          };
        case 'pending':
          return {
            color: 'bg-yellow-500',
            label: 'Pending',
            icon: (
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            textColor: 'text-yellow-700',
          };
        case 'failed':
          return {
            color: 'bg-red-500',
            label: 'Failed',
            icon: (
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            textColor: 'text-red-700',
          };
        case 'disconnected':
          return {
            color: 'bg-gray-400',
            label: 'Disconnected',
            icon: (
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
            ),
            textColor: 'text-gray-600',
          };
        default:
          return {
            color: 'bg-gray-400',
            label: 'Unknown',
            icon: null,
            textColor: 'text-gray-600',
          };
      }
    };

    const sizeClasses = {
      sm: {
        dot: 'h-2 w-2',
        icon: 'h-3 w-3',
        text: 'text-xs',
      },
      md: {
        dot: 'h-3 w-3',
        icon: 'h-4 w-4',
        text: 'text-sm',
      },
      lg: {
        dot: 'h-4 w-4',
        icon: 'h-5 w-5',
        text: 'text-base',
      },
    };

    const config = getStatusConfig(status);
    const sizes = sizeClasses[size];

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
        {...props}
      >
        <div className="relative flex items-center justify-center">
          <div className={cn('rounded-full', config.color, sizes.dot)} />
          {config.icon && (
            <div className={cn('absolute inset-0 flex items-center justify-center text-white', sizes.icon)}>
              {config.icon}
            </div>
          )}
        </div>
        {showLabel && (
          <span className={cn('font-medium', config.textColor, sizes.text)}>
            {config.label}
          </span>
        )}
      </div>
    );
  }
);

SyncStatusIndicator.displayName = 'SyncStatusIndicator';
