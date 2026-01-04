/**
 * BuildStatusCard Component
 * Displays a single build's current status with progress information
 */

import React from 'react';
import { Build, BuildStatusCardProps, BUILD_STATUS_CONFIG } from './types';
import { formatDistanceToNow } from '../utils/date';
import { formatBytes } from '../utils/format';

export const BuildStatusCard: React.FC<BuildStatusCardProps> = ({
  build,
  onViewDetails,
  onCancel,
  className = '',
}) => {
  const statusConfig = BUILD_STATUS_CONFIG[build.status];
  const isInProgress = ['queued', 'building', 'uploading', 'processing'].includes(build.status);
  const canCancel = isInProgress && onCancel;

  const getDuration = () => {
    if (!build.startedAt) return null;

    const end = build.completedAt || new Date();
    const start = new Date(build.startedAt);
    const durationMs = end.getTime() - start.getTime();
    const durationSec = Math.floor(durationMs / 1000);

    if (durationSec < 60) return `${durationSec}s`;
    const durationMin = Math.floor(durationSec / 60);
    if (durationMin < 60) return `${durationMin}m`;
    const durationHr = Math.floor(durationMin / 60);
    return `${durationHr}h ${durationMin % 60}m`;
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800
        rounded-lg border border-gray-200 dark:border-gray-700
        p-4 sm:p-6
        shadow-sm hover:shadow-md
        transition-shadow duration-200
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* Platform Icon */}
          <div className="flex-shrink-0">
            {build.platform === 'ios' ? (
              <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.523 15.34c-.027-.225-.043-.466-.043-.718 0-1.545.943-2.97 2.32-3.658-.52-.763-1.353-1.265-2.32-1.325-.98-.085-1.92.587-2.415.587-.48 0-1.23-.57-2.024-.554-1.044.016-2.008.616-2.547 1.563-1.088 1.898-.278 4.71.78 6.255.52.757 1.143 1.608 1.962 1.578.784-.03 1.08-.507 2.027-.507.946 0 1.214.477 2.027.462.836-.015 1.387-.763 1.906-1.523.6-.88.848-1.73.864-1.773-.02-.008-1.657-.64-1.677-2.535M15.09 7.24c.43-.523.72-1.248.64-1.97-.62.025-1.37.414-1.816.933-.4.463-.75 1.204-.655 1.916.693.054 1.402-.354 1.83-.88z"/>
              </svg>
            )}
          </div>

          {/* Build Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {build.platform === 'ios' ? 'iOS' : 'Android'} Build
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Version {build.version} • Build #{build.id.slice(0, 8)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${statusConfig.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
              ${statusConfig.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
              ${statusConfig.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}
              ${statusConfig.color === 'gray' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : ''}
            `}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Progress Bar (for in-progress builds) */}
      {isInProgress && build.progress !== undefined && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {build.currentStage ? build.currentStage.charAt(0).toUpperCase() + build.currentStage.slice(1) : 'Processing'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(build.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${build.progress}%` }}
            />
          </div>
          {build.estimatedTimeRemaining && build.estimatedTimeRemaining > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Estimated time remaining: {Math.ceil(build.estimatedTimeRemaining / 60)} minutes
            </p>
          )}
        </div>
      )}

      {/* Queue Position (for queued builds) */}
      {build.status === 'queued' && build.queuePosition !== undefined && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Position in queue: <span className="font-semibold">#{build.queuePosition}</span>
          </p>
        </div>
      )}

      {/* Error Summary (for failed builds) */}
      {build.status === 'failed' && build.errorSummary && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Build Failed</p>
          <p className="text-sm text-red-700 dark:text-red-300">{build.errorSummary}</p>
        </div>
      )}

      {/* Build Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400">Created</p>
          <p className="font-medium text-gray-900 dark:text-white">
            {formatDistanceToNow(build.createdAt)} ago
          </p>
        </div>

        {build.completedAt && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Duration</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {getDuration()}
            </p>
          </div>
        )}

        {build.artifactSizeBytes && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">Size</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatBytes(Number(build.artifactSizeBytes))}
            </p>
          </div>
        )}

        {build.easBuildId && (
          <div>
            <p className="text-gray-500 dark:text-gray-400">EAS Build ID</p>
            <p className="font-mono text-xs text-gray-900 dark:text-white truncate">
              {build.easBuildId}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {canCancel && (
          <button
            onClick={() => onCancel(build.id)}
            className="
              px-4 py-2 text-sm font-medium
              text-red-700 dark:text-red-400
              hover:text-red-800 dark:hover:text-red-300
              hover:bg-red-50 dark:hover:bg-red-900/20
              rounded-md
              transition-colors duration-150
            "
          >
            Cancel Build
          </button>
        )}

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(build.id)}
            className="
              px-4 py-2 text-sm font-medium
              text-blue-700 dark:text-blue-400
              hover:text-blue-800 dark:hover:text-blue-300
              hover:bg-blue-50 dark:hover:bg-blue-900/20
              rounded-md
              transition-colors duration-150
            "
          >
            View Details
          </button>
        )}

        {build.status === 'ready' && build.artifactS3Key && (
          <button
            className="
              px-4 py-2 text-sm font-medium
              text-white bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-600
              rounded-md
              transition-colors duration-150
            "
          >
            Download
          </button>
        )}
      </div>
    </div>
  );
};
