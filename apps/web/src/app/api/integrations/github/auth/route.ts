/**
 * GitHub OAuth - Start authentication flow
 * GET /api/integrations/github/auth
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const redirectPath = searchParams.get('redirect');

    // Forward request to generator service
    const params = new URLSearchParams({
      userId,
      ...(projectId && { projectId }),
      ...(redirectPath && { redirectPath }),
    });

    const response = await fetch(`${GENERATOR_URL}/api/github/auth?${params}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to initiate OAuth' },
        { status: response.status }
      );
    }

    // Redirect to GitHub OAuth URL
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
