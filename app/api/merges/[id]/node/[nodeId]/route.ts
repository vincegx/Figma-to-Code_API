/**
 * API Route: Generate code for a specific node in a merge
 *
 * GET /api/merges/[id]/node/[nodeId]
 *
 * Query parameters:
 * - framework: 'react-tailwind' | 'react-tailwind-v4' | 'html-css' (default: 'react-tailwind')
 *
 * Returns:
 * - altNode: The SimpleAltNode subtree
 * - code: Generated code for the subtree
 * - css: Generated CSS (if applicable)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMerge } from '@/lib/store/merge-store';
import { generateCodeForMergeNode } from '@/lib/merge/merge-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  try {
    const { id, nodeId } = await params;
    const { searchParams } = new URL(request.url);
    const framework = (searchParams.get('framework') || 'react-tailwind') as 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

    // Load the merge
    const merge = await getMerge(id);
    if (!merge) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    // Generate code for the specific node
    const result = await generateCodeForMergeNode(merge, nodeId, framework);

    return NextResponse.json({
      success: true,
      altNode: result.altNode,
      code: result.code,
      css: result.css,
    });
  } catch (error) {
    console.error('Generate merge node code error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate code',
      },
      { status: 500 }
    );
  }
}
