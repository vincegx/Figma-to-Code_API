/**
 * WP43: Transform Stats Computation
 *
 * Computes statistics from transformed AltNode tree for dashboard metrics.
 * Called once at import/refetch and stored in LibraryNode.transformStats.
 */

import type { SimpleAltNode } from './altnode-transform';
import type { TransformStats } from './types/library';

/**
 * Compute transformation statistics from an AltNode tree
 *
 * Traverses the entire AltNode tree and collects metrics about:
 * - Structure: total nodes, max depth, nodes by type
 * - Layout: auto-layout usage, absolute positioning, GROUP inlining
 * - Assets: images, icons, gradients
 * - Quality: semantic vs arbitrary Tailwind classes, CSS variables
 *
 * @param altNode - Root AltNode from transformation
 * @returns TransformStats object ready to be stored in LibraryNode
 */
export function computeTransformStats(altNode: SimpleAltNode): TransformStats {
  const stats: TransformStats = {
    totalNodes: 0,
    maxDepth: 0,
    nodesByType: {},
    autoLayoutCount: 0,
    absolutePositionedCount: 0,
    groupsInlined: 0,
    imagesCount: 0,
    iconsCount: 0,
    gradientsCount: 0,
    semanticCount: 0,
    arbitraryCount: 0,
    variablesUsed: 0,
    computedAt: new Date().toISOString(),
  };

  // Mutable version for accumulation
  const mutableStats = {
    totalNodes: 0,
    maxDepth: 0,
    nodesByType: {} as Record<string, number>,
    autoLayoutCount: 0,
    absolutePositionedCount: 0,
    groupsInlined: 0,
    imagesCount: 0,
    iconsCount: 0,
    gradientsCount: 0,
    semanticCount: 0,
    arbitraryCount: 0,
    variablesUsed: 0,
  };

  function traverse(node: SimpleAltNode, depth: number): void {
    mutableStats.totalNodes++;
    mutableStats.maxDepth = Math.max(mutableStats.maxDepth, depth);

    // Type distribution
    const nodeType = node.originalType || node.type;
    mutableStats.nodesByType[nodeType] = (mutableStats.nodesByType[nodeType] || 0) + 1;

    // Layout analysis
    const originalNode = node.originalNode as any;
    if (originalNode) {
      // Auto-layout detection
      if (originalNode.layoutMode === 'HORIZONTAL' || originalNode.layoutMode === 'VERTICAL') {
        mutableStats.autoLayoutCount++;
      }

      // Absolute positioning detection
      if (originalNode.layoutPositioning === 'ABSOLUTE') {
        mutableStats.absolutePositionedCount++;
      }

      // GROUP inlined detection (node.type is 'group' after inlining)
      if (node.type === 'group' && node.originalType === 'GROUP') {
        mutableStats.groupsInlined++;
      }

      // CSS variables detection
      if (originalNode.boundVariables) {
        mutableStats.variablesUsed += Object.keys(originalNode.boundVariables).length;
      }
    }

    // Asset detection
    if (node.imageData) {
      mutableStats.imagesCount++;
    }
    if (node.isIcon) {
      mutableStats.iconsCount++;
    }
    if (node.fillsData?.some(f => f.type.startsWith('GRADIENT'))) {
      mutableStats.gradientsCount++;
    }

    // Quality analysis: semantic vs arbitrary Tailwind classes
    // Check style values for arbitrary value syntax [...]
    if (node.styles) {
      Object.values(node.styles).forEach(value => {
        if (typeof value === 'string') {
          // Count each style value
          if (/\[.+?\]/.test(value)) {
            // Contains arbitrary value like [14px], [#ff0000], etc.
            mutableStats.arbitraryCount++;
          } else if (value.includes('var(--')) {
            // CSS variable - counts as semantic (design token)
            mutableStats.semanticCount++;
          } else if (value && value !== '0' && value !== 'none' && value !== 'auto') {
            // Non-trivial value that could map to semantic class
            mutableStats.semanticCount++;
          }
        }
      });
    }

    // Recurse through children
    if (node.children) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  }

  traverse(altNode, 1);

  // Return immutable result
  return {
    totalNodes: mutableStats.totalNodes,
    maxDepth: mutableStats.maxDepth,
    nodesByType: mutableStats.nodesByType,
    autoLayoutCount: mutableStats.autoLayoutCount,
    absolutePositionedCount: mutableStats.absolutePositionedCount,
    groupsInlined: mutableStats.groupsInlined,
    imagesCount: mutableStats.imagesCount,
    iconsCount: mutableStats.iconsCount,
    gradientsCount: mutableStats.gradientsCount,
    semanticCount: mutableStats.semanticCount,
    arbitraryCount: mutableStats.arbitraryCount,
    variablesUsed: mutableStats.variablesUsed,
    computedAt: new Date().toISOString(),
  };
}
