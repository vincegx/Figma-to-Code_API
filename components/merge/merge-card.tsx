'use client';

/**
 * Merge Card Component
 *
 * Displays a single merge in the library grid/list view.
 * Shows merge name, status badge, source node thumbnails, and creation date.
 * Supports click-to-navigate and delete actions.
 */

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MergeListItem, MergeStatus } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

interface MergeCardProps {
  merge: MergeListItem;
  onDelete: (id: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get badge variant based on merge status
 */
function getStatusVariant(status: MergeStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'ready':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Get status display text
 */
function getStatusLabel(status: MergeStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'processing':
      return 'Processing';
    case 'error':
      return 'Error';
    default:
      return status;
  }
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// Component
// ============================================================================

export function MergeCard({ merge, onDelete }: MergeCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/merge/${merge.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    onDelete(merge.id);
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{merge.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete merge</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(merge.status)}>
            {getStatusLabel(merge.status)}
          </Badge>
          {merge.warningCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {merge.warningCount} warning{merge.warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Source node thumbnails */}
        <div className="mb-3 flex gap-2">
          {merge.sourceNodes.map((node) => (
            <div
              key={node.breakpoint}
              className="flex flex-col items-center"
            >
              <div className="h-12 w-12 overflow-hidden rounded border bg-muted">
                {node.thumbnail ? (
                  <img
                    src={node.thumbnail}
                    alt={`${node.breakpoint} thumbnail`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    {node.breakpoint.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="mt-1 text-xs text-muted-foreground">
                {node.breakpoint.charAt(0).toUpperCase() + node.breakpoint.slice(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Creation date */}
        <p className="text-xs text-muted-foreground">
          Created {formatRelativeTime(merge.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
