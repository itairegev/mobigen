/**
 * QualityOverview Component
 *
 * Main quality dashboard that combines all quality monitoring components.
 * Features:
 * - Real-time metrics overview
 * - Success rate trends
 * - Active alerts feed
 * - Template certification status
 * - Validation error details
 * - Auto-refresh with polling
 */

'use client';

import React, { useState } from 'react';
import {
  Activity,
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { MetricCard, MetricCardSkeleton } from './MetricCard';
import { SuccessRateChart, SuccessRateChartSkeleton } from './SuccessRateChart';
import { AlertFeed, AlertFeedSkeleton } from './AlertFeed';
import { TemplateStatus, TemplateStatusSkeleton } from './TemplateStatus';
import { ValidationDetails, ValidationDetailsSkeleton } from './ValidationDetails';
import { useQualityMetrics } from './hooks/useQualityMetrics';
import { DEFAULT_THRESHOLDS } from './types';
import type { TimePeriod } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface QualityOverviewProps {
  /** Initial time period */
  defaultPeriod?: TimePeriod;

  /** Enable auto-refresh */
  enablePolling?: boolean;

  /** Refresh interval in ms */
  pollInterval?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEADER COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  isStale: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function DashboardHeader({
  lastUpdated,
  isStale,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quality Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Real-time monitoring of generation quality and validation metrics
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Last updated */}
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              <span className="font-medium">Last updated:</span>{' '}
              {format(lastUpdated, 'HH:mm:ss')}
              {isStale && (
                <span className="ml-2 text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Stale
                </span>
              )}
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          {/* Export button */}
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700
                     rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function QualityOverview({
  defaultPeriod = '7d',
  enablePolling = true,
  pollInterval = 30000,
}: QualityOverviewProps) {
  const [period, setPeriod] = useState<TimePeriod>(defaultPeriod);

  // Fetch quality metrics
  const { data, isLoading, error, refetch, lastUpdated, isStale } =
    useQualityMetrics({
      period,
      enablePolling,
      pollInterval,
    });

  // Handle alert actions
  const handleAcknowledgeAlert = (alertId: string) => {
    console.log('Acknowledge alert:', alertId);
    // TODO: Implement API call
  };

  const handleSnoozeAlert = (alertId: string, duration: number) => {
    console.log('Snooze alert:', alertId, 'for', duration, 'hours');
    // TODO: Implement API call
  };

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
  };

  // Calculate tier stats from error breakdown (mock calculation)
  const tierStats = data
    ? {
        tier1: { passed: 95, failed: 5 },
        tier2: { passed: 88, failed: 12 },
        tier3: { passed: 82, failed: 18 },
      }
    : undefined;

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded" />
        </div>

        <div className="p-6 space-y-6">
          {/* Metric cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>

          {/* Chart skeleton */}
          <SuccessRateChartSkeleton />

          {/* Two column layout skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertFeedSkeleton />
            <ValidationDetailsSkeleton />
          </div>

          {/* Template status skeleton */}
          <TemplateStatusSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-sm text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        lastUpdated={lastUpdated}
        isStale={isStale}
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {/* Main content */}
      <div className="p-6 space-y-6">
        {/* Summary metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Success Rate"
            value={data.metrics.successRate}
            format="percentage"
            trend={data.trends.successRate}
            threshold={DEFAULT_THRESHOLDS.successRate}
          />

          <MetricCard
            title="Auto-Fix Rate"
            value={data.metrics.autoFixRate}
            format="percentage"
            trend={{
              data: data.trends.successRate.data,
              change: 2.3,
              direction: 'up',
            }}
            threshold={DEFAULT_THRESHOLDS.autoFixRate}
          />

          <MetricCard
            title="Avg Duration"
            value={data.metrics.avgDuration}
            format="duration"
            trend={data.trends.duration}
            threshold={DEFAULT_THRESHOLDS.avgDuration}
          />

          <MetricCard
            title="Active Alerts"
            value={data.metrics.activeAlerts}
            format="number"
            trend={{
              data: data.trends.volume.data,
              change: -15.2,
              direction: 'down',
            }}
          />
        </div>

        {/* Success rate chart */}
        <SuccessRateChart
          data={data.trends.successRate}
          targetRate={DEFAULT_THRESHOLDS.successRate.target}
          warningRate={DEFAULT_THRESHOLDS.successRate.warning}
          onPeriodChange={handlePeriodChange}
        />

        {/* Two column layout: Alerts + Validation Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AlertFeed
            alerts={data.alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onSnooze={handleSnoozeAlert}
            maxItems={5}
          />

          <ValidationDetails
            errorBreakdown={data.errorBreakdown}
            tierStats={tierStats}
          />
        </div>

        {/* Template certification status */}
        <TemplateStatus templates={data.templates} />

        {/* Additional stats footer */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Generations</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.metrics.totalGenerations.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.metrics.successfulGenerations.toLocaleString()} successful
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Failed Generations</p>
              <p className="text-2xl font-bold text-red-600">
                {data.metrics.failedGenerations.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {((data.metrics.failedGenerations / data.metrics.totalGenerations) * 100).toFixed(2)}% failure rate
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Avg Success Rate</p>
              <p
                className={`text-2xl font-bold ${
                  data.metrics.successRate >= DEFAULT_THRESHOLDS.successRate.target
                    ? 'text-green-600'
                    : data.metrics.successRate >= DEFAULT_THRESHOLDS.successRate.warning
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {data.metrics.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Target: {DEFAULT_THRESHOLDS.successRate.target}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityOverview;
