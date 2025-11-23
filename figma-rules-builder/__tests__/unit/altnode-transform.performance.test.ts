/**
 * AltNode Transformation Performance Benchmark
 *
 * Verifies transformation meets performance target: <50ms for 100-node tree
 */

import { describe, it, expect } from 'vitest';
import { transformToAltNode } from '@/lib/altnode-transform';
import type { FigmaNode } from '@/lib/types/figma';

/**
 * Generate a deeply nested Figma node tree for benchmarking
 *
 * @param depth - Tree depth
 * @param childrenPerLevel - Number of children at each level
 * @returns Root Figma node with nested children
 */
function generateLargeFigmaTree(
  depth: number,
  childrenPerLevel: number
): FigmaNode {
  let nodeId = 1;

  function createNode(currentDepth: number): FigmaNode {
    const id = `${nodeId}:${nodeId}`;
    nodeId++;

    const node: FigmaNode = {
      id,
      name: `Node ${id}`,
      type: 'FRAME',
      layoutMode: currentDepth % 2 === 0 ? 'HORIZONTAL' : 'VERTICAL',
      itemSpacing: 16,
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 8,
      paddingBottom: 8,
      fills: [
        {
          type: 'SOLID',
          color: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
        },
      ],
      strokes: [
        {
          type: 'SOLID',
          color: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
      effects: [
        {
          type: 'DROP_SHADOW',
          offset: { x: 0, y: 2 },
          radius: 4,
          color: { r: 0, g: 0, b: 0, a: 0.1 },
        },
      ],
      absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
    };

    // Add children if not at max depth
    if (currentDepth < depth) {
      node.children = [];
      for (let i = 0; i < childrenPerLevel; i++) {
        node.children.push(createNode(currentDepth + 1));
      }
    }

    return node;
  }

  return createNode(0);
}

/**
 * Count total nodes in tree
 *
 * @param node - Root node
 * @returns Total node count
 */
function countNodes(node: FigmaNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

describe('AltNode Transformation Performance', () => {
  it('should transform 100-node tree in <50ms', () => {
    // Generate tree with ~100 nodes
    // Depth 4, 3 children per level: 1 + 3 + 9 + 27 + 81 = 121 nodes
    const figmaTree = generateLargeFigmaTree(4, 3);
    const nodeCount = countNodes(figmaTree);

    console.log(`Generated tree with ${nodeCount} nodes`);

    // Warm up (JIT compilation)
    transformToAltNode(figmaTree);

    // Benchmark
    const startTime = performance.now();
    const altNode = transformToAltNode(figmaTree);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Transformation took ${duration.toFixed(2)}ms for ${nodeCount} nodes`);
    console.log(`Average: ${(duration / nodeCount).toFixed(4)}ms per node`);

    // Verify transformation succeeded
    expect(altNode).toBeDefined();
    expect(altNode.id).toBe('1:1');
    expect(altNode.children).toBeDefined();

    // Check performance requirement
    expect(duration).toBeLessThan(50);
  });

  it('should transform deeply nested tree efficiently', () => {
    // Depth 10, 2 children per level: 2^10 - 1 = 1023 nodes
    const figmaTree = generateLargeFigmaTree(10, 2);
    const nodeCount = countNodes(figmaTree);

    console.log(`Generated deeply nested tree with ${nodeCount} nodes`);

    // Warm up
    transformToAltNode(figmaTree);

    // Benchmark
    const startTime = performance.now();
    const altNode = transformToAltNode(figmaTree);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Deep tree transformation took ${duration.toFixed(2)}ms for ${nodeCount} nodes`);

    // Verify transformation succeeded
    expect(altNode).toBeDefined();
    expect(altNode.children).toBeDefined();

    // For larger trees, allow proportionally more time
    // Target: ~0.5ms per node
    const expectedMaxTime = nodeCount * 0.5;
    expect(duration).toBeLessThan(expectedMaxTime);
  });

  it('should handle wide tree (many siblings) efficiently', () => {
    // Depth 2, 50 children per level: 1 + 50 + 2500 = 2551 nodes
    const figmaTree = generateLargeFigmaTree(2, 50);
    const nodeCount = countNodes(figmaTree);

    console.log(`Generated wide tree with ${nodeCount} nodes`);

    // Warm up
    transformToAltNode(figmaTree);

    // Benchmark
    const startTime = performance.now();
    const altNode = transformToAltNode(figmaTree);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Wide tree transformation took ${duration.toFixed(2)}ms for ${nodeCount} nodes`);

    // Verify transformation succeeded
    expect(altNode).toBeDefined();
    expect(altNode.children).toHaveLength(50);

    // For larger trees, allow proportionally more time
    const expectedMaxTime = nodeCount * 0.5;
    expect(duration).toBeLessThan(expectedMaxTime);
  });

  it('should transform simple tree (baseline)', () => {
    // Simple tree: 1 root + 10 children = 11 nodes
    const figmaTree = generateLargeFigmaTree(1, 10);
    const nodeCount = countNodes(figmaTree);

    console.log(`Generated simple tree with ${nodeCount} nodes`);

    // Benchmark (no warmup needed for small tree)
    const startTime = performance.now();
    const altNode = transformToAltNode(figmaTree);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Simple tree transformation took ${duration.toFixed(2)}ms for ${nodeCount} nodes`);

    // Verify transformation succeeded
    expect(altNode).toBeDefined();

    // Simple tree should be very fast (<5ms)
    expect(duration).toBeLessThan(5);
  });

  it('should verify transformation correctness on large tree', () => {
    // Generate tree with specific properties
    const figmaTree = generateLargeFigmaTree(3, 4);
    const altNode = transformToAltNode(figmaTree);

    // Verify root node transformation
    expect(altNode.type).toBe('container');
    expect(altNode.styles.display).toBe('flex');
    expect(altNode.styles.gap).toBe('16px');
    expect(altNode.styles.padding).toBe('8px');
    expect(altNode.styles.background).toBeDefined();
    expect(altNode.styles.border).toBeDefined();
    expect(altNode.styles.boxShadow).toBeDefined();

    // Verify children exist and are transformed
    expect(altNode.children).toBeDefined();
    expect(altNode.children!.length).toBeGreaterThan(0);

    // Verify child transformation
    const firstChild = altNode.children![0];
    expect(firstChild.type).toBe('container');
    expect(firstChild.styles.display).toBe('flex');
    expect(firstChild.styles.flexDirection).toBe('column'); // Alternating layout

    // Verify grandchildren
    expect(firstChild.children).toBeDefined();
    expect(firstChild.children!.length).toBeGreaterThan(0);
  });
});
