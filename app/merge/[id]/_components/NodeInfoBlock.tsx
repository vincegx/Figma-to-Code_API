'use client';

/**
 * NodeInfoBlock Component
 *
 * Node info card showing name, type, ID, children, sources, and classes.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { useState } from 'react';
import Link from 'next/link';
import { Smartphone, Tablet, Monitor, Copy, Check } from 'lucide-react';
import type { UnifiedElement, MergeSourceNode } from '@/lib/types/merge';

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

interface NodeInfoBlockProps {
  displayNode: UnifiedElement | null;
  sourceNodes: readonly MergeSourceNode[];
  nodeClasses: string;
  previewFramework: MergeFrameworkType;
}

export function NodeInfoBlock({
  displayNode,
  sourceNodes,
  nodeClasses,
  previewFramework,
}: NodeInfoBlockProps) {
  const [copiedClasses, setCopiedClasses] = useState(false);

  // Count children helper
  const countChildren = (node: UnifiedElement | null): number => {
    if (!node?.children) return 0;
    return node.children.length;
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-4">
      <span className="text-sm font-medium text-text-primary mb-4 block">Node Info</span>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {/* Name */}
        <div>
          <span className="text-text-muted text-xs block mb-1">Name</span>
          <span className="text-text-primary text-sm">{displayNode?.name}</span>
        </div>
        {/* Type */}
        <div>
          <span className="text-text-muted text-xs block mb-1">Type</span>
          <span className="flex gap-1">
            <span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">div</span>
            <span className="px-1.5 py-0.5 bg-bg-secondary rounded text-xs text-text-primary">{displayNode?.type || 'FRAME'}</span>
          </span>
        </div>
        {/* ID */}
        <div>
          <span className="text-text-muted text-xs block mb-1">ID</span>
          <span className="text-text-primary text-sm font-mono">
            {displayNode?.sources?.mobile?.nodeId || displayNode?.sources?.tablet?.nodeId || displayNode?.sources?.desktop?.nodeId || displayNode?.id}
          </span>
        </div>
        {/* Children */}
        <div>
          <span className="text-text-muted text-xs block mb-1">Children</span>
          <span className="text-text-primary text-sm">{countChildren(displayNode)} nodes</span>
        </div>
        {/* Sources */}
        <div>
          <span className="text-text-muted text-xs block mb-1">Sources</span>
          <div className="flex items-center gap-2">
            {sourceNodes.map((source) => (
              <Link
                key={source.breakpoint}
                href={`/node/${source.nodeId}`}
                className="flex items-center gap-1 px-1.5 py-1 bg-bg-secondary rounded text-xs text-text-primary hover:bg-bg-hover transition-colors"
                title={source.nodeName}
              >
                {source.breakpoint === 'mobile' && <Smartphone className="w-3 h-3" />}
                {source.breakpoint === 'tablet' && <Tablet className="w-3 h-3" />}
                {source.breakpoint === 'desktop' && <Monitor className="w-3 h-3" />}
              </Link>
            ))}
          </div>
        </div>
        {/* Tailwind/CSS Classes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-muted text-xs">
              {previewFramework === 'html-css' ? 'CSS Classes' : 'Tailwind'}
            </span>
            {nodeClasses && (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(nodeClasses);
                  setCopiedClasses(true);
                  setTimeout(() => setCopiedClasses(false), 2000);
                }}
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
        {/* Status */}
        <div className="col-span-2">
          <span className="text-text-muted text-xs block mb-1">Status</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-400 text-sm">Visible</span>
            <span className="text-text-muted text-sm">•</span>
            {displayNode?.presence.mobile && <span className="flex items-center gap-1 text-xs text-text-muted"><Smartphone className="w-3 h-3" /></span>}
            {displayNode?.presence.tablet && <span className="flex items-center gap-1 text-xs text-text-muted"><Tablet className="w-3 h-3" /></span>}
            {displayNode?.presence.desktop && <span className="flex items-center gap-1 text-xs text-text-muted"><Monitor className="w-3 h-3" /></span>}
          </span>
        </div>
      </div>
    </div>
  );
}
