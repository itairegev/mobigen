'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@mobigen/ui';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

export interface BarChartDataPoint {
  timestamp?: string;
  label: string;
  value: number;
  category?: string;
}

export interface BarChartProps {
  title: string;
  data?: BarChartDataPoint[];
  isLoading?: boolean;
  color?: string;
  colors?: string[];
  height?: number;
  formatValue?: (value: number) => string;
  granularity?: 'hour' | 'day' | 'week' | 'month';
  showLegend?: boolean;
  dataKey?: string;
  horizontal?: boolean;
}

export function BarChart({
  title,
  data = [],
  isLoading,
  color = '#3b82f6',
  colors,
  height = 300,
  formatValue = (value) => value.toLocaleString(),
  granularity = 'day',
  showLegend = false,
  dataKey = 'value',
  horizontal = false,
}: BarChartProps) {
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
    formattedDate: point.timestamp ? formatDate(point.timestamp) : point.label,
  }));

  const defaultColors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ];

  const barColors = colors || [color];

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
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart
              data={chartData}
              layout={horizontal ? 'vertical' : 'horizontal'}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-slate-700" />
              {horizontal ? (
                <>
                  <XAxis
                    type="number"
                    stroke="#6b7280"
                    className="dark:stroke-slate-400"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={formatValue}
                  />
                  <YAxis
                    type="category"
                    dataKey="formattedDate"
                    stroke="#6b7280"
                    className="dark:stroke-slate-400"
                    fontSize={12}
                    tickLine={false}
                  />
                </>
              ) : (
                <>
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
                </>
              )}
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
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={barColors[index % barColors.length]}
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
