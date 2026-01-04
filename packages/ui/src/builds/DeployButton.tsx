/**
 * DeployButton Component
 * Trigger new TestFlight/Play Store deployment builds
 */

import React, { useState } from 'react';
import { DeployButtonProps } from './types';

export const DeployButton: React.FC<DeployButtonProps> = ({
  projectId,
  platform,
  disabled = false,
  options,
  onDeployStart,
  onDeployError,
  className = '',
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleDeploy = async () => {
    try {
      setIsDeploying(true);

      // Simulated API call - replace with actual implementation
      const response = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          ...options,
        }),
      });

      if (!response.ok) {
        throw new Error('Deployment failed');
      }

      const data = await response.json();
      onDeployStart?.(data.buildId);
      setShowOptions(false);
    } catch (error) {
      onDeployError?.(error as Error);
    } finally {
      setIsDeploying(false);
    }
  };

  const platformLabel = platform === 'ios' ? 'iOS' : 'Android';
  const storeLabel = platform === 'ios' ? 'TestFlight' : 'Play Store';

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || isDeploying}
        className={`
          inline-flex items-center px-4 py-2
          text-sm font-medium text-white
          bg-blue-600 hover:bg-blue-700
          dark:bg-blue-500 dark:hover:bg-blue-600
          rounded-md
          transition-colors duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isDeploying ? 'cursor-wait' : ''}
        `}
      >
        {isDeploying ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            Deploying...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                clipRule="evenodd"
              />
            </svg>
            Deploy to {storeLabel}
          </>
        )}
      </button>

      {/* Options Dropdown */}
      {showOptions && !isDeploying && (
        <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Deploy {platformLabel} Build
            </h3>

            <div className="space-y-3">
              <div>
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    defaultChecked={options?.autoIncrement ?? true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  Auto-increment version
                </label>
              </div>

              {platform === 'ios' && (
                <div>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      defaultChecked={options?.submitToTestFlight ?? true}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    Submit to TestFlight
                  </label>
                </div>
              )}

              {platform === 'android' && (
                <div>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      defaultChecked={options?.submitToPlayStore ?? false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    Submit to Play Store (internal testing)
                  </label>
                </div>
              )}
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleDeploy}
                className="
                  flex-1 px-3 py-2 text-sm font-medium
                  text-white bg-blue-600 hover:bg-blue-700
                  dark:bg-blue-500 dark:hover:bg-blue-600
                  rounded-md transition-colors
                "
              >
                Start Deployment
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="
                  px-3 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  rounded-md transition-colors
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
