'use client';

import { useState } from 'react';
import type { UnifiedElement } from '@/lib/types/merge';
import { ChevronRight, ChevronDown, Smartphone, Tablet, Monitor } from 'lucide-react';
import { FigmaTypeIcon } from './figma-type-icon';
import { getNodeColors } from '@/lib/utils/node-colors';
import { cn } from '@/lib/utils';

/**
 * Unified Tree View Component
 *
 * WP08: Tree view for UnifiedElement structure (from merge result).
 * Similar to FigmaTreeView but adapted for merged responsive elements.
 * Shows breakpoint presence indicators and visibility classes.
 */

interface UnifiedTreeViewProps {
  unifiedTree: UnifiedElement | null;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

export default function UnifiedTreeView({
  unifiedTree,
  selectedNodeId,
  onNodeClick,
}: UnifiedTreeViewProps) {
  if (!unifiedTree) {
    return (
      <div className="p-4 text-text-muted">
        <p>Loading unified tree...</p>
        <p className="text-sm mt-2">
          The merged structure will appear here once loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4 text-text-secondary flex items-center justify-between">
        <span>Unified Tree</span>
        <span className="text-xs font-normal text-text-muted">
          Click to inspect
        </span>
      </h3>
      <TreeNode
        node={unifiedTree}
        level={0}
        selectedNodeId={selectedNodeId}
        onNodeClick={onNodeClick}
        defaultExpanded={true}
      />
    </div>
  );
}

interface TreeNodeProps {
  node: UnifiedElement;
  level: number;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  defaultExpanded?: boolean;
}

function TreeNode({
  node,
  level,
  selectedNodeId,
  onNodeClick,
  defaultExpanded = false,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0 ? true : defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const colors = getNodeColors(node.type);

  // Check if element has partial visibility (not present in all breakpoints)
  const hasPartialVisibility =
    !node.presence.mobile || !node.presence.tablet || !node.presence.desktop;

  return (
    <div>
      {/* Node row */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
          isSelected
            ? cn('bg-accent-secondary', colors.text)
            : 'hover:bg-bg-hover',
          hasPartialVisibility && 'opacity-75'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onNodeClick(node.id)}
      >
        {/* Expand/collapse icon */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-bg-hover rounded flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}

        {/* Type icon */}
        <FigmaTypeIcon
          type={node.type}
          size={14}
          className={cn('flex-shrink-0', colors.text)}
        />

        {/* Node name */}
        <span
          className={cn(
            'text-sm truncate flex-1',
            isSelected ? colors.text : 'text-text-primary'
          )}
        >
          {node.name}
        </span>

        {/* Breakpoint presence indicators */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Smartphone
            size={12}
            className={cn(
              node.presence.mobile ? 'text-green-500' : 'text-text-muted opacity-30'
            )}
          />
          <Tablet
            size={12}
            className={cn(
              node.presence.tablet ? 'text-blue-500' : 'text-text-muted opacity-30'
            )}
          />
          <Monitor
            size={12}
            className={cn(
              node.presence.desktop ? 'text-purple-500' : 'text-text-muted opacity-30'
            )}
          />
        </div>

        {/* Metadata badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* HTML type badge */}
          <span className="text-xs text-text-muted bg-bg-secondary px-1 rounded font-mono">
            {node.type}
          </span>
          {/* Children count */}
          {hasChildren && (
            <span className="text-xs text-text-muted min-w-[20px] text-right">
              {node.children!.length}
            </span>
          )}
        </div>
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedNodeId={selectedNodeId}
              onNodeClick={onNodeClick}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
