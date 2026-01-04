import * as React from 'react';
import { cn } from '../utils/cn';
import { Button } from '../components/Button';
import type { SyncAction } from './types';

export interface SyncActionsMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  onAction: (action: SyncAction) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  syncEnabled?: boolean;
  autoCommit?: boolean;
  showPush?: boolean;
  showPull?: boolean;
  showConfigure?: boolean;
  showDisconnect?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const SyncActionsMenu = React.forwardRef<HTMLDivElement, SyncActionsMenuProps>(
  (
    {
      className,
      onAction,
      isLoading = false,
      disabled = false,
      syncEnabled = true,
      autoCommit = false,
      showPush = true,
      showPull = true,
      showConfigure = true,
      showDisconnect = true,
      orientation = 'horizontal',
      ...props
    },
    ref
  ) => {
    const [actionLoading, setActionLoading] = React.useState<SyncAction | null>(null);

    const handleAction = async (action: SyncAction) => {
      try {
        setActionLoading(action);
        await onAction(action);
      } catch (error) {
        console.error(`GitHub ${action} error:`, error);
      } finally {
        setActionLoading(null);
      }
    };

    const isActionLoading = (action: SyncAction) => actionLoading === action;
    const isDisabled = disabled || isLoading;

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-2',
          orientation === 'vertical' && 'flex-col',
          orientation === 'horizontal' && 'flex-row items-center',
          className
        )}
        {...props}
      >
        {showPush && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAction('push')}
            isLoading={isActionLoading('push')}
            disabled={isDisabled || !syncEnabled || autoCommit}
            title={
              !syncEnabled
                ? 'Sync is disabled'
                : autoCommit
                ? 'Auto-commit is enabled'
                : 'Push changes to GitHub'
            }
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Push
          </Button>
        )}

        {showPull && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAction('pull')}
            isLoading={isActionLoading('pull')}
            disabled={isDisabled || !syncEnabled}
            title={!syncEnabled ? 'Sync is disabled' : 'Pull changes from GitHub'}
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8"
              />
            </svg>
            Pull
          </Button>
        )}

        {showConfigure && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('configure')}
            isLoading={isActionLoading('configure')}
            disabled={isDisabled}
            title="Configure GitHub sync settings"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configure
          </Button>
        )}

        {showDisconnect && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAction('disconnect')}
            isLoading={isActionLoading('disconnect')}
            disabled={isDisabled}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Disconnect GitHub integration"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
              />
            </svg>
            Disconnect
          </Button>
        )}
      </div>
    );
  }
);

SyncActionsMenu.displayName = 'SyncActionsMenu';
