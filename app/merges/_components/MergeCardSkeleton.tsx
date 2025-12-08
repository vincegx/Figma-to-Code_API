'use client';

/**
 * MergeCardSkeleton Component
 *
 * Loading skeleton for merge cards.
 * VERBATIM from merges/page.tsx lines 65-75 - Phase 3 refactoring
 */

export function MergeCardSkeleton() {
  return (
    <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
      <div className="aspect-[4/3] bg-bg-secondary animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 bg-bg-secondary animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-bg-secondary animate-pulse rounded" />
      </div>
    </div>
  );
}
