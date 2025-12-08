'use client';

/**
 * NodeInfoPanel Component
 *
 * Node info, Tailwind classes, and status display.
 * VERBATIM from viewer/[nodeId]/page.tsx lines 932-992 - Phase 3 refactoring
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { FrameworkType } from '@/lib/types/rules';
import { HierarchyBlock } from './HierarchyBlock';

interface NodeInfoPanelProps {
  displayNode: SimpleAltNode | null;
  nodeClasses: string;
  previewFramework: FrameworkType;
}

export function NodeInfoPanel({
  displayNode,
  nodeClasses,
  previewFramework,
}: NodeInfoPanelProps) {
  const [copiedClasses, setCopiedClasses] = useState(false);

  const countChildren = (node: SimpleAltNode | null): number => {
    if (!node?.children) return 0;
    return node.children.length;
  };

  const handleCopyClasses = async () => {
    await navigator.clipboard.writeText(nodeClasses);
    setCopiedClasses(true);
    setTimeout(() => setCopiedClasses(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Node Info */}
      <div className="bg-bg-card rounded-xl border border-border-primary p-4">
        <span className="text-sm font-medium text-text-primary mb-4 block">Node Info</span>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div><span className="text-text-muted text-xs block mb-1">Name</span><span className="text-text-primary text-sm">{displayNode?.name}</span></div>
          <div><span className="text-text-muted text-xs block mb-1">Type</span><span className="flex gap-1"><span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">div</span><span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">{displayNode?.type || 'FRAME'}</span></span></div>
          <div><span className="text-text-muted text-xs block mb-1">ID</span><span className="text-text-primary text-sm font-mono">{displayNode?.id}</span></div>
          <div><span className="text-text-muted text-xs block mb-1">Children</span><span className="text-text-primary text-sm">{countChildren(displayNode)} nodes</span></div>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-muted text-xs">
                {previewFramework === 'html-css' ? 'CSS Classes' : 'Tailwind'}
              </span>
              {nodeClasses && (
                <button
                  onClick={handleCopyClasses}
                  className="text-text-muted hover:text-text-primary transition-colors"
                  title="Copy classes"
                >
                  {copiedClasses ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <div className="bg-bg-secondary rounded p-1.5 h-10 overflow-auto">
              <code className="text-xs text-text-primary font-mono break-all leading-relaxed line-clamp-2">
                {nodeClasses || '—'}
              </code>
            </div>
          </div>
          <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Status</span><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-400 text-sm">Visible</span><span className="text-text-muted text-sm">• Not Locked</span></span></div>
        </div>
      </div>

      {/* Hierarchy + Layout side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Hierarchy */}
        <HierarchyBlock node={displayNode} />

        {/* Layout */}
        <div className="bg-bg-card rounded-xl border border-border-primary p-4">
          <span className="text-sm font-medium text-text-primary mb-4 block">Layout</span>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div><span className="text-text-muted text-xs block mb-1">Width</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.width || 0)}px</span></div>
            <div><span className="text-text-muted text-xs block mb-1">Height</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.height || 0)}px</span></div>
            <div><span className="text-text-muted text-xs block mb-1">X</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.x || 0)}px</span></div>
            <div><span className="text-text-muted text-xs block mb-1">Y</span><span className="text-text-primary text-sm">{Math.round(displayNode?.originalNode?.absoluteBoundingBox?.y || 0)}px</span></div>
            <div><span className="text-text-muted text-xs block mb-1">Mode</span><span className="text-text-primary text-sm">{((displayNode?.originalNode as any)?.layoutMode || 'NONE').charAt(0) + ((displayNode?.originalNode as any)?.layoutMode || 'NONE').slice(1).toLowerCase()}</span></div>
            <div><span className="text-text-muted text-xs block mb-1">Gap</span><span className="text-text-primary text-sm">{(displayNode?.originalNode as any)?.itemSpacing || 0}px</span></div>
            <div className="col-span-2"><span className="text-text-muted text-xs block mb-1">Padding</span><span className="text-text-primary text-sm font-mono tracking-wider">{(displayNode?.originalNode as any)?.paddingTop || 0} &nbsp; {(displayNode?.originalNode as any)?.paddingRight || 0} &nbsp; {(displayNode?.originalNode as any)?.paddingBottom || 0} &nbsp; {(displayNode?.originalNode as any)?.paddingLeft || 0}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
