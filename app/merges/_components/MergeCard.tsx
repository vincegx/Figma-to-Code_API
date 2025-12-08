'use client';

/**
 * MergeCard Component
 *
 * Grid view card for a single merge.
 * VERBATIM from merges/page.tsx - Phase 3 refactoring
 */

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Layers, MoreVertical, Eye, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MergeListItem } from '@/lib/types/merge';
import { StatusBadge } from './StatusBadge';

interface MergeCardProps {
  merge: MergeListItem;
  onDeleteClick: (merge: MergeListItem) => void;
  formatRelativeTime: (dateString: string) => string;
}

export function MergeCard({ merge, onDeleteClick, formatRelativeTime }: MergeCardProps) {
  const router = useRouter();

  return (
    <div
      className="group bg-bg-card rounded-xl border border-border-primary overflow-hidden hover:border-border-secondary transition-all cursor-pointer"
      onClick={() => router.push(`/merge/${merge.id}`)}
    >
      {/* Preview thumbnails */}
      <div className="aspect-[4/3] bg-bg-secondary flex items-center justify-center relative">
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none rounded-t-xl" />

        {/* Thumbnails row */}
        <div className="flex items-center justify-center gap-2 p-3">
          {merge.sourceNodes.map((node, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded overflow-hidden bg-bg-primary border border-border-primary',
                node.breakpoint === 'mobile' && 'w-14 h-20',
                node.breakpoint === 'tablet' && 'w-20 h-16',
                node.breakpoint === 'desktop' && 'w-28 h-16'
              )}
            >
              {node.thumbnail ? (
                <Image
                  src={node.thumbnail}
                  alt={node.nodeName}
                  width={112}
                  height={80}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">
                  <Layers className="w-4 h-4" />
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
                  onDeleteClick(merge);
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
          <div className="flex items-center gap-2">
            {merge.warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {merge.warningCount}
              </span>
            )}
            <StatusBadge status={merge.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
