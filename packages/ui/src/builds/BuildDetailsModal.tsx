/**
 * BuildDetailsModal Component
 * Detailed view of a build with logs, artifacts, timing, and validation errors
 */

import React, { useState } from 'react';
import { BuildDetailsModalProps, BUILD_STATUS_CONFIG } from './types';
import { formatDate, formatTime, formatDuration } from '../utils/date';
import { formatBytes } from '../utils/format';

export const BuildDetailsModal: React.FC<BuildDetailsModalProps> = ({
  build,
  isOpen,
  onClose,
  onDownloadArtifact,
  onViewLogs,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'validation' | 'timing'>('overview');

  if (!isOpen || !build) return null;

  const statusConfig = BUILD_STATUS_CONFIG[build.status];

  const getDuration = () => {
    if (!build.startedAt || !build.completedAt) return null;
    const start = new Date(build.startedAt);
    const end = new Date(build.completedAt);
    const durationMs = end.getTime() - start.getTime();
    return formatDuration(Math.floor(durationMs / 1000));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          fixed inset-0 z-50 overflow-y-auto
          flex items-center justify-center p-4
        `}
      >
        <div
          className={`
            relative bg-white dark:bg-gray-800
            rounded-lg shadow-xl
            max-w-4xl w-full
            max-h-[90vh] overflow-hidden
            flex flex-col
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {build.platform === 'ios' ? 'iOS' : 'Android'} Build Details
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Version {build.version} • Build #{build.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="
                  text-gray-400 hover:text-gray-500 dark:hover:text-gray-300
                  transition-colors
                "
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Status Badge */}
            <div className="mt-4">
              <span
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
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
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex px-6" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'validation', label: 'Validation' },
                { id: 'timing', label: 'Timing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`
                    px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Build Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Platform
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                      {build.platform === 'ios' ? 'iOS' : 'Android'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Version
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                      {build.version}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Build ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                      {build.id}
                    </p>
                  </div>

                  {build.easBuildId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        EAS Build ID
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                        {build.easBuildId}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(build.createdAt, 'long')}
                    </p>
                  </div>

                  {build.completedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Completed
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {formatDate(build.completedAt, 'long')}
                      </p>
                    </div>
                  )}

                  {build.artifactSizeBytes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Artifact Size
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                        {formatBytes(Number(build.artifactSizeBytes))}
                      </p>
                    </div>
                  )}

                  {getDuration() && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Duration
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                        {getDuration()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Summary (for failed builds) */}
                {build.status === 'failed' && build.errorSummary && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Build Error
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{build.errorSummary}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {build.status === 'ready' && build.artifactS3Key && onDownloadArtifact && (
                    <button
                      onClick={() => onDownloadArtifact(build.id)}
                      className="
                        px-4 py-2 text-sm font-medium
                        text-white bg-blue-600 hover:bg-blue-700
                        dark:bg-blue-500 dark:hover:bg-blue-600
                        rounded-md
                        transition-colors duration-150
                      "
                    >
                      Download Artifact
                    </button>
                  )}

                  {build.logsS3Key && onViewLogs && (
                    <button
                      onClick={() => onViewLogs(build.id)}
                      className="
                        px-4 py-2 text-sm font-medium
                        text-gray-700 dark:text-gray-300
                        bg-gray-100 dark:bg-gray-700
                        hover:bg-gray-200 dark:hover:bg-gray-600
                        rounded-md
                        transition-colors duration-150
                      "
                    >
                      View Logs
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Validation Tab */}
            {activeTab === 'validation' && (
              <div className="space-y-4">
                {build.validationPassed !== undefined && (
                  <div
                    className={`
                      p-4 rounded-lg border
                      ${
                        build.validationPassed
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      {build.validationPassed ? (
                        <svg
                          className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-600 dark:text-red-400 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span
                        className={`
                          text-sm font-medium
                          ${
                            build.validationPassed
                              ? 'text-green-800 dark:text-green-200'
                              : 'text-red-800 dark:text-red-200'
                          }
                        `}
                      >
                        {build.validationPassed
                          ? 'All validation checks passed'
                          : 'Validation failed'}
                      </span>
                    </div>
                  </div>
                )}

                {build.validationTier && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Validation Tier
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium uppercase">
                      {build.validationTier}
                    </p>
                  </div>
                )}

                {build.validationErrors && build.validationErrors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Validation Errors ({build.validationErrors.length})
                    </h4>
                    <div className="space-y-2">
                      {build.validationErrors.map((error, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start">
                            <span
                              className={`
                                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2
                                ${
                                  error.type === 'error'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }
                              `}
                            >
                              {error.type || 'error'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                {error.file}
                                {error.line && `:${error.line}`}
                              </p>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {error.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!build.validationErrors || build.validationErrors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No validation errors
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Timing Tab */}
            {activeTab === 'timing' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {build.createdAt && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Build Queued
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(build.createdAt)} at {formatTime(build.createdAt)}
                      </span>
                    </div>
                  )}

                  {build.startedAt && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Build Started
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(build.startedAt)} at {formatTime(build.startedAt)}
                      </span>
                    </div>
                  )}

                  {build.completedAt && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Build Completed
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(build.completedAt)} at {formatTime(build.completedAt)}
                      </span>
                    </div>
                  )}

                  {getDuration() && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Total Duration
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {getDuration()}
                      </span>
                    </div>
                  )}
                </div>

                {!build.startedAt && !build.completedAt && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Build timing information not available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="
                  px-4 py-2 text-sm font-medium
                  text-gray-700 dark:text-gray-300
                  hover:text-gray-900 dark:hover:text-white
                  bg-gray-100 dark:bg-gray-700
                  hover:bg-gray-200 dark:hover:bg-gray-600
                  rounded-md
                  transition-colors duration-150
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
