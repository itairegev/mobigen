/**
 * BuildProgressBar Component
 * Visual progress indicator showing build stages and completion percentage
 */

import React from 'react';
import { BuildProgressBarProps, BUILD_STAGES, BuildStage } from './types';

export const BuildProgressBar: React.FC<BuildProgressBarProps> = ({
  build,
  showStages = true,
  showPercentage = true,
  className = '',
}) => {
  const stages: BuildStage[] = ['queued', 'building', 'uploading', 'processing', 'ready'];

  const getCurrentStageIndex = (): number => {
    if (!build.currentStage) return 0;
    return BUILD_STAGES[build.currentStage].order;
  };

  const getStageProgress = (stageIndex: number): number => {
    const currentIndex = getCurrentStageIndex();
    if (stageIndex < currentIndex) return 100;
    if (stageIndex > currentIndex) return 0;
    return build.progress || 0;
  };

  const isStageActive = (stageIndex: number): boolean => {
    return getCurrentStageIndex() === stageIndex;
  };

  const isStageCompleted = (stageIndex: number): boolean => {
    return getCurrentStageIndex() > stageIndex;
  };

  if (!showStages) {
    // Simple progress bar
    return (
      <div className={`w-full ${className}`}>
        {showPercentage && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {build.currentStage
                ? BUILD_STAGES[build.currentStage].label
                : 'Processing'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(build.progress || 0)}%
            </span>
          </div>
        )}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${build.progress || 0}%` }}
          />
        </div>
      </div>
    );
  }

  // Detailed stage progress
  return (
    <div className={`w-full ${className}`}>
      {/* Overall Progress */}
      {showPercentage && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Build Progress
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {Math.round(build.progress || 0)}%
          </span>
        </div>
      )}

      {/* Stage Timeline */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-blue-600 dark:bg-blue-500 transition-all duration-500"
          style={{
            width: `${(getCurrentStageIndex() / (stages.length - 1)) * 100}%`,
          }}
        />

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const config = BUILD_STAGES[stage];
            const isActive = isStageActive(index);
            const isCompleted = isStageCompleted(index);
            const progress = getStageProgress(index);

            return (
              <div
                key={stage}
                className="flex flex-col items-center"
                style={{ width: `${100 / stages.length}%` }}
              >
                {/* Stage Icon */}
                <div
                  className={`
                    relative z-10 flex items-center justify-center
                    w-8 h-8 rounded-full border-2
                    transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
                        : isActive
                        ? 'bg-white dark:bg-gray-800 border-blue-600 dark:border-blue-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : isActive ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin"
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
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                  )}
                </div>

                {/* Stage Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`
                      text-xs font-medium
                      ${
                        isActive || isCompleted
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                  >
                    {config.label}
                  </p>
                  {isActive && progress > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {Math.round(progress)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Description */}
      {build.currentStage && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {BUILD_STAGES[build.currentStage].description}
          </p>
          {build.estimatedTimeRemaining && build.estimatedTimeRemaining > 0 && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Estimated time remaining: {Math.ceil(build.estimatedTimeRemaining / 60)}{' '}
              {Math.ceil(build.estimatedTimeRemaining / 60) === 1 ? 'minute' : 'minutes'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
