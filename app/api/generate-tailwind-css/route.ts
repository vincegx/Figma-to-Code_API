import { NextRequest, NextResponse } from 'next/server';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route: Generate Tailwind CSS for specific component code
 *
 * Takes JSX/TSX code with Tailwind classes and generates the minimal CSS needed
 * Uses Tailwind programmatic API with JIT mode to support arbitrary values
 *
 * POST /api/generate-tailwind-css
 * Body: { code: string }
 * Response: { css: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    // Input CSS with Tailwind directives
    const inputCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;
    `;

    // Tailwind config with JIT scanning the provided code
    const tailwindConfig = {
      content: [{ raw: code, extension: 'html' }],
      theme: {
        extend: {},
      },
      corePlugins: {
        preflight: false, // Disable base reset styles for iframe
      },
    };

    // Process CSS with PostCSS + Tailwind
    const result = await postcss([
      tailwindcss(tailwindConfig),
    ]).process(inputCSS, {
      from: undefined,
    });

    return NextResponse.json({
      css: result.css,
    });
  } catch (error) {
    console.error('Tailwind CSS generation error:', error);

    return NextResponse.json(
      {
        error: 'CSS generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
