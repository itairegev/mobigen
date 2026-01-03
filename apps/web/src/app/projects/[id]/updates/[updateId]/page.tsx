'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChannelBadge,
  VersionBadge,
  RolloutProgress,
  UpdateActions,
} from '@/components/updates';

// Mock data - in production this would come from API
const MOCK_UPDATE_DETAIL = {
  id: 'update-1',
  version: '1.2.3',
  channel: 'production' as const,
  status: 'active' as const,
  message: 'Fix critical payment processing bug',
  description: `This update addresses a critical issue in the payment processing flow that was causing some transactions to fail silently. The fix ensures all payment attempts are properly logged and users receive appropriate feedback.

Changes included:
- Fixed race condition in payment confirmation
- Improved error handling for network timeouts
- Added retry logic for failed transactions
- Enhanced logging for debugging`,
  publishedAt: new Date('2024-01-03T14:30:00'),
  publishedBy: 'john@example.com',
  rolloutPercentage: 75,
  rolloutStrategy: 'gradual',
  downloads: 12543,
  errorRate: 0.8,
  crashRate: 0.02,
  totalErrors: 100,
  totalCrashes: 3,
  averageDownloadTime: 4.2,
  platforms: {
    ios: {
      downloads: 7821,
      errorRate: 0.6,
    },
    android: {
      downloads: 4722,
      errorRate: 1.2,
    },
  },
};

// Mock download stats over time
const DOWNLOAD_STATS = [
  { time: '14:30', downloads: 1200 },
  { time: '15:00', downloads: 2300 },
  { time: '15:30', downloads: 3100 },
  { time: '16:00', downloads: 4500 },
  { time: '16:30', downloads: 5800 },
  { time: '17:00', downloads: 7200 },
  { time: '17:30', downloads: 8900 },
  { time: '18:00', downloads: 10400 },
  { time: '18:30', downloads: 11800 },
  { time: '19:00', downloads: 12543 },
];

// Mock error stats
const ERROR_STATS = [
  { time: '14:30', errors: 8 },
  { time: '15:00', errors: 12 },
  { time: '15:30', errors: 9 },
  { time: '16:00', errors: 15 },
  { time: '16:30', errors: 11 },
  { time: '17:00', errors: 13 },
  { time: '17:30', errors: 7 },
  { time: '18:00', errors: 10 },
  { time: '18:30', errors: 8 },
  { time: '19:00', errors: 7 },
];

export default function UpdateDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const updateId = params.updateId as string;

  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);

  const update = MOCK_UPDATE_DETAIL; // In production, fetch by updateId

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const maxDownloads = Math.max(...DOWNLOAD_STATS.map((s) => s.downloads));
  const maxErrors = Math.max(...ERROR_STATS.map((s) => s.errors));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <Link
                  href={`/projects/${projectId}/updates`}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  ← All Updates
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Update Details
                </h1>
                <VersionBadge version={update.version} size="lg" />
                <ChannelBadge channel={update.channel} />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{update.message}</p>
              <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                <span>Published {formatDate(update.publishedAt)}</span>
                <span>•</span>
                <span>By {update.publishedBy}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rollout Progress */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Rollout Progress
              </h2>
              <RolloutProgress
                percentage={update.rolloutPercentage}
                status={update.status}
              />
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Strategy</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                    {update.rolloutStrategy}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Target</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    100% (All users)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Avg Download Time
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {update.averageDownloadTime}s
                  </div>
                </div>
              </div>
            </div>

            {/* Download Statistics Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Downloads Over Time
              </h2>
              <div className="h-64 flex items-end gap-2">
                {DOWNLOAD_STATS.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{
                        height: `${(stat.downloads / maxDownloads) * 100}%`,
                        minHeight: '4px',
                      }}
                      title={`${stat.downloads} downloads`}
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400 rotate-45 origin-left whitespace-nowrap">
                      {stat.time}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total Downloads:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {update.downloads.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Error Rate Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Error Tracking
              </h2>
              <div className="h-64 flex items-end gap-2">
                {ERROR_STATS.map((stat, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-t transition-all ${
                        stat.errors > 12
                          ? 'bg-red-500 hover:bg-red-600'
                          : stat.errors > 8
                          ? 'bg-yellow-500 hover:bg-yellow-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                      style={{
                        height: `${(stat.errors / maxErrors) * 100}%`,
                        minHeight: '4px',
                      }}
                      title={`${stat.errors} errors`}
                    />
                    <div className="text-xs text-slate-500 dark:text-slate-400 rotate-45 origin-left whitespace-nowrap">
                      {stat.time}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Error Rate
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {update.errorRate}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Total Errors
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {update.totalErrors}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                    Crash Rate
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {update.crashRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Update Description
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {update.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Actions</h3>
              <div className="space-y-3">
                {update.status === 'active' && (
                  <>
                    <button className="w-full px-4 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors">
                      Pause Rollout
                    </button>
                    <button
                      onClick={() => setShowRollbackConfirm(true)}
                      className="w-full px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      Rollback Update
                    </button>
                  </>
                )}
                <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                  View Error Logs
                </button>
                <button className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                  Download Report
                </button>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                Platform Breakdown
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl"></span>
                      <span className="font-medium text-slate-900 dark:text-white">iOS</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {update.platforms.ios.downloads.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Error rate: {update.platforms.ios.errorRate}%
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🤖</span>
                      <span className="font-medium text-slate-900 dark:text-white">Android</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {update.platforms.android.downloads.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Error rate: {update.platforms.android.errorRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Update Info */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Update Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Update ID</span>
                  <span className="font-mono text-slate-900 dark:text-white text-xs">
                    {update.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Status</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {update.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Channel</span>
                  <ChannelBadge channel={update.channel} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Published By</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {update.publishedBy}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Rollback Confirmation Modal */}
      {showRollbackConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Confirm Rollback
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Are you sure you want to rollback version {update.version}? This will revert all
                users to the previous version and cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRollbackConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Rollback confirmed');
                    setShowRollbackConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Rollback Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
