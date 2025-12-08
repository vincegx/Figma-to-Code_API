'use client';

/**
 * TreePanel Component
 *
 * Left panel with unified tree view (collapsible/resizable).
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { Resizable } from 're-resizable';
import { PanelLeftClose, PanelLeftOpen, Eye } from 'lucide-react';
import UnifiedTreeView from '@/components/unified-tree-view';
import { cn } from '@/lib/utils';
import type { UnifiedElement } from '@/lib/types/merge';

interface TreePanelProps {
  unifiedTree: UnifiedElement | null;
  selectedNodeId: string | null;
  onNodeClick: (id: string) => void;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  highlightEnabled: boolean;
  onHighlightChange: (enabled: boolean) => void;
}

export function TreePanel({
  unifiedTree,
  selectedNodeId,
  onNodeClick,
  isCollapsed,
  onCollapseChange,
  highlightEnabled,
  onHighlightChange,
}: TreePanelProps) {
  if (isCollapsed) {
    return (
      <div className="w-10 flex-shrink-0 mr-4 bg-bg-card rounded-lg border border-border-primary flex flex-col items-center py-2">
        <button
          onClick={() => onCollapseChange(false)}
          className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
          title="Expand panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <Resizable
      defaultSize={{ width: 320, height: '100%' }}
      minWidth={240}
      maxWidth={520}
      enable={{ right: true }}
      handleStyles={{
        right: {
          width: '20px',
          cursor: 'ew-resize',
          right: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }
      }}
      handleComponent={{
        right: (
          <div className="h-16 w-1 bg-border-primary rounded-full hover:bg-cyan-500 transition-colors" />
        )
      }}
      className="flex-shrink-0"
    >
      <div className="h-full mr-5 bg-bg-card rounded-xl border border-border-primary flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-primary">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">Unified Tree</span>
            <button
              onClick={() => onHighlightChange(!highlightEnabled)}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 text-xs rounded',
                highlightEnabled ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover'
              )}
            >
              <Eye className="w-3 h-3" />
              Inspect
            </button>
          </div>
          <button
            onClick={() => onCollapseChange(true)}
            className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Collapse panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <UnifiedTreeView
            unifiedTree={unifiedTree}
            selectedNodeId={selectedNodeId}
            onNodeClick={onNodeClick}
          />
        </div>
      </div>
    </Resizable>
  );
}
