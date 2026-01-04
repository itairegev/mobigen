/**
 * BuildHistoryList Component
 * Displays a list of past builds with filtering and pagination
 */

import React from 'react';
import { BuildHistoryListProps, BUILD_STATUS_CONFIG, BuildStatus, BuildPlatform } from './types';
import { formatDistanceToNow, formatDate } from '../utils/date';
import { formatBytes, formatBuildId } from '../utils/format';

export const BuildHistoryList: React.FC<BuildHistoryListProps> = ({
  builds,
  filters,
  onFilterChange,
  onBuildClick,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  className = '',
}) => {
  const getStatusIcon = (status: BuildStatus) => {
    const config = BUILD_STATUS_CONFIG[status];
    const iconClass = 'w-5 h-5';

    switch (config.icon) {
      case 'check':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'x':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cog':
      case 'spinner':
        return (
          <svg className={`${iconClass} animate-spin`} fill="none" viewBox="0 0 24 24">
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
        );
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Filters */}
      {onFilterChange && (
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={filters?.platform || 'all'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                platform: e.target.value === 'all' ? undefined : (e.target.value as BuildPlatform),
              })
            }
            className="
              px-3 py-2 text-sm
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
          >
            <option value="all">All Platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>

          <select
            value={filters?.status || 'all'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value === 'all' ? undefined : (e.target.value as BuildStatus),
              })
            }
            className="
              px-3 py-2 text-sm
              border border-gray-300 dark:border-gray-600
              rounded-md
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
          >
            <option value="all">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="building">Building</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Build List */}
      <div className="space-y-3">
        {builds.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No builds</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first build.
            </p>
          </div>
        )}

        {builds.map((build) => {
          const statusConfig = BUILD_STATUS_CONFIG[build.status];
          const iconColorClass =
            statusConfig.color === 'green'
              ? 'text-green-600 dark:text-green-400'
              : statusConfig.color === 'red'
              ? 'text-red-600 dark:text-red-400'
              : statusConfig.color === 'blue'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400';

          return (
            <div
              key={build.id}
              onClick={() => onBuildClick?.(build)}
              className={`
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-lg p-4
                hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
                transition-all duration-150
                ${onBuildClick ? 'cursor-pointer' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Status Icon */}
                  <div className={iconColorClass}>{getStatusIcon(build.status)}</div>

                  {/* Build Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {build.platform === 'ios' ? 'iOS' : 'Android'} v{build.version}
                      </h4>
                      <span
                        className={`
                          inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${
                            statusConfig.color === 'green'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : ''
                          }
                          ${
                            statusConfig.color === 'blue'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : ''
                          }
                          ${
                            statusConfig.color === 'red'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : ''
                          }
                          ${
                            statusConfig.color === 'gray'
                              ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              : ''
                          }
                        `}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>#{formatBuildId(build.id)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(build.createdAt)} ago</span>
                      {build.artifactSizeBytes && (
                        <>
                          <span>•</span>
                          <span>{formatBytes(Number(build.artifactSizeBytes))}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow Icon */}
                {onBuildClick && (
                  <svg
                    className="w-5 h-5 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Error Summary (for failed builds) */}
              {build.status === 'failed' && build.errorSummary && (
                <div className="mt-3 text-xs text-red-600 dark:text-red-400 truncate">
                  {build.errorSummary}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500" />
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && !isLoading && (
        <button
          onClick={onLoadMore}
          className="
            mt-4 w-full py-2 px-4
            text-sm font-medium
            text-blue-700 dark:text-blue-400
            hover:text-blue-800 dark:hover:text-blue-300
            bg-blue-50 dark:bg-blue-900/20
            hover:bg-blue-100 dark:hover:bg-blue-900/30
            rounded-md
            transition-colors duration-150
          "
        >
          Load More
        </button>
      )}
    </div>
  );
};
