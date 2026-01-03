/**
 * SLA Monitoring Types for Enterprise Users
 * Tracks service uptime and provides 99.9% SLA guarantees
 */

export type ServiceType =
  | 'api'
  | 'generator'
  | 'builder'
  | 'preview'
  | 'analytics'
  | 'database';

export type IncidentSeverity =
  | 'critical'  // Complete service outage
  | 'major'     // Significant degradation
  | 'minor'     // Partial degradation
  | 'info';     // Maintenance or notification

export type IncidentStatus =
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved';

export interface SLAMetrics {
  serviceId: string;
  serviceType: ServiceType;
  period: {
    start: Date;
    end: Date;
  };

  // Uptime metrics
  totalTimeMs: number;
  uptimeMs: number;
  downtimeMs: number;
  uptimePercentage: number;

  // Target SLA
  targetSLA: number; // 99.9% = 0.999
  metSLA: boolean;

  // Incident summary
  totalIncidents: number;
  criticalIncidents: number;
  majorIncidents: number;
  minorIncidents: number;

  // Response metrics
  meanTimeToDetect: number | null; // Average time to detect incidents (ms)
  meanTimeToResolve: number | null; // Average time to resolve incidents (ms)

  // Availability zones (for multi-region)
  availability: {
    region: string;
    uptimePercentage: number;
  }[];
}

export interface UptimeRecord {
  id: string;
  serviceId: string;
  serviceType: ServiceType;

  // Health check details
  checkTimestamp: Date;
  isHealthy: boolean;
  responseTimeMs: number | null;
  statusCode: number | null;

  // Geographic location
  region?: string;

  // Error details (if unhealthy)
  errorMessage?: string;
  errorCode?: string;

  // Metadata
  metadata?: Record<string, any>;
}

export interface IncidentRecord {
  id: string;
  serviceId: string;
  serviceType: ServiceType;

  // Incident details
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;

  // Impact
  affectedRegions: string[];
  affectedUsers?: number;
  impactDescription?: string;

  // Timeline
  detectedAt: Date;
  identifiedAt?: Date;
  resolvedAt?: Date;

  // Metrics
  durationMs?: number;

  // Root cause analysis
  rootCause?: string;
  resolution?: string;

  // Updates
  updates: IncidentUpdate[];

  // Metadata
  metadata?: Record<string, any>;
}

export interface IncidentUpdate {
  timestamp: Date;
  status: IncidentStatus;
  message: string;
  updatedBy?: string;
}

export interface SLAReport {
  // Report metadata
  reportId: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };

  // Overall SLA
  overallSLA: number;
  metSLATarget: boolean;
  targetSLA: number;

  // Service-level metrics
  services: SLAMetrics[];

  // Summary
  totalIncidents: number;
  totalDowntimeMs: number;
  totalDowntimeFormatted: string; // "2h 15m"

  // Comparison with previous period
  comparisonPeriod?: {
    start: Date;
    end: Date;
  };
  uptimeTrend?: number; // Percentage change
  incidentTrend?: number; // Percentage change

  // Notable incidents
  notableIncidents: IncidentRecord[];

  // SLA credits (if applicable)
  slaCreditsOwed?: {
    amount: number;
    currency: string;
    reason: string;
  }[];
}

export interface SLAConfiguration {
  // Service-specific targets
  serviceTargets: {
    serviceType: ServiceType;
    targetSLA: number; // 0.999 = 99.9%
    maxDowntimeMs: number; // Max allowed downtime per month
  }[];

  // Health check settings
  healthCheckInterval: number; // milliseconds
  healthCheckTimeout: number; // milliseconds
  healthCheckRetries: number;

  // Incident settings
  incidentThreshold: number; // Number of failed checks before incident
  autoResolveAfter: number; // Auto-resolve after X ms of healthy checks

  // Alerting
  alertOnIncident: boolean;
  alertRecipients: string[]; // Email addresses
  alertWebhooks: string[]; // Webhook URLs

  // Reporting
  reportingEnabled: boolean;
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
  reportRecipients: string[];
}

export interface HealthCheckResult {
  serviceId: string;
  serviceType: ServiceType;
  timestamp: Date;

  // Check result
  healthy: boolean;
  responseTimeMs: number;
  statusCode?: number;

  // Details
  endpoint?: string;
  method?: string;
  region?: string;

  // Error info
  error?: {
    message: string;
    code: string;
    stack?: string;
  };

  // Additional metadata
  metadata?: Record<string, any>;
}

export interface SLADashboardData {
  // Current status
  currentStatus: {
    serviceType: ServiceType;
    isHealthy: boolean;
    lastCheckAt: Date;
    uptimePercentage: number; // Last 30 days
  }[];

  // Recent incidents
  recentIncidents: IncidentRecord[];

  // Uptime chart data (last 30 days)
  uptimeChart: {
    date: string;
    uptimePercentage: number;
    incidents: number;
  }[];

  // SLA compliance
  slaCompliance: {
    period: string;
    target: number;
    actual: number;
    met: boolean;
  };

  // Performance metrics
  performanceMetrics: {
    serviceType: ServiceType;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  }[];
}

export interface SLAAlert {
  id: string;
  timestamp: Date;

  // Alert details
  type: 'incident_detected' | 'sla_breach' | 'performance_degradation' | 'incident_resolved';
  severity: IncidentSeverity;

  // Related entities
  serviceId: string;
  serviceType: ServiceType;
  incidentId?: string;

  // Message
  title: string;
  message: string;

  // Recipients
  recipients: string[];

  // Status
  sent: boolean;
  sentAt?: Date;

  // Metadata
  metadata?: Record<string, any>;
}
