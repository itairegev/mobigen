'use client';

/**
 * Enterprise SLA Dashboard
 * Displays uptime metrics, incidents, and SLA compliance
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface ServiceStatus {
  serviceType: string;
  isHealthy: boolean;
  lastCheckAt: Date;
  uptimePercentage: number;
}

interface Incident {
  id: string;
  serviceType: string;
  title: string;
  severity: 'critical' | 'major' | 'minor' | 'info';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  detectedAt: Date;
  resolvedAt?: Date;
  durationMs?: number;
}

interface UptimeChartData {
  date: string;
  uptimePercentage: number;
  incidents: number;
}

interface SLADashboardData {
  currentStatus: ServiceStatus[];
  recentIncidents: Incident[];
  uptimeChart: UptimeChartData[];
  slaCompliance: {
    period: string;
    target: number;
    actual: number;
    met: boolean;
  };
  performanceMetrics: {
    serviceType: string;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  }[];
}

export default function SLADashboardPage() {
  const [data, setData] = useState<SLADashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/enterprise/sla');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SLA data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const downloadReport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/enterprise/sla/report?format=${format}`);
      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sla-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const json = await response.json();
        const blob = new Blob([JSON.stringify(json.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sla-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading SLA dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const healthyServices = data.currentStatus.filter((s) => s.isHealthy).length;
  const totalServices = data.currentStatus.length;
  const overallHealth = (healthyServices / totalServices) * 100;

  const activeIncidents = data.recentIncidents.filter(
    (i) => i.status !== 'resolved'
  ).length;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">SLA Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Enterprise-grade uptime monitoring and SLA compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Activity className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => downloadReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button variant="outline" onClick={() => downloadReport('json')}>
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </div>
      </div>

      {/* SLA Compliance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {data.slaCompliance.met ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            SLA Compliance - {data.slaCompliance.period}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Target SLA</p>
              <p className="text-3xl font-bold">{data.slaCompliance.target}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Actual SLA</p>
              <p
                className={`text-3xl font-bold ${
                  data.slaCompliance.met ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.slaCompliance.actual.toFixed(3)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <Badge
                variant={data.slaCompliance.met ? 'success' : 'destructive'}
                className="text-lg px-4 py-1"
              >
                {data.slaCompliance.met ? 'Meeting SLA' : 'Below Target'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Health</p>
                <p className="text-2xl font-bold mt-1">
                  {overallHealth.toFixed(1)}%
                </p>
              </div>
              {overallHealth === 100 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : overallHealth >= 80 ? (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {healthyServices} of {totalServices} services healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Incidents</p>
                <p className="text-2xl font-bold mt-1">{activeIncidents}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {data.recentIncidents.length} total in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(
                    data.performanceMetrics.reduce(
                      (sum, m) => sum + m.avgResponseTime,
                      0
                    ) / data.performanceMetrics.length
                  )}
                  ms
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">30-Day Uptime</p>
                <p className="text-2xl font-bold mt-1">
                  {(
                    data.uptimeChart.reduce((sum, d) => sum + d.uptimePercentage, 0) /
                    data.uptimeChart.length
                  ).toFixed(2)}
                  %
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.currentStatus.map((service) => (
              <div
                key={service.serviceType}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.isHealthy ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <p className="font-semibold capitalize">
                      {service.serviceType.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Last checked:{' '}
                      {new Date(service.lastCheckAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {service.uptimePercentage.toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-600">30-day uptime</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uptime Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>30-Day Uptime Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.uptimeChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[99, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="uptimePercentage"
                stroke="#10b981"
                strokeWidth={2}
                name="Uptime %"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Response Time Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.performanceMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="serviceType" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgResponseTime" fill="#3b82f6" name="Average" />
              <Bar dataKey="p95ResponseTime" fill="#8b5cf6" name="P95" />
              <Bar dataKey="p99ResponseTime" fill="#ec4899" name="P99" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentIncidents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <p className="text-gray-600">No incidents in the last 30 days</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentIncidents.slice(0, 10).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex gap-4">
                    <div>
                      <Badge
                        variant={
                          incident.severity === 'critical'
                            ? 'destructive'
                            : incident.severity === 'major'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {incident.severity}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{incident.title}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {incident.serviceType} •{' '}
                        {new Date(incident.detectedAt).toLocaleString()}
                      </p>
                      {incident.resolvedAt && incident.durationMs && (
                        <p className="text-sm text-gray-600 mt-1">
                          Duration: {formatDuration(incident.durationMs)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      incident.status === 'resolved' ? 'success' : 'warning'
                    }
                  >
                    {incident.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
