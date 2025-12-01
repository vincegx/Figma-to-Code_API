import { NextRequest, NextResponse } from 'next/server';
import postcss from 'postcss';
import tailwindcssV3 from 'tailwindcss';
import { compile as compileTailwindV4 } from 'tailwindcss-v4';
import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache v4 compiler for performance
let v4CompilerPromise: Promise<Awaited<ReturnType<typeof compileTailwindV4>>> | null = null;

async function getV4Compiler() {
  if (!v4CompilerPromise) {
    // Initialize v4 compiler with custom stylesheet loader
    v4CompilerPromise = compileTailwindV4('@import "tailwindcss";', {
      loadStylesheet: async (id: string, base: string) => {
        if (id === 'tailwindcss') {
          const cssPath = path.join(process.cwd(), 'node_modules/tailwindcss-v4/index.css');
          return {
            path: 'virtual:tailwindcss/index.css',
            base,
            content: await readFile(cssPath, 'utf-8'),
          };
        }
        throw new Error(`Cannot load stylesheet: ${id}`);
      },
    });
  }
  return v4CompilerPromise;
}

/**
 * Extract Tailwind classes from code
 */
function extractClasses(code: string): string[] {
  const classes = new Set<string>();

  const patterns = [
    /className="([^"]*(?:\[[^\]]*\][^"]*)*)"/g,
    /className='([^']*(?:\[[^\]]*\][^']*)*)'/g,
    /class="([^"]*(?:\[[^\]]*\][^"]*)*)"/g,
    /class='([^']*(?:\[[^\]]*\][^']*)*)'/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const classString = match[1];
      classString.split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    }
  }

  return Array.from(classes);
}

/**
 * API Route: Generate Tailwind CSS for specific component code
 *
 * Takes JSX/TSX code with Tailwind classes and generates the minimal CSS needed
 * Uses Tailwind programmatic API with JIT mode to support arbitrary values
 *
 * POST /api/generate-tailwind-css
 * Body: { code: string, version?: 'v3' | 'v4' }
 * Response: { css: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { code, version = 'v3' } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required and must be a string' },
        { status: 400 }
      );
    }

    let css: string;

    if (version === 'v4') {
      // Tailwind v4: Use @tailwindcss/node compile API
      const compiler = await getV4Compiler();
      const classes = extractClasses(code);
      css = compiler.build(classes);
    } else {
      // Tailwind v3: Use tailwindcss (existing behavior)
      const inputCSSv3 = `
@tailwind base;
@tailwind components;
@tailwind utilities;
      `;

      const tailwindConfig = {
        content: [{ raw: code, extension: 'html' }],
        theme: {
          extend: {},
        },
        corePlugins: {
          preflight: false, // Disable base reset styles for iframe
        },
      };

      const result = await postcss([
        tailwindcssV3(tailwindConfig),
      ]).process(inputCSSv3, {
        from: undefined,
      });

      css = result.css;
    }

    return NextResponse.json({ css });
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
