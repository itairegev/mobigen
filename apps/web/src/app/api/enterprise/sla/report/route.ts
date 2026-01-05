/**
 * Enterprise SLA Report API
 * GET /api/enterprise/sla/report - Download SLA report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Stub for SLA monitor - in production this would be a real service
const slaMonitor = {
  generateReport: async (period: { start: Date; end: Date }) => ({
    reportId: `report-${Date.now()}`,
    period,
    generatedAt: new Date(),
    overallSLA: 99.95,
    targetSLA: 99.9,
    metSLATarget: true,
    totalIncidents: 3,
    totalDowntimeMs: 1800000,
    totalDowntimeFormatted: '30m',
    services: [
      { serviceType: 'api', uptimePercentage: 99.99, downtimeMs: 60000, totalIncidents: 1, criticalIncidents: 0, majorIncidents: 0, minorIncidents: 1 },
      { serviceType: 'generator', uptimePercentage: 99.9, downtimeMs: 600000, totalIncidents: 2, criticalIncidents: 0, majorIncidents: 1, minorIncidents: 1 },
    ],
    notableIncidents: [],
  }),
};

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is Enterprise tier
    const userTier = (session.user as any).tier || 'basic';

    if (userTier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Forbidden: Enterprise tier required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('period') || 'month';
    const format = searchParams.get('format') || 'json';

    // Calculate period
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (periodType) {
      case 'day':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Custom period
        const startParam = searchParams.get('start');
        const endParam = searchParams.get('end');
        if (startParam && endParam) {
          start = new Date(startParam);
          end = new Date(endParam);
        } else {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }

    // Generate report
    const report = await slaMonitor.generateReport({ start, end });

    // Return report in requested format
    if (format === 'pdf') {
      // TODO: Generate PDF report
      return NextResponse.json(
        { error: 'PDF format not yet implemented' },
        { status: 501 }
      );
    }

    if (format === 'csv') {
      // Generate CSV report
      const csv = generateCSVReport(report);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sla-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: JSON
    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('SLA report API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function generateCSVReport(report: any): string {
  const lines: string[] = [];

  // Header
  lines.push('Mobigen SLA Report');
  lines.push(`Report ID,${report.reportId}`);
  lines.push(`Period,${report.period.start.toISOString()} to ${report.period.end.toISOString()}`);
  lines.push(`Generated At,${report.generatedAt.toISOString()}`);
  lines.push('');

  // Summary
  lines.push('Summary');
  lines.push('Metric,Value');
  lines.push(`Overall SLA,${report.overallSLA.toFixed(2)}%`);
  lines.push(`Target SLA,${report.targetSLA}%`);
  lines.push(`Met SLA Target,${report.metSLATarget ? 'Yes' : 'No'}`);
  lines.push(`Total Incidents,${report.totalIncidents}`);
  lines.push(`Total Downtime,${report.totalDowntimeFormatted}`);
  lines.push('');

  // Service metrics
  lines.push('Service Metrics');
  lines.push('Service,Uptime %,Downtime,Incidents,Critical,Major,Minor');

  for (const service of report.services) {
    lines.push(
      [
        service.serviceType,
        service.uptimePercentage.toFixed(2) + '%',
        formatDuration(service.downtimeMs),
        service.totalIncidents,
        service.criticalIncidents,
        service.majorIncidents,
        service.minorIncidents,
      ].join(',')
    );
  }

  lines.push('');

  // Notable incidents
  if (report.notableIncidents.length > 0) {
    lines.push('Notable Incidents');
    lines.push('Service,Severity,Title,Detected At,Resolved At,Duration');

    for (const incident of report.notableIncidents) {
      lines.push(
        [
          incident.serviceType,
          incident.severity,
          `"${incident.title}"`,
          incident.detectedAt.toISOString(),
          incident.resolvedAt?.toISOString() || 'Ongoing',
          incident.durationMs ? formatDuration(incident.durationMs) : 'N/A',
        ].join(',')
      );
    }
  }

  return lines.join('\n');
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
