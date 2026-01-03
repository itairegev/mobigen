/**
 * Enterprise SLA Dashboard API
 * GET /api/enterprise/sla - Get SLA dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { slaMonitor } from '@/services/generator/src/sla-monitor';

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
    // In production, this would check user.tier from database
    const userTier = (session.user as any).tier || 'basic';

    if (userTier !== 'enterprise') {
      return NextResponse.json(
        { error: 'Forbidden: Enterprise tier required' },
        { status: 403 }
      );
    }

    // Get SLA dashboard data
    const dashboardData = await slaMonitor.getDashboardData();

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('SLA dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
