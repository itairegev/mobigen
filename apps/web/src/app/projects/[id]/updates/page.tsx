'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { UpdateCard, ChannelBadge, VersionBadge } from '@/components/updates';

// Mock data - in production this would come from API
const MOCK_UPDATES = [
  {
    id: 'update-1',
    version: '1.2.3',
    channel: 'production' as const,
    status: 'active' as const,
    message: 'Fix critical payment processing bug',
    publishedAt: new Date('2024-01-03T14:30:00'),
    rolloutPercentage: 75,
    downloads: 12543,
    errorRate: 0.8,
  },
  {
    id: 'update-2',
    version: '1.2.2',
    channel: 'production' as const,
    status: 'completed' as const,
    message: 'Add dark mode support and improve performance',
    publishedAt: new Date('2024-01-02T10:15:00'),
    rolloutPercentage: 100,
    downloads: 28901,
    errorRate: 1.2,
  },
  {
    id: 'update-3',
    version: '1.2.4',
    channel: 'staging' as const,
    status: 'active' as const,
    message: 'New feature: User profiles and avatar upload',
    publishedAt: new Date('2024-01-03T16:00:00'),
    rolloutPercentage: 50,
    downloads: 234,
    errorRate: 2.1,
  },
  {
    id: 'update-4',
    version: '1.2.1',
    channel: 'production' as const,
    status: 'superseded' as const,
    message: 'Minor bug fixes and UI improvements',
    publishedAt: new Date('2024-01-01T08:00:00'),
    rolloutPercentage: 100,
    downloads: 18234,
    errorRate: 1.5,
  },
  {
    id: 'update-5',
    version: '1.2.0',
    channel: 'production' as const,
    status: 'rolled-back' as const,
    message: 'Major feature release - rolled back due to high error rate',
    publishedAt: new Date('2023-12-30T12:00:00'),
    rolloutPercentage: 30,
    downloads: 5432,
    errorRate: 8.7,
  },
  {
    id: 'update-6',
    version: '1.2.5',
    channel: 'development' as const,
    status: 'active' as const,
    message: 'Testing new analytics integration',
    publishedAt: new Date('2024-01-03T18:00:00'),
    rolloutPercentage: 100,
    downloads: 45,
    errorRate: 0.0,
  },
];

type Channel = 'all' | 'production' | 'staging' | 'development';

export default function UpdatesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [selectedChannel, setSelectedChannel] = useState<Channel>('all');

  // Filter updates by channel
  const filteredUpdates = useMemo(() => {
    if (selectedChannel === 'all') {
      return MOCK_UPDATES;
    }
    return MOCK_UPDATES.filter((update) => update.channel === selectedChannel);
  }, [selectedChannel]);

  // Get current version (latest completed production update)
  const currentVersion = useMemo(() => {
    const productionUpdates = MOCK_UPDATES.filter(
      (u) => u.channel === 'production' && (u.status === 'completed' || u.status === 'active')
    ).sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    return productionUpdates[0]?.version || '1.0.0';
  }, []);

  // Calculate channel stats
  const channelStats = useMemo(() => {
    const stats = {
      production: { total: 0, active: 0 },
      staging: { total: 0, active: 0 },
      development: { total: 0, active: 0 },
    };

    MOCK_UPDATES.forEach((update) => {
      stats[update.channel].total++;
      if (update.status === 'active' || update.status === 'paused') {
        stats[update.channel].active++;
      }
    });

    return stats;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Link
                  href={`/projects/${projectId}`}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  ← Back to Project
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                OTA Updates
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-slate-600 dark:text-slate-400">
                  Current Version:
                </p>
                <VersionBadge version={currentVersion} isCurrent={true} size="md" />
              </div>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <span>📤</span>
              <span>Publish Update</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Channel Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex gap-1 p-1">
              {(['all', 'production', 'staging', 'development'] as Channel[]).map((channel) => (
                <button
                  key={channel}
                  onClick={() => setSelectedChannel(channel)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedChannel === channel
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {channel !== 'all' && <ChannelBadge channel={channel as any} size="sm" />}
                    {channel === 'all' && <span className="capitalize">{channel}</span>}
                    {channel !== 'all' && (
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {channelStats[channel as keyof typeof channelStats].total}
                        {channelStats[channel as keyof typeof channelStats].active > 0 && (
                          <span className="text-blue-600 dark:text-blue-400 ml-1">
                            ({channelStats[channel as keyof typeof channelStats].active} active)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📦</span>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Updates</div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {MOCK_UPDATES.length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🚀</span>
              <div className="text-sm text-slate-600 dark:text-slate-400">Active Rollouts</div>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {MOCK_UPDATES.filter((u) => u.status === 'active').length}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📥</span>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Downloads</div>
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {MOCK_UPDATES.reduce((sum, u) => sum + u.downloads, 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Error Rate</div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {(
                MOCK_UPDATES.reduce((sum, u) => sum + u.errorRate, 0) / MOCK_UPDATES.length
              ).toFixed(2)}
              %
            </div>
          </div>
        </div>

        {/* Updates List */}
        <div className="space-y-4">
          {filteredUpdates.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                No updates found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                No updates for this channel yet. Publish your first update to get started.
              </p>
            </div>
          ) : (
            filteredUpdates.map((update) => (
              <UpdateCard
                key={update.id}
                update={update}
                isCurrent={update.version === currentVersion}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
