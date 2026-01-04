# GitHub Sync UI Components

A collection of React components and hooks for displaying GitHub sync status and managing GitHub integration in the Mobigen dashboard.

## Overview

These components provide a complete UI solution for integrating GitHub sync functionality into your application. They handle displaying connection status, sync progress, history, and provide actions for push/pull operations.

## Components

### GitHubConnectionCard

A card component that displays GitHub connection status and user information.

**Props:**
- `connection: GitHubConnectionData | null` - GitHub connection data
- `isLoading?: boolean` - Loading state
- `onConnect?: () => void` - Callback when user clicks connect
- `onDisconnect?: () => void` - Callback when user clicks disconnect

**Example:**
```tsx
import { GitHubConnectionCard } from '@mobigen/ui';

function ConnectionSettings() {
  const { data: connection, isLoading } = useGitHubConnection({ userId: user.id });

  return (
    <GitHubConnectionCard
      connection={connection}
      isLoading={isLoading}
      onConnect={() => window.location.href = '/api/github/oauth'}
      onDisconnect={handleDisconnect}
    />
  );
}
```

### SyncStatusIndicator

A visual indicator showing the current sync status with icon and label.

**Props:**
- `status: SyncStatus` - Current sync status ('synced' | 'syncing' | 'pending' | 'failed' | 'disconnected')
- `showLabel?: boolean` - Whether to show text label (default: true)
- `size?: 'sm' | 'md' | 'lg'` - Size variant (default: 'md')

**Example:**
```tsx
import { SyncStatusIndicator } from '@mobigen/ui';

function ProjectHeader() {
  const { data: syncConfig } = useSyncStatus({ projectId });

  return (
    <div className="flex items-center gap-2">
      <h1>My Project</h1>
      <SyncStatusIndicator
        status={syncConfig?.syncStatus || 'disconnected'}
        size="sm"
      />
    </div>
  );
}
```

### LastSyncInfo

Displays when the project was last synced with commit and branch information.

**Props:**
- `lastSyncAt: Date | null` - Last sync timestamp
- `commitSha?: string | null` - Commit SHA hash
- `branch?: string | null` - Branch name
- `repoUrl?: string` - Repository URL for linking to commit
- `size?: 'sm' | 'md'` - Size variant (default: 'md')

**Example:**
```tsx
import { LastSyncInfo } from '@mobigen/ui';

function SyncDetails() {
  const { data: syncConfig } = useSyncStatus({ projectId });

  return (
    <LastSyncInfo
      lastSyncAt={syncConfig?.lastSyncAt}
      commitSha={syncConfig?.lastCommitSha}
      branch={syncConfig?.currentBranch}
      repoUrl={syncConfig?.repoUrl}
    />
  );
}
```

### SyncHistoryList

Displays a list of recent sync operations with details.

**Props:**
- `entries: SyncHistoryEntry[]` - Array of sync history entries
- `isLoading?: boolean` - Loading state
- `emptyMessage?: string` - Message when no history (default: 'No sync history yet')
- `maxEntries?: number` - Max entries to display (default: 10)
- `onEntryClick?: (entry: SyncHistoryEntry) => void` - Click handler for entries
- `repoUrl?: string` - Repository URL for linking to commits

**Example:**
```tsx
import { SyncHistoryList } from '@mobigen/ui';

function HistoryPanel() {
  const { data: history, isLoading } = useSyncHistory({ projectId });

  return (
    <SyncHistoryList
      entries={history || []}
      isLoading={isLoading}
      maxEntries={20}
      repoUrl="https://github.com/username/repo"
      onEntryClick={(entry) => console.log('Clicked:', entry)}
    />
  );
}
```

### ConnectGitHubButton

A styled button for initiating GitHub OAuth connection.

**Props:**
- `onConnect: () => void | Promise<void>` - Connect handler
- `isConnected?: boolean` - Whether already connected (shows disabled state)
- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost'` - Button style
- `size?: 'sm' | 'md' | 'lg'` - Size variant
- `fullWidth?: boolean` - Full width button
- `isLoading?: boolean` - Loading state

**Example:**
```tsx
import { ConnectGitHubButton } from '@mobigen/ui';

function SetupPage() {
  const { startOAuth } = useGitHubOAuth();
  const { data: connection } = useGitHubConnection({ userId });

  const handleConnect = async () => {
    const authUrl = await startOAuth({ userId });
    window.location.href = authUrl;
  };

  return (
    <ConnectGitHubButton
      onConnect={handleConnect}
      isConnected={!!connection}
      fullWidth
    />
  );
}
```

### SyncActionsMenu

A menu of action buttons for push, pull, configure, and disconnect operations.

**Props:**
- `onAction: (action: SyncAction) => void | Promise<void>` - Action handler
- `isLoading?: boolean` - Loading state
- `disabled?: boolean` - Disable all actions
- `syncEnabled?: boolean` - Whether sync is enabled
- `autoCommit?: boolean` - Whether auto-commit is enabled
- `showPush?: boolean` - Show push button (default: true)
- `showPull?: boolean` - Show pull button (default: true)
- `showConfigure?: boolean` - Show configure button (default: true)
- `showDisconnect?: boolean` - Show disconnect button (default: true)
- `orientation?: 'horizontal' | 'vertical'` - Layout direction

**Example:**
```tsx
import { SyncActionsMenu } from '@mobigen/ui';

function ProjectActions() {
  const { data: syncConfig } = useSyncStatus({ projectId });

  const handleAction = async (action: SyncAction) => {
    switch (action) {
      case 'push':
        await pushToGitHub(projectId);
        break;
      case 'pull':
        await pullFromGitHub(projectId);
        break;
      case 'configure':
        router.push('/settings/github');
        break;
      case 'disconnect':
        await disconnectGitHub();
        break;
    }
  };

  return (
    <SyncActionsMenu
      onAction={handleAction}
      syncEnabled={syncConfig?.syncEnabled}
      autoCommit={syncConfig?.autoCommit}
      orientation="horizontal"
    />
  );
}
```

## Hooks

### useGitHubConnection

Fetches and manages GitHub connection data for a user.

**Parameters:**
- `config: GitHubHookConfig`
  - `userId?: string` - User ID to fetch connection for
  - `enabled?: boolean` - Enable/disable fetching (default: true)
  - `refetchInterval?: number` - Auto-refetch interval in ms

**Returns:**
- `data: GitHubConnectionData | null` - Connection data
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if fetch failed
- `refetch: () => Promise<void>` - Manually refetch data

**Example:**
```tsx
const { data: connection, isLoading, refetch } = useGitHubConnection({
  userId: currentUser.id,
  enabled: true,
});

if (connection) {
  console.log(`Connected as ${connection.githubUsername}`);
}
```

### useSyncStatus

Fetches project GitHub sync configuration and status.

**Parameters:**
- `config: GitHubHookConfig`
  - `projectId?: string` - Project ID to fetch status for
  - `enabled?: boolean` - Enable/disable fetching (default: true)
  - `refetchInterval?: number` - Auto-refetch interval in ms (useful for polling)

**Returns:**
- `data: ProjectGitHubData | null` - Sync configuration
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if fetch failed
- `refetch: () => Promise<void>` - Manually refetch data

**Example:**
```tsx
const { data: syncConfig, isLoading } = useSyncStatus({
  projectId: 'project-123',
  enabled: true,
  refetchInterval: 5000, // Poll every 5 seconds
});

if (syncConfig) {
  console.log(`Sync status: ${syncConfig.syncStatus}`);
}
```

### useSyncHistory

Fetches sync history entries for a project.

**Parameters:**
- `config: GitHubHookConfig`
  - `projectId?: string` - Project ID to fetch history for
  - `enabled?: boolean` - Enable/disable fetching (default: true)
  - `refetchInterval?: number` - Auto-refetch interval in ms

**Returns:**
- `data: SyncHistoryEntry[] | null` - History entries
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if fetch failed
- `refetch: () => Promise<void>` - Manually refetch data

**Example:**
```tsx
const { data: history, isLoading } = useSyncHistory({
  projectId: 'project-123',
  enabled: true,
});

return <SyncHistoryList entries={history || []} isLoading={isLoading} />;
```

### useRealtimeSyncStatus

Manages local sync status state for real-time updates.

**Parameters:**
- `initialStatus: SyncStatus` - Initial status (default: 'disconnected')

**Returns:**
- `status: SyncStatus` - Current status
- `lastUpdate: Date | null` - Last update timestamp
- `updateStatus: (status: SyncStatus) => void` - Update function

**Example:**
```tsx
const { status, updateStatus } = useRealtimeSyncStatus('synced');

const handlePush = async () => {
  updateStatus('syncing');
  try {
    await pushToGitHub();
    updateStatus('synced');
  } catch {
    updateStatus('failed');
  }
};

return <SyncStatusIndicator status={status} />;
```

### useGitHubOAuth

Manages GitHub OAuth flow state.

**Returns:**
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error if OAuth failed
- `startOAuth: (params: { userId: string; projectId?: string }) => Promise<string>` - Start OAuth flow
- `completeOAuth: (code: string, state: string) => Promise<void>` - Complete OAuth flow

**Example:**
```tsx
const { isLoading, error, startOAuth } = useGitHubOAuth();

const handleConnect = async () => {
  try {
    const authUrl = await startOAuth({ userId: currentUser.id });
    window.location.href = authUrl;
  } catch (err) {
    console.error('OAuth failed:', err);
  }
};

return (
  <ConnectGitHubButton
    onConnect={handleConnect}
    isLoading={isLoading}
  />
);
```

## Types

### GitHubConnectionData
```typescript
interface GitHubConnectionData {
  id: string;
  githubUsername: string;
  githubEmail: string | null;
  githubAvatarUrl: string | null;
  status: 'active' | 'revoked' | 'expired' | 'disconnected';
  scopes: string[];
  connectedAt: Date;
}
```

### ProjectGitHubData
```typescript
interface ProjectGitHubData {
  id: string;
  repoOwner: string;
  repoName: string;
  repoUrl: string;
  defaultBranch: string;
  currentBranch: string;
  syncEnabled: boolean;
  autoCommit: boolean;
  autoPush: boolean;
  syncStatus: 'synced' | 'syncing' | 'pending' | 'failed' | 'disconnected';
  lastSyncAt: Date | null;
  lastCommitSha: string | null;
}
```

### SyncHistoryEntry
```typescript
interface SyncHistoryEntry {
  id: string;
  phase: string;
  commitSha: string | null;
  commitMessage: string | null;
  branch: string | null;
  filesAdded: string[];
  filesModified: string[];
  filesDeleted: string[];
  status: 'success' | 'failed';
  errorMessage: string | null;
  durationMs: number;
  createdAt: Date;
}
```

### SyncAction
```typescript
type SyncAction = 'push' | 'pull' | 'disconnect' | 'configure';
```

### SyncStatus
```typescript
type SyncStatus = 'synced' | 'syncing' | 'pending' | 'failed' | 'disconnected';
```

## Complete Example

Here's a complete example of a project settings page with GitHub sync:

```tsx
import {
  GitHubConnectionCard,
  SyncStatusIndicator,
  LastSyncInfo,
  SyncHistoryList,
  SyncActionsMenu,
  useGitHubConnection,
  useSyncStatus,
  useSyncHistory,
  useGitHubOAuth,
  type SyncAction,
} from '@mobigen/ui';

function ProjectGitHubSettings({ projectId, userId }) {
  // Fetch data
  const { data: connection, refetch: refetchConnection } = useGitHubConnection({ userId });
  const { data: syncConfig, refetch: refetchSync } = useSyncStatus({
    projectId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
  const { data: history, refetch: refetchHistory } = useSyncHistory({ projectId });

  // OAuth flow
  const { startOAuth } = useGitHubOAuth();

  const handleConnect = async () => {
    const authUrl = await startOAuth({ userId, projectId });
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    await fetch(`/api/github/disconnect`, { method: 'POST' });
    await refetchConnection();
    await refetchSync();
  };

  const handleAction = async (action: SyncAction) => {
    switch (action) {
      case 'push':
        await fetch(`/api/projects/${projectId}/github/push`, { method: 'POST' });
        await refetchSync();
        await refetchHistory();
        break;
      case 'pull':
        await fetch(`/api/projects/${projectId}/github/pull`, { method: 'POST' });
        await refetchSync();
        break;
      case 'configure':
        // Navigate to settings
        break;
      case 'disconnect':
        await handleDisconnect();
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">GitHub Integration</h2>

        <GitHubConnectionCard
          connection={connection}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </div>

      {connection && syncConfig && (
        <>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sync Status</h3>
              <SyncStatusIndicator status={syncConfig.syncStatus} />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Repository</p>
                <a
                  href={syncConfig.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {syncConfig.repoOwner}/{syncConfig.repoName}
                </a>
              </div>

              <LastSyncInfo
                lastSyncAt={syncConfig.lastSyncAt}
                commitSha={syncConfig.lastCommitSha}
                branch={syncConfig.currentBranch}
                repoUrl={syncConfig.repoUrl}
              />

              <SyncActionsMenu
                onAction={handleAction}
                syncEnabled={syncConfig.syncEnabled}
                autoCommit={syncConfig.autoCommit}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Sync History</h3>
            <SyncHistoryList
              entries={history || []}
              maxEntries={20}
              repoUrl={syncConfig.repoUrl}
            />
          </div>
        </>
      )}
    </div>
  );
}
```

## Implementation Notes

### API Integration

These hooks are designed to work with your API layer. You'll need to replace the placeholder API calls in the hooks with your actual implementation:

**With tRPC:**
```typescript
// In hooks.ts
const data = await trpc.github.getConnection.query({ userId });
```

**With REST:**
```typescript
// In hooks.ts
const response = await fetch(`/api/github/connection?userId=${userId}`);
const data = await response.json();
```

### Polling for Real-time Updates

Use the `refetchInterval` option to poll for updates during sync operations:

```typescript
const { data: syncConfig } = useSyncStatus({
  projectId,
  refetchInterval: syncConfig?.syncStatus === 'syncing' ? 2000 : undefined,
});
```

### Error Handling

All hooks return an `error` property. Handle errors appropriately in your UI:

```typescript
const { data, error, isLoading } = useGitHubConnection({ userId });

if (error) {
  return <div>Error: {error.message}</div>;
}
```

## Styling

All components use Tailwind CSS classes and follow the existing Mobigen UI design system. They're fully responsive and support light mode by default.

To customize, you can:
- Pass custom `className` props to any component
- Modify the base styles in the component files
- Use Tailwind's utility classes for fine-grained control

## Accessibility

All components follow accessibility best practices:
- Semantic HTML elements
- Proper ARIA labels
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## License

MIT
