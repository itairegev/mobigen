'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: string;
}

function MetricCard({ title, value, change, subtitle, icon }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const changeBg = isPositive ? 'bg-green-50' : 'bg-red-50';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {icon && <span className="text-2xl">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OverviewMetricsProps {
  data?: {
    dau: number;
    mau: number;
    totalSessions: number;
    sessionsLast7Days: number;
    totalBuilds: number;
    retention7Day: number;
    retention30Day: number;
  };
  isLoading?: boolean;
}

export function OverviewMetrics({ data, isLoading }: OverviewMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Daily Active Users"
        value={formatNumber(data.dau)}
        subtitle="Active users today"
        icon="👥"
      />
      <MetricCard
        title="Monthly Active Users"
        value={formatNumber(data.mau)}
        subtitle="Active users this month"
        icon="📊"
      />
      <MetricCard
        title="Sessions (7d)"
        value={formatNumber(data.sessionsLast7Days)}
        subtitle={`${formatNumber(data.totalSessions)} total sessions`}
        icon="🔄"
      />
      <MetricCard
        title="7-Day Retention"
        value={`${(data.retention7Day * 100).toFixed(1)}%`}
        subtitle={`${(data.retention30Day * 100).toFixed(1)}% 30-day retention`}
        icon="📈"
      />
    </div>
  );
}
