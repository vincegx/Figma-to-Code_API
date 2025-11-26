import { NextRequest, NextResponse } from 'next/server';
import { transformSync } from '@swc/core';

// Force Node.js runtime for SWC
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route: Server-side JSX/TSX Transpilation
 *
 * Transpiles React JSX/TSX code to plain JavaScript for iframe execution
 * using SWC (Next.js built-in transpiler, no external dependencies).
 *
 * POST /api/transpile
 * Body: { code: string, framework: 'react-tailwind' | 'react-inline' }
 * Response: { transpiledCode: string, componentName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { code, framework } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    // Extract component name before transpilation
    const componentNameMatch = code.match(/function\s+([A-Z]\w+)/);
    const componentName = componentNameMatch?.[1] || 'Component';

    // Remove export statements before transpilation
    const codeWithoutExport = code.replace(/^export\s+(default\s+)?/gm, '');

    // Transpile JSX/TSX to JavaScript using SWC (Next.js built-in)
    const result = transformSync(codeWithoutExport, {
      filename: 'component.tsx',
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'classic', // Use React.createElement
            pragma: 'React.createElement',
            pragmaFrag: 'React.Fragment',
          },
        },
        target: 'es2020',
      },
      module: {
        type: 'es6', // Use ES modules for browser compatibility
        strict: false,
        strictMode: false,
      },
      sourceMaps: false,
      minify: false,
    });

    // Wrap in IIFE to avoid export issues in iframe
    const wrappedCode = `
(function() {
  ${result.code}
  window.${componentName} = ${componentName};
})();
    `.trim();

    return NextResponse.json({
      transpiledCode: wrappedCode,
      componentName,
      framework,
    });
  } catch (error) {
    console.error('Transpilation error:', error);

    return NextResponse.json(
      {
        error: 'Transpilation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
