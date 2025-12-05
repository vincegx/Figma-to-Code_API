'use client';

/**
 * Merges Library Page
 *
 * Main page for browsing and managing responsive merges.
 * Features:
 * - Grid of merge cards
 * - "New Merge" button to open creation modal
 * - Empty state when no merges exist
 * - Loading skeleton while fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MergeCard } from '@/components/merge/merge-card';
import { MergeCreationModal } from '@/components/merge/merge-creation-modal';
import type { MergeListItem, Merge } from '@/lib/types/merge';

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

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
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
  const [merges, setMerges] = useState<MergeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleMergeCreated = (merge: Merge) => {
    // Refresh the list to include the new merge
    fetchMerges();
  };

  const handleDelete = async (id: string) => {
    // Optimistically remove from UI
    setMerges((prev) => prev.filter((m) => m.id !== id));

    try {
      const response = await fetch(`/api/merges/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        // Revert on failure
        fetchMerges();
      }
    } catch (error) {
      console.error('Failed to delete merge:', error);
      // Revert on error
      fetchMerges();
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
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

      {/* Content */}
      {isLoading ? (
        // Loading state
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MergeCardSkeleton key={i} />
          ))}
        </div>
      ) : merges.length === 0 ? (
        // Empty state
        <EmptyState onCreateClick={() => setIsModalOpen(true)} />
      ) : (
        // Merge grid
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {merges.map((merge) => (
            <MergeCard
              key={merge.id}
              merge={merge}
              onDelete={handleDelete}
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
    </div>
  );
}
