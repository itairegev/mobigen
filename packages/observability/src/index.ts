/**
 * @mobigen/observability
 *
 * Observability tools for Mobigen services:
 * - Metrics: Prometheus-compatible metrics collection
 * - Logging: Structured JSON logging
 * - Health: Health checks and readiness probes
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
