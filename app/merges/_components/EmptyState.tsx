'use client';

/**
 * EmptyState Component
 *
 * Empty state display when no merges exist or match filters.
 * VERBATIM from merges/page.tsx lines 81-117 - Phase 3 refactoring
 */

import { Search, X, Combine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateClick: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function EmptyState({
  onCreateClick,
  hasFilters,
  onClearFilters,
}: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="text-center py-16 bg-bg-card rounded-xl border border-border-primary">
        <Search className="w-16 h-16 mx-auto mb-4 text-text-muted" />
        <p className="text-text-muted mb-4">No merges match your filters</p>
        <Button variant="outline" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16 bg-bg-card rounded-xl border border-border-primary">
      <Combine className="w-16 h-16 mx-auto mb-4 text-text-muted" />
      <p className="text-text-muted mb-4">No merges yet</p>
      <p className="text-text-muted text-sm mb-6">
        Create your first responsive merge by combining<br />
        mobile, tablet, and desktop designs.
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 h-4 w-4" />
        Create Merge
      </Button>
    </div>
  );
}
