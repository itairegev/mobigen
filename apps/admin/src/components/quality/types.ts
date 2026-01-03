/**
 * Quality Dashboard TypeScript Types
 *
 * Defines all interfaces and types for the Mobigen quality monitoring system.
 * Based on the 3-tier validation pipeline from TECHNICAL-DESIGN-mobigen.md
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE METRICS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface QualityMetrics {
  /** Overall success rate (0-100) */
  successRate: number;

  /** Percentage of failures auto-fixed (0-100) */
  autoFixRate: number;

  /** Average generation duration in seconds */
  avgDuration: number;

  /** Number of active alerts */
  activeAlerts: number;

  /** Total generations in period */
  totalGenerations: number;

  /** Successful generations */
  successfulGenerations: number;

  /** Failed generations */
  failedGenerations: number;

  /** Timestamp of last update */
  lastUpdated: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRICS TREND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface MetricTrend {
  /** Timestamp of the data point */
  timestamp: Date;

  /** Success rate at this point */
  successRate: number;

  /** Total generations at this point */
  totalGenerations: number;

  /** Failed generations at this point */
  failedGenerations: number;
}

export interface TrendData {
  /** Historical data points */
  data: MetricTrend[];

  /** Change from previous period (percentage points) */
  change: number;

  /** Direction of trend */
  direction: 'up' | 'down' | 'stable';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALERTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertType =
  | 'success_rate_drop'
  | 'high_failure_rate'
  | 'slow_generation'
  | 'template_degradation'
  | 'validation_timeout'
  | 'auto_fix_failure';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  details?: string;
  timestamp: Date;
  projectId?: string;
  templateId?: string;
  acknowledged: boolean;
  snoozedUntil?: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VALIDATION RESULTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ValidationTier = 'tier1' | 'tier2' | 'tier3';

export type ValidationCheckId =
  // Tier 1 (Instant)
  | 'typescript'
  | 'eslint-critical'
  | 'imports'
  | 'navigation'
  // Tier 2 (Fast)
  | 'eslint-full'
  | 'prettier'
  | 'metro-bundle'
  | 'expo-doctor'
  | 'component-render'
  // Tier 3 (Thorough)
  | 'expo-prebuild'
  | 'maestro-e2e'
  | 'visual-snapshots'
  | 'bundle-size';

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  code?: string;
  severity: 'error' | 'warning';
  fixable: boolean;
}

export interface ValidationCheckResult {
  id: ValidationCheckId;
  name: string;
  tier: ValidationTier;
  passed: boolean;
  duration: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  required: boolean;
  autoFixed?: boolean;
}

export interface ValidationResult {
  projectId: string;
  timestamp: Date;
  tier: ValidationTier;
  passed: boolean;
  duration: number;
  checks: ValidationCheckResult[];
  totalErrors: number;
  totalWarnings: number;
  attemptNumber?: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR CATEGORIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ErrorCategory =
  | 'syntax'
  | 'type'
  | 'import'
  | 'navigation'
  | 'styling'
  | 'runtime'
  | 'build'
  | 'test';

export interface ErrorBreakdown {
  category: ErrorCategory;
  count: number;
  percentage: number;
  examples: ValidationError[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEMPLATE CERTIFICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CertificationLevel = 'gold' | 'silver' | 'bronze' | 'uncertified';

export interface TemplateCertification {
  templateId: string;
  templateName: string;
  category: string;
  level: CertificationLevel;
  successRate: number;
  totalGenerations: number;
  lastCertified: Date;
  issues: TemplateIssue[];
  avgDuration: number;
}

export interface TemplateIssue {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  occurrences: number;
  lastOccurred: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIME PERIODS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type TimePeriod = '1h' | '24h' | '7d' | '30d' | '90d';

export interface TimeRange {
  start: Date;
  end: Date;
  period: TimePeriod;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface QualityDashboardData {
  metrics: QualityMetrics;
  trends: {
    successRate: TrendData;
    duration: TrendData;
    volume: TrendData;
  };
  alerts: Alert[];
  templates: TemplateCertification[];
  recentValidations: ValidationResult[];
  errorBreakdown: ErrorBreakdown[];
}

export interface QualityMetricsFilter {
  period?: TimePeriod;
  templateId?: string;
  tier?: ValidationTier;
  projectId?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// METRIC THRESHOLDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface MetricThresholds {
  successRate: {
    target: number;     // 99%
    warning: number;    // 95%
    critical: number;   // 90%
  };
  autoFixRate: {
    target: number;     // 80%
    warning: number;    // 60%
    critical: number;   // 40%
  };
  avgDuration: {
    target: number;     // seconds
    warning: number;
    critical: number;
  };
}

export const DEFAULT_THRESHOLDS: MetricThresholds = {
  successRate: {
    target: 99,
    warning: 95,
    critical: 90,
  },
  autoFixRate: {
    target: 80,
    warning: 60,
    critical: 40,
  },
  avgDuration: {
    target: 120,      // 2 minutes
    warning: 300,     // 5 minutes
    critical: 600,    // 10 minutes
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UI STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: TrendData;
  threshold?: {
    target: number;
    warning: number;
    critical: number;
  };
  format?: 'number' | 'percentage' | 'duration';
  className?: string;
}
