'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

export interface LineChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface LineChartProps {
  title: string;
  data?: LineChartDataPoint[];
  isLoading?: boolean;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  showLegend?: boolean;
  dataKey?: string;
}

export function LineChart({
  title,
  data = [],
  isLoading,
  color = '#3b82f6',
  height = 300,
  formatValue = (value) => value.toLocaleString(),
  granularity = 'day',
  showLegend = false,
  dataKey = 'value',
}: LineChartProps) {
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
            <div className="h-[300px] bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-slate-400">
            No data available for this time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              <XAxis
                dataKey="formattedDate"
                stroke="#6b7280"
                className="dark:stroke-slate-400"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                className="dark:stroke-slate-400"
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
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
