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
 * Delete a node or all nodes from the library
 *
 * Request body:
 * {
 *   "nodeId": "lib-123-456"  // Delete specific node
 * }
 * OR empty body / { "clearAll": true } to delete all nodes
 */
export async function DELETE(request: NextRequest) {
  try {
    let body: { nodeId?: string; clearAll?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body = clear all
    }

    const { nodeId, clearAll } = body;
    const { removeNode, getAllNodes, clearLibraryIndex } = await import('@/lib/utils/library-index');
    const { deleteNodeData } = await import('@/lib/utils/file-storage');

    // Clear all nodes if no nodeId provided or clearAll is true
    if (!nodeId || clearAll) {
      const allNodes = await getAllNodes();
      let deletedCount = 0;

      for (const node of allNodes) {
        try {
          // Extract Figma node ID from library node ID
          const figmaNodeId = node.id.replace('lib-', '').replace(/-/g, ':');
          await deleteNodeData(figmaNodeId);
          await removeNode(node.id);
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete node ${node.id}:`, err);
        }
      }

      // Clear the library index
      await clearLibraryIndex();

      return NextResponse.json({
        success: true,
        deletedCount,
        message: `Cleared ${deletedCount} nodes from cache`,
      });
    }

    // Delete single node
    const figmaNodeId = nodeId.replace('lib-', '').replace(/-/g, ':');
    await deleteNodeData(figmaNodeId);
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
