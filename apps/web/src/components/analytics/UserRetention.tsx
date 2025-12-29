'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';

interface RetentionCohort {
  cohortStart: string;
  cohortSize: number;
  retention: number[]; // Array of retention percentages for each period
}

interface UserRetentionProps {
  data?: RetentionCohort[];
  isLoading?: boolean;
  isPro?: boolean;
}

export function UserRetention({ data = [], isLoading, isPro = false }: UserRetentionProps) {
  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pro Feature
            </h3>
            <p className="text-gray-600 mb-4">
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
          <CardTitle>User Retention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
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

  const maxPeriods = Math.max(...data.map((c) => c.retention.length));

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Retention Cohorts</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          Percentage of users who return after their first visit
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No retention data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-gray-600">
                    Cohort
                  </th>
                  <th className="text-right py-2 px-2 font-medium text-gray-600">
                    Size
                  </th>
                  {Array.from({ length: maxPeriods }).map((_, i) => (
                    <th
                      key={i}
                      className="text-center py-2 px-2 font-medium text-gray-600 min-w-[60px]"
                    >
                      Week {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((cohort) => (
                  <tr key={cohort.cohortStart} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium text-gray-900">
                      {new Date(cohort.cohortStart).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-2 px-2 text-right text-gray-600">
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
                            <div className="w-12 h-8 bg-gray-100 rounded"></div>
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
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
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
