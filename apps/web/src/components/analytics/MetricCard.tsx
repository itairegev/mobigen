'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({
  title,
  value,
  change,
  subtitle,
  icon,
  trend
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const changeBg = isPositive
    ? 'bg-green-50 dark:bg-green-900/20'
    : 'bg-red-50 dark:bg-red-900/20';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        {icon && <span className="text-2xl">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <div
            className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}
          >
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
