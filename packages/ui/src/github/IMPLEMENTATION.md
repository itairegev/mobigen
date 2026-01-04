# GitHub Sync UI - Implementation Guide

This document provides a quick reference for implementing the GitHub sync UI components in your Mobigen dashboard.

## Quick Start

### 1. Install Dependencies

The components are part of the `@mobigen/ui` package. All required dependencies are already included:

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### 2. Import Components

```typescript
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
} from '@mobigen/ui';
```

### 3. Connect Hooks to Your API

The hooks in `/home/ubuntu/base99/mobigen/packages/ui/src/github/hooks.ts` have placeholder implementations. You need to replace them with actual API calls.

**Location to Update:** `/home/ubuntu/base99/mobigen/packages/ui/src/github/hooks.ts`

**Example with tRPC:**

```typescript
// In useGitHubConnection hook
const fetchConnection = useCallback(async () => {
  if (!enabled || !userId) return;

  setIsLoading(true);
  setError(null);

  try {
    // Replace this line:
    // const mockData: GitHubConnectionData | null = null;

    // With your actual tRPC call:
    const data = await trpc.github.getConnection.query({ userId });

    setData(data);
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to fetch GitHub connection'));
  } finally {
    setIsLoading(false);
  }
}, [userId, enabled]);
```

**Example with REST:**

```typescript
// In useSyncStatus hook
const fetchSyncStatus = useCallback(async () => {
  if (!enabled || !projectId) return;

  setIsLoading(true);
  setError(null);

  try {
    // Replace this line:
    // const mockData: ProjectGitHubData | null = null;

    // With your actual fetch call:
    const response = await fetch(`/api/projects/${projectId}/github/status`);
    if (!response.ok) throw new Error('Failed to fetch sync status');
    const data = await response.json();

    setData(data);
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Failed to fetch sync status'));
  } finally {
    setIsLoading(false);
  }
}, [projectId, enabled]);
```

### 4. API Endpoints to Implement

You'll need these API endpoints for the components to work:

#### GitHub Connection Endpoints

```typescript
// GET /api/github/connection?userId={userId}
// Returns: GitHubConnectionData | null

// POST /api/github/oauth/authorize
// Body: { userId: string, projectId?: string }
// Returns: { url: string }

// POST /api/github/oauth/callback
// Body: { code: string, state: string }
// Returns: { success: boolean }

// POST /api/github/disconnect
// Body: { userId: string }
// Returns: { success: boolean }
```

#### Project Sync Endpoints

```typescript
// GET /api/projects/:projectId/github/status
// Returns: ProjectGitHubData | null

// GET /api/projects/:projectId/github/history
// Returns: SyncHistoryEntry[]

// POST /api/projects/:projectId/github/push
// Body: { message?: string }
// Returns: { success: boolean, commitSha?: string }

// POST /api/projects/:projectId/github/pull
// Returns: { success: boolean, filesChanged?: number }

// PUT /api/projects/:projectId/github/configure
// Body: { syncEnabled: boolean, autoCommit: boolean, ... }
// Returns: { success: boolean }
```

### 5. Database Schema

The components expect data in these shapes:

```typescript
// github_connections table
{
  id: string;
  userId: string;
  githubUserId: number;
  githubUsername: string;
  githubEmail: string | null;
  githubAvatarUrl: string | null;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// project_github_configs table
{
  id: string;
  projectId: string;
  connectionId: string | null;
  repoOwner: string;
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  defaultBranch: string;
  syncEnabled: boolean;
  autoCommit: boolean;
  autoPush: boolean;
  branchStrategy: 'single' | 'feature';
  createPrs: boolean;
  currentBranch: string;
  lastCommitSha: string | null;
  lastSyncAt: Date | null;
  syncStatus: 'pending' | 'synced' | 'syncing' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// github_sync_history table
{
  id: string;
  projectId: string;
  configId: string | null;
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

## Component Usage Examples

### Simple Connection Card

```tsx
function GitHubSettings({ userId }) {
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
```

### Project Sync Dashboard

```tsx
function ProjectSyncPanel({ projectId }) {
  const { data: syncConfig } = useSyncStatus({ projectId });
  const { data: history } = useSyncHistory({ projectId });

  if (!syncConfig) return <div>Not configured</div>;

  return (
    <div className="space-y-4">
      <SyncStatusIndicator status={syncConfig.syncStatus} />

      <LastSyncInfo
        lastSyncAt={syncConfig.lastSyncAt}
        commitSha={syncConfig.lastCommitSha}
        branch={syncConfig.currentBranch}
        repoUrl={syncConfig.repoUrl}
      />

      <SyncActionsMenu
        onAction={async (action) => {
          if (action === 'push') {
            await fetch(`/api/projects/${projectId}/github/push`, {
              method: 'POST',
            });
          }
        }}
        syncEnabled={syncConfig.syncEnabled}
      />

      <SyncHistoryList
        entries={history || []}
        repoUrl={syncConfig.repoUrl}
      />
    </div>
  );
}
```

### Real-time Sync Status

```tsx
function SyncButton({ projectId }) {
  const { status, updateStatus } = useRealtimeSyncStatus('synced');

  const handleSync = async () => {
    updateStatus('syncing');
    try {
      await fetch(`/api/projects/${projectId}/github/push`, {
        method: 'POST',
      });
      updateStatus('synced');
    } catch {
      updateStatus('failed');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <SyncStatusIndicator status={status} size="sm" />
      <button onClick={handleSync} disabled={status === 'syncing'}>
        Sync Now
      </button>
    </div>
  );
}
```

## Testing

### Unit Tests

Test individual components:

```typescript
import { render, screen } from '@testing-library/react';
import { SyncStatusIndicator } from '@mobigen/ui';

test('shows synced status', () => {
  render(<SyncStatusIndicator status="synced" />);
  expect(screen.getByText('Synced')).toBeInTheDocument();
});
```

### Integration Tests

Test with mock API:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useGitHubConnection } from '@mobigen/ui';

test('fetches connection data', async () => {
  const { result } = renderHook(() =>
    useGitHubConnection({ userId: 'user-123' })
  );

  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(result.current.data).toBeTruthy();
});
```

## Styling Customization

All components accept `className` prop for custom styling:

```tsx
<GitHubConnectionCard
  className="shadow-lg border-2 border-blue-500"
  connection={connection}
/>

<SyncStatusIndicator
  className="ml-auto"
  status="synced"
  size="lg"
/>
```

## Performance Optimization

### Polling Strategy

Only poll when necessary:

```tsx
const { data: syncConfig } = useSyncStatus({
  projectId,
  // Only poll when syncing
  refetchInterval: syncConfig?.syncStatus === 'syncing' ? 2000 : undefined,
});
```

### Conditional Rendering

Don't fetch data until needed:

```tsx
const { data: history } = useSyncHistory({
  projectId,
  // Only fetch when tab is active
  enabled: activeTab === 'history',
});
```

## Troubleshooting

### Components not rendering

- Verify all peer dependencies are installed (`react`, `react-dom`)
- Check that Tailwind CSS is configured in your project
- Ensure `@mobigen/ui` is properly imported

### Hooks not fetching data

- Verify `enabled` prop is true
- Check that `userId` or `projectId` is provided
- Implement actual API calls in the hook functions
- Check browser console for errors

### TypeScript errors

- Ensure `@types/react` is installed
- Update TypeScript to v5.3+
- Check that all imports are from `@mobigen/ui`

## Next Steps

1. Implement the API endpoints listed above
2. Update the hooks with real API calls
3. Test components in your dashboard
4. Configure OAuth credentials in environment variables
5. Set up database tables for GitHub data

## Files Reference

All files are located in `/home/ubuntu/base99/mobigen/packages/ui/src/github/`:

- `types.ts` - TypeScript type definitions
- `hooks.ts` - React hooks (needs API implementation)
- `GitHubConnectionCard.tsx` - Connection card component
- `SyncStatusIndicator.tsx` - Status indicator component
- `LastSyncInfo.tsx` - Last sync info component
- `SyncHistoryList.tsx` - Sync history list component
- `ConnectGitHubButton.tsx` - Connect button component
- `SyncActionsMenu.tsx` - Actions menu component
- `index.ts` - Package exports
- `README.md` - Full documentation

## Support

For questions or issues, refer to:
- Full documentation: `/home/ubuntu/base99/mobigen/packages/ui/src/github/README.md`
- GitHub package implementation: `/home/ubuntu/base99/mobigen/packages/github/`
- Technical design: Sprint 2 documentation
