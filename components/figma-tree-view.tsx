'use client';

import { useState } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { ChevronRight, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { FigmaTypeIcon } from './figma-type-icon';
import { InstanceBadge } from './instance-badge';
import { getNodeColors } from '@/lib/utils/node-colors';
import { cn } from '@/lib/utils';

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
      <div className="p-4 text-gray-500 dark:text-gray-400">
        <p>Loading Figma tree...</p>
        <p className="text-sm mt-2">
          The node structure will appear here once loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center justify-between">
        <span>Figma Tree</span>
        <span className="text-xs font-normal text-gray-500">
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
  const colors = getNodeColors(node.type);

  // Extract component name for INSTANCE nodes
  const componentName =
    node.type === 'INSTANCE' && 'componentName' in node
      ? (node as { componentName?: string }).componentName
      : undefined;

  return (
    <div>
      {/* Node row */}
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors',
          isSelected
            ? cn(colors.bg, colors.text, colors.border, 'border')
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
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
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
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

        {/* Node type icon with color */}
        <FigmaTypeIcon
          type={node.type}
          size={14}
          className={cn('flex-shrink-0', colors.text)}
        />

        {/* Node name */}
        <span
          className={cn(
            'text-sm truncate flex-1',
            isSelected ? colors.text : 'text-gray-900 dark:text-white'
          )}
        >
          {node.name}
        </span>

        {/* Instance badge for INSTANCE nodes */}
        {node.type === 'INSTANCE' && componentName && (
          <InstanceBadge componentName={componentName} />
        )}

        {/* Metadata badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Invisible badge */}
          {!node.visible && (
            <EyeOff size={12} className="text-gray-400 dark:text-gray-500" />
          )}
          {/* Children count */}
          {hasChildren && 'children' in node && (
            <span className="text-xs text-gray-400 dark:text-gray-500 min-w-[20px] text-right">
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
