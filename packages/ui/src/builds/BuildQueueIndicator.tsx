/**
 * BuildQueueIndicator Component
 * Shows position in build queue and estimated wait time
 */

import React from 'react';
import { BuildQueueIndicatorProps } from './types';
import { formatDuration } from '../utils/date';

export const BuildQueueIndicator: React.FC<BuildQueueIndicatorProps> = ({
  queueInfo,
  buildId,
  className = '',
}) => {
  const { position, totalInQueue, estimatedWaitTime } = queueInfo;

  return (
    <div
      className={`
        bg-blue-50 dark:bg-blue-900/20
        border border-blue-200 dark:border-blue-800
        rounded-lg p-4
        ${className}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Build Queued
          </h3>

          <div className="mt-2 text-sm text-blue-800 dark:text-blue-300">
            <div className="flex items-center justify-between mb-2">
              <span>Position in queue:</span>
              <span className="font-semibold">
                #{position} of {totalInQueue}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Estimated wait:</span>
              <span className="font-semibold">{formatDuration(estimatedWaitTime)}</span>
            </div>
          </div>

          {/* Visual Queue Progress */}
          <div className="mt-3">
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalInQueue, 10) }).map((_, index) => (
                <div
                  key={index}
                  className={`
                    h-2 flex-1 rounded-full
                    ${
                      index < position - 1
                        ? 'bg-blue-300 dark:bg-blue-600'
                        : index === position - 1
                        ? 'bg-blue-600 dark:bg-blue-400 animate-pulse'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }
                  `}
                  title={
                    index === position - 1
                      ? 'Your build'
                      : index < position - 1
                      ? 'Completed'
                      : 'Waiting'
                  }
                />
              ))}
              {totalInQueue > 10 && (
                <span className="text-xs text-blue-700 dark:text-blue-300 ml-1">
                  +{totalInQueue - 10}
                </span>
              )}
            </div>
          </div>

          {buildId && (
            <p className="mt-2 text-xs text-blue-700 dark:text-blue-400 font-mono">
              Build ID: {buildId.slice(0, 8)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
