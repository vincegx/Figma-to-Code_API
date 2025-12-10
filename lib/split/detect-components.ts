/**
 * Smart Component Detection Algorithm
 *
 * Detects potential component boundaries in a Figma node tree
 * using heuristics based on node type, depth, size, and naming.
 */

import type { FigmaNode } from '../types/figma';
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
export function countNodes(node: FigmaNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child as FigmaNode);
    }
  }
  return count;
}

/**
 * Check if a node name suggests it's a structural wrapper
 * Wrappers are traversed deeper instead of being detected as components
 */
function isWrapper(name: string, nodeCount: number): boolean {
  const wrapperPatterns = [
    'body', 'container', 'content', 'main', 'wrapper',
    'root', 'page', 'section', 'layout', 'stack', 'view'
  ];
  const normalizedName = name.toLowerCase().trim();
  return wrapperPatterns.some(p => normalizedName === p || normalizedName.endsWith('-' + p))
    && nodeCount > 100;
}

/**
 * Calculate component quality score
 * Higher score = better component candidate
 */
function calculateScore(node: FigmaNode, depth: number, nodeCount: number): number {
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

  // Semantic name bonus
  const semanticPatterns = [
    /header/i, /footer/i, /nav/i, /sidebar/i,
    /card/i, /button/i, /modal/i, /form/i,
    /section/i, /hero/i, /banner/i, /menu/i
  ];
  if (semanticPatterns.some(p => p.test(trimmedName))) {
    score += 10;
  }

  return score;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Detect potential component boundaries in a Figma node tree
 *
 * Algorithm:
 * 1. Skip root node, start with its direct children
 * 2. For each node, check if it's a structural wrapper
 * 3. Wrappers are traversed deeper; non-wrappers are scored
 * 4. Nodes meeting MIN_COMPONENT_NODES and MIN_DETECTION_SCORE are detected
 * 5. Results sorted by score (highest first)
 *
 * @param rootNode - The root Figma node to analyze
 * @returns Array of detected components sorted by score
 */
export function detectComponents(rootNode: FigmaNode): DetectedComponent[] {
  const results: DetectedComponent[] = [];

  function traverse(node: FigmaNode, depth: number): void {
    // Skip root (depth 0) - we want to detect its children
    if (depth === 0) {
      if (node.children) {
        for (const child of node.children) {
          traverse(child as FigmaNode, 1);
        }
      }
      return;
    }

    // Only consider structural node types
    const structuralTypes = ['FRAME', 'INSTANCE', 'COMPONENT', 'GROUP'];
    if (!structuralTypes.includes(node.type)) {
      return;
    }

    const nodeCount = countNodes(node);

    // Skip nodes with too few children
    if (nodeCount < MIN_COMPONENT_NODES) {
      return;
    }

    // Check if this is a wrapper to traverse deeper
    if (isWrapper(node.name, nodeCount) && depth < MAX_DETECTION_DEPTH && node.children) {
      for (const child of node.children) {
        traverse(child as FigmaNode, depth + 1);
      }
      return;
    }

    // Calculate score and add if meets threshold
    const score = calculateScore(node, depth, nodeCount);
    if (score >= MIN_DETECTION_SCORE) {
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        nodeCount,
        depth,
        score,
      });
    }

    // Continue traversing if we haven't reached max depth
    // This allows detecting nested components
    if (depth < MAX_DETECTION_DEPTH && node.children) {
      for (const child of node.children) {
        traverse(child as FigmaNode, depth + 1);
      }
    }
  }

  traverse(rootNode, 0);

  // Sort by score (highest first), then by depth (closest to root first)
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.depth - b.depth;
  });
}
