/**
 * GitHub Repositories - List user's repos
 * GET /api/integrations/github/repos
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
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('perPage') || '30';
    const sort = searchParams.get('sort') || 'updated';

    // Forward request to generator service
    const params = new URLSearchParams({
      userId,
      page,
      perPage,
      sort,
    });

    const response = await fetch(`${GENERATOR_URL}/api/github/repos?${params}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch repositories' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub repos list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create a new GitHub repository
 * POST /api/integrations/github/repos
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }

    // Forward request to generator service
    const response = await fetch(`${GENERATOR_URL}/api/github/repos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        name: body.name,
        description: body.description,
        private: body.private ?? true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to create repository' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub repo creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
