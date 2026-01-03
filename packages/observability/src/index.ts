/**
 * @mobigen/observability
 *
 * Observability tools for Mobigen services:
 * - Metrics: Prometheus-compatible metrics collection
 * - Logging: Structured JSON logging
 * - Health: Health checks and readiness probes
 * - Alerts: Alert rules and notifications for quality metrics
 * - Tracing: Distributed tracing (coming soon)
 */

export {
  Counter,
  Gauge,
  Histogram,
  MetricsRegistry,
  defaultRegistry,
  mobigenMetrics,
  type MetricType,
  type MetricLabels,
  type MetricValue,
  type MetricDefinition,
} from './metrics';

export {
  Logger,
  createLogger,
  defaultLogger,
  requestLoggingMiddleware,
  LogContextManager,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerOptions,
} from './logger';

export {
  HealthCheckManager,
  createHealthCheckManager,
  healthChecks,
  type HealthStatus,
  type HealthCheckResult,
  type HealthReport,
  type HealthChecker,
  type HealthCheckOptions,
} from './health';

export {
  AlertManager,
  AlertEvaluator,
  AlertHistory,
  SlackChannel,
  EmailChannel,
  defaultAlertRules,
  MetricCalculator,
  AlertSeverity,
  AlertStatus,
  type AlertRule,
  type TriggeredAlert,
  type AlertResult,
  type AlertHistoryEntry,
  type AlertManagerConfig,
  type AlertQueryOptions,
  type NotificationChannel,
  type ChannelConfig,
  type ComparisonOperator,
} from './alerts';
