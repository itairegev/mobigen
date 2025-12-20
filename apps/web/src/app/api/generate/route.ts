import { NextRequest, NextResponse } from 'next/server';

const GENERATOR_URL = process.env.GENERATOR_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId || !body.prompt || !body.config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Forward request to generator service
    const response = await fetch(`${GENERATOR_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Generation failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Generation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const response = await fetch(`${GENERATOR_URL}/api/health`);
    const data = await response.json();
    return NextResponse.json({
      status: 'ok',
      generator: data,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Generator service unavailable' },
      { status: 503 }
    );
  }
}
