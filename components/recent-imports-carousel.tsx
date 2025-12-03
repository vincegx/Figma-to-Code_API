'use client';

/**
 * RecentImportsCarousel - Horizontal Scroll Component (WP42 Redesign V2)
 *
 * Displays recent imports in a horizontal carousel with:
 * - Dark solid cards (no thumbnails)
 * - Status badges (green/amber dot)
 * - Node count display
 * - Subtitle "Latest Figma files you've converted"
 */

import { useNodesStore } from '@/lib/store';
import { Plus, ArrowUpRight, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function RecentImportsCarousel() {
  const nodes = useNodesStore((s) => s.nodes);

  const recentNodes = [...nodes]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine status (green = viewed, amber = processing, etc.)
  const getStatusColor = (node: typeof nodes[0]) => {
    // Simple logic: if it has altNode, it's processed
    return node.altNode ? 'bg-emerald-400' : 'bg-amber-400';
  };

  return (
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
            {recentNodes.map((node) => (
              <Link
                key={node.id}
                href={`/viewer/${node.id}`}
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
                      src={node.thumbnail}
                      alt={node.name}
                      fill
                      className="object-cover"
                      sizes="224px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      'w-3 h-3 rounded-full block',
                      getStatusColor(node)
                    )} />
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
            ))}

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
  );
}
