'use client';

/**
 * Tree Explorer for Manual Selection
 *
 * Displays the Figma node tree with checkboxes for manual
 * component selection. Supports depth filtering and search.
 */

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Layers, Box, Component, Grid3x3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { SimpleAltNode } from '@/lib/altnode-transform';

interface TreeExplorerProps {
  rootNode: SimpleAltNode;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Get icon for node type
 */
function getNodeIcon(type: string) {
  switch (type) {
    case 'INSTANCE':
      return <Component className="w-3.5 h-3.5 text-purple-400" />;
    case 'COMPONENT':
      return <Component className="w-3.5 h-3.5 text-green-400" />;
    case 'FRAME':
      return <Box className="w-3.5 h-3.5 text-blue-400" />;
    case 'GROUP':
      return <Grid3x3 className="w-3.5 h-3.5 text-yellow-400" />;
    default:
      return <Layers className="w-3.5 h-3.5 text-text-muted" />;
  }
}

/**
 * Count nodes recursively
 */
function countNodes(node: SimpleAltNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

/**
 * Check if any ancestor is selected
 */
function hasSelectedAncestor(nodeId: string, selectedIds: string[], nodeMap: Map<string, SimpleAltNode>, parentMap: Map<string, string>): boolean {
  let currentId = parentMap.get(nodeId);
  while (currentId) {
    if (selectedIds.includes(currentId)) {
      return true;
    }
    currentId = parentMap.get(currentId);
  }
  return false;
}

/**
 * Build maps for parent lookup
 */
function buildMaps(node: SimpleAltNode, nodeMap: Map<string, SimpleAltNode>, parentMap: Map<string, string>, parentId?: string): void {
  nodeMap.set(node.id, node);
  if (parentId) {
    parentMap.set(node.id, parentId);
  }
  if (node.children) {
    for (const child of node.children) {
      buildMaps(child, nodeMap, parentMap, node.id);
    }
  }
}

/**
 * Filter tree by search term
 */
function matchesSearch(node: SimpleAltNode, searchTerm: string): boolean {
  const term = searchTerm.toLowerCase();
  if (node.name.toLowerCase().includes(term)) {
    return true;
  }
  if (node.children) {
    return node.children.some(child => matchesSearch(child, term));
  }
  return false;
}

interface TreeNodeProps {
  node: SimpleAltNode;
  depth: number;
  maxDepth: number;
  selectedIds: string[];
  onToggle: (id: string) => void;
  isRoot?: boolean;
  searchTerm: string;
  nodeMap: Map<string, SimpleAltNode>;
  parentMap: Map<string, string>;
  disabled?: boolean;
}

function TreeNode({
  node,
  depth,
  maxDepth,
  selectedIds,
  onToggle,
  isRoot = false,
  searchTerm,
  nodeMap,
  parentMap,
  disabled = false,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const nodeCount = useMemo(() => countNodes(node), [node]);
  const isSelected = selectedIds.includes(node.id);
  const ancestorSelected = hasSelectedAncestor(node.id, selectedIds, nodeMap, parentMap);

  // Skip non-structural types for selection (manual selection = less restrictive)
  const isStructural = ['FRAME', 'INSTANCE', 'COMPONENT', 'GROUP'].includes(node.originalType || '');
  const canSelect = isStructural && !isRoot;

  // Filter by search
  if (searchTerm && !matchesSearch(node, searchTerm)) {
    return null;
  }

  // Don't render beyond max depth
  if (depth > maxDepth) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1 px-2 hover:bg-bg-hover rounded transition-colors',
          isRoot && 'bg-bg-secondary',
          ancestorSelected && !isRoot && 'opacity-50',
          disabled && 'pointer-events-none'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-4 h-4 flex items-center justify-center text-text-muted hover:text-text-primary"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Checkbox */}
        {canSelect ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(node.id)}
            disabled={disabled || ancestorSelected}
            className="data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
          />
        ) : (
          <div className="w-4" />
        )}

        {/* Icon */}
        {getNodeIcon(node.originalType || '')}

        {/* Name */}
        <span className={cn(
          'flex-1 text-sm truncate',
          isRoot ? 'text-text-muted font-medium' : 'text-text-primary'
        )}>
          {node.name}
        </span>

        {/* Type badge */}
        <span className="text-[10px] text-text-muted">
          {node.originalType}
        </span>

        {/* Node count */}
        <span className="text-xs text-text-muted tabular-nums ml-2">
          {nodeCount}
        </span>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              maxDepth={maxDepth}
              selectedIds={selectedIds}
              onToggle={onToggle}
              searchTerm={searchTerm}
              nodeMap={nodeMap}
              parentMap={parentMap}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeExplorer({
  rootNode,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: TreeExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [maxDepth, setMaxDepth] = useState('3');

  // Build lookup maps
  const { nodeMap, parentMap } = useMemo(() => {
    const nodeMap = new Map<string, SimpleAltNode>();
    const parentMap = new Map<string, string>();
    buildMaps(rootNode, nodeMap, parentMap);
    return { nodeMap, parentMap };
  }, [rootNode]);

  const toggleNode = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const totalNodes = useMemo(() => {
    return selectedIds.reduce((sum, id) => {
      const node = nodeMap.get(id);
      return sum + (node ? countNodes(node) : 0);
    }, 0);
  }, [selectedIds, nodeMap]);

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Input
          type="text"
          placeholder="Filter by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 h-8 text-sm bg-bg-secondary border-border-primary"
          disabled={disabled}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Depth:</span>
          <Select value={maxDepth} onValueChange={setMaxDepth} disabled={disabled}>
            <SelectTrigger className="w-16 h-8 text-xs bg-bg-secondary border-border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border-primary z-[100]">
              <SelectItem value="1" className="text-xs">1</SelectItem>
              <SelectItem value="2" className="text-xs">2</SelectItem>
              <SelectItem value="3" className="text-xs">3</SelectItem>
              <SelectItem value="4" className="text-xs">4</SelectItem>
              <SelectItem value="5" className="text-xs">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tree */}
      <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-secondary">
        <div className="max-h-[350px] overflow-y-auto py-1">
          <TreeNode
            node={rootNode}
            depth={0}
            maxDepth={parseInt(maxDepth)}
            selectedIds={selectedIds}
            onToggle={toggleNode}
            isRoot={true}
            searchTerm={searchTerm}
            nodeMap={nodeMap}
            parentMap={parentMap}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-1 text-xs text-text-muted">
        <span>
          Selected: <span className="text-text-primary">{selectedIds.length}</span>
        </span>
        <span>
          <span className="text-text-primary">{totalNodes}</span> nodes
        </span>
      </div>

      {/* Warning */}
      {selectedIds.length > 0 && (
        <p className="text-xs text-amber-400 px-1">
          Parent selection includes all children
        </p>
      )}
    </div>
  );
}
