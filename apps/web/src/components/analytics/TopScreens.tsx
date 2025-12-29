'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';

interface ScreenData {
  name: string;
  views: number;
  uniqueUsers: number;
  avgDuration: number;
}

interface TopScreensProps {
  data?: ScreenData[];
  isLoading?: boolean;
  limit?: number;
}

export function TopScreens({ data = [], isLoading, limit = 10 }: TopScreensProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Screens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayData = data.slice(0, limit);
  const maxViews = Math.max(...displayData.map((s) => s.views), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Screens</CardTitle>
      </CardHeader>
      <CardContent>
        {displayData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No screen data available</div>
        ) : (
          <div className="space-y-4">
            {displayData.map((screen, index) => {
              const percentage = (screen.views / maxViews) * 100;

              return (
                <div key={screen.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{screen.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatNumber(screen.uniqueUsers)} users · Avg{' '}
                          {formatDuration(screen.avgDuration)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatNumber(screen.views)}
                      </div>
                      <div className="text-xs text-gray-500">views</div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
