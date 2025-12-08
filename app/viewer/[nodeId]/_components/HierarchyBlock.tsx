'use client';

/**
 * HierarchyBlock Component
 *
 * Displays the hierarchy tree of a node's children with expand/collapse functionality.
 * VERBATIM from viewer/[nodeId]/page.tsx lines 72-154 - Phase 3 refactoring
 */

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimpleAltNode } from '@/lib/altnode-transform';

interface HierarchyBlockProps {
  node: SimpleAltNode | null;
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

  const renderNode = (child: SimpleAltNode, depth: number = 0) => {
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
          {hasChildren && (
            <span className="text-text-muted ml-auto">{child.children!.length}</span>
          )}
        </div>
        {isExpanded && child.children && (
          <div>
            {child.children.slice(0, 10).map(subChild => renderNode(subChild, depth + 1))}
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
        {children.slice(0, 10).map(child => renderNode(child))}
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
