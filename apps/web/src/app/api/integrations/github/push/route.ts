/**
 * GitHub Push - Push project code to repository
 * POST /api/integrations/github/push
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

const GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:4000';

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
    if (!body.projectId || !body.repoOwner || !body.repoName) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, repoOwner, repoName' },
        { status: 400 }
      );
    }

    // Forward request to generator service
    const response = await fetch(`${GENERATOR_URL}/api/github/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        projectId: body.projectId,
        repoOwner: body.repoOwner,
        repoName: body.repoName,
        branch: body.branch || 'main',
        commitMessage: body.commitMessage || '[mobigen] Export generated code',
        createPullRequest: body.createPullRequest || false,
        prTitle: body.prTitle || 'Update from Mobigen',
        prBody: body.prBody || 'Generated code from Mobigen',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to push to repository' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GitHub push error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
