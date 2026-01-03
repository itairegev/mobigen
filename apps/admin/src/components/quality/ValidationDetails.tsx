/**
 * ValidationDetails Component
 *
 * Detailed view of validation results with error breakdowns.
 * Features:
 * - Breakdown by validation tier
 * - Error categories pie chart
 * - File-level error list
 * - Expandable error details
 * - Auto-fix indicators
 */

'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ErrorBreakdown, ValidationTier, ErrorCategory } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ValidationDetailsProps {
  errorBreakdown: ErrorBreakdown[];
  tierStats?: {
    tier1: { passed: number; failed: number };
    tier2: { passed: number; failed: number };
    tier3: { passed: number; failed: number };
  };
  className?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR CATEGORY COLORS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CATEGORY_COLORS: Record<ErrorCategory, string> = {
  syntax: '#ef4444', // red-500
  type: '#f97316', // orange-500
  import: '#f59e0b', // amber-500
  navigation: '#eab308', // yellow-500
  styling: '#84cc16', // lime-500
  runtime: '#22c55e', // green-500
  build: '#14b8a6', // teal-500
  test: '#06b6d4', // cyan-500
};

const CATEGORY_LABELS: Record<ErrorCategory, string> = {
  syntax: 'Syntax Errors',
  type: 'Type Errors',
  import: 'Import Errors',
  navigation: 'Navigation',
  styling: 'Styling',
  runtime: 'Runtime',
  build: 'Build',
  test: 'Test Failures',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIER STATS COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TierStatsProps {
  tier: ValidationTier;
  passed: number;
  failed: number;
}

function TierStats({ tier, passed, failed }: TierStatsProps) {
  const total = passed + failed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  const tierLabels = {
    tier1: 'Tier 1: Instant',
    tier2: 'Tier 2: Fast',
    tier3: 'Tier 3: Thorough',
  };

  const tierDescriptions = {
    tier1: 'TypeScript, ESLint, Imports',
    tier2: 'Bundler, Rendering, Doctor',
    tier3: 'Prebuild, E2E, Snapshots',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="text-sm font-medium text-gray-900">
            {tierLabels[tier]}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {tierDescriptions[tier]}
          </p>
        </div>

        <div className="text-right">
          <div
            className={`text-lg font-bold ${
              passRate >= 95
                ? 'text-green-600'
                : passRate >= 80
                  ? 'text-yellow-600'
                  : 'text-red-600'
            }`}
          >
            {passRate.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">
            {passed}/{total} passed
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            passRate >= 95
              ? 'bg-green-500'
              : passRate >= 80
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}
          style={{ width: `${passRate}%` }}
        />
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR CATEGORY PIE CHART
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ErrorCategoryChartProps {
  data: ErrorBreakdown[];
}

function ErrorCategoryChart({ data }: ErrorCategoryChartProps) {
  const chartData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category],
    value: item.count,
    percentage: item.percentage,
    color: CATEGORY_COLORS[item.category],
  }));

  return (
    <div className="bg-white">
      <h4 className="text-sm font-medium text-gray-900 mb-4">
        Error Distribution
      </h4>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry) => `${entry.percentage.toFixed(1)}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => [
              `${value} errors (${props.payload.percentage.toFixed(1)}%)`,
              name,
            ]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-xs text-gray-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR LIST COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ErrorListProps {
  breakdown: ErrorBreakdown[];
}

function ErrorList({ breakdown }: ErrorListProps) {
  const [expandedCategory, setExpandedCategory] = useState<ErrorCategory | null>(
    null
  );

  const toggleCategory = (category: ErrorCategory) => {
    setExpandedCategory(
      expandedCategory === category ? null : category
    );
  };

  // Sort by count descending
  const sortedBreakdown = [...breakdown].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        Error Details by Category
      </h4>

      {sortedBreakdown.map((item) => {
        const isExpanded = expandedCategory === item.category;
        const hasExamples = item.examples && item.examples.length > 0;

        return (
          <div
            key={item.category}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Category header */}
            <button
              onClick={() => hasExamples && toggleCategory(item.category)}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              disabled={!hasExamples}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                />
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {CATEGORY_LABELS[item.category]}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.count} error{item.count !== 1 ? 's' : ''} (
                    {item.percentage.toFixed(1)}%)
                  </div>
                </div>
              </div>

              {hasExamples && (
                <div className="text-gray-400">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </button>

            {/* Error examples */}
            {isExpanded && hasExamples && (
              <div className="border-t border-gray-200 bg-white">
                {item.examples.map((error, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      {error.severity === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-gray-700 truncate">
                            {error.file}
                            {error.line && `:${error.line}`}
                            {error.column && `:${error.column}`}
                          </code>
                          {error.fixable && (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                              <Wrench className="h-3 w-3" />
                              Auto-fixable
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-900 mt-1">
                          {error.message}
                        </p>

                        {error.code && (
                          <code className="text-xs text-gray-500 mt-1">
                            {error.code}
                          </code>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ValidationDetails({
  errorBreakdown,
  tierStats,
  className = '',
}: ValidationDetailsProps) {
  const totalErrors = errorBreakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Validation Details
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {totalErrors} total errors across all validations
        </p>
      </div>

      <div className="p-6">
        {/* Tier stats */}
        {tierStats && (
          <div className="mb-8 space-y-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Validation Tier Performance
            </h4>
            <TierStats
              tier="tier1"
              passed={tierStats.tier1.passed}
              failed={tierStats.tier1.failed}
            />
            <TierStats
              tier="tier2"
              passed={tierStats.tier2.passed}
              failed={tierStats.tier2.failed}
            />
            <TierStats
              tier="tier3"
              passed={tierStats.tier3.passed}
              failed={tierStats.tier3.failed}
            />
          </div>
        )}

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Error pie chart */}
          <ErrorCategoryChart data={errorBreakdown} />

          {/* Summary stats */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              Top Error Categories
            </h4>
            <div className="space-y-3">
              {errorBreakdown
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                      />
                      <span className="text-sm text-gray-700">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.count}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Error list */}
        <div className="mt-8">
          <ErrorList breakdown={errorBreakdown} />
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function ValidationDetailsSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
      </div>
      <div className="p-6">
        <div className="space-y-3 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-50 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="h-64 bg-gray-100 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
