'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';
import { MetricCard } from './MetricCard';

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
