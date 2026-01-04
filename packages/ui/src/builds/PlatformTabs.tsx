/**
 * PlatformTabs Component
 * Switch between iOS and Android build views
 */

import React from 'react';
import { PlatformTabsProps } from './types';

export const PlatformTabs: React.FC<PlatformTabsProps> = ({
  selectedPlatform,
  onPlatformChange,
  iosBuildCount,
  androidBuildCount,
  className = '',
}) => {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Platform">
        {/* iOS Tab */}
        <button
          onClick={() => onPlatformChange('ios')}
          className={`
            group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
            transition-colors duration-150
            ${
              selectedPlatform === 'ios'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `}
        >
          {/* iOS Icon */}
          <svg
            className={`
              -ml-0.5 mr-2 h-5 w-5
              ${
                selectedPlatform === 'ios'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
              }
            `}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>

          <span>iOS</span>

          {iosBuildCount !== undefined && iosBuildCount > 0 && (
            <span
              className={`
                ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                ${
                  selectedPlatform === 'ios'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }
              `}
            >
              {iosBuildCount}
            </span>
          )}
        </button>

        {/* Android Tab */}
        <button
          onClick={() => onPlatformChange('android')}
          className={`
            group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
            transition-colors duration-150
            ${
              selectedPlatform === 'android'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }
          `}
        >
          {/* Android Icon */}
          <svg
            className={`
              -ml-0.5 mr-2 h-5 w-5
              ${
                selectedPlatform === 'android'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
              }
            `}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.523 15.34c-.027-.225-.043-.466-.043-.718 0-1.545.943-2.97 2.32-3.658-.52-.763-1.353-1.265-2.32-1.325-.98-.085-1.92.587-2.415.587-.48 0-1.23-.57-2.024-.554-1.044.016-2.008.616-2.547 1.563-1.088 1.898-.278 4.71.78 6.255.52.757 1.143 1.608 1.962 1.578.784-.03 1.08-.507 2.027-.507.946 0 1.214.477 2.027.462.836-.015 1.387-.763 1.906-1.523.6-.88.848-1.73.864-1.773-.02-.008-1.657-.64-1.677-2.535M15.09 7.24c.43-.523.72-1.248.64-1.97-.62.025-1.37.414-1.816.933-.4.463-.75 1.204-.655 1.916.693.054 1.402-.354 1.83-.88z" />
          </svg>

          <span>Android</span>

          {androidBuildCount !== undefined && androidBuildCount > 0 && (
            <span
              className={`
                ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                ${
                  selectedPlatform === 'android'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }
              `}
            >
              {androidBuildCount}
            </span>
          )}
        </button>
      </nav>
    </div>
  );
};
