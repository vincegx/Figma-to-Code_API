'use client';

import { useState } from 'react';
import type { AltNode } from '@/lib/types/altnode';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface FigmaTreeViewProps {
  node: AltNode;
  level?: number;
  selectedNodeId?: string;
  onNodeSelect?: (nodeId: string) => void;
  ruleMatchCounts?: Map<string, number>;
}

export function FigmaTreeView({
  node,
  level = 0,
  selectedNodeId,
  onNodeSelect,
  ruleMatchCounts,
}: FigmaTreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(level < 3); // Auto-expand first 3 levels

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const matchCount = ruleMatchCounts?.get(node.id) ?? 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleNodeClick = () => {
    onNodeSelect?.(node.id);
  };

  // Icon for node type
  const getNodeTypeIcon = (type: AltNode['type']) => {
    switch (type) {
      case 'container':
        return '□';
      case 'text':
        return 'T';
      case 'image':
        return '🖼';
      case 'group':
        return '⊞';
      default:
        return '•';
    }
  };

  // Badge color based on match count
  const getBadgeVariant = (count: number) => {
    if (count === 0) return 'outline';
    if (count === 1) return 'default';
    if (count === 2) return 'secondary';
    return 'destructive'; // 3+ matches indicates conflicts
  };

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className={`
          flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent cursor-pointer
          ${isSelected ? 'bg-accent' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleNodeClick}
      >
        {/* Expand/Collapse Icon */}
        <button
          className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <span className="h-3 w-3" />
          )}
        </button>

        {/* Node Type Icon */}
        <span className="text-muted-foreground" title={node.type}>
          {getNodeTypeIcon(node.type)}
        </span>

        {/* Node Name */}
        <span className="flex-1 truncate" title={node.name}>
          {node.name}
        </span>

        {/* Rule Match Count Badge */}
        {matchCount > 0 && (
          <Badge variant={getBadgeVariant(matchCount)} className="ml-auto text-xs">
            {matchCount}
          </Badge>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <FigmaTreeView
              key={child.id}
              node={child}
              level={level + 1}
              {...(selectedNodeId !== undefined && { selectedNodeId })}
              {...(onNodeSelect !== undefined && { onNodeSelect })}
              {...(ruleMatchCounts !== undefined && { ruleMatchCounts })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
