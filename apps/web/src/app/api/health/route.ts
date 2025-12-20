import { NextResponse } from 'next/server';
import { prisma } from '@mobigen/db';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceStatus;
    generator?: ServiceStatus;
  };
}

interface ServiceStatus {
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'up',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkGenerator(): Promise<ServiceStatus> {
  const generatorUrl = process.env.GENERATOR_URL || 'http://localhost:4000';
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${generatorUrl}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      return {
        status: 'up',
        latency: Date.now() - start,
      };
    }

    return {
      status: 'down',
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function GET() {
  const [dbStatus, generatorStatus] = await Promise.all([
    checkDatabase(),
    checkGenerator(),
  ]);

  const allServicesUp = dbStatus.status === 'up';
  const someServicesUp = dbStatus.status === 'up' || generatorStatus.status === 'up';

  const overallStatus: HealthStatus['status'] = allServicesUp
    ? 'healthy'
    : someServicesUp
      ? 'degraded'
      : 'unhealthy';

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbStatus,
      generator: generatorStatus,
    },
  };

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { status: httpStatus });
}
