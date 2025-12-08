'use client';

/**
 * FigmaDataSection Component
 *
 * Figma export data management (cache stats, delete).
 * VERBATIM from settings/page.tsx - Phase 3 refactoring
 */

import { RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CacheStats {
  size: string;
  nodeCount: number;
}

interface FigmaDataSectionProps {
  cacheStats: CacheStats | null;
  loadingCache: boolean;
  clearingCache: boolean;
  onRefresh: () => void;
  onDeleteClick: () => void;
}

export function FigmaDataSection({
  cacheStats,
  loadingCache,
  clearingCache,
  onRefresh,
  onDeleteClick,
}: FigmaDataSectionProps) {
  return (
    <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Figma Export Data</h2>
          <p className="text-sm text-text-muted">Manage your exported Figma designs</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg">
          <div>
            <p className="text-sm font-medium text-text-primary">Storage Statistics</p>
            {loadingCache ? (
              <p className="text-xs text-text-muted">Loading...</p>
            ) : cacheStats ? (
              <p className="text-xs text-text-muted">{cacheStats.nodeCount} designs • {cacheStats.size}</p>
            ) : (
              <p className="text-xs text-text-muted">No data</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loadingCache}>
            <RefreshCw className={cn('h-4 w-4 mr-1', loadingCache && 'animate-spin')} />
            Refresh
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={onDeleteClick}
          disabled={clearingCache || !cacheStats?.nodeCount}
          className="w-full bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete All Data
        </Button>
      </div>
    </div>
  );
}
