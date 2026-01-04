/**
 * Build Status Dashboard Hooks
 * React hooks for managing build state and operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Build,
  UseBuildStatusReturn,
  UseBuildHistoryReturn,
  UseDeploymentReturn,
  BuildHistoryFilters,
  DeploymentOptions,
} from './types';

// Configuration
const DEFAULT_POLLING_INTERVAL = 5000; // 5 seconds
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Hook to fetch and monitor a single build's status
 * Automatically polls for updates when build is in progress
 */
export function useBuildStatus(buildId: string | null): UseBuildStatusReturn {
  const [build, setBuild] = useState<Build | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBuild = useCallback(async () => {
    if (!buildId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/builds/${buildId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch build: ${response.statusText}`);
      }

      const data = await response.json();
      setBuild(data);

      // Stop polling if build is in terminal state
      const terminalStatuses = ['ready', 'failed', 'cancelled'];
      if (terminalStatuses.includes(data.status) && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [buildId]);

  const refresh = useCallback(async () => {
    await fetchBuild();
  }, [fetchBuild]);

  const cancel = useCallback(async () => {
    if (!buildId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/builds/${buildId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel build: ${response.statusText}`);
      }

      await fetchBuild();
    } catch (err) {
      setError(err as Error);
    }
  }, [buildId, fetchBuild]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!buildId) {
      setBuild(null);
      return;
    }

    fetchBuild();

    // Set up polling for in-progress builds
    intervalRef.current = setInterval(() => {
      fetchBuild();
    }, DEFAULT_POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [buildId, fetchBuild]);

  return {
    build,
    isLoading,
    error,
    refresh,
    cancel,
  };
}

/**
 * Hook to fetch and filter build history
 * Supports pagination and filtering
 */
export function useBuildHistory(
  projectId: string,
  initialFilters: BuildHistoryFilters = {}
): UseBuildHistoryReturn {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<BuildHistoryFilters>({
    limit: 20,
    offset: 0,
    ...initialFilters,
  });

  const fetchBuilds = useCallback(
    async (append = false) => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        queryParams.append('projectId', projectId);

        if (filters.platform) queryParams.append('platform', filters.platform);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
        if (filters.offset) queryParams.append('offset', filters.offset.toString());

        const response = await fetch(`${API_BASE_URL}/builds?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch builds: ${response.statusText}`);
        }

        const data = await response.json();

        if (append) {
          setBuilds((prev) => [...prev, ...data.builds]);
        } else {
          setBuilds(data.builds);
        }

        setHasMore(data.hasMore ?? false);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, filters]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  }, [hasMore, isLoading]);

  const refresh = useCallback(async () => {
    setFilters((prev) => ({ ...prev, offset: 0 }));
    await fetchBuilds(false);
  }, [fetchBuilds]);

  const updateFilters = useCallback((newFilters: BuildHistoryFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      offset: 0, // Reset offset when filters change
    }));
  }, []);

  // Fetch builds when filters change
  useEffect(() => {
    fetchBuilds(filters.offset !== 0);
  }, [filters, fetchBuilds]);

  return {
    builds,
    isLoading,
    error,
    hasMore,
    filters,
    setFilters: updateFilters,
    loadMore,
    refresh,
  };
}

/**
 * Hook to trigger and monitor deployments
 * Handles deployment initiation and tracks the created build
 */
export function useDeployment(projectId: string): UseDeploymentReturn {
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentBuild, setCurrentBuild] = useState<Build | null>(null);

  const deploy = useCallback(
    async (options: DeploymentOptions): Promise<Build> => {
      try {
        setIsDeploying(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/deploy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Deployment failed: ${response.statusText}`);
        }

        const build = await response.json();
        setCurrentBuild(build);

        return build;
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsDeploying(false);
      }
    },
    [projectId]
  );

  return {
    deploy,
    isDeploying,
    error,
    currentBuild,
  };
}

/**
 * Hook to fetch queue information for a build
 */
export function useBuildQueue(buildId: string | null) {
  const [queueInfo, setQueueInfo] = useState<{
    position: number;
    totalInQueue: number;
    estimatedWaitTime: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!buildId) {
      setQueueInfo(null);
      return;
    }

    const fetchQueueInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/builds/${buildId}/queue`);

        if (!response.ok) {
          throw new Error(`Failed to fetch queue info: ${response.statusText}`);
        }

        const data = await response.json();
        setQueueInfo(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueInfo();

    // Poll every 10 seconds for queue updates
    const interval = setInterval(fetchQueueInfo, 10000);

    return () => clearInterval(interval);
  }, [buildId]);

  return { queueInfo, isLoading, error };
}

/**
 * Hook to subscribe to real-time build updates via WebSocket
 * Falls back to polling if WebSocket is not available
 */
export function useBuildUpdates(buildId: string | null, onUpdate?: (build: Build) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!buildId) return;

    // Try to establish WebSocket connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:4000/ws`;

    try {
      const ws = new WebSocket(`${wsUrl}/builds/${buildId}`);

      ws.onopen = () => {
        setConnected(true);
        console.log('[useBuildUpdates] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const build = JSON.parse(event.data);
          onUpdate?.(build);
        } catch (err) {
          console.error('[useBuildUpdates] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[useBuildUpdates] WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('[useBuildUpdates] WebSocket disconnected');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[useBuildUpdates] Failed to create WebSocket:', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [buildId, onUpdate]);

  return { connected };
}
