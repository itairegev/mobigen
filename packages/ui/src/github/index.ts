/**
 * GitHub Sync UI Components
 *
 * A collection of React components and hooks for displaying GitHub sync status
 * and managing GitHub integration in the Mobigen dashboard.
 */

// Types
export type {
  GitHubConnectionStatus,
  SyncStatus,
  GitHubConnectionData,
  ProjectGitHubData,
  SyncHistoryEntry,
  SyncAction,
  OAuthFlowState,
} from './types';

// Components
export { GitHubConnectionCard } from './GitHubConnectionCard';
export type { GitHubConnectionCardProps } from './GitHubConnectionCard';

export { SyncStatusIndicator } from './SyncStatusIndicator';
export type { SyncStatusIndicatorProps } from './SyncStatusIndicator';

export { LastSyncInfo } from './LastSyncInfo';
export type { LastSyncInfoProps } from './LastSyncInfo';

export { SyncHistoryList } from './SyncHistoryList';
export type { SyncHistoryListProps } from './SyncHistoryList';

export { ConnectGitHubButton } from './ConnectGitHubButton';
export type { ConnectGitHubButtonProps } from './ConnectGitHubButton';

export { SyncActionsMenu } from './SyncActionsMenu';
export type { SyncActionsMenuProps } from './SyncActionsMenu';

// Hooks
export {
  useGitHubConnection,
  useSyncStatus,
  useSyncHistory,
  useRealtimeSyncStatus,
  useGitHubOAuth,
} from './hooks';
export type { GitHubHookConfig, HookResult } from './hooks';
