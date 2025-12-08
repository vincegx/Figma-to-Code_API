'use client';

/**
 * RecentImportsCarousel - Horizontal Scroll Component (WP42 Redesign V2, WP44 Updates)
 *
 * Displays recent imports in a horizontal carousel with:
 * - Dark solid cards with thumbnails
 * - Sync status badges (green = <24h, amber = >24h or never)
 * - Tooltip showing sync status details
 * - Subtitle "Latest Figma files you've converted"
 */

import { useNodesStore } from '@/lib/store';
import { Plus, ArrowUpRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type SyncStatus = 'synced' | 'not_synced';

interface SyncInfo {
  status: SyncStatus;
  label: string;
  timeAgo: string;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}

export function RecentImportsCarousel() {
  const nodes = useNodesStore((s) => s.nodes);

  const recentNodes = [...nodes]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // WP44: Determine sync status based on lastModified
  const getSyncInfo = (node: typeof nodes[0]): SyncInfo => {
    const lastRefetch = node.lastModified;

    if (!lastRefetch) {
      return {
        status: 'not_synced',
        label: 'Not synced',
        timeAgo: 'Never refreshed',
      };
    }

    const lastRefetchDate = new Date(lastRefetch);
    const now = Date.now();
    const hoursSinceRefetch = (now - lastRefetchDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRefetch < 24) {
      return {
        status: 'synced',
        label: 'Synced',
        timeAgo: `Last refetch: ${formatTimeAgo(lastRefetchDate)}`,
      };
    } else {
      return {
        status: 'not_synced',
        label: 'Not synced',
        timeAgo: `Last refetch: ${formatTimeAgo(lastRefetchDate)}`,
      };
    }
  };

  const getStatusColor = (syncInfo: SyncInfo) => {
    return syncInfo.status === 'synced' ? 'bg-emerald-400' : 'bg-amber-400';
  };

  return (
    <TooltipProvider>
      <div className="p-5 rounded-xl bg-bg-card border border-border-primary">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Recent Imports</h3>
            <p className="text-xs text-text-muted mt-0.5">Latest Figma files you&apos;ve converted</p>
          </div>
          {nodes.length > 0 && (
            <Link
              href="/nodes"
              className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1 font-medium transition-colors"
            >
              View all {nodes.length}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Empty State */}
        {recentNodes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
              <Package className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-muted mb-4">No nodes imported yet</p>
            <button
              onClick={scrollToTop}
              className="px-4 py-2 text-sm font-medium border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover transition-colors"
            >
              Import your first design
            </button>
          </div>
        ) : (
          <>
            {/* Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
              {recentNodes.map((node) => {
                const syncInfo = getSyncInfo(node);
                return (
                  <Link
                    key={node.id}
                    href={`/node/${node.id}`}
                    className="flex-shrink-0 w-56 group"
                  >
                    {/* Card with Thumbnail */}
                    <div
                      className={cn(
                        'relative h-32 rounded-lg bg-bg-secondary border border-border-primary overflow-hidden mb-3',
                        'group-hover:border-border-secondary group-hover:bg-bg-hover',
                        'transition-all duration-200'
                      )}
                    >
                      {/* Thumbnail Image */}
                      {node.thumbnail ? (
                        <Image
                          src={`${node.thumbnail}?w=448`}
                          alt={node.name}
                          fill
                          className="object-cover"
                          sizes="224px"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-8 h-8 text-text-muted" />
                        </div>
                      )}
                      {/* WP44: Sync Status Badge with Tooltip */}
                      <div className="absolute top-3 right-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={cn(
                                'w-3 h-3 rounded-full block cursor-help',
                                getStatusColor(syncInfo)
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  getStatusColor(syncInfo)
                                )}
                              />
                              <span>{syncInfo.label}</span>
                            </div>
                            <div className="text-text-muted mt-0.5">
                              {syncInfo.timeAgo}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Name & Date */}
                    <p className="text-xs font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
                      {node.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {node.addedAt ? new Date(node.addedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </Link>
                );
              })}

              {/* Add More Card */}
              <button
                onClick={scrollToTop}
                className={cn(
                  'flex-shrink-0 w-56 h-32 rounded-lg',
                  'border-2 border-dashed border-border-primary',
                  'hover:border-border-secondary hover:bg-bg-hover',
                  'flex flex-col items-center justify-center gap-2',
                  'text-text-muted hover:text-text-secondary',
                  'transition-all duration-200'
                )}
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">Add more</span>
              </button>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
