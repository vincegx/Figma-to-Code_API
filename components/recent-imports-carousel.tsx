'use client';

/**
 * RecentImportsCarousel - Horizontal Scroll Component
 *
 * Displays recent imports in a horizontal carousel with:
 * - Thumbnail previews
 * - Node name and type
 * - "Add more" CTA
 * - Quick action buttons
 */

import { useNodesStore } from '@/lib/store';
import { Plus, ArrowRight, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function RecentImportsCarousel() {
  const nodes = useNodesStore((s) => s.nodes);

  const recentNodes = [...nodes]
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 5);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 rounded-xl bg-bg-card border border-border-primary">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Recent Imports</h3>
        {nodes.length > 0 && (
          <Link
            href="/nodes"
            className="text-sm text-accent-primary hover:underline flex items-center gap-1 font-medium"
          >
            View all {nodes.length}
            <ArrowRight className="w-4 h-4" />
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
                className="flex-shrink-0 w-36 group"
              >
                {/* Thumbnail */}
                <div
                  className={cn(
                    'aspect-square rounded-lg bg-bg-secondary border border-border-primary overflow-hidden mb-2',
                    'group-hover:border-accent-primary group-hover:shadow-md',
                    'transition-all duration-200'
                  )}
                >
                  {node.thumbnail ? (
                    <Image
                      src={node.thumbnail}
                      alt={node.name}
                      width={144}
                      height={144}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-text-muted" />
                    </div>
                  )}
                </div>

                {/* Name & Type */}
                <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
                  {node.name}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {node.altNode?.type || 'Node'}
                </p>
              </Link>
            ))}

            {/* Add More Card */}
            <button
              onClick={scrollToTop}
              className={cn(
                'flex-shrink-0 w-36 aspect-square rounded-lg',
                'border-2 border-dashed border-border-primary',
                'hover:border-accent-primary hover:bg-accent-primary/5',
                'flex flex-col items-center justify-center gap-2',
                'text-text-muted hover:text-accent-primary',
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
