/**
 * Figma Diff Utility
 *
 * WP40 T341: Deep comparison between two FigmaNode trees to detect changes.
 * Identifies added, removed, and modified nodes with detailed property changes.
 */

import type { FigmaNode } from '../types/figma';
import type { NodeDiff, PropertyChange, DiffSummary } from '../types/versioning';
import { TRACKED_PROPERTIES, IGNORED_PROPERTIES } from '../types/versioning';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all tracked properties as a flat array
 */
function getAllTrackedProperties(): string[] {
  return Object.values(TRACKED_PROPERTIES).flat();
}

/**
 * Check if a property should be ignored in diff
 */
function shouldIgnoreProperty(prop: string): boolean {
  return (IGNORED_PROPERTIES as readonly string[]).includes(prop);
}

/**
 * Deep compare two values for equality
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * Create a map of nodes by ID for fast lookup
 */
function createNodeMap(node: FigmaNode): Map<string, FigmaNode> {
  const map = new Map<string, FigmaNode>();

  function traverse(n: FigmaNode): void {
    map.set(n.id, n);
    if ('children' in n && n.children) {
      for (const child of n.children) {
        traverse(child as FigmaNode);
      }
    }
  }

  traverse(node);
  return map;
}

/**
 * Extract imageRef values from fills
 */
function extractImageRefs(node: FigmaNode): string[] {
  const refs: string[] = [];

  function traverse(n: FigmaNode): void {
    if ('fills' in n && Array.isArray(n.fills)) {
      for (const fill of n.fills) {
        if (fill.type === 'IMAGE' && 'imageRef' in fill && fill.imageRef) {
          refs.push(fill.imageRef);
        }
      }
    }
    if ('children' in n && n.children) {
      for (const child of n.children) {
        traverse(child as FigmaNode);
      }
    }
  }

  traverse(node);
  return refs;
}

// ============================================================================
// Core Diff Functions
// ============================================================================

/**
 * Compare two nodes and return property changes
 */
function compareNodeProperties(
  oldNode: FigmaNode,
  newNode: FigmaNode
): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const trackedProps = getAllTrackedProperties();

  for (const prop of trackedProps) {
    if (shouldIgnoreProperty(prop)) continue;

    // Skip children comparison here (handled separately for structure diff)
    if (prop === 'children') continue;

    const oldValue = (oldNode as unknown as Record<string, unknown>)[prop];
    const newValue = (newNode as unknown as Record<string, unknown>)[prop];

    if (!deepEqual(oldValue, newValue)) {
      changes.push({
        property: prop,
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

/**
 * Main diff function: compare two Figma node trees
 *
 * @param oldNode - Previous version of the node tree
 * @param newNode - New version of the node tree
 * @returns Array of NodeDiff objects describing all changes
 */
export function diffFigmaNodes(
  oldNode: FigmaNode,
  newNode: FigmaNode
): NodeDiff[] {
  const diffs: NodeDiff[] = [];

  const oldMap = createNodeMap(oldNode);
  const newMap = createNodeMap(newNode);

  // Find removed nodes (in old but not in new)
  for (const [id, node] of oldMap) {
    if (!newMap.has(id)) {
      diffs.push({
        nodeId: id,
        nodeName: node.name,
        type: 'removed',
        nodeType: node.type,
      });
    }
  }

  // Find added nodes (in new but not in old)
  for (const [id, node] of newMap) {
    if (!oldMap.has(id)) {
      diffs.push({
        nodeId: id,
        nodeName: node.name,
        type: 'added',
        nodeType: node.type,
      });
    }
  }

  // Find modified nodes (in both, but with changes)
  for (const [id, newNode] of newMap) {
    const oldNode = oldMap.get(id);
    if (oldNode) {
      const changes = compareNodeProperties(oldNode, newNode);
      if (changes.length > 0) {
        diffs.push({
          nodeId: id,
          nodeName: newNode.name,
          type: 'modified',
          nodeType: newNode.type,
          changes,
        });
      }
    }
  }

  return diffs;
}

/**
 * Detect new images between two node trees
 *
 * @param oldNode - Previous version of the node tree
 * @param newNode - New version of the node tree
 * @returns Array of new imageRef values
 */
export function detectNewImages(
  oldNode: FigmaNode,
  newNode: FigmaNode
): string[] {
  const oldRefs = new Set(extractImageRefs(oldNode));
  const newRefs = extractImageRefs(newNode);

  return newRefs.filter(ref => !oldRefs.has(ref));
}

/**
 * Create a summary of the diff results
 *
 * @param diffs - Array of NodeDiff from diffFigmaNodes
 * @param newImages - Array of new imageRef values
 * @returns DiffSummary object
 */
export function createDiffSummary(
  diffs: NodeDiff[],
  newImages: string[]
): DiffSummary {
  let totalChanges = 0;

  for (const diff of diffs) {
    if (diff.type === 'modified' && diff.changes) {
      totalChanges += diff.changes.length;
    } else if (diff.type === 'added' || diff.type === 'removed') {
      totalChanges += 1;
    }
  }

  return {
    nodesAdded: diffs.filter(d => d.type === 'added').length,
    nodesRemoved: diffs.filter(d => d.type === 'removed').length,
    nodesModified: diffs.filter(d => d.type === 'modified').length,
    newImages,
    totalChanges,
  };
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format a single property change for display
 */
function formatPropertyChange(change: PropertyChange): string {
  const formatValue = (v: unknown): string => {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'object') return JSON.stringify(v).slice(0, 50);
    return String(v);
  };

  return `${change.property}: ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`;
}

/**
 * Format diff results for human-readable display
 *
 * @param diffs - Array of NodeDiff from diffFigmaNodes
 * @returns Formatted string for display
 */
export function formatDiffForDisplay(diffs: NodeDiff[]): string {
  if (diffs.length === 0) {
    return 'No changes detected.';
  }

  const lines: string[] = [];

  // Group by type
  const added = diffs.filter(d => d.type === 'added');
  const removed = diffs.filter(d => d.type === 'removed');
  const modified = diffs.filter(d => d.type === 'modified');

  if (added.length > 0) {
    lines.push(`➕ Added (${added.length}):`);
    for (const diff of added) {
      lines.push(`  • "${diff.nodeName}" (${diff.nodeType})`);
    }
    lines.push('');
  }

  if (removed.length > 0) {
    lines.push(`➖ Removed (${removed.length}):`);
    for (const diff of removed) {
      lines.push(`  • "${diff.nodeName}" (${diff.nodeType})`);
    }
    lines.push('');
  }

  if (modified.length > 0) {
    lines.push(`✏️ Modified (${modified.length}):`);
    for (const diff of modified) {
      lines.push(`  • "${diff.nodeName}"`);
      if (diff.changes) {
        for (const change of diff.changes.slice(0, 3)) {
          lines.push(`    └─ ${formatPropertyChange(change)}`);
        }
        if (diff.changes.length > 3) {
          lines.push(`    └─ ... and ${diff.changes.length - 3} more`);
        }
      }
    }
  }

  return lines.join('\n');
}

/**
 * Check if there are any meaningful changes
 *
 * @param diffs - Array of NodeDiff from diffFigmaNodes
 * @returns true if there are actual changes
 */
export function hasChanges(diffs: NodeDiff[]): boolean {
  return diffs.length > 0;
}
