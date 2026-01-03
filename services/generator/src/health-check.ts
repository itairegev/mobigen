/**
 * Health Check Integration for SLA Monitoring
 * Performs regular health checks on all services and records uptime
 */

import { slaMonitor } from './sla-monitor';
import type { ServiceType, HealthCheckResult } from './sla-types';

interface ServiceEndpoint {
  id: string;
  type: ServiceType;
  url: string;
  method?: 'GET' | 'POST' | 'HEAD';
  timeout?: number;
  expectedStatus?: number;
  region?: string;
}

const SERVICE_ENDPOINTS: ServiceEndpoint[] = [
  {
    id: 'api-service',
    type: 'api',
    url: process.env.API_URL || 'http://localhost:3000/api/health',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    id: 'generator-service',
    type: 'generator',
    url: process.env.GENERATOR_URL || 'http://localhost:3001/health',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    id: 'builder-service',
    type: 'builder',
    url: process.env.BUILDER_URL || 'http://localhost:3002/health',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    id: 'preview-service',
    type: 'preview',
    url: process.env.PREVIEW_URL || 'http://localhost:3003/health',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    id: 'analytics-service',
    type: 'analytics',
    url: process.env.ANALYTICS_URL || 'http://localhost:3004/health',
    method: 'GET',
    expectedStatus: 200,
  },
];

export class HealthCheckService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start periodic health checks
   */
  start(intervalMs: number = 60000): void {
    if (this.isRunning) {
      console.log('Health check service already running');
      return;
    }

    console.log(`Starting health check service (interval: ${intervalMs}ms)`);
    this.isRunning = true;

    // Run initial check immediately
    this.runHealthChecks().catch((error) => {
      console.error('Initial health check failed:', error);
    });

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.runHealthChecks().catch((error) => {
        console.error('Health check failed:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Health check service stopped');
  }

  /**
   * Run health checks for all services
   */
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const endpoint of SERVICE_ENDPOINTS) {
      try {
        const result = await this.checkEndpoint(endpoint);
        results.push(result);

        // Track in SLA monitor
        await slaMonitor.trackUptime(endpoint.id, endpoint.type, result);

        // Log result
        const status = result.healthy ? '✓' : '✗';
        console.log(
          `[Health Check] ${status} ${endpoint.type} (${endpoint.id}): ${result.responseTimeMs}ms`
        );
      } catch (error) {
        console.error(`Health check error for ${endpoint.id}:`, error);

        // Record as unhealthy
        const errorResult: HealthCheckResult = {
          serviceId: endpoint.id,
          serviceType: endpoint.type,
          timestamp: new Date(),
          healthy: false,
          responseTimeMs: 0,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            code: 'HEALTH_CHECK_FAILED',
          },
        };

        results.push(errorResult);
        await slaMonitor.trackUptime(endpoint.id, endpoint.type, errorResult);
      }
    }

    return results;
  }

  /**
   * Check a single endpoint
   */
  private async checkEndpoint(endpoint: ServiceEndpoint): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeout = endpoint.timeout || 5000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(endpoint.url, {
        method: endpoint.method || 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mobigen-HealthCheck/1.0',
        },
      });

      clearTimeout(timeoutId);

      const responseTimeMs = Date.now() - startTime;
      const expectedStatus = endpoint.expectedStatus || 200;
      const healthy = response.status === expectedStatus;

      return {
        serviceId: endpoint.id,
        serviceType: endpoint.type,
        timestamp: new Date(),
        healthy,
        responseTimeMs,
        statusCode: response.status,
        endpoint: endpoint.url,
        method: endpoint.method || 'GET',
        region: endpoint.region,
        error: healthy
          ? undefined
          : {
              message: `Unexpected status code: ${response.status}`,
              code: `HTTP_${response.status}`,
            },
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      let errorMessage = 'Unknown error';
      let errorCode = 'UNKNOWN';

      if (error instanceof Error) {
        errorMessage = error.message;

        if (error.name === 'AbortError') {
          errorCode = 'TIMEOUT';
          errorMessage = `Request timeout after ${timeout}ms`;
        } else if (error.message.includes('ECONNREFUSED')) {
          errorCode = 'CONNECTION_REFUSED';
          errorMessage = 'Connection refused';
        } else if (error.message.includes('ENOTFOUND')) {
          errorCode = 'DNS_ERROR';
          errorMessage = 'DNS lookup failed';
        } else if (error.message.includes('ETIMEDOUT')) {
          errorCode = 'NETWORK_TIMEOUT';
          errorMessage = 'Network timeout';
        }
      }

      return {
        serviceId: endpoint.id,
        serviceType: endpoint.type,
        timestamp: new Date(),
        healthy: false,
        responseTimeMs,
        endpoint: endpoint.url,
        method: endpoint.method || 'GET',
        region: endpoint.region,
        error: {
          message: errorMessage,
          code: errorCode,
        },
      };
    }
  }

  /**
   * Perform database health check
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // Simple query to test database connectivity
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();

      const responseTimeMs = Date.now() - startTime;

      return {
        serviceId: 'database-service',
        serviceType: 'database',
        timestamp: new Date(),
        healthy: true,
        responseTimeMs,
        endpoint: 'postgresql',
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      return {
        serviceId: 'database-service',
        serviceType: 'database',
        timestamp: new Date(),
        healthy: false,
        responseTimeMs,
        endpoint: 'postgresql',
        error: {
          message: error instanceof Error ? error.message : 'Database error',
          code: 'DATABASE_ERROR',
        },
      };
    }
  }

  /**
   * Get current health status for all services
   */
  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'degraded' | 'down';
    services: {
      id: string;
      type: ServiceType;
      healthy: boolean;
      responseTimeMs: number;
      lastCheck: Date;
    }[];
  }> {
    const results = await this.runHealthChecks();

    const services = results.map((result) => ({
      id: result.serviceId,
      type: result.serviceType,
      healthy: result.healthy,
      responseTimeMs: result.responseTimeMs,
      lastCheck: result.timestamp,
    }));

    const healthyCount = services.filter((s) => s.healthy).length;
    const totalCount = services.length;

    let overall: 'healthy' | 'degraded' | 'down';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount === 0) {
      overall = 'down';
    } else {
      overall = 'degraded';
    }

    return { overall, services };
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  const checkInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10);
  healthCheckService.start(checkInterval);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, stopping health checks...');
    healthCheckService.stop();
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, stopping health checks...');
    healthCheckService.stop();
  });
}
