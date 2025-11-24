'use client';

import { useEffect, useState } from 'react';
import { useNodesStore } from '@/lib/store';
import NodeCard from '@/components/node-card';
import { Search, Grid, List, Filter, SortAsc, Trash2 } from 'lucide-react';

export default function NodesLibraryPage() {
  const nodes = useNodesStore((state) => state.nodes);
  const viewMode = useNodesStore((state) => state.viewMode);
  const searchTerm = useNodesStore((state) => state.searchTerm);
  const filters = useNodesStore((state) => state.filters);
  const sortCriteria = useNodesStore((state) => state.sortCriteria);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const setViewMode = useNodesStore((state) => state.setViewMode);
  const setSearchTerm = useNodesStore((state) => state.setSearchTerm);
  const setFilters = useNodesStore((state) => state.setFilters);
  const setSortCriteria = useNodesStore((state) => state.setSortCriteria);
  const deleteNode = useNodesStore((state) => state.deleteNode);

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // Load library on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Apply filters and search
  const filteredNodes = nodes.filter((node) => {
    // Search filter
    if (searchTerm && !node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      if (!node.altNode?.type || !filters.type.includes(node.altNode.type)) {
        return false;
      }
    }

    // Coverage filter (note: LibraryNode doesn't have coverage field, skip for now)
    // Will need to calculate coverage from rule matches

    return true;
  });

  // Apply sorting
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    const field = sortCriteria.field;
    const order = sortCriteria.order;
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        break;
      case 'type':
        comparison = (a.altNode?.type || '').localeCompare(b.altNode?.type || '');
        break;
      case 'coverage':
        // Coverage not available in LibraryNode, use viewCount as fallback
        comparison = a.usage.viewCount - b.usage.viewCount;
        break;
      default:
        comparison = 0;
    }

    return order === 'asc' ? comparison : -comparison;
  });

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

  // Select all
  const selectAll = () => {
    setSelectedNodeIds(new Set(sortedNodes.map((n) => n.id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNodeIds(new Set());
  };

  // Delete selected nodes
  const deleteSelected = () => {
    if (selectedNodeIds.size === 0) return;

    const confirmed = window.confirm(
      `Delete ${selectedNodeIds.size} selected node(s)? This action cannot be undone.`
    );

    if (confirmed) {
      selectedNodeIds.forEach((nodeId) => {
        deleteNode(nodeId);
      });
      clearSelection();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Node Library</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {sortedNodes.length} node{sortedNodes.length !== 1 ? 's' : ''} in library
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search nodes by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Button */}
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
            onClick={() => {
              // Toggle filter panel (to be implemented)
              alert('Filter panel - to be implemented in T080');
            }}
          >
            <Filter className="w-5 h-5" />
            Filter
          </button>

          {/* Sort Button */}
          <button
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
            onClick={() => {
              // Toggle sort panel (to be implemented)
              alert('Sort panel - to be implemented in T081');
            }}
          >
            <SortAsc className="w-5 h-5" />
            Sort
          </button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedNodeIds.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedNodeIds.size} node{selectedNodeIds.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Clear selection
              </button>
              {selectedNodeIds.size < sortedNodes.length && (
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Select all ({sortedNodes.length})
                </button>
              )}
            </div>
            <button
              onClick={deleteSelected}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Nodes Display */}
      {sortedNodes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || filters.type?.length
              ? 'No nodes match your filters'
              : 'No nodes in library yet'}
          </p>
          {!searchTerm && !filters.type?.length && (
            <button
              onClick={() => (window.location.href = '/')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Import Your First Node
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedNodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              onToggleSelect={() => toggleSelection(node.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedNodeIds.size === sortedNodes.length && sortedNodes.length > 0}
                    onChange={() => {
                      if (selectedNodeIds.size === sortedNodes.length) {
                        clearSelection();
                      } else {
                        selectAll();
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Added
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Views
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedNodes.map((node) => (
                <tr
                  key={node.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedNodeIds.has(node.id)}
                      onChange={() => toggleSelection(node.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/viewer/${node.id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {node.name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {node.altNode?.type || 'Node'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(node.addedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {node.usage.viewCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Delete "${node.name}"?`);
                        if (confirmed) deleteNode(node.id);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
