'use client';

import { useState } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { FigmaTypeIcon } from './figma-type-icon';
import { InstanceBadge } from './instance-badge';
import { getNodeColors } from '@/lib/utils/node-colors';
import { cn } from '@/lib/utils';

// ============================================================================
// Layout Icon Helper (WP18 - T157)
// ============================================================================

/**
 * Get layout icon for nodes with auto-layout
 * Returns null if no auto-layout (layoutMode === 'NONE' or undefined)
 *
 * Icon selection logic:
 * 1. Wrap mode (layoutWrap='WRAP') → grid icon
 * 2. Row layout → flex row icon (alignment: left/center/right)
 * 3. Column layout → flex column icon (alignment: top/center/bottom)
 * 4. No layout → null
 */
function getLayoutIcon(node: SimpleAltNode): React.ReactNode | null {
  const layoutMode = (node.originalNode as any)?.layoutMode;
  const layoutWrap = (node.originalNode as any)?.layoutWrap;
  const primaryAxisAlignItems = (node.originalNode as any)?.primaryAxisAlignItems;

  // No auto-layout = no icon
  if (!layoutMode || layoutMode === 'NONE') {
    return null;
  }

  // Wrap mode takes precedence - show grid icon
  if (layoutWrap === 'WRAP') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
        <path fillRule="evenodd" d="M5.5 3a.5.5 0 0 1 .5.5V5h4V3.5a.5.5 0 0 1 1 0V5h1.5a.5.5 0 0 1 0 1H11v4h1.5a.5.5 0 0 1 0 1H11v1.5a.5.5 0 0 1-1 0V11H6v1.5a.5.5 0 0 1-1 0V11H3.5a.5.5 0 0 1 0-1H5V6H3.5a.5.5 0 0 1 0-1H5V3.5a.5.5 0 0 1 .5-.5m4.5 7V6H6v4z" clipRule="evenodd"></path>
      </svg>
    );
  }

  // Row layout (HORIZONTAL) - elements arranged horizontally (side by side)
  if (layoutMode === 'HORIZONTAL') {
    // Row center
    if (primaryAxisAlignItems === 'CENTER') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
          <path fillRule="evenodd" d="M4 4h2v8H4zM3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm7 2h2v4h-2zM9 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" clipRule="evenodd"></path>
        </svg>
      );
    }
    // Row right
    if (primaryAxisAlignItems === 'MAX') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
          <path fillRule="evenodd" d="M4 4h2v8H4zM3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm7 4h2v4h-2zM9 8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" clipRule="evenodd"></path>
        </svg>
      );
    }
    // Row left (MIN or default)
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
        <path fillRule="evenodd" d="M4 4h2v8H4zM3 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zm7 0h2v4h-2zM9 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z" clipRule="evenodd"></path>
      </svg>
    );
  }

  // Column layout (VERTICAL) - elements arranged vertically (stacked)
  if (layoutMode === 'VERTICAL') {
    // Column center
    if (primaryAxisAlignItems === 'CENTER') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
          <path fillRule="evenodd" d="M4 4v2h8V4zm0-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm2 7v2h4v-2zm0-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" clipRule="evenodd"></path>
        </svg>
      );
    }
    // Column bottom
    if (primaryAxisAlignItems === 'MAX') {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
          <path fillRule="evenodd" d="M4 4v2h8V4zm0-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm4 7v2h4v-2zm0-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" clipRule="evenodd"></path>
        </svg>
      );
    }
    // Column top (MIN or default)
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
        <path fillRule="evenodd" d="M4 4v2h8V4zm0-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm0 7v2h4v-2zm0-1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" clipRule="evenodd"></path>
      </svg>
    );
  }

  return null;
}

interface FigmaTreeViewProps {
  altNode: SimpleAltNode | null;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

export default function FigmaTreeView({
  altNode,
  selectedNodeId,
  onNodeClick,
}: FigmaTreeViewProps) {
  if (!altNode) {
    return (
      <div className="p-4 text-text-muted">
        <p>Loading Figma tree...</p>
        <p className="text-sm mt-2">
          The node structure will appear here once loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4 text-text-secondary flex items-center justify-between">
        <span>Figma Tree</span>
        <span className="text-xs font-normal text-text-muted">
          Click to inspect
        </span>
      </h3>
      <TreeNode
        node={altNode}
        level={0}
        selectedNodeId={selectedNodeId}
        onNodeClick={onNodeClick}
        defaultExpanded={false} // Collapsed by default like Figma
      />
    </div>
  );
}

interface TreeNodeProps {
  node: SimpleAltNode;
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
  // Root level expanded by default, others collapsed
  const [isExpanded, setIsExpanded] = useState(level === 0 ? true : defaultExpanded);
  const hasChildren =
    'children' in node && node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const figmaType = node.originalNode?.type || 'FRAME';
  const colors = getNodeColors(figmaType);

  // Extract component name for INSTANCE nodes
  const componentName =
    figmaType === 'INSTANCE'
      ? (node.originalNode as any)?.componentId ? node.name : undefined
      : undefined;

  return (
    <div>
      {/* Node row - dim hidden nodes */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
          isSelected
            ? cn('bg-accent-secondary', colors.text)
            : 'hover:bg-bg-hover',
          !node.visible && 'opacity-50' // T156: Dim hidden nodes
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
          <span className="w-5 flex-shrink-0" /> // Spacer for alignment
        )}

        {/* Icon: Layout icon for auto-layout nodes, type icon otherwise (WP18 - T157) */}
        {getLayoutIcon(node) ? (
          <div className="flex-shrink-0 text-text-muted">
            {getLayoutIcon(node)}
          </div>
        ) : (
          <FigmaTypeIcon
            type={figmaType}
            size={14}
            className={cn('flex-shrink-0', colors.text)}
          />
        )}

        {/* Node name */}
        <span
          className={cn(
            'text-sm truncate flex-1',
            isSelected ? colors.text : 'text-text-primary'
          )}
        >
          {node.name}
        </span>

        {/* Instance badge for INSTANCE nodes - use figmaType, NOT node.type */}
        {figmaType === 'INSTANCE' && componentName && (
          <InstanceBadge componentName={componentName} />
        )}

        {/* Metadata badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* HTML type badge - shows the rendered HTML element type */}
          <span className="text-xs text-text-muted bg-bg-secondary px-1 rounded font-mono">
            {node.type}
          </span>
          {/* Invisible badge */}
          {!node.visible && (
            <EyeOff size={12} className="text-text-muted" />
          )}
          {/* Children count */}
          {hasChildren && 'children' in node && (
            <span className="text-xs text-text-muted min-w-[20px] text-right">
              {node.children.length}
            </span>
          )}
        </div>
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && 'children' in node && (
        <div>
          {node.children.map((child: SimpleAltNode) => (
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
