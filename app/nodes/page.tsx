'use client';

/**
 * Node Library Page (WP42 Redesign V2)
 *
 * Features:
 * - NodeID column with # prefix
 * - Statistics column with 4 icons (cube, layers, zap, file)
 * - Kebab menu for actions
 * - Grid view with placeholder icons and stats
 */

import { useEffect, useState } from 'react';
import { useNodesStore } from '@/lib/store';
import { Search, Grid, List, Filter, SortAsc, Trash2, MoreVertical, Eye, Download, Box, Layers, Zap, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

export default function NodesLibraryPage() {
  const nodes = useNodesStore((state) => state.nodes);
  const viewMode = useNodesStore((state) => state.viewMode);
  const searchTerm = useNodesStore((state) => state.searchTerm);
  const filters = useNodesStore((state) => state.filters);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const setViewMode = useNodesStore((state) => state.setViewMode);
  const setSearchTerm = useNodesStore((state) => state.setSearchTerm);
  const deleteNode = useNodesStore((state) => state.deleteNode);

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [deleteDialogNode, setDeleteDialogNode] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.type && filters.type.length > 0) {
      if (!node.altNode?.type || !filters.type.includes(node.altNode.type)) {
        return false;
      }
    }
    return true;
  });

  // Sort by date (most recent first)
  const sortedNodes = [...filteredNodes].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );

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

  // Get statistics for a node (use seeded random for consistent values)
  const getNodeStats = (node: typeof nodes[0]) => {
    // Use node ID to generate consistent pseudo-random values
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

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-text-primary" />
          <h1 className="text-3xl font-bold text-text-primary">Node Library</h1>
        </div>
        <p className="text-text-muted text-sm">
          {sortedNodes.length} nodes in library
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

          {/* Filter & Sort */}
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg hover:bg-bg-hover flex items-center gap-2 border border-border-primary">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2 bg-bg-secondary text-text-secondary rounded-lg hover:bg-bg-hover flex items-center gap-2 border border-border-primary">
              <SortAsc className="w-4 h-4" />
              Sort
            </button>
          </div>
        </div>
      </div>

      {/* Nodes Display */}
      {sortedNodes.length === 0 ? (
        <div className="text-center py-16 bg-bg-card rounded-xl border border-border-primary">
          <Box className="w-16 h-16 mx-auto mb-4 text-text-muted" />
          <p className="text-text-muted mb-4">
            {searchTerm || filters.type?.length
              ? 'No nodes match your filters'
              : 'No nodes in library yet'}
          </p>
          {!searchTerm && !filters.type?.length && (
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
          {sortedNodes.map((node) => {
            const stats = getNodeStats(node);
            return (
              <div
                key={node.id}
                className="bg-bg-card rounded-xl border border-border-primary overflow-hidden hover:border-border-secondary transition-all"
              >
                {/* Preview Image */}
                <Link href={`/viewer/${node.id}`} className="block">
                  <div className="aspect-[4/3] bg-bg-secondary flex items-start justify-center relative">
                    {node.thumbnail ? (
                      <Image
                        src={node.thumbnail}
                        alt={node.name}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                    ) : (
                      <Box className="w-12 h-12 text-text-muted" />
                    )}

                    {/* Kebab Menu - Always Visible */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <button className="p-1.5 bg-bg-card/90 backdrop-blur-sm rounded-lg hover:bg-bg-card">
                            <MoreVertical className="w-4 h-4 text-text-primary" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/viewer/${node.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View node
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Open preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => {
                              e.preventDefault();
                              setDeleteDialogNode({ id: node.id, name: node.name });
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Link>

                {/* Card Footer - Name, Date, Stats */}
                <div className="p-3">
                  <h3 className="font-medium text-text-primary truncate text-xs mb-1">{node.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {new Date(node.addedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="flex items-center gap-0.5">
                        <Box className="w-3 h-3 text-blue-400" />
                        {stats.elements}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Layers className="w-3 h-3 text-white" />
                        {stats.layers}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-blue-400" />
                        {stats.rules}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FileText className="w-3 h-3 text-white" />
                        {stats.exports}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-secondary border-b border-border-primary">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedNodeIds.size === sortedNodes.length && sortedNodes.length > 0}
                    onChange={() => {
                      if (selectedNodeIds.size === sortedNodes.length) {
                        setSelectedNodeIds(new Set());
                      } else {
                        setSelectedNodeIds(new Set(sortedNodes.map((n) => n.id)));
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
              {sortedNodes.map((node) => {
                const stats = getNodeStats(node);
                return (
                  <tr key={node.id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedNodeIds.has(node.id)}
                        onChange={() => toggleSelection(node.id)}
                        className="rounded border-border-primary"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="w-10 h-10 rounded-lg bg-bg-secondary overflow-hidden relative flex-shrink-0">
                        {node.thumbnail ? (
                          <Image
                            src={node.thumbnail}
                            alt={node.name}
                            fill
                            className="object-cover object-top"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Box className="w-5 h-5 text-text-muted" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/viewer/${node.id}`}
                        className="font-medium text-text-primary hover:text-accent-primary"
                      >
                        {node.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {getShortNodeId(node.id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      {new Date(node.addedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Box className="w-4 h-4 text-blue-400" />
                          {stats.elements}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-4 h-4 text-white" />
                          {stats.layers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-blue-400" />
                          {stats.rules}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-white" />
                          {stats.exports}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 hover:bg-bg-secondary rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-text-muted" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/viewer/${node.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View node
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Open preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => setDeleteDialogNode({ id: node.id, name: node.name })}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
