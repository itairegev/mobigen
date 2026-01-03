/**
 * GitHub OAuth - Handle callback
 * GET /api/integrations/github/callback
 */

import { NextRequest, NextResponse } from 'next/server';

const GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=${encodeURIComponent(error)}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=missing_params`
      );
    }

    // Forward to generator service
    const response = await fetch(
      `${GENERATOR_URL}/api/github/callback?code=${code}&state=${state}`
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?error=${encodeURIComponent(data.error || 'callback_failed')}`
      );
    }

    // Redirect to project page or dashboard
    const redirectPath = data.redirectPath || '/dashboard';
    const projectParam = data.projectId ? `?projectId=${data.projectId}` : '';

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}${redirectPath}${projectParam}&github_connected=true`
    );
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?error=server_error`
    );
  }
}
