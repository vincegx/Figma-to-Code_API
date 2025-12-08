'use client';

/**
 * Merges Library Page
 *
 * Main page for browsing and managing responsive merges.
 * Phase 3 refactoring: extracted useMergesData hook and components
 */

import { useState } from 'react';
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
import { SortSelect } from '@/components/library/sort-select';
import { LibraryPagination } from '@/components/library/library-pagination';
import { PerPageSelect } from '@/components/library/per-page-select';
import { MergeCreationModal } from '@/components/merge/merge-creation-modal';
import { DeleteMergeDialog } from '@/components/merge/delete-merge-dialog';
import type { MergeStatus } from '@/lib/types/merge';

// Phase 3: Extracted hook and components
import { useMergesData } from './_hooks';
import { MergeCardSkeleton, EmptyState, MergeCard, MergeRow } from './_components';

type StatusFilter = MergeStatus | 'all';

export default function MergesPage() {
  // Phase 3: All data logic extracted to hook
  const {
    merges,
    isLoading,
    filteredMerges,
    sortedMerges,
    paginatedMerges,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    hasFilters,
    clearFilters,
    sortBy,
    setSortBy,
    page,
    setPage,
    perPage,
    setPerPage,
    selectedMergeIds,
    toggleSelection,
    toggleSelectAll,
    deleteTarget,
    isDeleting,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    fetchMerges,
    formatRelativeTime,
  } = useMergesData();

  // Local UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
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
              className={cn('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary')}
              title="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-accent-primary text-white' : 'text-text-muted hover:text-text-primary')}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Sort & Per Page */}
          <SortSelect value={sortBy} onChange={setSortBy} />
          <PerPageSelect value={perPage} onChange={(v) => { setPerPage(v); setPage(1); }} />

          {/* Clear filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-text-muted">
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <MergeCardSkeleton key={i} />)}
        </div>
      ) : sortedMerges.length === 0 ? (
        <EmptyState onCreateClick={() => setIsModalOpen(true)} hasFilters={hasFilters} onClearFilters={clearFilters} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginatedMerges.map((merge) => (
            <MergeCard key={merge.id} merge={merge} onDeleteClick={handleDeleteClick} formatRelativeTime={formatRelativeTime} />
          ))}
        </div>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-secondary border-b border-border-primary">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedMergeIds.size === paginatedMerges.length && paginatedMerges.length > 0}
                    onChange={toggleSelectAll}
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
                <MergeRow key={merge.id} merge={merge} isSelected={selectedMergeIds.has(merge.id)} onToggleSelection={toggleSelection} onDeleteClick={handleDeleteClick} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {sortedMerges.length > 0 && (
        <LibraryPagination total={sortedMerges.length} page={page} perPage={perPage} onPageChange={setPage} />
      )}

      {/* Creation Modal */}
      <MergeCreationModal open={isModalOpen} onOpenChange={setIsModalOpen} onCreated={fetchMerges} />

      {/* Delete Confirmation Dialog */}
      <DeleteMergeDialog open={!!deleteTarget} mergeName={deleteTarget?.name || ''} onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} isDeleting={isDeleting} />
    </div>
  );
}
