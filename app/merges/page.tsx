'use client';

/**
 * Merges Library Page
 *
 * Main page for browsing and managing responsive merges.
 * Styled to match the /nodes page.
 *
 * Phase 3 refactoring: extracted MergeCard and MergeRow components
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Combine, Search, X, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SortSelect, type SortOption } from '@/components/library/sort-select';
import { LibraryPagination } from '@/components/library/library-pagination';
import { PerPageSelect } from '@/components/library/per-page-select';
import { MergeCreationModal } from '@/components/merge/merge-creation-modal';
import { DeleteMergeDialog } from '@/components/merge/delete-merge-dialog';
import type { MergeListItem, MergeStatus } from '@/lib/types/merge';

// Phase 3: Extracted components
import { StatusBadge, MergeCardSkeleton, EmptyState, MergeCard, MergeRow } from './_components';

// ============================================================================
// Types
// ============================================================================

type StatusFilter = MergeStatus | 'all';

// ============================================================================
// Main Page Component
// ============================================================================

export default function MergesPage() {
  // Data state
  const [merges, setMerges] = useState<MergeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // View, Sort, Pagination state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedMergeIds, setSelectedMergeIds] = useState<Set<string>>(new Set());

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<MergeListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch merges
  const fetchMerges = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/merges');
      if (!response.ok) {
        throw new Error('Failed to fetch merges');
      }
      const data = await response.json();
      setMerges(data.merges || []);
    } catch (error) {
      console.error('Failed to fetch merges:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerges();
  }, [fetchMerges]);

  // Filtered merges
  const filteredMerges = useMemo(() => {
    let result = merges;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((m) =>
        m.name.toLowerCase().includes(query) ||
        m.sourceNodes.some((n) => n.nodeName.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => m.status === statusFilter);
    }

    return result;
  }, [merges, searchQuery, statusFilter]);

  // Sorted merges
  const sortedMerges = useMemo(() => {
    return [...filteredMerges].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'nodes-desc':
          return (b.warningCount || 0) - (a.warningCount || 0);
        default:
          return 0;
      }
    });
  }, [filteredMerges, sortBy]);

  // Paginated merges
  const paginatedMerges = useMemo(() => {
    return sortedMerges.slice((page - 1) * perPage, page * perPage);
  }, [sortedMerges, page, perPage]);

  // Reset page when filters/sort/search change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  // Toggle selection
  const toggleSelection = (mergeId: string) => {
    const newSelection = new Set(selectedMergeIds);
    if (newSelection.has(mergeId)) {
      newSelection.delete(mergeId);
    } else {
      newSelection.add(mergeId);
    }
    setSelectedMergeIds(newSelection);
  };

  // Check if any filters are active
  const hasFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  // Handle merge created
  const handleMergeCreated = () => {
    fetchMerges();
  };

  // Handle delete click (opens confirmation)
  const handleDeleteClick = (merge: MergeListItem) => {
    setDeleteTarget(merge);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/merges/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMerges((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      } else {
        console.error('Failed to delete merge');
      }
    } catch (error) {
      console.error('Failed to delete merge:', error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setDeleteTarget(null);
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Combine className="w-8 h-8 text-text-primary" />
            <h1 className="text-3xl font-bold text-text-primary">Responsive Merges</h1>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Merge
          </Button>
        </div>
        <p className="text-text-muted text-sm">
          {filteredMerges.length} merges {filteredMerges.length !== merges.length && `(filtered from ${merges.length})`}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search merges by name..."
                className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-40 bg-bg-secondary border-border-primary">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

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

          {/* Sort & Per Page */}
          <SortSelect value={sortBy} onChange={setSortBy} />
          <PerPageSelect
            value={perPage}
            onChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />

          {/* Clear filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-text-muted"
            >
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MergeCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedMerges.length === 0 ? (
        <EmptyState
          onCreateClick={() => setIsModalOpen(true)}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedMerges.map((merge) => (
            <MergeCard
              key={merge.id}
              merge={merge}
              onDeleteClick={handleDeleteClick}
              formatRelativeTime={formatRelativeTime}
            />
          ))}
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
                    checked={selectedMergeIds.size === paginatedMerges.length && paginatedMerges.length > 0}
                    onChange={() => {
                      if (selectedMergeIds.size === paginatedMerges.length) {
                        setSelectedMergeIds(new Set());
                      } else {
                        setSelectedMergeIds(new Set(paginatedMerges.map((m) => m.id)));
                      }
                    }}
                    className="rounded border-border-primary"
                  />
                </th>
                <th className="px-2 py-3 w-24"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Sources</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-text-muted">Warnings</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary">
              {paginatedMerges.map((merge) => (
                <MergeRow
                  key={merge.id}
                  merge={merge}
                  isSelected={selectedMergeIds.has(merge.id)}
                  onToggleSelection={toggleSelection}
                  onDeleteClick={handleDeleteClick}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {sortedMerges.length > 0 && (
        <LibraryPagination
          total={sortedMerges.length}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
        />
      )}

      {/* Creation Modal */}
      <MergeCreationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreated={handleMergeCreated}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteMergeDialog
        open={!!deleteTarget}
        mergeName={deleteTarget?.name || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />
    </div>
  );
}
