/**
 * Figma Library API Route
 *
 * GET /api/figma/library
 * Returns all nodes in the library with optional filtering and sorting.
 *
 * Query parameters:
 * - search: Search query string (optional)
 * - type: Filter by FigmaNodeType (optional)
 * - coverage: Filter by coverage (all|with-rules|without-rules) (optional)
 * - sortBy: Sort criteria (name|date|type|coverage) (optional, default: date)
 * - sortOrder: Sort order (asc|desc) (optional, default: desc)
 *
 * Response:
 * {
 *   "success": true,
 *   "nodes": LibraryNode[],
 *   "totalNodes": number,
 *   "categories": string[],
 *   "tags": string[]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllNodes, searchNodes, filterNodes, sortNodes, getAllCategories, getAllTags } from '@/lib/utils/library-index';
import type { LibraryFilters, LibrarySortCriteria, SortOrder } from '@/lib/types/library';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const searchQuery = searchParams.get('search');
    const typeFilter = searchParams.get('type');
    const coverageFilter = searchParams.get('coverage');
    const sortBy = searchParams.get('sortBy') as LibrarySortCriteria || 'date';
    const sortOrder = searchParams.get('sortOrder') as SortOrder || 'desc';

    // Start with all nodes or search results
    let nodes = searchQuery
      ? await searchNodes(searchQuery)
      : await getAllNodes();

    // Apply filters if provided
    if (typeFilter || coverageFilter) {
      const filters: LibraryFilters = {
        ...(typeFilter && { type: [typeFilter] }),
        ...(coverageFilter && { coverage: coverageFilter as 'full' | 'partial' | 'none' }),
      };

      // Filter the current node set
      const allFilteredNodes = await filterNodes(filters);
      nodes = nodes.filter(node =>
        allFilteredNodes.some(fn => fn.id === node.id)
      );
    }

    // Apply sorting
    const allSortedNodes = await sortNodes(sortBy, sortOrder);
    nodes = nodes
      .sort((a, b) => {
        const aIndex = allSortedNodes.findIndex(n => n.id === a.id);
        const bIndex = allSortedNodes.findIndex(n => n.id === b.id);
        return aIndex - bIndex;
      });

    // Get metadata
    const categories = await getAllCategories();
    const tags = await getAllTags();

    return NextResponse.json({
      success: true,
      nodes,
      totalNodes: nodes.length,
      categories,
      tags,
    });
  } catch (error) {
    console.error('Library fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load library'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/figma/library
 * Delete a node from the library
 *
 * Request body:
 * {
 *   "nodeId": "lib-123-456"
 * }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { nodeId?: string };
    const { nodeId } = body;

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing nodeId parameter' },
        { status: 400 }
      );
    }

    const { removeNode } = await import('@/lib/utils/library-index');
    const { deleteNodeData } = await import('@/lib/utils/file-storage');

    // Extract Figma node ID from library node ID (format: "lib-{figmaNodeId}")
    const figmaNodeId = nodeId.replace('lib-', '').replace(/-/g, ':');

    // Delete from filesystem
    await deleteNodeData(figmaNodeId);

    // Remove from library index
    await removeNode(nodeId);

    return NextResponse.json({
      success: true,
      nodeId,
    });
  } catch (error) {
    console.error('Delete error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete node'
      },
      { status: 500 }
    );
  }
}
