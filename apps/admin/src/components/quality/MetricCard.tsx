/**
 * MetricCard Component
 *
 * Reusable card component for displaying quality metrics.
 * Features:
 * - Color-coded based on thresholds
 * - Trend indicators with sparkline
 * - Multiple format options (number, percentage, duration)
 * - Loading and error states
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import type { MetricCardProps, TrendData } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatValue(
  value: number | string,
  format: 'number' | 'percentage' | 'duration' = 'number',
  unit?: string
): string {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      // Convert seconds to human-readable format
      if (value < 60) {
        return `${Math.round(value)}s`;
      } else if (value < 3600) {
        const minutes = Math.floor(value / 60);
        const seconds = Math.round(value % 60);
        return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
      } else {
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    case 'number':
    default:
      return unit ? `${value.toLocaleString()}${unit}` : value.toLocaleString();
  }
}

function getStatusColor(
  value: number,
  threshold?: { target: number; warning: number; critical: number },
  inverse: boolean = false
): string {
  if (!threshold) return 'text-gray-900';

  // For metrics where lower is better (e.g., duration)
  if (inverse) {
    if (value <= threshold.target) return 'text-green-600';
    if (value <= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  }

  // For metrics where higher is better (e.g., success rate)
  if (value >= threshold.target) return 'text-green-600';
  if (value >= threshold.warning) return 'text-yellow-600';
  return 'text-red-600';
}

function getBackgroundColor(
  value: number,
  threshold?: { target: number; warning: number; critical: number },
  inverse: boolean = false
): string {
  if (!threshold) return 'bg-white';

  if (inverse) {
    if (value <= threshold.target) return 'bg-green-50';
    if (value <= threshold.warning) return 'bg-yellow-50';
    return 'bg-red-50';
  }

  if (value >= threshold.target) return 'bg-green-50';
  if (value >= threshold.warning) return 'bg-yellow-50';
  return 'bg-red-50';
}

function getBorderColor(
  value: number,
  threshold?: { target: number; warning: number; critical: number },
  inverse: boolean = false
): string {
  if (!threshold) return 'border-gray-200';

  if (inverse) {
    if (value <= threshold.target) return 'border-green-200';
    if (value <= threshold.warning) return 'border-yellow-200';
    return 'border-red-200';
  }

  if (value >= threshold.target) return 'border-green-200';
  if (value >= threshold.warning) return 'border-yellow-200';
  return 'border-red-200';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TREND INDICATOR COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TrendIndicatorProps {
  trend: TrendData;
}

function TrendIndicator({ trend }: TrendIndicatorProps) {
  const { direction, change } = trend;

  const Icon =
    direction === 'up'
      ? TrendingUp
      : direction === 'down'
        ? TrendingDown
        : Minus;

  const colorClass =
    direction === 'up'
      ? 'text-green-600'
      : direction === 'down'
        ? 'text-red-600'
        : 'text-gray-400';

  return (
    <div className={`flex items-center gap-1 text-sm ${colorClass}`}>
      <Icon className="h-4 w-4" />
      <span className="font-medium">
        {change > 0 ? '+' : ''}
        {change.toFixed(1)}%
      </span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MINI SPARKLINE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MiniSparklineProps {
  data: TrendData;
  valueKey: 'successRate' | 'totalGenerations' | 'failedGenerations';
}

function MiniSparkline({ data, valueKey }: MiniSparklineProps) {
  const values = data.data.map((d) => d[valueKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  const strokeColor =
    data.direction === 'up'
      ? '#16a34a'
      : data.direction === 'down'
        ? '#dc2626'
        : '#9ca3af';

  return (
    <svg
      className="h-8 w-20"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function MetricCard({
  title,
  value,
  unit,
  trend,
  threshold,
  format = 'number',
  className = '',
}: MetricCardProps) {
  const numericValue = typeof value === 'number' ? value : 0;
  const inverse = format === 'duration'; // Lower is better for duration

  const bgColor = getBackgroundColor(numericValue, threshold, inverse);
  const borderColor = getBorderColor(numericValue, threshold, inverse);
  const valueColor = getStatusColor(numericValue, threshold, inverse);

  const formattedValue = formatValue(value, format, unit);

  return (
    <div
      className={`
        rounded-lg border-2 p-6 transition-all duration-200
        ${bgColor} ${borderColor}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>

        {/* Threshold indicator */}
        {threshold && (
          <div className="flex items-center gap-1">
            {numericValue < threshold.critical && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-2 flex items-baseline justify-between">
        <div className={`text-3xl font-bold ${valueColor}`}>
          {formattedValue}
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex flex-col items-end gap-1">
            <TrendIndicator trend={trend} />
            <MiniSparkline
              data={trend}
              valueKey={
                format === 'percentage' ? 'successRate' : 'totalGenerations'
              }
            />
          </div>
        )}
      </div>

      {/* Threshold status */}
      {threshold && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            Target: {format === 'percentage' ? `${threshold.target}%` : threshold.target}
          </span>
          {numericValue < threshold.warning && (
            <span className="text-yellow-600 font-medium">
              Below target
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="mt-2 h-10 w-32 bg-gray-300 rounded" />
      <div className="mt-4 h-3 w-20 bg-gray-200 rounded" />
    </div>
  );
}
