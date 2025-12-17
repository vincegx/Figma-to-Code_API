/**
 * Smart Component Detection Algorithm for UnifiedElement Trees
 *
 * Detects potential component boundaries in a UnifiedElement tree
 * using a structural approach: descend through wrappers until
 * finding the right level of granularity.
 *
 * This is the merge-compatible version of detect-components.ts,
 * operating on UnifiedElement instead of FigmaNode.
 */

import type { UnifiedElement } from '../types/merge';
import type { DetectedComponent } from '../types/split';
import {
  MIN_COMPONENT_NODES,
  MAX_DETECTION_DEPTH,
  MIN_DETECTION_SCORE,
} from '../types/split';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Count total nodes recursively (including the node itself)
 */
export function countNodesUnified(node: UnifiedElement): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodesUnified(child);
    }
  }
  return count;
}

/**
 * Check if a node is a "substantial" component candidate
 * Substantial = structural type + enough nodes + has children
 */
function isSubstantial(node: UnifiedElement, nodeCount: number): boolean {
  // Must be a structural type
  const structuralTypes = ['FRAME', 'INSTANCE', 'COMPONENT', 'GROUP'];
  if (!structuralTypes.includes(node.type)) {
    return false;
  }

  // Must have enough nodes
  if (nodeCount < MIN_COMPONENT_NODES) {
    return false;
  }

  // Must have children (not a leaf wrapper)
  if (!node.children || node.children.length === 0) {
    return false;
  }

  return true;
}

/**
 * Calculate component quality score
 * Used for sorting results (higher = better candidate)
 */
function calculateScore(node: UnifiedElement, depth: number, nodeCount: number): number {
  let score = 0;

  // Type scoring - INSTANCE/COMPONENT are best candidates
  const nodeType = node.type;
  if (nodeType === 'INSTANCE' || nodeType === 'COMPONENT') {
    score += 30;
  } else if (nodeType === 'FRAME') {
    score += 20;
  } else if (nodeType === 'GROUP') {
    score += 10;
  }

  // Depth scoring - closer to root is better
  score += Math.max(0, 20 - (depth * 5));

  // Size scoring - medium-sized components are ideal
  if (nodeCount >= 5 && nodeCount <= 50) {
    score += 15;
  } else if (nodeCount > 50 && nodeCount <= 150) {
    score += 10;
  } else if (nodeCount > 150) {
    score += 5;
  }

  // Name quality - generic names get penalty
  const trimmedName = node.name.trim();
  if (/^(frame|group|rectangle|ellipse)\s*\d*$/i.test(trimmedName)) {
    score -= 15;
  }

  return score;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect potential component boundaries in a UnifiedElement tree
 *
 * Algorithm (v2 - structural approach):
 * 1. Start with root's children
 * 2. If <= 2 children → wrapper level, descend deeper
 * 3. If > 2 children → check if they're "substantial"
 * 4. If >= 2 substantial → these are components, STOP
 * 5. Otherwise → descend into each child
 * 6. Stop at MAX_DETECTION_DEPTH
 *
 * @param rootNode - The root UnifiedElement to analyze
 * @returns Array of detected components sorted by score
 */
export function detectComponentsUnified(rootNode: UnifiedElement): DetectedComponent[] {
  const results: DetectedComponent[] = [];
  const addedIds = new Set<string>();

  function addCandidate(node: UnifiedElement, depth: number, nodeCount: number, skipScoreFilter = false): void {
    if (addedIds.has(node.id)) return;

    const score = calculateScore(node, depth, nodeCount);
    // When skipScoreFilter is true, we found the right structural level - add regardless of score
    if (skipScoreFilter || score >= MIN_DETECTION_SCORE) {
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        nodeCount,
        depth,
        score,
      });
      addedIds.add(node.id);
    }
  }

  function findComponents(node: UnifiedElement, depth: number): void {
    // Stop at max depth
    if (depth > MAX_DETECTION_DEPTH) {
      return;
    }

    const children = node.children;
    if (!children || children.length === 0) {
      return;
    }

    // Wrapper detection: <= 2 children → descend
    if (children.length <= 2) {
      for (const child of children) {
        findComponents(child, depth + 1);
      }
      return;
    }

    // > 2 children: check if they're substantial
    const parentNodeCount = countNodesUnified(node);
    const childrenWithCounts = children.map(child => ({
      node: child,
      nodeCount: countNodesUnified(child),
    }));

    // Filter substantial children, but exclude "dominant" ones (>80% of parent)
    // A dominant child is a wrapper, not a component
    const substantialChildren = childrenWithCounts.filter(
      ({ node: child, nodeCount }) => {
        if (!isSubstantial(child, nodeCount)) return false;
        // If this child contains >80% of parent nodes, it's a wrapper
        const ratio = nodeCount / parentNodeCount;
        if (ratio > 0.8) return false;
        return true;
      }
    );

    // If >= 2 substantial children → these are the components
    if (substantialChildren.length >= 2) {
      for (const { node: child, nodeCount } of substantialChildren) {
        // Skip score filter - structural detection found the right level
        addCandidate(child, depth, nodeCount, true);
      }
      // Also descend into dominant/wrapper children to find their components
      for (const { node: child, nodeCount } of childrenWithCounts) {
        const ratio = nodeCount / parentNodeCount;
        if (ratio > 0.8) {
          // This is a dominant wrapper, descend into it
          findComponents(child, depth + 1);
        }
      }
      return;
    }

    // Not enough substantial children → descend into each
    for (const child of children) {
      findComponents(child, depth + 1);
    }
  }

  // Start from root - treat it like any other node
  findComponents(rootNode, 0);

  // Sort by score (highest first), then by depth (closest to root first)
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.depth - b.depth;
  });
}
