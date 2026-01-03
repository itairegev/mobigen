'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';

export interface RetentionCohort {
  cohortStart: string;
  cohortSize: number;
  retention: number[]; // Array of retention percentages for each period
}

export interface RetentionGridProps {
  data?: RetentionCohort[];
  isLoading?: boolean;
  isPro?: boolean;
  periodLabel?: string;
}

export function RetentionGrid({
  data = [],
  isLoading,
  isPro = false,
  periodLabel = 'Week',
}: RetentionGridProps) {
  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Pro Feature
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Retention cohort analysis is available in Pro and Enterprise plans
            </p>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors">
              Upgrade to Pro
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Retention Cohorts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRetentionColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-green-400';
    if (percentage >= 40) return 'bg-yellow-400';
    if (percentage >= 30) return 'bg-orange-400';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const maxPeriods = Math.max(...data.map((c) => c.retention.length), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Retention Cohorts</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Percentage of users who return after their first visit
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No retention data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 font-medium text-slate-600 dark:text-slate-400">
                    Cohort
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-slate-600 dark:text-slate-400">
                    Size
                  </th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th
                      key={i}
                      className="text-center py-2 px-2 font-medium text-slate-600 dark:text-slate-400 min-w-[60px]"
                    >
                      {periodLabel} {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((cohort) => (
                  <tr
                    key={cohort.cohortStart}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-2 px-2 font-medium text-slate-900 dark:text-white">
                      {new Date(cohort.cohortStart).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-2 px-2 text-right text-slate-600 dark:text-slate-400">
                      {cohort.cohortSize.toLocaleString()}
                    </td>
                    {cohort.retention.map((percentage, i) => (
                      <td key={i} className="py-2 px-2">
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-12 h-8 rounded flex items-center justify-center text-white text-xs font-medium ${getRetentionColor(
                              percentage
                            )}`}
                          >
                            {percentage}%
                          </div>
                        </div>
                      </td>
                    ))}
                    {Array.from({ length: maxPeriods - cohort.retention.length }).map(
                      (_, i) => (
                        <td key={`empty-${i}`} className="py-2 px-2">
                          <div className="flex items-center justify-center">
                            <div className="w-12 h-8 bg-slate-100 dark:bg-slate-800 rounded"></div>
                          </div>
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>70%+</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>40-70%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>20-40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>&lt;20%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
