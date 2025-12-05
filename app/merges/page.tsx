'use client';

/**
 * Merges Library Page
 *
 * Main page for browsing and managing responsive merges.
 * Styled to match the /nodes page.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Layers, Search, X, MoreVertical, Eye, Trash2, Combine } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MergeCreationModal } from '@/components/merge/merge-creation-modal';
import { DeleteMergeDialog } from '@/components/merge/delete-merge-dialog';
import type { MergeListItem, MergeStatus } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

type StatusFilter = MergeStatus | 'all';

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: MergeStatus }) {
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

// ============================================================================
// Loading Skeleton
// ============================================================================

function MergeCardSkeleton() {
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

// ============================================================================
// Main Page Component
// ============================================================================

export default function MergesPage() {
  const router = useRouter();

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
      ) : filteredMerges.length === 0 ? (
        <EmptyState
          onCreateClick={() => setIsModalOpen(true)}
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMerges.map((merge) => (
            <div
              key={merge.id}
              className="group bg-bg-card rounded-xl border border-border-primary overflow-hidden hover:border-border-secondary transition-all cursor-pointer"
              onClick={() => router.push(`/merge/${merge.id}`)}
            >
              {/* Preview thumbnails */}
              <div className="aspect-[4/3] bg-bg-secondary flex items-center justify-center relative">
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none rounded-t-xl" />

                {/* Thumbnails row */}
                <div className="flex items-center justify-center gap-1 p-2">
                  {merge.sourceNodes.map((node, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded overflow-hidden bg-bg-primary border border-border-primary',
                        node.breakpoint === 'mobile' && 'w-8 h-12',
                        node.breakpoint === 'tablet' && 'w-12 h-10',
                        node.breakpoint === 'desktop' && 'w-16 h-10'
                      )}
                    >
                      {node.thumbnail ? (
                        <Image
                          src={node.thumbnail}
                          alt={node.nodeName}
                          width={64}
                          height={48}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted">
                          <Layers className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Kebab Menu */}
                <div className="absolute top-2 right-2 z-20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 bg-bg-card/90 backdrop-blur-sm rounded-lg hover:bg-bg-card">
                        <MoreVertical className="w-4 h-4 text-text-primary" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/merge/${merge.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View merge
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(merge);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3">
                <h3 className="font-medium text-text-primary truncate text-sm mb-1">
                  {merge.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">
                    {formatRelativeTime(merge.createdAt)}
                  </span>
                  <StatusBadge status={merge.status} />
                </div>
              </div>
            </div>
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
