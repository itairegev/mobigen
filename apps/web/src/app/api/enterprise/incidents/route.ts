/**
 * Enterprise Incidents API
 * GET /api/enterprise/incidents - List incidents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Incident {
  id: string;
  serviceId: string;
  serviceType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'resolved' | 'investigating';
  detectedAt: Date;
  resolvedAt?: Date;
  description: string;
}

// Stub for SLA monitor - in production this would be a real service
const slaMonitor = {
  getIncidents: async (_serviceId: string, _period: { start: Date; end: Date }): Promise<Incident[]> => {
    return [];
  },
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
    const serviceId = searchParams.get('serviceId');
    const serviceType = searchParams.get('serviceType');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Calculate period (default: last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const period = {
      start: startParam ? new Date(startParam) : thirtyDaysAgo,
      end: endParam ? new Date(endParam) : now,
    };

    // Get all services to query
    const services = serviceId
      ? [serviceId]
      : ['api-service', 'generator-service', 'builder-service', 'preview-service', 'analytics-service', 'database-service'];

    // Get incidents for all services
    const allIncidents = await Promise.all(
      services.map(async (svcId) => {
        return slaMonitor.getIncidents(svcId, period);
      })
    );

    let incidents = allIncidents.flat();

    // Apply filters
    if (serviceType) {
      incidents = incidents.filter((i) => i.serviceType === serviceType);
    }

    if (severity) {
      incidents = incidents.filter((i) => i.severity === severity);
    }

    if (status) {
      incidents = incidents.filter((i) => i.status === status);
    }

    // Sort by detected time (most recent first)
    incidents.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

    // Paginate
    const total = incidents.length;
    const paginatedIncidents = incidents.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        incidents: paginatedIncidents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    console.error('Incidents API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
