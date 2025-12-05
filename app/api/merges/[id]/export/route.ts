/**
 * Merge Export API Route
 *
 * GET /api/merges/[id]/export?framework=react-tailwind
 * Returns generated code for the specified framework.
 *
 * Query parameters:
 * - framework: Required. One of: react-tailwind, react-tailwind-v4, html-css
 *
 * Response:
 * {
 *   "success": true,
 *   "code": "export function Component() { ... }",
 *   "framework": "react-tailwind",
 *   "filename": "hero-section.tsx"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMerge } from '@/lib/store/merge-store';
import type { FrameworkType } from '@/lib/types/merge';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_FRAMEWORKS: FrameworkType[] = ['react-tailwind', 'react-tailwind-v4', 'html-css'];

/**
 * Generate filename from merge name and framework
 */
function getFilename(name: string, framework: FrameworkType): string {
  // Convert to kebab-case
  const baseName = name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  switch (framework) {
    case 'react-tailwind':
    case 'react-tailwind-v4':
      return `${baseName}.tsx`;
    case 'html-css':
      return `${baseName}.html`;
    default:
      return `${baseName}.txt`;
  }
}

/**
 * Get MIME type for framework
 */
function getMimeType(framework: FrameworkType): string {
  switch (framework) {
    case 'react-tailwind':
    case 'react-tailwind-v4':
      return 'text/typescript';
    case 'html-css':
      return 'text/html';
    default:
      return 'text/plain';
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get('framework') as FrameworkType | null;

    // Validate framework parameter
    if (!framework) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing framework parameter. Use: react-tailwind, react-tailwind-v4, or html-css',
        },
        { status: 400 }
      );
    }

    if (!VALID_FRAMEWORKS.includes(framework)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid framework "${framework}". Valid options: ${VALID_FRAMEWORKS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Fetch merge
    const merge = await getMerge(id);

    if (!merge) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    // Check merge is ready
    if (merge.status !== 'ready') {
      return NextResponse.json(
        {
          success: false,
          error: `Merge is not ready for export (status: ${merge.status})`,
        },
        { status: 400 }
      );
    }

    if (!merge.result) {
      return NextResponse.json(
        { success: false, error: 'Merge result not available' },
        { status: 400 }
      );
    }

    // Get generated code
    const code = merge.result.generatedCode[framework];
    const filename = getFilename(merge.name, framework);
    const mimeType = getMimeType(framework);

    // Check if download is requested
    const download = searchParams.get('download') === 'true';

    if (download) {
      // Return as file download
      return new NextResponse(code, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Return as JSON
    return NextResponse.json({
      success: true,
      code,
      framework,
      filename,
      mimeType,
    });
  } catch (error) {
    console.error('Export error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export merge',
      },
      { status: 500 }
    );
  }
}
