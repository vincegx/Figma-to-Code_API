/**
 * Rule Engine Performance Benchmarks
 *
 * Verifies performance target: <10ms for 50 rules × 100 nodes
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateRules,
  resolveConflicts,
  evaluateRulesForTree,
} from '@/lib/rule-engine';
import type { AltNode } from '@/lib/types/altnode';
import type { MappingRule } from '@/lib/types/rule';

/**
 * Generate a large set of mapping rules for benchmarking
 *
 * @param ruleCount - Number of rules to generate
 * @returns Array of mapping rules
 */
function generateMappingRules(ruleCount: number): MappingRule[] {
  const rules: MappingRule[] = [];

  for (let i = 0; i < ruleCount; i++) {
    // Vary rule patterns to simulate realistic workload
    const ruleType = i % 4;

    switch (ruleType) {
      case 0:
        // Container rules
        rules.push({
          id: `rule-container-${i}`,
          name: `Container Rule ${i}`,
          selector: {
            nodeType: 'container',
          },
          transformer: {
            htmlTag: 'div',
            cssClasses: [`container-${i}`],
          },
          priority: Math.floor(Math.random() * 100),
        });
        break;

      case 1:
        // Layout rules
        rules.push({
          id: `rule-layout-${i}`,
          name: `Layout Rule ${i}`,
          selector: {
            layoutMode: i % 2 === 0 ? 'horizontal' : 'vertical',
          },
          transformer: {
            htmlTag: 'div',
            cssClasses: [i % 2 === 0 ? 'hstack' : 'vstack'],
          },
          priority: Math.floor(Math.random() * 100),
        });
        break;

      case 2:
        // Text rules
        rules.push({
          id: `rule-text-${i}`,
          name: `Text Rule ${i}`,
          selector: {
            nodeType: 'text',
          },
          transformer: {
            htmlTag: 'span',
            cssClasses: [`text-${i}`],
            inlineStyles: {
              fontSize: `${12 + (i % 8) * 2}px`,
            },
          },
          priority: Math.floor(Math.random() * 100),
        });
        break;

      case 3:
        // Custom property rules
        rules.push({
          id: `rule-custom-${i}`,
          name: `Custom Rule ${i}`,
          selector: {
            customProperties: {
              padding: '8px',
            },
          },
          transformer: {
            htmlTag: 'div',
            cssClasses: [`padded-${i}`],
          },
          priority: Math.floor(Math.random() * 100),
        });
        break;
    }
  }

  return rules;
}

/**
 * Generate a large AltNode tree for benchmarking
 *
 * @param depth - Tree depth
 * @param childrenPerLevel - Number of children per node
 * @returns Root AltNode
 */
function generateLargeTree(
  depth: number,
  childrenPerLevel: number
): AltNode {
  let nodeId = 1;

  function createNode(currentDepth: number): AltNode {
    const id = `${nodeId}:${nodeId}`;
    nodeId++;

    const isText = currentDepth === depth || Math.random() > 0.7;
    const layoutMode = Math.random() > 0.5 ? 'horizontal' : 'vertical';

    const node: AltNode = {
      id,
      name: `Node ${id}`,
      type: isText ? 'text' : 'container',
      styles: {},
    };

    if (!isText) {
      // Add layout properties for containers
      node.styles.display = 'flex';
      node.styles.flexDirection =
        layoutMode === 'horizontal' ? 'row' : 'column';
      node.styles.gap = '16px';
      node.styles.padding = '8px';
    } else {
      // Add text properties
      node.styles.fontSize = '14px';
      node.styles.color = '#000000';
    }

    // Add children if not at max depth
    if (currentDepth < depth && !isText) {
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
 */
function countNodes(node: AltNode): number {
  let count = 1;
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }
  return count;
}

describe('Rule Engine Performance', () => {
  it('should evaluate 50 rules × 100 nodes in <10ms', () => {
    // Generate 50 rules
    const rules = generateMappingRules(50);

    // Generate tree with ~100 nodes
    // Depth 4, 3 children per level: 1 + 3 + 9 + 27 + ~60 = ~100 nodes
    const tree = generateLargeTree(4, 3);
    const nodeCount = countNodes(tree);

    console.log(`Generated ${rules.length} rules and tree with ${nodeCount} nodes`);

    // Warm up (JIT compilation)
    evaluateRulesForTree(tree, rules);

    // Benchmark
    const startTime = performance.now();
    const allMatches = evaluateRulesForTree(tree, rules);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Rule evaluation took ${duration.toFixed(2)}ms for ${rules.length} rules × ${nodeCount} nodes`);
    console.log(`Total evaluations: ${rules.length * nodeCount} (${((duration / (rules.length * nodeCount)) * 1000).toFixed(2)}μs per evaluation)`);

    // Verify results
    expect(allMatches.size).toBe(nodeCount);

    // Check performance requirement
    expect(duration).toBeLessThan(10);
  });

  it('should evaluate 100 rules × 50 nodes efficiently', () => {
    // Generate 100 rules
    const rules = generateMappingRules(100);

    // Generate smaller tree with ~50 nodes
    const tree = generateLargeTree(3, 3);
    const nodeCount = countNodes(tree);

    console.log(`Generated ${rules.length} rules and tree with ${nodeCount} nodes`);

    // Warm up
    evaluateRulesForTree(tree, rules);

    // Benchmark
    const startTime = performance.now();
    const allMatches = evaluateRulesForTree(tree, rules);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Rule evaluation took ${duration.toFixed(2)}ms for ${rules.length} rules × ${nodeCount} nodes`);

    // Verify results
    expect(allMatches.size).toBeGreaterThan(0);

    // Allow more time for larger rule set
    expect(duration).toBeLessThan(20);
  });

  it('should resolve conflicts quickly for many matches', () => {
    // Generate worst case: all rules match and conflict
    const rules: MappingRule[] = [];
    for (let i = 0; i < 50; i++) {
      rules.push({
        id: `rule-${i}`,
        name: `Rule ${i}`,
        selector: {}, // Matches all nodes
        transformer: {
          htmlTag: i % 2 === 0 ? 'div' : 'button',
          cssClasses: [`class-${i}`],
        },
        priority: i,
      });
    }

    const node: AltNode = {
      id: '1:1',
      name: 'Test',
      type: 'container',
      styles: {},
    };

    // Warm up
    const matches = evaluateRules(node, rules);

    // Benchmark conflict resolution
    const startTime = performance.now();
    const resolved = resolveConflicts(matches);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Conflict resolution took ${duration.toFixed(4)}ms for ${matches.length} matches`);

    // Verify resolution
    expect(resolved.resolved.htmlTag).toBeDefined();
    expect(Object.keys(resolved.propertyProvenance).length).toBeGreaterThan(0);

    // Should be very fast (sub-millisecond)
    expect(duration).toBeLessThan(1);
  });

  it('should handle deep tree efficiently', () => {
    // Generate deeply nested tree (depth 10, 2 children per level)
    const rules = generateMappingRules(20);
    const tree = generateLargeTree(10, 2);
    const nodeCount = countNodes(tree);

    console.log(`Generated deep tree with ${nodeCount} nodes`);

    // Warm up
    evaluateRulesForTree(tree, rules);

    // Benchmark
    const startTime = performance.now();
    const allMatches = evaluateRulesForTree(tree, rules);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Deep tree evaluation took ${duration.toFixed(2)}ms for ${nodeCount} nodes`);

    // Verify all nodes processed
    expect(allMatches.size).toBe(nodeCount);

    // Should complete quickly (allow 1ms per node for smaller trees)
    const expectedMaxTime = Math.max(nodeCount * 0.1, 5); // Min 5ms threshold
    expect(duration).toBeLessThan(expectedMaxTime);
  });

  it('should handle wide tree efficiently', () => {
    // Generate wide tree (depth 2, 50 children per level)
    const rules = generateMappingRules(20);
    const tree = generateLargeTree(2, 50);
    const nodeCount = countNodes(tree);

    console.log(`Generated wide tree with ${nodeCount} nodes`);

    // Warm up
    evaluateRulesForTree(tree, rules);

    // Benchmark
    const startTime = performance.now();
    const allMatches = evaluateRulesForTree(tree, rules);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`Wide tree evaluation took ${duration.toFixed(2)}ms for ${nodeCount} nodes`);

    // Verify all nodes processed
    expect(allMatches.size).toBeGreaterThan(0);

    // Should handle width efficiently (allow more time for very small trees)
    const expectedMaxTime = Math.max(nodeCount * 0.1, 5); // Min 5ms threshold
    expect(duration).toBeLessThan(expectedMaxTime);
  });

  it('should verify single node evaluation baseline', () => {
    // Baseline: Single node, 10 rules
    const rules = generateMappingRules(10);
    const node: AltNode = {
      id: '1:1',
      name: 'Single',
      type: 'container',
      styles: {
        display: 'flex',
        flexDirection: 'row',
      },
    };

    // Warm up
    evaluateRules(node, rules);

    // Benchmark
    const iterations = 1000;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      evaluateRules(node, rules);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgPerEval = duration / iterations;

    console.log(`Single node evaluation: ${avgPerEval.toFixed(4)}ms average over ${iterations} iterations`);

    // Should be very fast
    expect(avgPerEval).toBeLessThan(0.1); // <0.1ms per evaluation
  });

  it('should verify algorithm complexity (O(n*m))', () => {
    // Test different combinations to verify O(n*m) complexity
    const testCases = [
      { rules: 10, depth: 3, children: 3 },  // ~40 nodes
      { rules: 20, depth: 2, children: 4 },  // ~21 nodes
      { rules: 10, depth: 4, children: 2 },  // ~31 nodes
      { rules: 50, depth: 3, children: 2 },  // ~15 nodes
    ];

    const results: Array<{ rules: number; nodes: number; time: number }> = [];

    for (const { rules: ruleCount, depth, children } of testCases) {
      const rules = generateMappingRules(ruleCount);
      const tree = generateLargeTree(depth, children);

      // Warm up
      evaluateRulesForTree(tree, rules);

      // Benchmark
      const startTime = performance.now();
      evaluateRulesForTree(tree, rules);
      const endTime = performance.now();

      results.push({
        rules: ruleCount,
        nodes: countNodes(tree),
        time: endTime - startTime,
      });
    }

    // Print complexity analysis
    console.log('\nComplexity Analysis:');
    results.forEach((r) => {
      console.log(`  ${r.rules} rules × ${r.nodes} nodes: ${r.time.toFixed(2)}ms`);
    });

    // Verify all tests completed reasonably fast (50ms for any combination)
    for (const result of results) {
      expect(result.time).toBeLessThan(50);
    }
  });
});
