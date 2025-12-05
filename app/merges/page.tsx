'use client';

/**
 * Merges Library Page
 *
 * Main page for browsing and managing responsive merges.
 * Features:
 * - Grid of merge cards
 * - "New Merge" button to open creation modal
 * - Search by name
 * - Filter by status
 * - Delete with confirmation
 * - Empty state when no merges exist
 * - Loading skeleton while fetching
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Layers, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MergeCard } from '@/components/merge/merge-card';
import { MergeCreationModal } from '@/components/merge/merge-creation-modal';
import { DeleteMergeDialog } from '@/components/merge/delete-merge-dialog';
import type { MergeListItem, Merge, MergeStatus } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

type StatusFilter = MergeStatus | 'all';

// ============================================================================
// Loading Skeleton
// ============================================================================

function MergeCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded bg-muted" />
      </div>
      <div className="mb-4 h-5 w-20 animate-pulse rounded bg-muted" />
      <div className="mb-3 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({
  onCreateClick,
  hasFilters,
  onClearFilters,
}: {
  onCreateClick: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 py-16">
        <Search className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">No matches found</h3>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Try adjusting your search or filter criteria.
        </p>
        <Button variant="outline" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 py-16">
      <Layers className="mb-4 h-12 w-12 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-medium">No merges yet</h3>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Create your first responsive merge by combining
        <br />
        mobile, tablet, and desktop designs.
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Merge
      </Button>
    </div>
  );
}

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
  const handleDeleteClick = (id: string) => {
    const merge = merges.find((m) => m.id === id);
    if (merge) {
      setDeleteTarget(merge);
    }
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
        // Remove from local state
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

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Responsive Merges</h1>
          <p className="text-muted-foreground">
            Combine multiple breakpoint designs into responsive components
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Merge
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search merges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}

        {/* Results count */}
        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            {filteredMerges.length} of {merges.length} merges
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        // Loading state
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MergeCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredMerges.length === 0 ? (
        // Empty state
        <EmptyState
          onCreateClick={() => setIsModalOpen(true)}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />
      ) : (
        // Merge grid
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMerges.map((merge) => (
            <MergeCard
              key={merge.id}
              merge={merge}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
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
