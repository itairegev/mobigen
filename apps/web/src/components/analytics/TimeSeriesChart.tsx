'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

interface TimeSeriesChartProps {
  title: string;
  data?: TimeSeriesDataPoint[];
  isLoading?: boolean;
  type?: 'line' | 'area';
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export function TimeSeriesChart({
  title,
  data = [],
  isLoading,
  type = 'area',
  color = '#3b82f6',
  height = 300,
  formatValue = (value) => value.toLocaleString(),
  granularity = 'day',
}: TimeSeriesChartProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (granularity) {
      case 'hour':
        return format(date, 'HH:mm');
      case 'day':
        return format(date, 'MMM d');
      case 'week':
        return format(date, 'MMM d');
      case 'month':
        return format(date, 'MMM yyyy');
      default:
        return format(date, 'MMM d');
    }
  };

  const chartData = data.map((point) => ({
    ...point,
    formattedDate: formatDate(point.timestamp),
  }));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[300px] bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'area' ? Area : Line;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="formattedDate"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={formatValue}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
                formatter={(value: number) => [formatValue(value), 'Value']}
              />
              {type === 'area' ? (
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
