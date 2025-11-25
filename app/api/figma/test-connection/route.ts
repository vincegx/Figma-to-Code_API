import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/figma/test-connection
 *
 * Proxy for testing Figma API connection.
 * Avoids CORS issues when calling Figma API from browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Call Figma API /v1/me to validate token
    const response = await fetch('https://api.figma.com/v1/me', {
      headers: {
        'X-Figma-Token': token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        user: {
          id: data.id,
          email: data.email,
          handle: data.handle,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: response.status === 403
            ? 'Invalid or expired token'
            : `Figma API error: ${response.status}`,
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect to Figma API' },
      { status: 500 }
    );
  }
}
