/**
 * SLA Monitor Service for Enterprise Users
 * Tracks service uptime, detects incidents, and generates SLA reports
 * Target: 99.9% uptime guarantee
 */

import { PrismaClient } from '@prisma/client';
import type {
  ServiceType,
  SLAMetrics,
  UptimeRecord,
  IncidentRecord,
  SLAReport,
  SLAConfiguration,
  HealthCheckResult,
  SLADashboardData,
  IncidentSeverity,
  IncidentStatus,
  SLAAlert,
} from './sla-types';

const prisma = new PrismaClient();

export class SLAMonitor {
  private config: SLAConfiguration;

  constructor(config?: Partial<SLAConfiguration>) {
    this.config = {
      serviceTargets: [
        { serviceType: 'api', targetSLA: 0.999, maxDowntimeMs: 43200000 }, // 43.2 minutes/month
        { serviceType: 'generator', targetSLA: 0.999, maxDowntimeMs: 43200000 },
        { serviceType: 'builder', targetSLA: 0.999, maxDowntimeMs: 43200000 },
        { serviceType: 'preview', targetSLA: 0.995, maxDowntimeMs: 216000000 }, // 3.6 hours/month
        { serviceType: 'analytics', targetSLA: 0.995, maxDowntimeMs: 216000000 },
        { serviceType: 'database', targetSLA: 0.9995, maxDowntimeMs: 21600000 }, // 21.6 minutes/month
      ],
      healthCheckInterval: 60000, // 1 minute
      healthCheckTimeout: 5000, // 5 seconds
      healthCheckRetries: 3,
      incidentThreshold: 3, // 3 consecutive failures
      autoResolveAfter: 300000, // 5 minutes of healthy checks
      alertOnIncident: true,
      alertRecipients: [],
      alertWebhooks: [],
      reportingEnabled: true,
      reportingFrequency: 'monthly',
      reportRecipients: [],
      ...config,
    };
  }

  /**
   * Track service uptime by recording health check result
   */
  async trackUptime(
    serviceId: string,
    serviceType: ServiceType,
    healthCheck: HealthCheckResult
  ): Promise<UptimeRecord> {
    const record: UptimeRecord = {
      id: this.generateId(),
      serviceId,
      serviceType,
      checkTimestamp: healthCheck.timestamp,
      isHealthy: healthCheck.healthy,
      responseTimeMs: healthCheck.responseTimeMs,
      statusCode: healthCheck.statusCode || null,
      region: healthCheck.region,
      errorMessage: healthCheck.error?.message,
      errorCode: healthCheck.error?.code,
      metadata: healthCheck.metadata,
    };

    // Store in database
    await prisma.$executeRaw`
      INSERT INTO uptime_records (
        id, service_id, service_type, check_timestamp, is_healthy,
        response_time_ms, status_code, region, error_message,
        error_code, metadata
      ) VALUES (
        ${record.id}, ${record.serviceId}, ${record.serviceType},
        ${record.checkTimestamp}, ${record.isHealthy}, ${record.responseTimeMs},
        ${record.statusCode}, ${record.region || null}, ${record.errorMessage || null},
        ${record.errorCode || null}, ${JSON.stringify(record.metadata || {})}
      )
    `;

    // Check if we need to create or update incident
    if (!healthCheck.healthy) {
      await this.handleUnhealthyCheck(serviceId, serviceType, record);
    } else {
      await this.handleHealthyCheck(serviceId, serviceType);
    }

    return record;
  }

  /**
   * Calculate SLA metrics for a service over a time period
   */
  async calculateSLA(
    serviceId: string,
    period: { start: Date; end: Date }
  ): Promise<SLAMetrics> {
    const serviceType = await this.getServiceType(serviceId);
    const targetConfig = this.config.serviceTargets.find(
      (t) => t.serviceType === serviceType
    );
    const targetSLA = targetConfig?.targetSLA || 0.999;

    // Calculate total time in period
    const totalTimeMs = period.end.getTime() - period.start.getTime();

    // Get all uptime records in period
    const records = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM uptime_records
      WHERE service_id = ${serviceId}
        AND check_timestamp >= ${period.start}
        AND check_timestamp <= ${period.end}
      ORDER BY check_timestamp ASC
    `;

    // Calculate downtime
    let downtimeMs = 0;
    let currentIncidentStart: Date | null = null;

    for (const record of records) {
      if (!record.is_healthy && !currentIncidentStart) {
        currentIncidentStart = record.check_timestamp;
      } else if (record.is_healthy && currentIncidentStart) {
        downtimeMs += record.check_timestamp.getTime() - currentIncidentStart.getTime();
        currentIncidentStart = null;
      }
    }

    // If still in incident at end of period
    if (currentIncidentStart) {
      downtimeMs += period.end.getTime() - currentIncidentStart.getTime();
    }

    const uptimeMs = totalTimeMs - downtimeMs;
    const uptimePercentage = (uptimeMs / totalTimeMs) * 100;

    // Get incidents in period
    const incidents = await this.getIncidents(serviceId, period);

    // Calculate MTTD and MTTR
    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
    const meanTimeToDetect =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum, i) => {
            return sum + (i.detectedAt.getTime() - (i.detectedAt.getTime() - 60000)); // Simplified
          }, 0) / resolvedIncidents.length
        : null;

    const meanTimeToResolve =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum, i) => {
            return (
              sum +
              ((i.resolvedAt?.getTime() || 0) - i.detectedAt.getTime())
            );
          }, 0) / resolvedIncidents.length
        : null;

    // Get availability by region (if multi-region)
    const availability = await this.calculateRegionalAvailability(
      serviceId,
      period
    );

    return {
      serviceId,
      serviceType,
      period,
      totalTimeMs,
      uptimeMs,
      downtimeMs,
      uptimePercentage,
      targetSLA,
      metSLA: uptimePercentage >= targetSLA * 100,
      totalIncidents: incidents.length,
      criticalIncidents: incidents.filter((i) => i.severity === 'critical').length,
      majorIncidents: incidents.filter((i) => i.severity === 'major').length,
      minorIncidents: incidents.filter((i) => i.severity === 'minor').length,
      meanTimeToDetect,
      meanTimeToResolve,
      availability,
    };
  }

  /**
   * Get incidents for a service in a time period
   */
  async getIncidents(
    serviceId: string,
    period: { start: Date; end: Date }
  ): Promise<IncidentRecord[]> {
    const incidents = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM incidents
      WHERE service_id = ${serviceId}
        AND detected_at >= ${period.start}
        AND detected_at <= ${period.end}
      ORDER BY detected_at DESC
    `;

    return incidents.map((i) => ({
      id: i.id,
      serviceId: i.service_id,
      serviceType: i.service_type,
      title: i.title,
      description: i.description,
      severity: i.severity,
      status: i.status,
      affectedRegions: i.affected_regions || [],
      affectedUsers: i.affected_users,
      impactDescription: i.impact_description,
      detectedAt: i.detected_at,
      identifiedAt: i.identified_at,
      resolvedAt: i.resolved_at,
      durationMs: i.duration_ms,
      rootCause: i.root_cause,
      resolution: i.resolution,
      updates: i.updates || [],
      metadata: i.metadata,
    }));
  }

  /**
   * Generate comprehensive SLA report
   */
  async generateReport(period: {
    start: Date;
    end: Date;
  }): Promise<SLAReport> {
    const reportId = this.generateId();

    // Get all services
    const services = await this.getAllServices();

    // Calculate metrics for each service
    const serviceMetrics: SLAMetrics[] = [];
    let totalDowntimeMs = 0;
    let totalIncidents = 0;

    for (const service of services) {
      const metrics = await this.calculateSLA(service.id, period);
      serviceMetrics.push(metrics);
      totalDowntimeMs += metrics.downtimeMs;
      totalIncidents += metrics.totalIncidents;
    }

    // Calculate overall SLA
    const totalTimeMs = period.end.getTime() - period.start.getTime();
    const overallSLA = ((totalTimeMs - totalDowntimeMs) / totalTimeMs) * 100;
    const targetSLA = 99.9;
    const metSLATarget = overallSLA >= targetSLA;

    // Get notable incidents (critical and major)
    const allIncidents = await Promise.all(
      services.map((s) => this.getIncidents(s.id, period))
    );
    const notableIncidents = allIncidents
      .flat()
      .filter((i) => i.severity === 'critical' || i.severity === 'major')
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, 10);

    // Format downtime
    const totalDowntimeFormatted = this.formatDuration(totalDowntimeMs);

    // Compare with previous period (if available)
    const comparisonPeriod = this.getPreviousPeriod(period);
    const previousMetrics = await this.calculatePeriodMetrics(comparisonPeriod);

    const uptimeTrend = previousMetrics
      ? ((overallSLA - previousMetrics.uptime) / previousMetrics.uptime) * 100
      : undefined;

    const incidentTrend = previousMetrics
      ? ((totalIncidents - previousMetrics.incidents) /
          (previousMetrics.incidents || 1)) *
        100
      : undefined;

    // Calculate SLA credits (if SLA was breached)
    const slaCreditsOwed = !metSLATarget
      ? this.calculateSLACredits(overallSLA, targetSLA, period)
      : [];

    const report: SLAReport = {
      reportId,
      generatedAt: new Date(),
      period,
      overallSLA,
      metSLATarget,
      targetSLA,
      services: serviceMetrics,
      totalIncidents,
      totalDowntimeMs,
      totalDowntimeFormatted,
      comparisonPeriod,
      uptimeTrend,
      incidentTrend,
      notableIncidents,
      slaCreditsOwed,
    };

    // Store report in database
    await this.storeReport(report);

    return report;
  }

  /**
   * Get current SLA dashboard data
   */
  async getDashboardData(): Promise<SLADashboardData> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get current status for all services
    const services = await this.getAllServices();
    const currentStatus = await Promise.all(
      services.map(async (service) => {
        const lastCheck = await this.getLastHealthCheck(service.id);
        const metrics = await this.calculateSLA(service.id, {
          start: thirtyDaysAgo,
          end: now,
        });

        return {
          serviceType: service.type,
          isHealthy: lastCheck?.is_healthy || false,
          lastCheckAt: lastCheck?.check_timestamp || new Date(),
          uptimePercentage: metrics.uptimePercentage,
        };
      })
    );

    // Get recent incidents (last 30 days)
    const recentIncidents = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM incidents
      WHERE detected_at >= ${thirtyDaysAgo}
      ORDER BY detected_at DESC
      LIMIT 20
    `;

    // Generate uptime chart data (daily aggregation)
    const uptimeChart = await this.generateUptimeChart(thirtyDaysAgo, now);

    // Calculate SLA compliance for current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthMetrics = await this.calculatePeriodMetrics({
      start: monthStart,
      end: now,
    });

    const slaCompliance = {
      period: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      target: 99.9,
      actual: monthMetrics.uptime,
      met: monthMetrics.uptime >= 99.9,
    };

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(thirtyDaysAgo, now);

    return {
      currentStatus,
      recentIncidents: recentIncidents.map((i) => this.mapIncident(i)),
      uptimeChart,
      slaCompliance,
      performanceMetrics,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async handleUnhealthyCheck(
    serviceId: string,
    serviceType: ServiceType,
    record: UptimeRecord
  ): Promise<void> {
    // Check how many consecutive failures
    const recentFailures = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM uptime_records
      WHERE service_id = ${serviceId}
        AND check_timestamp <= ${record.checkTimestamp}
      ORDER BY check_timestamp DESC
      LIMIT ${this.config.incidentThreshold}
    `;

    const allFailed = recentFailures.every((r) => !r.is_healthy);

    if (allFailed && recentFailures.length === this.config.incidentThreshold) {
      // Create incident
      await this.createIncident(serviceId, serviceType, record);
    } else {
      // Update existing incident
      await this.updateIncident(serviceId, record);
    }
  }

  private async handleHealthyCheck(
    serviceId: string,
    serviceType: ServiceType
  ): Promise<void> {
    // Check for open incidents
    const openIncidents = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM incidents
      WHERE service_id = ${serviceId}
        AND status != 'resolved'
      ORDER BY detected_at DESC
      LIMIT 1
    `;

    if (openIncidents.length > 0) {
      // Check if we should auto-resolve
      const incident = openIncidents[0];
      const now = new Date();
      const timeSinceIncident = now.getTime() - incident.detected_at.getTime();

      if (timeSinceIncident >= this.config.autoResolveAfter) {
        await this.resolveIncident(incident.id);
      }
    }
  }

  private async createIncident(
    serviceId: string,
    serviceType: ServiceType,
    trigger: UptimeRecord
  ): Promise<void> {
    const incident: Partial<IncidentRecord> = {
      id: this.generateId(),
      serviceId,
      serviceType,
      title: `${serviceType} service outage`,
      description: trigger.errorMessage || 'Service health check failed',
      severity: this.determineSeverity(serviceType),
      status: 'investigating',
      affectedRegions: trigger.region ? [trigger.region] : [],
      detectedAt: trigger.checkTimestamp,
      updates: [
        {
          timestamp: trigger.checkTimestamp,
          status: 'investigating',
          message: 'Incident detected, investigating',
        },
      ],
    };

    await prisma.$executeRaw`
      INSERT INTO incidents (
        id, service_id, service_type, title, description, severity,
        status, affected_regions, detected_at, updates
      ) VALUES (
        ${incident.id}, ${incident.serviceId}, ${incident.serviceType},
        ${incident.title}, ${incident.description}, ${incident.severity},
        ${incident.status}, ${JSON.stringify(incident.affectedRegions)},
        ${incident.detectedAt}, ${JSON.stringify(incident.updates)}
      )
    `;

    // Send alert
    if (this.config.alertOnIncident) {
      await this.sendAlert({
        type: 'incident_detected',
        serviceId,
        serviceType,
        incidentId: incident.id!,
        severity: incident.severity!,
        title: incident.title!,
        message: incident.description!,
      });
    }
  }

  private async updateIncident(
    serviceId: string,
    record: UptimeRecord
  ): Promise<void> {
    const openIncidents = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM incidents
      WHERE service_id = ${serviceId}
        AND status != 'resolved'
      ORDER BY detected_at DESC
      LIMIT 1
    `;

    if (openIncidents.length > 0) {
      const incident = openIncidents[0];
      const updates = [...(incident.updates || [])];
      updates.push({
        timestamp: record.checkTimestamp,
        status: incident.status,
        message: record.errorMessage || 'Service still unhealthy',
      });

      await prisma.$executeRaw`
        UPDATE incidents
        SET updates = ${JSON.stringify(updates)}
        WHERE id = ${incident.id}
      `;
    }
  }

  private async resolveIncident(incidentId: string): Promise<void> {
    const now = new Date();

    await prisma.$executeRaw`
      UPDATE incidents
      SET status = 'resolved',
          resolved_at = ${now},
          duration_ms = EXTRACT(EPOCH FROM (${now} - detected_at)) * 1000
      WHERE id = ${incidentId}
    `;

    // Send resolution alert
    const incident = await this.getIncidentById(incidentId);
    if (incident && this.config.alertOnIncident) {
      await this.sendAlert({
        type: 'incident_resolved',
        serviceId: incident.serviceId,
        serviceType: incident.serviceType,
        incidentId,
        severity: 'info',
        title: `${incident.serviceType} service restored`,
        message: `Incident resolved after ${this.formatDuration(incident.durationMs || 0)}`,
      });
    }
  }

  private determineSeverity(serviceType: ServiceType): IncidentSeverity {
    // Critical services: database, api, generator
    if (['database', 'api', 'generator'].includes(serviceType)) {
      return 'critical';
    }
    // Major services: builder
    if (['builder'].includes(serviceType)) {
      return 'major';
    }
    // Minor services: preview, analytics
    return 'minor';
  }

  private async sendAlert(alert: Partial<SLAAlert>): Promise<void> {
    const fullAlert: SLAAlert = {
      id: this.generateId(),
      timestamp: new Date(),
      recipients: this.config.alertRecipients,
      sent: false,
      ...alert,
    } as SLAAlert;

    // Store alert
    await prisma.$executeRaw`
      INSERT INTO sla_alerts (
        id, timestamp, type, severity, service_id, service_type,
        incident_id, title, message, recipients, sent
      ) VALUES (
        ${fullAlert.id}, ${fullAlert.timestamp}, ${fullAlert.type},
        ${fullAlert.severity}, ${fullAlert.serviceId}, ${fullAlert.serviceType},
        ${fullAlert.incidentId || null}, ${fullAlert.title}, ${fullAlert.message},
        ${JSON.stringify(fullAlert.recipients)}, ${fullAlert.sent}
      )
    `;

    // Send via webhooks
    for (const webhook of this.config.alertWebhooks) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullAlert),
        });
      } catch (error) {
        console.error('Failed to send webhook alert:', error);
      }
    }

    // Mark as sent
    await prisma.$executeRaw`
      UPDATE sla_alerts
      SET sent = true, sent_at = ${new Date()}
      WHERE id = ${fullAlert.id}
    `;
  }

  private async calculateRegionalAvailability(
    serviceId: string,
    period: { start: Date; end: Date }
  ): Promise<{ region: string; uptimePercentage: number }[]> {
    const regions = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT region
      FROM uptime_records
      WHERE service_id = ${serviceId}
        AND region IS NOT NULL
        AND check_timestamp >= ${period.start}
        AND check_timestamp <= ${period.end}
    `;

    const availability = await Promise.all(
      regions.map(async ({ region }) => {
        const records = await prisma.$queryRaw<any[]>`
          SELECT is_healthy
          FROM uptime_records
          WHERE service_id = ${serviceId}
            AND region = ${region}
            AND check_timestamp >= ${period.start}
            AND check_timestamp <= ${period.end}
        `;

        const healthyCount = records.filter((r) => r.is_healthy).length;
        const uptimePercentage = (healthyCount / records.length) * 100;

        return { region, uptimePercentage };
      })
    );

    return availability;
  }

  private getPreviousPeriod(period: {
    start: Date;
    end: Date;
  }): { start: Date; end: Date } {
    const duration = period.end.getTime() - period.start.getTime();
    return {
      start: new Date(period.start.getTime() - duration),
      end: new Date(period.start.getTime()),
    };
  }

  private async calculatePeriodMetrics(period: {
    start: Date;
    end: Date;
  }): Promise<{ uptime: number; incidents: number }> {
    const services = await this.getAllServices();
    const metrics = await Promise.all(
      services.map((s) => this.calculateSLA(s.id, period))
    );

    const avgUptime =
      metrics.reduce((sum, m) => sum + m.uptimePercentage, 0) / metrics.length;
    const totalIncidents = metrics.reduce((sum, m) => sum + m.totalIncidents, 0);

    return { uptime: avgUptime, incidents: totalIncidents };
  }

  private calculateSLACredits(
    actualSLA: number,
    targetSLA: number,
    period: { start: Date; end: Date }
  ): { amount: number; currency: string; reason: string }[] {
    // Simplified SLA credit calculation
    // In production, this would be based on contract terms
    const slaBreachPercentage = targetSLA - actualSLA;

    if (slaBreachPercentage <= 0) return [];

    let creditPercentage = 0;
    if (slaBreachPercentage < 0.1) {
      creditPercentage = 10; // 10% credit
    } else if (slaBreachPercentage < 0.5) {
      creditPercentage = 25; // 25% credit
    } else {
      creditPercentage = 50; // 50% credit
    }

    return [
      {
        amount: creditPercentage,
        currency: 'percent',
        reason: `SLA breach: ${actualSLA.toFixed(2)}% (target: ${targetSLA}%)`,
      },
    ];
  }

  private async generateUptimeChart(
    start: Date,
    end: Date
  ): Promise<{ date: string; uptimePercentage: number; incidents: number }[]> {
    const days: { date: string; uptimePercentage: number; incidents: number }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const metrics = await this.calculatePeriodMetrics({
        start: dayStart,
        end: dayEnd,
      });

      days.push({
        date: current.toISOString().split('T')[0],
        uptimePercentage: metrics.uptime,
        incidents: metrics.incidents,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  private async getPerformanceMetrics(
    start: Date,
    end: Date
  ): Promise<
    {
      serviceType: ServiceType;
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
    }[]
  > {
    const services = await this.getAllServices();

    return Promise.all(
      services.map(async (service) => {
        const records = await prisma.$queryRaw<any[]>`
          SELECT response_time_ms
          FROM uptime_records
          WHERE service_id = ${service.id}
            AND check_timestamp >= ${start}
            AND check_timestamp <= ${end}
            AND response_time_ms IS NOT NULL
          ORDER BY response_time_ms ASC
        `;

        const responseTimes = records.map((r) => r.response_time_ms);
        const avgResponseTime =
          responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length || 0;

        const p95Index = Math.floor(responseTimes.length * 0.95);
        const p99Index = Math.floor(responseTimes.length * 0.99);

        return {
          serviceType: service.type,
          avgResponseTime,
          p95ResponseTime: responseTimes[p95Index] || 0,
          p99ResponseTime: responseTimes[p99Index] || 0,
        };
      })
    );
  }

  private async storeReport(report: SLAReport): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO sla_reports (
        id, generated_at, period_start, period_end, overall_sla,
        met_sla_target, target_sla, services, total_incidents,
        total_downtime_ms, comparison_period, uptime_trend,
        incident_trend, notable_incidents, sla_credits_owed
      ) VALUES (
        ${report.reportId}, ${report.generatedAt}, ${report.period.start},
        ${report.period.end}, ${report.overallSLA}, ${report.metSLATarget},
        ${report.targetSLA}, ${JSON.stringify(report.services)},
        ${report.totalIncidents}, ${report.totalDowntimeMs},
        ${JSON.stringify(report.comparisonPeriod || {})},
        ${report.uptimeTrend || null}, ${report.incidentTrend || null},
        ${JSON.stringify(report.notableIncidents)},
        ${JSON.stringify(report.slaCreditsOwed || [])}
      )
    `;
  }

  private async getAllServices(): Promise<{ id: string; type: ServiceType }[]> {
    // In production, this would query a services registry
    // For now, return hardcoded services
    return [
      { id: 'api-service', type: 'api' },
      { id: 'generator-service', type: 'generator' },
      { id: 'builder-service', type: 'builder' },
      { id: 'preview-service', type: 'preview' },
      { id: 'analytics-service', type: 'analytics' },
      { id: 'database-service', type: 'database' },
    ];
  }

  private async getServiceType(serviceId: string): Promise<ServiceType> {
    const services = await this.getAllServices();
    const service = services.find((s) => s.id === serviceId);
    return service?.type || 'api';
  }

  private async getLastHealthCheck(serviceId: string): Promise<any> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM uptime_records
      WHERE service_id = ${serviceId}
      ORDER BY check_timestamp DESC
      LIMIT 1
    `;

    return result[0] || null;
  }

  private async getIncidentById(incidentId: string): Promise<IncidentRecord | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT *
      FROM incidents
      WHERE id = ${incidentId}
      LIMIT 1
    `;

    return result[0] ? this.mapIncident(result[0]) : null;
  }

  private mapIncident(row: any): IncidentRecord {
    return {
      id: row.id,
      serviceId: row.service_id,
      serviceType: row.service_type,
      title: row.title,
      description: row.description,
      severity: row.severity,
      status: row.status,
      affectedRegions: row.affected_regions || [],
      affectedUsers: row.affected_users,
      impactDescription: row.impact_description,
      detectedAt: row.detected_at,
      identifiedAt: row.identified_at,
      resolvedAt: row.resolved_at,
      durationMs: row.duration_ms,
      rootCause: row.root_cause,
      resolution: row.resolution,
      updates: row.updates || [],
      metadata: row.metadata,
    };
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const slaMonitor = new SLAMonitor();
