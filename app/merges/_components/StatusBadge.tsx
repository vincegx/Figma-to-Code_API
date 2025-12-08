'use client';

/**
 * StatusBadge Component
 *
 * Displays a colored badge indicating merge status (ready/processing/error).
 * VERBATIM from merges/page.tsx lines 47-59 - Phase 3 refactoring
 */

import { cn } from '@/lib/utils';
import type { MergeStatus } from '@/lib/types/merge';

interface StatusBadgeProps {
  status: MergeStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    ready: { label: 'Ready', className: 'bg-green-500/20 text-green-400' },
    processing: { label: 'Processing', className: 'bg-yellow-500/20 text-yellow-400' },
    error: { label: 'Error', className: 'bg-red-500/20 text-red-400' },
  }[status];

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
