/**
 * useQualityMetrics Hook
 *
 * Custom React hook for fetching and managing quality metrics data.
 * Handles polling, caching, and error states for the quality dashboard.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  QualityDashboardData,
  QualityMetricsFilter,
  TimePeriod,
  LoadingState,
} from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DEFAULT_POLL_INTERVAL = 30000; // 30 seconds
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOK OPTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface UseQualityMetricsOptions {
  /** Time period for metrics */
  period?: TimePeriod;

  /** Filter by template ID */
  templateId?: string;

  /** Enable automatic polling */
  enablePolling?: boolean;

  /** Polling interval in milliseconds */
  pollInterval?: number;

  /** Refetch on window focus */
  refetchOnFocus?: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOOK RETURN TYPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface UseQualityMetricsReturn {
  /** Dashboard data */
  data: QualityDashboardData | null;

  /** Loading state */
  isLoading: boolean;

  /** Error message if any */
  error: string | null;

  /** Manual refetch function */
  refetch: () => Promise<void>;

  /** Last updated timestamp */
  lastUpdated: Date | null;

  /** Is data stale (needs refresh) */
  isStale: boolean;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA GENERATOR (for development)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function generateMockData(filter: QualityMetricsFilter): QualityDashboardData {
  const now = new Date();

  return {
    metrics: {
      successRate: 98.5,
      autoFixRate: 75.3,
      avgDuration: 145,
      activeAlerts: 3,
      totalGenerations: 1247,
      successfulGenerations: 1228,
      failedGenerations: 19,
      lastUpdated: now,
    },
    trends: {
      successRate: {
        data: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000),
          successRate: 96 + Math.random() * 3,
          totalGenerations: 150 + Math.floor(Math.random() * 50),
          failedGenerations: 2 + Math.floor(Math.random() * 3),
        })),
        change: 1.2,
        direction: 'up' as const,
      },
      duration: {
        data: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000),
          successRate: 0,
          totalGenerations: 140 + Math.floor(Math.random() * 20),
          failedGenerations: 0,
        })),
        change: -5.3,
        direction: 'down' as const,
      },
      volume: {
        data: Array.from({ length: 7 }, (_, i) => ({
          timestamp: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000),
          successRate: 0,
          totalGenerations: 150 + Math.floor(Math.random() * 100),
          failedGenerations: 0,
        })),
        change: 12.5,
        direction: 'up' as const,
      },
    },
    alerts: [
      {
        id: '1',
        type: 'success_rate_drop',
        severity: 'warning',
        message: 'Success rate dropped below 99% for e-commerce template',
        details: 'Last 10 generations: 8/10 successful',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        templateId: 'ecommerce',
        acknowledged: false,
      },
      {
        id: '2',
        type: 'slow_generation',
        severity: 'info',
        message: 'Average generation time increased',
        details: 'Current: 145s, Target: 120s',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        acknowledged: false,
      },
      {
        id: '3',
        type: 'auto_fix_failure',
        severity: 'critical',
        message: 'Auto-fix failed after 3 attempts',
        details: 'Project: proj_abc123, Template: loyalty',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        projectId: 'proj_abc123',
        templateId: 'loyalty',
        acknowledged: false,
      },
    ],
    templates: [
      {
        templateId: 'ecommerce',
        templateName: 'E-commerce',
        category: 'Shopping',
        level: 'gold',
        successRate: 99.2,
        totalGenerations: 487,
        lastCertified: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        issues: [],
        avgDuration: 132,
      },
      {
        templateId: 'loyalty',
        templateName: 'Loyalty & Rewards',
        category: 'Engagement',
        level: 'silver',
        successRate: 97.8,
        totalGenerations: 312,
        lastCertified: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        issues: [
          {
            type: 'Navigation Error',
            severity: 'minor',
            description: 'QR scanner route occasionally unregistered',
            occurrences: 3,
            lastOccurred: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        avgDuration: 156,
      },
      {
        templateId: 'news',
        templateName: 'News & Content',
        category: 'Media',
        level: 'gold',
        successRate: 99.5,
        totalGenerations: 298,
        lastCertified: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        issues: [],
        avgDuration: 128,
      },
      {
        templateId: 'ai-assistant',
        templateName: 'AI Assistant',
        category: 'AI',
        level: 'bronze',
        successRate: 95.1,
        totalGenerations: 150,
        lastCertified: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
        issues: [
          {
            type: 'API Integration',
            severity: 'major',
            description: 'OpenAI API key validation fails',
            occurrences: 7,
            lastOccurred: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
        avgDuration: 178,
      },
    ],
    recentValidations: [],
    errorBreakdown: [
      { category: 'syntax', count: 45, percentage: 23.7, examples: [] },
      { category: 'type', count: 62, percentage: 32.6, examples: [] },
      { category: 'import', count: 28, percentage: 14.7, examples: [] },
      { category: 'navigation', count: 18, percentage: 9.5, examples: [] },
      { category: 'styling', count: 12, percentage: 6.3, examples: [] },
      { category: 'runtime', count: 15, percentage: 7.9, examples: [] },
      { category: 'build', count: 8, percentage: 4.2, examples: [] },
      { category: 'test', count: 2, percentage: 1.1, examples: [] },
    ],
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN HOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function useQualityMetrics(
  options: UseQualityMetricsOptions = {}
): UseQualityMetricsReturn {
  const {
    period = '7d',
    templateId,
    enablePolling = true,
    pollInterval = DEFAULT_POLL_INTERVAL,
    refetchOnFocus = true,
  } = options;

  const [data, setData] = useState<QualityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FETCH FUNCTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const fetchMetrics = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const filter: QualityMetricsFilter = {
        period,
        templateId,
      };

      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/quality/metrics`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(filter),
      //   signal: abortControllerRef.current.signal,
      // });

      // if (!response.ok) {
      //   throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      // }

      // const dashboardData = await response.json() as QualityDashboardData;

      // For now, use mock data
      const dashboardData = generateMockData(filter);

      setData(dashboardData);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          // Request was cancelled, ignore
          return;
        }
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, [period, templateId]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INITIAL FETCH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POLLING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!enablePolling) return;

    pollTimerRef.current = setInterval(() => {
      fetchMetrics();
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [enablePolling, pollInterval, fetchMetrics]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // REFETCH ON FOCUS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!refetchOnFocus) return;

    const handleFocus = () => {
      fetchMetrics();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchOnFocus, fetchMetrics]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLEANUP ON UNMOUNT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CHECK IF DATA IS STALE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const isStale = lastUpdated
    ? Date.now() - lastUpdated.getTime() > pollInterval * 1.5
    : false;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RETURN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return {
    data,
    isLoading,
    error,
    refetch: fetchMetrics,
    lastUpdated,
    isStale,
  };
}
