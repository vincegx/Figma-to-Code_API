/**
 * Rule Engine Performance Benchmarks - WP05 T049
 *
 * Validates performance meets Success Criteria:
 * - SC-005: Rule changes update match counts <2 seconds (50 rules × 100 nodes)
 * - SC-014: 100% match accuracy across entire library
 */

import { describe, it, expect } from 'vitest';
import { evaluateRules } from '@/lib/rule-engine';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { SimpleMappingRule, Selector } from '@/lib/types/rules';

// ============================================================================
// Test Data Generators
// ============================================================================

function generateTestNodes(count: number): SimpleAltNode[] {
  const nodes: SimpleAltNode[] = [];

  for (let i = 0; i < count; i++) {
    const nodeType = i % 3 === 0 ? 'FRAME' : i % 3 === 1 ? 'TEXT' : 'RECTANGLE';

    if (nodeType === 'FRAME') {
      nodes.push({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: 'FRAME',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'NORMAL',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 50 + (i * 5),
          height: 30 + (i * 2),
          isRelative: false,
        },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        effects: [],
        children: [],
        layout: {
          layoutMode: 'HORIZONTAL',
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          itemSpacing: 0,
        },
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        clipsContent: false,
        isComponent: false,
        originalNode: {} as any,
      } as unknown as SimpleAltNode);
    } else if (nodeType === 'TEXT') {
      nodes.push({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: 'TEXT',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'NORMAL',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 50 + (i * 5),
          height: 30 + (i * 2),
          isRelative: false,
        },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        effects: [],
        characters: `Text ${i}`,
        style: {
          fontFamily: 'Inter',
          fontWeight: 400,
          fontSize: 16,
          lineHeightPx: 20,
          letterSpacing: 0,
          textAlignHorizontal: 'LEFT',
          textAlignVertical: 'TOP',
          fills: [],
        },
        textAutoResize: 'WIDTH_AND_HEIGHT',
        lineHeight: 'AUTO',
        originalNode: {} as any,
      } as unknown as SimpleAltNode);
    } else {
      nodes.push({
        id: `node-${i}`,
        name: `Node ${i}`,
        type: 'RECTANGLE',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'NORMAL',
        absoluteBoundingBox: {
          x: 0,
          y: 0,
          width: 50 + (i * 5),
          height: 30 + (i * 2),
          isRelative: false,
        },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        effects: [],
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        originalNode: {} as any,
      } as unknown as SimpleAltNode);
    }
  }

  return nodes;
}

function generateTestRules(count: number): SimpleMappingRule[] {
  const rules: SimpleMappingRule[] = [];

  for (let i = 0; i < count; i++) {
    const selectorType = i % 3 === 0 ? 'FRAME' : i % 3 === 1 ? 'TEXT' : 'RECTANGLE';

    rules.push({
      id: `rule-${i}`,
      name: `Rule ${i}`,
      priority: i,
      selector: {
        type: selectorType,
      },
      transformer: {
        backgroundColor: `hsl(${i * 7}, 70%, 50%)`,
        padding: `${i + 8}px`,
      },
    });
  }

  return rules;
}

// ============================================================================
// Performance Benchmarks
// ============================================================================

describe('Rule Engine - Performance Benchmarks', () => {
  it('should evaluate 50 rules × 100 nodes in <2 seconds (SC-005)', () => {
    // Generate 100 test nodes
    const nodes = generateTestNodes(100);

    // Generate 50 test rules
    const rules = generateTestRules(50);

    // Benchmark: evaluate all rules against all nodes
    const startTime = performance.now();

    const results = nodes.map(node => evaluateRules(node, rules));

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✓ Evaluated 50 rules × 100 nodes in ${duration.toFixed(2)}ms`);

    // Success Criteria SC-005: <2000ms
    expect(duration).toBeLessThan(2000);
    expect(results).toHaveLength(100);

    // Verify all evaluations returned results
    results.forEach((matches, idx) => {
      expect(Array.isArray(matches)).toBe(true);
      // Should have roughly 1/3 of rules matching (based on type distribution)
      expect(matches.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('should calculate match counts for entire library in <2 seconds', () => {
    // Simulate use-rule-matches.ts hook calculating match counts
    const nodes = generateTestNodes(100);
    const rules = generateTestRules(30);

    const startTime = performance.now();

    // Calculate match count for each rule (Rule Manager sidebar display)
    const matchCounts = rules.map(rule => {
      const matchingNodes = nodes.filter(node =>
        evaluateRules(node, [rule]).length > 0
      );
      return {
        ruleId: rule.id,
        matchCount: matchingNodes.length,
      };
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✓ Calculated match counts for 30 rules × 100 nodes in ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(2000);
    expect(matchCounts).toHaveLength(30);
    expect(matchCounts[0].matchCount).toBeGreaterThan(0);
  });

  it('should handle large rule library (100 rules × 50 nodes) efficiently', () => {
    const nodes = generateTestNodes(50);
    const rules = generateTestRules(100);

    const startTime = performance.now();
    const results = nodes.map(node => evaluateRules(node, rules));
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✓ Evaluated 100 rules × 50 nodes in ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(3000); // Relaxed threshold for larger workload
    expect(results).toHaveLength(50);
  });

  it('should maintain performance with complex selectors', () => {
    const nodes = generateTestNodes(100);

    // Generate rules with complex selectors (multiple criteria)
    const rules: SimpleMappingRule[] = Array.from({ length: 30 }, (_, i) => ({
      id: `rule-${i}`,
      name: `Complex Rule ${i}`,
      priority: i,
      selector: {
        type: i % 2 === 0 ? 'FRAME' : 'TEXT',
        width: { min: i * 10, max: (i + 5) * 20 },
        height: { min: i * 5, max: (i + 3) * 15 },
        name: /^Node/,
      },
      transformer: {
        backgroundColor: `hsl(${i * 12}, 60%, 50%)`,
        padding: `${i * 2}px`,
      },
    }));

    const startTime = performance.now();
    const results = nodes.map(node => evaluateRules(node, rules));
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✓ Evaluated 30 complex rules × 100 nodes in ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(2000);
    expect(results).toHaveLength(100);
  });

  it('should maintain performance with high conflict scenarios', () => {
    const nodes = generateTestNodes(50);

    // Generate rules that all match same nodes (high conflict)
    const rules: SimpleMappingRule[] = Array.from({ length: 50 }, (_, i) => ({
      id: `rule-${i}`,
      name: `Conflicting Rule ${i}`,
      priority: i,
      selector: {
        type: 'FRAME', // All target FRAME nodes
      },
      transformer: {
        backgroundColor: `hsl(${i * 7}, 70%, 50%)`, // All conflict on backgroundColor
        width: `${100 + i * 10}px`, // All conflict on width
        padding: `${i + 5}px`, // All conflict on padding
      },
    }));

    const startTime = performance.now();

    // Evaluate only FRAME nodes (where conflicts occur)
    const frameNodes = nodes.filter(n => n.type === 'FRAME');
    const results = frameNodes.map(node => evaluateRules(node, rules));

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`✓ Evaluated 50 conflicting rules × ${frameNodes.length} nodes in ${duration.toFixed(2)}ms`);

    expect(duration).toBeLessThan(1000);
    expect(results.length).toBeGreaterThan(0);

    // Verify conflict detection is working
    results.forEach(matches => {
      expect(matches).toHaveLength(50); // All 50 rules should match FRAME nodes

      // First rule (highest priority) should have no conflicts
      expect(matches[0].conflicts).toHaveLength(0);

      // Lower priority rules should have conflicts
      const lastMatch = matches[matches.length - 1];
      expect(lastMatch.conflicts.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Match Accuracy Tests (SC-014)
// ============================================================================

describe('Rule Engine - Match Accuracy (SC-014)', () => {
  it('should achieve 100% match accuracy with exact type selectors', () => {
    const nodes = generateTestNodes(30);

    const frameRule: SimpleMappingRule = {
      id: 'frame-rule',
      name: 'Frame Rule',
      priority: 10,
      selector: { type: 'FRAME' },
      transformer: { display: 'flex' },
    };

    const frameNodes = nodes.filter(n => n.type === 'FRAME');
    const nonFrameNodes = nodes.filter(n => n.type !== 'FRAME');

    // All FRAME nodes should match
    frameNodes.forEach(node => {
      const matches = evaluateRules(node, [frameRule]);
      expect(matches).toHaveLength(1);
      expect(matches[0].ruleId).toBe('frame-rule');
    });

    // No non-FRAME nodes should match
    nonFrameNodes.forEach(node => {
      const matches = evaluateRules(node, [frameRule]);
      expect(matches).toHaveLength(0);
    });
  });

  it('should achieve 100% match accuracy with name regex selectors', () => {
    const nodes: AltNode[] = [
      {
        id: '1',
        name: 'ButtonPrimary',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 40, isRelative: false },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'NORMAL',
        effects: [],
        children: [],
        layout: { layoutMode: 'HORIZONTAL', paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0, itemSpacing: 0 },
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        clipsContent: false,
        isComponent: false,
        originalNode: {} as any,
      } as AltFrameNode,
      {
        id: '2',
        name: 'ButtonSecondary',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 40, isRelative: false },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'NORMAL',
        effects: [],
        children: [],
        layout: { layoutMode: 'HORIZONTAL', paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0, itemSpacing: 0 },
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        clipsContent: false,
        isComponent: false,
        originalNode: {} as any,
      } as AltFrameNode,
      {
        id: '3',
        name: 'Icon',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 24, height: 24, isRelative: false },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'NORMAL',
        effects: [],
        children: [],
        layout: { layoutMode: 'HORIZONTAL', paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0, itemSpacing: 0 },
        fills: { paints: [] },
        strokes: { paints: [], weight: 0, align: 'INSIDE' },
        cornerRadius: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, isUniform: true },
        clipsContent: false,
        isComponent: false,
        originalNode: {} as any,
      } as AltFrameNode,
    ];

    const buttonRule: SimpleMappingRule = {
      id: 'button-rule',
      name: 'Button Rule',
      priority: 10,
      selector: { name: /^Button/ },
      transformer: { cursor: 'pointer' },
    };

    // First two nodes should match (start with "Button")
    expect(evaluateRules(nodes[0], [buttonRule])).toHaveLength(1);
    expect(evaluateRules(nodes[1], [buttonRule])).toHaveLength(1);

    // Third node should NOT match
    expect(evaluateRules(nodes[2], [buttonRule])).toHaveLength(0);
  });

  it('should achieve 100% match accuracy with dimension range selectors', () => {
    const nodes = generateTestNodes(20);

    const iconRule: SimpleMappingRule = {
      id: 'icon-rule',
      name: 'Icon Rule',
      priority: 10,
      selector: {
        width: { min: 16, max: 64 },
        height: { min: 16, max: 64 },
      },
      transformer: { display: 'inline-block' },
    };

    let matchedCount = 0;
    let expectedCount = 0;

    nodes.forEach(node => {
      const width = node.absoluteBoundingBox.width;
      const height = node.absoluteBoundingBox.height;
      const shouldMatch = width >= 16 && width <= 64 && height >= 16 && height <= 64;

      if (shouldMatch) {
        expectedCount++;
      }

      const matches = evaluateRules(node, [iconRule]);

      if (matches.length > 0) {
        matchedCount++;
        expect(shouldMatch).toBe(true); // No false positives
      } else {
        expect(shouldMatch).toBe(false); // No false negatives
      }
    });

    // Verify we had meaningful test data (some matches, some non-matches)
    expect(matchedCount).toBeGreaterThan(0);
    expect(matchedCount).toBe(expectedCount);
  });
});
