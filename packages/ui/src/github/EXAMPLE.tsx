/**
 * Complete Example: GitHub Sync Dashboard
 *
 * This file demonstrates how to use all GitHub sync UI components together
 * in a real-world dashboard scenario.
 *
 * To use this example:
 * 1. Implement the API endpoints in your backend
 * 2. Update the hooks in hooks.ts with real API calls
 * 3. Copy this component to your dashboard app
 * 4. Customize styling as needed
 */

import * as React from 'react';
import {
  GitHubConnectionCard,
  SyncStatusIndicator,
  LastSyncInfo,
  SyncHistoryList,
  ConnectGitHubButton,
  SyncActionsMenu,
  useGitHubConnection,
  useSyncStatus,
  useSyncHistory,
  useGitHubOAuth,
  useRealtimeSyncStatus,
  type SyncAction,
} from './index';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
import { Badge } from '../components/Badge';

interface GitHubSyncDashboardProps {
  projectId: string;
  userId: string;
}

/**
 * Main GitHub Sync Dashboard Component
 *
 * Displays complete GitHub integration status and controls
 */
export function GitHubSyncDashboard({ projectId, userId }: GitHubSyncDashboardProps) {
  // Fetch GitHub connection status
  const {
    data: connection,
    isLoading: connectionLoading,
    refetch: refetchConnection,
  } = useGitHubConnection({ userId, enabled: true });

  // Fetch project sync configuration (poll every 5 seconds when syncing)
  const {
    data: syncConfig,
    isLoading: syncLoading,
    refetch: refetchSync,
  } = useSyncStatus({
    projectId,
    enabled: !!connection,
    refetchInterval: syncConfig?.syncStatus === 'syncing' ? 5000 : undefined,
  });

  // Fetch sync history
  const {
    data: history,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useSyncHistory({
    projectId,
    enabled: !!connection && !!syncConfig,
  });

  // OAuth flow management
  const { isLoading: oauthLoading, startOAuth } = useGitHubOAuth();

  // Real-time status for optimistic UI updates
  const { status: realtimeStatus, updateStatus } = useRealtimeSyncStatus(
    syncConfig?.syncStatus || 'disconnected'
  );

  // Handle connecting GitHub
  const handleConnect = async () => {
    try {
      const authUrl = await startOAuth({ userId, projectId });
      // Redirect to GitHub OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to start OAuth:', error);
      // Show error toast/notification
    }
  };

  // Handle disconnecting GitHub
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? This will stop automatic syncing.')) {
      return;
    }

    try {
      // Call your disconnect API
      await fetch('/api/github/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      // Refresh connection status
      await refetchConnection();
      await refetchSync();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      // Show error toast/notification
    }
  };

  // Handle sync actions (push, pull, configure, disconnect)
  const handleSyncAction = async (action: SyncAction) => {
    try {
      switch (action) {
        case 'push':
          updateStatus('syncing');
          await fetch(`/api/projects/${projectId}/github/push`, {
            method: 'POST',
          });
          updateStatus('synced');
          await refetchSync();
          await refetchHistory();
          break;

        case 'pull':
          updateStatus('syncing');
          await fetch(`/api/projects/${projectId}/github/pull`, {
            method: 'POST',
          });
          updateStatus('synced');
          await refetchSync();
          break;

        case 'configure':
          // Navigate to settings page or open modal
          window.location.href = `/projects/${projectId}/settings/github`;
          break;

        case 'disconnect':
          await handleDisconnect();
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      updateStatus('failed');
      // Show error toast/notification
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GitHub Integration</h1>
          <p className="text-gray-600 mt-1">
            Manage version control and automatic syncing for your project
          </p>
        </div>
        {connection && syncConfig && (
          <SyncStatusIndicator status={realtimeStatus} size="lg" />
        )}
      </div>

      {/* Connection Card */}
      <GitHubConnectionCard
        connection={connection}
        isLoading={connectionLoading || oauthLoading}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {/* Sync Dashboard (only shown when connected) */}
      {connection && syncConfig && (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">
              History
              {history && history.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {history.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Repository Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Repository</p>
                    <a
                      href={syncConfig.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {syncConfig.repoOwner}/{syncConfig.repoName}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Default Branch</p>
                    <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {syncConfig.defaultBranch}
                    </code>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <LastSyncInfo
                    lastSyncAt={syncConfig.lastSyncAt}
                    commitSha={syncConfig.lastCommitSha}
                    branch={syncConfig.currentBranch}
                    repoUrl={syncConfig.repoUrl}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <SyncActionsMenu
                  onAction={handleSyncAction}
                  syncEnabled={syncConfig.syncEnabled}
                  autoCommit={syncConfig.autoCommit}
                  orientation="horizontal"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <SyncHistoryList
                  entries={history?.slice(0, 5) || []}
                  isLoading={historyLoading}
                  maxEntries={5}
                  repoUrl={syncConfig.repoUrl}
                  emptyMessage="No sync operations yet. Push your first changes to get started."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <SyncHistoryList
                  entries={history || []}
                  isLoading={historyLoading}
                  maxEntries={50}
                  repoUrl={syncConfig.repoUrl}
                  onEntryClick={(entry) => {
                    // Could open a details modal
                    console.log('View details:', entry);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Automatic Sync</p>
                      <p className="text-sm text-gray-600">
                        Automatically sync changes to GitHub
                      </p>
                    </div>
                    <Badge variant={syncConfig.syncEnabled ? 'success' : 'default'}>
                      {syncConfig.syncEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-commit</p>
                      <p className="text-sm text-gray-600">
                        Commit changes after each generation phase
                      </p>
                    </div>
                    <Badge variant={syncConfig.autoCommit ? 'success' : 'default'}>
                      {syncConfig.autoCommit ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-push</p>
                      <p className="text-sm text-gray-600">
                        Push commits to GitHub automatically
                      </p>
                    </div>
                    <Badge variant={syncConfig.autoPush ? 'success' : 'default'}>
                      {syncConfig.autoPush ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Current Branch</p>
                  <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {syncConfig.currentBranch}
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* No Connection State */}
      {!connection && !connectionLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect GitHub to Get Started
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Link your GitHub account to enable automatic version control and collaboration
              features for your Mobigen project.
            </p>
            <ConnectGitHubButton
              onConnect={handleConnect}
              isLoading={oauthLoading}
              size="lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Minimal Example - Just the connection card
 */
export function MinimalGitHubPanel({ userId }: { userId: string }) {
  const { data: connection } = useGitHubConnection({ userId });
  const { startOAuth } = useGitHubOAuth();

  return (
    <GitHubConnectionCard
      connection={connection}
      onConnect={async () => {
        const authUrl = await startOAuth({ userId });
        window.location.href = authUrl;
      }}
      onDisconnect={async () => {
        await fetch('/api/github/disconnect', { method: 'POST' });
      }}
    />
  );
}

/**
 * Project Header - Show sync status in header
 */
export function ProjectHeaderWithSync({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const { data: syncConfig } = useSyncStatus({ projectId, refetchInterval: 5000 });

  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{projectName}</h1>
      {syncConfig && (
        <div className="flex items-center gap-3">
          <SyncStatusIndicator status={syncConfig.syncStatus} size="sm" />
          {syncConfig.lastSyncAt && (
            <LastSyncInfo
              lastSyncAt={syncConfig.lastSyncAt}
              commitSha={syncConfig.lastCommitSha}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
}
