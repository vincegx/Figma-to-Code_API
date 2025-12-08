'use client';

/**
 * RecentMergesCarousel - Horizontal Scroll Component
 *
 * Displays recent merges in a horizontal carousel with:
 * - Dark solid cards with thumbnails
 * - Status badges
 * - Link to view all merges
 */

import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, Combine, Smartphone, Tablet, Monitor } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { MergeListItem } from '@/lib/types/merge';

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

export function RecentMergesCarousel() {
  const [merges, setMerges] = useState<MergeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMerges() {
      try {
        const response = await fetch('/api/merges');
        if (response.ok) {
          const data = await response.json();
          setMerges(data.merges || []);
        }
      } catch (err) {
        console.error('Failed to load merges:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMerges();
  }, []);

  const recentMerges = [...merges]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-emerald-400';
      case 'processing':
        return 'bg-amber-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="p-5 rounded-xl bg-bg-card border border-border-primary h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Recent Merges</h3>
          <p className="text-xs text-text-muted mt-0.5">Responsive components from multiple breakpoints</p>
        </div>
        {merges.length > 0 && (
          <Link
            href="/merges"
            className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-1 font-medium transition-colors"
          >
            View all {merges.length}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Empty State (also shown during loading to avoid skeleton flash) */}
      {isLoading || recentMerges.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
            <Combine className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted mb-4">No merges created yet</p>
          <Link
            href="/merges"
            className="px-4 py-2 text-sm font-medium border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover transition-colors inline-block"
          >
            Create your first merge
          </Link>
        </div>
      ) : (
        /* Carousel */
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          {recentMerges.map((merge) => (
            <Link
              key={merge.id}
              href={`/merge/${merge.id}`}
              className="flex-shrink-0 w-56 group"
            >
              {/* Card with Thumbnails */}
              <div
                className={cn(
                  'relative h-32 rounded-lg bg-bg-secondary border border-border-primary overflow-hidden mb-3',
                  'group-hover:border-border-secondary group-hover:bg-bg-hover',
                  'transition-all duration-200',
                  'flex items-center justify-center gap-2 p-3'
                )}
              >
                {/* 3 Breakpoint Thumbnails */}
                {merge.sourceNodes.map((node, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'rounded overflow-hidden bg-bg-primary border border-border-primary flex-shrink-0',
                      node.breakpoint === 'mobile' && 'w-10 h-16',
                      node.breakpoint === 'tablet' && 'w-14 h-12',
                      node.breakpoint === 'desktop' && 'w-20 h-12'
                    )}
                  >
                    {node.thumbnail ? (
                      <Image
                        src={node.thumbnail}
                        alt={node.nodeName}
                        width={80}
                        height={64}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        {node.breakpoint === 'mobile' && <Smartphone className="w-3 h-3" />}
                        {node.breakpoint === 'tablet' && <Tablet className="w-3 h-3" />}
                        {node.breakpoint === 'desktop' && <Monitor className="w-3 h-3" />}
                      </div>
                    )}
                  </div>
                ))}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={cn(
                      'w-3 h-3 rounded-full block',
                      getStatusColor(merge.status)
                    )}
                    title={merge.status}
                  />
                </div>
              </div>

              {/* Name & Date */}
              <p className="text-xs font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
                {merge.name}
              </p>
              <p className="text-xs text-text-muted">
                {formatTimeAgo(new Date(merge.createdAt))}
              </p>
            </Link>
          ))}

          {/* Add More Card */}
          <Link
            href="/merges"
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
          </Link>
        </div>
      )}
    </div>
  );
}
