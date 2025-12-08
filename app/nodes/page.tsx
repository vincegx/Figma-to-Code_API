'use client';

/**
 * Node Library Page (WP45 - Filters, Sort, Pagination & UX Improvements)
 *
 * Features:
 * - NodeID column with # prefix
 * - Statistics column with 4 icons (cube, layers, zap, file)
 * - Kebab menu for actions
 * - Grid view with placeholder icons and stats
 * - Filter by type and date
 * - Sort by date, name, nodes count
 * - Pagination with per page selector
 *
 * Phase 3 refactoring: extracted NodeCard and NodeRow components
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNodesStore } from '@/lib/store';
import { Search, Grid, List, Box, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';
import { FilterPopover, type FilterState } from '@/components/library/filter-popover';
import { SortSelect, type SortOption } from '@/components/library/sort-select';
import { LibraryPagination } from '@/components/library/library-pagination';
import { PerPageSelect } from '@/components/library/per-page-select';

// Phase 3: Extracted components
import { NodeCard, NodeRow } from './_components';

export default function NodesLibraryPage() {
  const router = useRouter();
  const nodes = useNodesStore((state) => state.nodes);
  const viewMode = useNodesStore((state) => state.viewMode);
  const searchTerm = useNodesStore((state) => state.searchTerm);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const setViewMode = useNodesStore((state) => state.setViewMode);
  const setSearchTerm = useNodesStore((state) => state.setSearchTerm);
  const deleteNode = useNodesStore((state) => state.deleteNode);

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [deleteDialogNode, setDeleteDialogNode] = useState<{ id: string; name: string } | null>(null);

  // Filter, Sort, Pagination state
  const [filters, setFilters] = useState<FilterState>({ types: [], dateRange: 'all' });
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Reset page when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [filters, sortBy, searchTerm]);

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    // Search filter
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    // Type filter
    if (filters.types.length > 0) {
      const nodeType = node.altNode?.type;
      if (!nodeType || !filters.types.includes(nodeType)) {
        return false;
      }
    }
    // Date filter
    if (filters.dateRange !== 'all') {
      const days = { '7d': 7, '30d': 30, '90d': 90 }[filters.dateRange];
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      if (new Date(node.addedAt).getTime() < cutoff) {
        return false;
      }
    }
    return true;
  });

  // Sort nodes
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      case 'date-asc':
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'nodes-desc':
        return (b.transformStats?.totalNodes || 0) - (a.transformStats?.totalNodes || 0);
      default:
        return 0;
    }
  });

  // Paginate nodes
  const paginatedNodes = sortedNodes.slice((page - 1) * perPage, page * perPage);

  // Toggle selection
  const toggleSelection = (nodeId: string) => {
    const newSelection = new Set(selectedNodeIds);
    if (newSelection.has(nodeId)) {
      newSelection.delete(nodeId);
    } else {
      newSelection.add(nodeId);
    }
    setSelectedNodeIds(newSelection);
  };

  // Get statistics for a node
  const getNodeStats = (node: typeof nodes[0]) => {
    // Use transformStats if available (WP43), otherwise use seeded random
    if (node.transformStats) {
      return {
        elements: node.transformStats.totalNodes,
        layers: node.transformStats.maxDepth,
        rules: node.transformStats.semanticCount,
        exports: node.usage.exportCount || 0,
      };
    }
    // Fallback: Use node ID to generate consistent pseudo-random values
    const seed = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      elements: (seed % 20) + 5,
      layers: (seed % 10) + 2,
      rules: (seed % 8) + 1,
      exports: node.usage.exportCount || 0,
    };
  };

  // Get short node ID
  const getShortNodeId = (id: string) => {
    const parts = id.split('-');
    if (parts.length >= 2) {
      return `#${parts[0]}-${parts[1]}`;
    }
    return `#${id.slice(0, 9)}`;
  };

  const handleDelete = async (nodeId: string) => {
    await deleteNode(nodeId);
    setDeleteDialogNode(null);
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({ types: [], dateRange: 'all' });
  };

  const handleOpenPreview = (nodeId: string) => {
    router.push(`/node/${nodeId}?fullscreen=true`);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-text-primary" />
          <h1 className="text-3xl font-bold text-text-primary">Node Library</h1>
        </div>
        <p className="text-text-muted text-sm">
          {filteredNodes.length} nodes {filteredNodes.length !== nodes.length && `(filtered from ${nodes.length})`}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-bg-card rounded-xl border border-border-primary p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search nodes by name..."
                className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
              title="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-accent-primary text-white'
                  : 'text-text-muted hover:text-text-primary'
              )}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Filter, Sort & Per Page */}
          <div className="flex gap-2">
            <FilterPopover
              filters={filters}
              onApply={handleFilterApply}
              onReset={handleFilterReset}
            />
            <SortSelect value={sortBy} onChange={setSortBy} />
            <PerPageSelect
              value={perPage}
              onChange={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Nodes Display */}
      {sortedNodes.length === 0 ? (
        <div className="text-center py-16 bg-bg-card rounded-xl border border-border-primary">
          <Box className="w-16 h-16 mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted mb-4">
            {searchTerm || filters.types.length > 0 || filters.dateRange !== 'all'
              ? 'No nodes match your filters'
              : 'No nodes in library yet'}
          </p>
          {!searchTerm && filters.types.length === 0 && filters.dateRange === 'all' && (
            <Link
              href="/"
              className="inline-flex px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-hover"
            >
              Import Your First Node
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View - 5 columns */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              stats={getNodeStats(node)}
              onOpenPreview={handleOpenPreview}
              onDelete={setDeleteDialogNode}
            />
          ))}
        </div>
      ) : (
        /* List View with Clickable Rows (T396) */
        <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-secondary border-b border-border-primary">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedNodeIds.size === paginatedNodes.length && paginatedNodes.length > 0}
                    onChange={() => {
                      if (selectedNodeIds.size === paginatedNodes.length) {
                        setSelectedNodeIds(new Set());
                      } else {
                        setSelectedNodeIds(new Set(paginatedNodes.map((n) => n.id)));
                      }
                    }}
                    className="rounded border-border-primary"
                  />
                </th>
                <th className="px-2 py-3 w-12"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">NodeID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Added</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Statistics</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {paginatedNodes.map((node) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  stats={getNodeStats(node)}
                  shortId={getShortNodeId(node.id)}
                  isSelected={selectedNodeIds.has(node.id)}
                  onToggleSelection={toggleSelection}
                  onOpenPreview={handleOpenPreview}
                  onDelete={setDeleteDialogNode}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {sortedNodes.length > 0 && (
        <LibraryPagination
          total={sortedNodes.length}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogNode && (
        <DeleteConfirmDialog
          open={!!deleteDialogNode}
          onOpenChange={(open) => !open && setDeleteDialogNode(null)}
          nodeName={deleteDialogNode.name}
          nodeId={deleteDialogNode.id}
          onConfirm={() => handleDelete(deleteDialogNode.id)}
        />
      )}
    </div>
  );
}
