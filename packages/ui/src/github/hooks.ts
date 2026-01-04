/**
 * React hooks for GitHub sync functionality
 *
 * These hooks are designed to work with your tRPC API or REST endpoints.
 * They provide a clean interface for components to interact with GitHub sync data.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  GitHubConnectionData,
  ProjectGitHubData,
  SyncHistoryEntry,
  SyncStatus,
} from './types';

/**
 * Hook configuration for data fetching
 */
export interface GitHubHookConfig {
  projectId?: string;
  userId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Generic hook result with loading and error states
 */
export interface HookResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing GitHub connection data
 *
 * @example
 * ```tsx
 * const { data: connection, isLoading, refetch } = useGitHubConnection({
 *   userId: currentUser.id,
 *   enabled: true,
 * });
 *
 * if (connection) {
 *   console.log(`Connected as ${connection.githubUsername}`);
 * }
 * ```
 */
export function useGitHubConnection(
  config: GitHubHookConfig = {}
): HookResult<GitHubConnectionData> {
  const { userId, enabled = true, refetchInterval } = config;

  const [data, setData] = useState<GitHubConnectionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnection = useCallback(async () => {
    if (!enabled || !userId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This should be replaced with your actual API call
      // Example with tRPC: const data = await trpc.github.getConnection.query({ userId });
      // Example with REST: const res = await fetch(`/api/github/connection?userId=${userId}`);

      // For now, this is a placeholder that demonstrates the expected structure
      const mockData: GitHubConnectionData | null = null;

      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch GitHub connection'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, enabled]);

  useEffect(() => {
    fetchConnection();

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchConnection, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchConnection, refetchInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchConnection,
  };
}

/**
 * Hook for managing project GitHub sync status
 *
 * @example
 * ```tsx
 * const { data: syncConfig, isLoading } = useSyncStatus({
 *   projectId: 'project-123',
 *   enabled: true,
 *   refetchInterval: 5000, // Poll every 5 seconds
 * });
 *
 * if (syncConfig) {
 *   console.log(`Sync status: ${syncConfig.syncStatus}`);
 * }
 * ```
 */
export function useSyncStatus(
  config: GitHubHookConfig = {}
): HookResult<ProjectGitHubData> {
  const { projectId, enabled = true, refetchInterval } = config;

  const [data, setData] = useState<ProjectGitHubData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    if (!enabled || !projectId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This should be replaced with your actual API call
      // Example with tRPC: const data = await trpc.github.getSyncStatus.query({ projectId });
      // Example with REST: const res = await fetch(`/api/projects/${projectId}/github/status`);

      const mockData: ProjectGitHubData | null = null;

      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sync status'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    fetchSyncStatus();

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchSyncStatus, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSyncStatus, refetchInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSyncStatus,
  };
}

/**
 * Hook for fetching sync history entries
 *
 * @example
 * ```tsx
 * const { data: history, isLoading } = useSyncHistory({
 *   projectId: 'project-123',
 *   enabled: true,
 * });
 *
 * return <SyncHistoryList entries={history || []} isLoading={isLoading} />;
 * ```
 */
export function useSyncHistory(
  config: GitHubHookConfig = {}
): HookResult<SyncHistoryEntry[]> {
  const { projectId, enabled = true, refetchInterval } = config;

  const [data, setData] = useState<SyncHistoryEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!enabled || !projectId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This should be replaced with your actual API call
      // Example with tRPC: const data = await trpc.github.getSyncHistory.query({ projectId });
      // Example with REST: const res = await fetch(`/api/projects/${projectId}/github/history`);

      const mockData: SyncHistoryEntry[] = [];

      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch sync history'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId, enabled]);

  useEffect(() => {
    fetchHistory();

    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchHistory, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHistory, refetchInterval]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistory,
  };
}

/**
 * Hook for real-time sync status updates
 *
 * This hook maintains local state that updates when sync operations occur.
 * It's useful for displaying real-time feedback during push/pull operations.
 *
 * @example
 * ```tsx
 * const { status, updateStatus } = useRealtimeSyncStatus('synced');
 *
 * const handlePush = async () => {
 *   updateStatus('syncing');
 *   try {
 *     await pushToGitHub();
 *     updateStatus('synced');
 *   } catch {
 *     updateStatus('failed');
 *   }
 * };
 * ```
 */
export function useRealtimeSyncStatus(initialStatus: SyncStatus = 'disconnected') {
  const [status, setStatus] = useState<SyncStatus>(initialStatus);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateStatus = useCallback((newStatus: SyncStatus) => {
    setStatus(newStatus);
    setLastUpdate(new Date());
  }, []);

  return {
    status,
    lastUpdate,
    updateStatus,
  };
}

/**
 * Hook for managing OAuth flow state
 *
 * @example
 * ```tsx
 * const { isLoading, error, startOAuth, completeOAuth } = useGitHubOAuth();
 *
 * const handleConnect = async () => {
 *   try {
 *     const authUrl = await startOAuth({ userId: currentUser.id });
 *     window.location.href = authUrl;
 *   } catch (err) {
 *     console.error('OAuth failed:', err);
 *   }
 * };
 * ```
 */
export function useGitHubOAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startOAuth = useCallback(async (params: { userId: string; projectId?: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // This should be replaced with your actual API call
      // Example: const { url } = await trpc.github.startOAuth.mutate(params);

      const authUrl = '/api/github/oauth/authorize';
      return authUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start OAuth flow');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOAuth = useCallback(async (code: string, state: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // This should be replaced with your actual API call
      // Example: await trpc.github.completeOAuth.mutate({ code, state });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to complete OAuth flow');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    startOAuth,
    completeOAuth,
  };
}
