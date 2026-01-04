import * as React from 'react';
import { cn } from '../utils/cn';
import { Input } from '../components/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import { Spinner } from '../components/Spinner';
import { ConnectorCard } from './ConnectorCard';
import { useConnectors } from './hooks';
import type { ConnectorListProps, ConnectorCategory } from './types';

/**
 * ConnectorList - Browse and filter available connectors
 *
 * Displays a grid of connector cards with category filtering,
 * search functionality, and loading/empty states.
 *
 * @example
 * ```tsx
 * <ConnectorList
 *   projectId="proj_123"
 *   category="payments"
 *   onConnectorSelect={(id) => openInstallModal(id)}
 * />
 * ```
 */
export const ConnectorList = React.forwardRef<HTMLDivElement, ConnectorListProps>(
  ({ projectId, category, tier, searchQuery: initialSearchQuery, onConnectorSelect, ...props }, ref) => {
    const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery || '');
    const [selectedCategory, setSelectedCategory] = React.useState<ConnectorCategory | 'all'>(
      category || 'all'
    );

    const { data: connectors, isLoading, error } = useConnectors({
      projectId,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      tier,
      search: searchQuery || undefined,
    });

    const categories: Array<{ value: ConnectorCategory | 'all'; label: string; icon: string }> = [
      { value: 'all', label: 'All', icon: '🔌' },
      { value: 'payments', label: 'Payments', icon: '💳' },
      { value: 'database', label: 'Database', icon: '🗄️' },
      { value: 'authentication', label: 'Auth', icon: '🔐' },
      { value: 'push_notifications', label: 'Push', icon: '🔔' },
      { value: 'in_app_purchases', label: 'IAP', icon: '💰' },
      { value: 'analytics', label: 'Analytics', icon: '📊' },
      { value: 'storage', label: 'Storage', icon: '📦' },
      { value: 'ai', label: 'AI', icon: '🤖' },
      { value: 'other', label: 'Other', icon: '⚙️' },
    ];

    const installedConnectorIds = new Set(
      connectors?.filter((c) => c.isInstalled).map((c) => c.metadata.id) || []
    );

    return (
      <div ref={ref} className="space-y-6" {...props}>
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Connectors</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add third-party services to your app with one click
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="search"
            placeholder="Search connectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as ConnectorCategory | 'all')}
        >
          <TabsList className="w-full flex-wrap h-auto gap-2 bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border',
                  'data-[state=active]:bg-blue-50 data-[state=active]:border-blue-300 data-[state=active]:text-blue-700',
                  'dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:border-blue-700 dark:data-[state=active]:text-blue-300'
                )}
              >
                <span>{cat.icon}</span>
                <span className="text-sm font-medium">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.value} value={cat.value} className="mt-6">
              {/* Content rendered below */}
            </TabsContent>
          ))}
        </Tabs>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Spinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400">Loading connectors...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  Failed to load connectors
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Results */}
        {!isLoading && !error && connectors && connectors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-6xl">🔍</div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                No connectors found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery
                  ? `No connectors match "${searchQuery}"`
                  : 'No connectors available in this category'}
              </p>
            </div>
          </div>
        )}

        {/* Connector Grid */}
        {!isLoading && !error && connectors && connectors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map((connector) => (
              <ConnectorCard
                key={connector.metadata.id}
                connector={connector.metadata}
                projectId={projectId}
                isInstalled={installedConnectorIds.has(connector.metadata.id)}
                onInstall={() => onConnectorSelect?.(connector.metadata.id)}
                onConfigure={() => onConnectorSelect?.(connector.metadata.id)}
              />
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && !error && connectors && connectors.length > 0 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800">
            Showing {connectors.length} connector{connectors.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        )}
      </div>
    );
  }
);

ConnectorList.displayName = 'ConnectorList';
