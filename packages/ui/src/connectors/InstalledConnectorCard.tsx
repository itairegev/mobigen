import * as React from 'react';
import { cn } from '../utils/cn';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import type { InstalledConnectorCardProps } from './types';

/**
 * InstalledConnectorCard - Display and manage an installed connector
 *
 * Shows connector status, last tested timestamp, and quick actions
 * for reconfiguring, testing, and uninstalling.
 *
 * @example
 * ```tsx
 * <InstalledConnectorCard
 *   connector={installedStripe}
 *   projectId="proj_123"
 *   onReconfigure={() => openConfigModal()}
 *   onUninstall={() => confirmUninstall()}
 *   onTest={() => testConnection()}
 * />
 * ```
 */
export const InstalledConnectorCard = React.forwardRef<HTMLDivElement, InstalledConnectorCardProps>(
  ({ connector, projectId, onReconfigure, onUninstall, onTest, ...props }, ref) => {
    const [isTestLoading, setIsTestLoading] = React.useState(false);

    const handleTest = async () => {
      setIsTestLoading(true);
      try {
        await onTest?.();
      } finally {
        setIsTestLoading(false);
      }
    };

    const getStatusColor = () => {
      switch (connector.status) {
        case 'installed':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'installing':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'failed':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'uninstalling':
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      }
    };

    const getStatusIcon = () => {
      switch (connector.status) {
        case 'installed':
          return '✓';
        case 'installing':
          return '⏳';
        case 'failed':
          return '❌';
        case 'uninstalling':
          return '🗑️';
        default:
          return '•';
      }
    };

    const formatLastTested = () => {
      if (!connector.lastTestedAt) return 'Never tested';

      const now = new Date();
      const tested = new Date(connector.lastTestedAt);
      const diffMs = now.getTime() - tested.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-white p-6 shadow-sm',
          'transition-all duration-200',
          connector.status === 'failed'
            ? 'border-red-200 dark:border-red-900 dark:bg-red-950/20'
            : 'border-gray-200 dark:border-gray-800 dark:bg-gray-900'
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{connector.icon}</div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                {connector.name}
              </h3>
              <Badge className={cn('text-xs mt-1', getStatusColor())}>
                {getStatusIcon()} {connector.status}
              </Badge>
            </div>
          </div>

          {/* Quick Actions Dropdown */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onReconfigure}
              disabled={connector.status === 'uninstalling'}
              title="Reconfigure"
            >
              ⚙️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTest}
              isLoading={isTestLoading}
              disabled={connector.status !== 'installed'}
              title="Test Connection"
            >
              🔌
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUninstall}
              disabled={connector.status === 'uninstalling'}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
              title="Uninstall"
            >
              🗑️
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {connector.status === 'failed' && connector.errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
            <p className="text-sm text-red-800 dark:text-red-200">
              <span className="font-medium">Error:</span> {connector.errorMessage}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Installed</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {new Date(connector.installedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Last Tested</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatLastTested()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onReconfigure}
            disabled={connector.status === 'uninstalling'}
          >
            Configure
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleTest}
            isLoading={isTestLoading}
            disabled={connector.status !== 'installed'}
          >
            Test
          </Button>
        </div>
      </div>
    );
  }
);

InstalledConnectorCard.displayName = 'InstalledConnectorCard';
