/**
 * SuccessRateChart Component
 *
 * Line chart displaying success rate over time with target threshold.
 * Features:
 * - Line chart with Recharts
 * - 99% target threshold line
 * - Time range selector (24h, 7d, 30d)
 * - Tooltip with detailed stats
 * - Color-coded based on performance
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import type { TrendData, TimePeriod } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SuccessRateChartProps {
  data: TrendData;
  targetRate?: number;
  warningRate?: number;
  onPeriodChange?: (period: TimePeriod) => void;
  className?: string;
}

type ChartDataPoint = {
  timestamp: string;
  date: Date;
  successRate: number;
  total: number;
  failed: number;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIME PERIOD SELECTOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TimePeriodSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

function TimePeriodSelector({ selected, onChange }: TimePeriodSelectorProps) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
  ];

  return (
    <div className="flex gap-2">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${
              selected === period.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUSTOM TOOLTIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as ChartDataPoint;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <p className="text-sm font-medium text-gray-900 mb-2">
        {format(data.date, 'MMM d, yyyy HH:mm')}
      </p>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">Success Rate:</span>
          <span className="text-sm font-semibold text-gray-900">
            {data.successRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">Total:</span>
          <span className="text-sm font-medium text-gray-700">
            {data.total}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">Failed:</span>
          <span className="text-sm font-medium text-red-600">
            {data.failed}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600">Successful:</span>
          <span className="text-sm font-medium text-green-600">
            {data.total - data.failed}
          </span>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SuccessRateChart({
  data,
  targetRate = 99,
  warningRate = 95,
  onPeriodChange,
  className = '',
}: SuccessRateChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('7d');

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Transform data for chart
  const chartData: ChartDataPoint[] = data.data.map((point) => ({
    timestamp: format(point.timestamp, 'MMM d'),
    date: point.timestamp,
    successRate: Number(point.successRate.toFixed(1)),
    total: point.totalGenerations,
    failed: point.failedGenerations,
  }));

  // Calculate average for display
  const avgSuccessRate =
    chartData.reduce((sum, d) => sum + d.successRate, 0) / chartData.length;

  // Determine line color based on average performance
  const lineColor =
    avgSuccessRate >= targetRate
      ? '#16a34a' // green-600
      : avgSuccessRate >= warningRate
        ? '#eab308' // yellow-500
        : '#dc2626'; // red-600

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Success Rate Trend
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Average: {avgSuccessRate.toFixed(1)}% | Target: {targetRate}%
          </p>
        </div>

        <TimePeriodSelector selected={period} onChange={handlePeriodChange} />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />

          <YAxis
            domain={[90, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />

          {/* Target threshold line */}
          <ReferenceLine
            y={targetRate}
            stroke="#16a34a"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Target (${targetRate}%)`,
              position: 'right',
              fill: '#16a34a',
              fontSize: 12,
            }}
          />

          {/* Warning threshold line */}
          <ReferenceLine
            y={warningRate}
            stroke="#eab308"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: `Warning (${warningRate}%)`,
              position: 'right',
              fill: '#eab308',
              fontSize: 12,
            }}
          />

          {/* Success rate line */}
          <Line
            type="monotone"
            dataKey="successRate"
            stroke={lineColor}
            strokeWidth={3}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
            name="Success Rate"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Highest
          </p>
          <p className="text-lg font-semibold text-green-600 mt-1">
            {Math.max(...chartData.map((d) => d.successRate)).toFixed(1)}%
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Lowest
          </p>
          <p className="text-lg font-semibold text-red-600 mt-1">
            {Math.min(...chartData.map((d) => d.successRate)).toFixed(1)}%
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Total Generations
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {chartData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SuccessRateChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between mb-6">
        <div>
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
        </div>
        <div className="h-10 w-64 bg-gray-200 rounded" />
      </div>
      <div className="h-[300px] bg-gray-100 rounded" />
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-300 rounded mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
