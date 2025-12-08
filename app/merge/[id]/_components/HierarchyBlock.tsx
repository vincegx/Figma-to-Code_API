'use client';

/**
 * HierarchyBlock Component for Merge Viewer
 *
 * Displays the hierarchy tree of a unified element's children with expand/collapse functionality.
 * Shows breakpoint indicators (mobile/tablet/desktop) for each node.
 * VERBATIM from merge/[id]/page.tsx lines 74-158 - Phase 3 refactoring
 */

import { useState } from 'react';
import { ChevronRight, Smartphone, Tablet, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnifiedElement } from '@/lib/types/merge';

interface HierarchyBlockProps {
  node: UnifiedElement | null;
}

export function HierarchyBlock({ node }: HierarchyBlockProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const children = node?.children || [];
  const childCount = children.length;

  const renderNode = (child: UnifiedElement, depth: number = 0) => {
    const hasChildren = child.children && child.children.length > 0;
    const isExpanded = expandedIds.has(child.id);

    return (
      <div key={child.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded text-xs cursor-pointer transition-colors",
            "hover:bg-bg-hover"
          )}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
          onClick={() => hasChildren && toggleExpand(child.id)}
        >
          {hasChildren ? (
            <ChevronRight
              className={cn(
                "w-3 h-3 text-text-muted transition-transform",
                isExpanded && "rotate-90"
              )}
            />
          ) : (
            <span className="w-3 h-3" />
          )}
          <span className="text-text-primary">{child.name}</span>
          {/* Breakpoint indicators */}
          <div className="flex items-center gap-0.5 ml-auto">
            {child.presence.mobile && <Smartphone className="w-3 h-3 text-text-muted" />}
            {child.presence.tablet && <Tablet className="w-3 h-3 text-text-muted" />}
            {child.presence.desktop && <Monitor className="w-3 h-3 text-text-muted" />}
          </div>
        </div>
        {isExpanded && child.children && (
          <div>
            {child.children.slice(0, 10).map(subChild => renderNode(subChild as UnifiedElement, depth + 1))}
            {child.children.length > 10 && (
              <div className="text-xs text-text-muted px-3 py-1" style={{ paddingLeft: `${24 + depth * 12}px` }}>
                +{child.children.length - 10} more...
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-4">
      <span className="text-sm font-medium text-text-primary mb-4 block">Hierarchy</span>
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="text-text-muted">Children</span>
        <span className="text-text-primary">{childCount} nodes</span>
      </div>
      <div className="space-y-1 h-[140px] overflow-auto">
        {children.slice(0, 10).map(child => renderNode(child as UnifiedElement))}
        {children.length > 10 && (
          <div className="text-xs text-text-muted px-3 py-1">
            +{children.length - 10} more...
          </div>
        )}
        {children.length === 0 && (
          <div className="text-xs text-text-muted">No children</div>
        )}
      </div>
    </div>
  );
}
