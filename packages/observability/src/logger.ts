/**
 * Structured Logging
 *
 * JSON-formatted logging with correlation IDs, context, and levels.
 * Compatible with CloudWatch, Datadog, and other log aggregators.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  service?: string;
  environment?: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerOptions {
  /** Service name for log entries */
  service?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Pretty print JSON (for development) */
  pretty?: boolean;
  /** Custom output function (defaults to console) */
  output?: (entry: LogEntry) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Structured Logger
 */
export class Logger {
  private options: Required<LoggerOptions>;
  private contextStack: LogContext[] = [];
  private correlationId?: string;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      service: options.service || 'mobigen',
      environment: options.environment || process.env.NODE_ENV || 'development',
      minLevel: options.minLevel || 'debug',
      pretty: options.pretty ?? (process.env.NODE_ENV === 'development'),
      output: options.output || this.defaultOutput.bind(this),
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.options);
    child.contextStack = [...this.contextStack, context];
    child.correlationId = this.correlationId;
    return child;
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    this.correlationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return this.correlationId;
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log at info level
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          ...context,
        }
      : { error, ...context };

    this.log('error', message, errorContext);
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error
      ? {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          ...context,
        }
      : { error, ...context };

    this.log('fatal', message, errorContext);
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.options.minLevel]) {
      return;
    }

    // Merge context stack
    const mergedContext = this.contextStack.reduce(
      (acc, ctx) => ({ ...acc, ...ctx }),
      context || {}
    );

    // Extract error if present
    let errorInfo: LogEntry['error'];
    if (mergedContext.error && typeof mergedContext.error === 'object') {
      const err = mergedContext.error as { name?: string; message?: string; stack?: string };
      errorInfo = {
        name: err.name || 'Error',
        message: err.message || String(mergedContext.error),
        stack: err.stack,
      };
      delete mergedContext.error;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.options.service,
      environment: this.options.environment,
      correlationId: this.correlationId,
      context: Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
      error: errorInfo,
    };

    this.options.output(entry);
  }

  /**
   * Default output to console
   */
  private defaultOutput(entry: LogEntry): void {
    const json = this.options.pretty
      ? JSON.stringify(entry, null, 2)
      : JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(json);
        break;
      case 'info':
        console.info(json);
        break;
      case 'warn':
        console.warn(json);
        break;
      case 'error':
      case 'fatal':
        console.error(json);
        break;
    }
  }

  /**
   * Time an async operation and log duration
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    this.debug(`Starting: ${operation}`, context);

    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`Completed: ${operation}`, { ...context, durationMs: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`Failed: ${operation}`, error, { ...context, durationMs: duration });
      throw error;
    }
  }
}

/**
 * Create a logger for a specific service
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  return new Logger(options);
}

/**
 * Default logger instance
 */
export const defaultLogger = createLogger();

/**
 * Express/Koa middleware for request logging
 */
export function requestLoggingMiddleware(logger: Logger = defaultLogger) {
  return (req: { method: string; url: string; headers: Record<string, string | string[] | undefined> }, res: { statusCode: number; on: (event: string, fn: () => void) => void }, next: () => void) => {
    const start = Date.now();

    // Extract or generate correlation ID
    const correlationId = (req.headers['x-correlation-id'] as string) ||
                         (req.headers['x-request-id'] as string) ||
                         logger.generateCorrelationId();

    // Create request-scoped logger
    const requestLogger = logger.child({
      method: req.method,
      url: req.url,
      correlationId,
    });

    requestLogger.setCorrelationId(correlationId);
    requestLogger.info('Request started');

    res.on('finish', () => {
      const duration = Date.now() - start;
      requestLogger.info('Request completed', {
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  };
}

/**
 * Log context for async operations
 */
export class LogContextManager {
  private static contexts: Map<string, LogContext> = new Map();

  static set(correlationId: string, context: LogContext): void {
    this.contexts.set(correlationId, {
      ...this.contexts.get(correlationId),
      ...context,
    });
  }

  static get(correlationId: string): LogContext | undefined {
    return this.contexts.get(correlationId);
  }

  static clear(correlationId: string): void {
    this.contexts.delete(correlationId);
  }

  static clearAll(): void {
    this.contexts.clear();
  }
}
