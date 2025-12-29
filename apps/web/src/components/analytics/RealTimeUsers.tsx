'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';

interface RealTimeData {
  activeNow: number;
  activeLast5Min: number;
  activeLast15Min: number;
  timestamp: string;
}

interface RealTimeUsersProps {
  projectId: string;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function RealTimeUsers({
  projectId,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30,
}: RealTimeUsersProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      onRefresh?.();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Mock data - in production would come from real-time analytics
  const data: RealTimeData = {
    activeNow: Math.floor(Math.random() * 50) + 10,
    activeLast5Min: Math.floor(Math.random() * 100) + 20,
    activeLast15Min: Math.floor(Math.random() * 200) + 50,
    timestamp: lastUpdate.toISOString(),
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Real-Time Activity</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {data.activeNow}
              </div>
              <div className="text-sm text-gray-500">Active right now</div>
            </div>
            <div className="text-6xl">👥</div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last 5 minutes</span>
              <span className="font-semibold text-gray-900">
                {data.activeLast5Min}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last 15 minutes</span>
              <span className="font-semibold text-gray-900">
                {data.activeLast15Min}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-400 text-right">
            Updated {formatTimeAgo(lastUpdate)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
