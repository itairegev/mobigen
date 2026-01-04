import * as React from 'react';
import { cn } from '../utils/cn';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import type { ConnectorCardProps } from './types';

/**
 * ConnectorCard - Individual connector display card
 *
 * Displays a connector with icon, name, description, category badge,
 * tier indicator, and install/configure buttons.
 *
 * @example
 * ```tsx
 * <ConnectorCard
 *   connector={stripeConnector}
 *   projectId="proj_123"
 *   isInstalled={false}
 *   onInstall={() => openModal()}
 * />
 * ```
 */
export const ConnectorCard = React.forwardRef<HTMLDivElement, ConnectorCardProps>(
  ({ connector, projectId, isInstalled, onInstall, onConfigure, ...props }, ref) => {
    const handleAction = () => {
      if (isInstalled && onConfigure) {
        onConfigure();
      } else if (!isInstalled && onInstall) {
        onInstall();
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
          'transition-all duration-200 hover:border-blue-300 hover:shadow-md',
          'dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-700'
        )}
        {...props}
      >
        {/* Tier Badge - Top Right */}
        {connector.tier !== 'free' && (
          <div className="absolute right-4 top-4">
            <Badge
              className={cn(
                connector.tier === 'pro' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                connector.tier === 'enterprise' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              )}
            >
              {connector.tier.toUpperCase()}
            </Badge>
          </div>
        )}

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              'bg-gradient-to-br from-gray-50 to-gray-100',
              'text-3xl transition-transform group-hover:scale-110',
              'dark:from-gray-800 dark:to-gray-700'
            )}
          >
            {connector.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
              {connector.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {connector.category.replace('_', ' ')}
              </Badge>
              {isInstalled && (
                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  ✓ Installed
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
          {connector.description}
        </p>

        {/* Platform Indicators */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 dark:text-gray-500">Platforms:</span>
          <div className="flex gap-1">
            {connector.platforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                {platform === 'ios' && '🍎'}
                {platform === 'android' && '🤖'}
                {platform === 'web' && '🌐'}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-2">
          {isInstalled ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleAction}
              >
                Configure
              </Button>
              {connector.docsUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(connector.docsUrl, '_blank', 'noopener,noreferrer');
                  }}
                  title="View Documentation"
                >
                  📚
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleAction}
              >
                Install
              </Button>
              {connector.docsUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(connector.docsUrl, '_blank', 'noopener,noreferrer');
                  }}
                  title="View Documentation"
                >
                  📚
                </Button>
              )}
            </>
          )}
        </div>

        {/* Provider Link */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <a
            href={connector.providerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Learn more about {connector.name} →
          </a>
        </div>
      </div>
    );
  }
);

ConnectorCard.displayName = 'ConnectorCard';
