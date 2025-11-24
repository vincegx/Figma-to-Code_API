/**
 * Rule Engine Tests - WP05
 *
 * Tests for AND-logic selector matching, priority-based conflict resolution,
 * property provenance tracking, and conflict severity detection.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateRules,
  selectorMatches,
  resolveConflicts,
  detectConflictSeverity,
  getPropertyProvenance,
} from '@/lib/rule-engine';
import type { AltNode, AltFrameNode, AltTextNode, AltRectangleNode } from '@/lib/types/altnode';
import type { SimpleMappingRule, Selector } from '@/lib/types/rules';

// ============================================================================
// Test Helpers - Mock AltNode Creation
// ============================================================================

function createMockFrameNode(overrides?: Partial<AltFrameNode>): AltFrameNode {
  return {
    id: '1:1',
    name: 'Frame',
    type: 'FRAME',
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'NORMAL',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 100,
      height: 40,
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
    fills: {
      paints: [],
    },
    strokes: {
      paints: [],
      weight: 0,
      align: 'INSIDE',
    },
    cornerRadius: {
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
      isUniform: true,
    },
    clipsContent: false,
    isComponent: false,
    originalNode: {} as any,
    ...overrides,
  } as AltFrameNode;
}

function createMockTextNode(overrides?: Partial<AltTextNode>): AltTextNode {
  return {
    id: '1:2',
    name: 'Text',
    type: 'TEXT',
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'NORMAL',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 50,
      height: 20,
      isRelative: false,
    },
    relativeTransform: [[1, 0, 0], [0, 1, 0]],
    effects: [],
    characters: 'Hello',
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
    ...overrides,
  } as AltTextNode;
}

function createMockRectangleNode(overrides?: Partial<AltRectangleNode>): AltRectangleNode {
  return {
    id: '1:3',
    name: 'Rectangle',
    type: 'RECTANGLE',
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'NORMAL',
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 32,
      height: 32,
      isRelative: false,
    },
    relativeTransform: [[1, 0, 0], [0, 1, 0]],
    effects: [],
    fills: {
      paints: [],
    },
    strokes: {
      paints: [],
      weight: 0,
      align: 'INSIDE',
    },
    cornerRadius: {
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
      isUniform: true,
    },
    originalNode: {} as any,
    ...overrides,
  } as AltRectangleNode;
}

// ============================================================================
// Selector Matching Tests - AND Logic (T044)
// ============================================================================

describe('Rule Engine - Selector Matching (AND logic)', () => {
  it('should match when all selector properties match', () => {
    const node = createMockFrameNode({
      name: 'Button',
      type: 'FRAME',
    });

    const selector: Selector = { type: 'FRAME', name: 'Button' };
    expect(selectorMatches(node, selector)).toBe(true);
  });

  it('should NOT match when any selector property fails', () => {
    const node = createMockFrameNode({
      name: 'Button',
      type: 'FRAME',
    });

    const selector: Selector = { type: 'TEXT', name: 'Button' }; // type mismatch
    expect(selectorMatches(node, selector)).toBe(false);
  });

  it('should match type selector', () => {
    const frameNode = createMockFrameNode();
    const textNode = createMockTextNode();

    expect(selectorMatches(frameNode, { type: 'FRAME' })).toBe(true);
    expect(selectorMatches(textNode, { type: 'TEXT' })).toBe(true);
    expect(selectorMatches(frameNode, { type: 'TEXT' })).toBe(false);
  });

  it('should match exact name', () => {
    const node = createMockFrameNode({ name: 'Button' });

    expect(selectorMatches(node, { name: 'Button' })).toBe(true);
    expect(selectorMatches(node, { name: 'Icon' })).toBe(false);
  });

  it('should match regex name pattern', () => {
    const node1 = createMockFrameNode({ name: 'ButtonPrimary' });
    const node2 = createMockFrameNode({ name: 'ButtonSecondary' });
    const node3 = createMockFrameNode({ name: 'Icon' });

    const selector: Selector = { name: /^Button/ }; // starts with "Button"

    expect(selectorMatches(node1, selector)).toBe(true);
    expect(selectorMatches(node2, selector)).toBe(true);
    expect(selectorMatches(node3, selector)).toBe(false);
  });

  it('should match width range', () => {
    const node = createMockFrameNode({
      absoluteBoundingBox: { x: 0, y: 0, width: 32, height: 32, isRelative: false },
    });

    expect(selectorMatches(node, { width: { min: 16, max: 64 } })).toBe(true);
    expect(selectorMatches(node, { width: { min: 40 } })).toBe(false);
    expect(selectorMatches(node, { width: { max: 20 } })).toBe(false);
  });

  it('should match height range', () => {
    const node = createMockFrameNode({
      absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 50, isRelative: false },
    });

    expect(selectorMatches(node, { height: { min: 40, max: 60 } })).toBe(true);
    expect(selectorMatches(node, { height: { min: 60 } })).toBe(false);
    expect(selectorMatches(node, { height: { max: 40 } })).toBe(false);
  });

  it('should match hasChildren selector', () => {
    const emptyNode = createMockFrameNode({ children: [] });
    const parentNode = createMockFrameNode({
      children: [createMockTextNode()],
    });

    expect(selectorMatches(emptyNode, { hasChildren: false })).toBe(true);
    expect(selectorMatches(emptyNode, { hasChildren: true })).toBe(false);
    expect(selectorMatches(parentNode, { hasChildren: true })).toBe(true);
    expect(selectorMatches(parentNode, { hasChildren: false })).toBe(false);
  });

  it('should match multiple selector properties with AND logic', () => {
    const node = createMockFrameNode({
      name: 'Icon',
      type: 'FRAME',
      absoluteBoundingBox: { x: 0, y: 0, width: 24, height: 24, isRelative: false },
      children: [],
    });

    // All properties match
    expect(selectorMatches(node, {
      type: 'FRAME',
      name: /^Icon/,
      width: { min: 16, max: 32 },
      hasChildren: false,
    })).toBe(true);

    // One property fails (width too small)
    expect(selectorMatches(node, {
      type: 'FRAME',
      name: /^Icon/,
      width: { min: 32 },
      hasChildren: false,
    })).toBe(false);
  });
});

// ============================================================================
// Priority Resolution Tests (T045)
// ============================================================================

describe('Rule Engine - Priority Resolution', () => {
  it('should resolve conflicts with higher priority winning', () => {
    const node = createMockFrameNode({ name: 'Button', type: 'FRAME' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 10,
      selector: { type: 'FRAME' },
      transformer: {
        backgroundColor: 'red',
        padding: '16px',
      },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 5,
      selector: { type: 'FRAME' },
      transformer: {
        backgroundColor: 'blue', // conflict with ruleA
        color: 'white',
      },
    };

    const matches = evaluateRules(node, [ruleA, ruleB]);

    expect(matches).toHaveLength(2);

    // Rule A (higher priority) should be first
    expect(matches[0].ruleId).toBe('rule-a');
    expect(matches[0].contributedProperties).toContain('backgroundColor');
    expect(matches[0].contributedProperties).toContain('padding');
    expect(matches[0].conflicts).toHaveLength(0);

    // Rule B should have conflict on backgroundColor
    expect(matches[1].ruleId).toBe('rule-b');
    expect(matches[1].contributedProperties).toContain('color');
    expect(matches[1].contributedProperties).not.toContain('backgroundColor');
    expect(matches[1].conflicts).toContain('backgroundColor');
  });

  it('should compose properties from multiple rules (not override entire rule)', () => {
    const node = createMockFrameNode({ type: 'FRAME' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 10,
      selector: { type: 'FRAME' },
      transformer: {
        backgroundColor: 'red',
        padding: '16px',
      },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 5,
      selector: { type: 'FRAME' },
      transformer: {
        color: 'white',
        fontSize: '14px',
      },
    };

    const matches = evaluateRules(node, [ruleA, ruleB]);

    // Both rules contribute properties (property-level composition)
    expect(matches[0].contributedProperties).toEqual(['backgroundColor', 'padding']);
    expect(matches[1].contributedProperties).toEqual(['color', 'fontSize']);

    // Build complete property map
    const provenance = getPropertyProvenance(matches);
    expect(provenance.get('backgroundColor')).toBe('rule-a');
    expect(provenance.get('padding')).toBe('rule-a');
    expect(provenance.get('color')).toBe('rule-b');
    expect(provenance.get('fontSize')).toBe('rule-b');
  });

  it('should handle three rules with cascading priorities', () => {
    const node = createMockTextNode({ type: 'TEXT' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 100,
      selector: { type: 'TEXT' },
      transformer: { fontSize: '16px', color: 'black' },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 50,
      selector: { type: 'TEXT' },
      transformer: { fontSize: '14px', fontWeight: 'bold' }, // fontSize conflicts with ruleA
    };

    const ruleC: SimpleMappingRule = {
      id: 'rule-c',
      name: 'Rule C',
      priority: 10,
      selector: { type: 'TEXT' },
      transformer: { fontSize: '12px', lineHeight: '1.5' }, // fontSize conflicts with ruleA
    };

    const matches = evaluateRules(node, [ruleA, ruleB, ruleC]);

    expect(matches[0].ruleId).toBe('rule-a');
    expect(matches[0].contributedProperties).toEqual(['fontSize', 'color']);

    expect(matches[1].ruleId).toBe('rule-b');
    expect(matches[1].contributedProperties).toEqual(['fontWeight']);
    expect(matches[1].conflicts).toEqual(['fontSize']);

    expect(matches[2].ruleId).toBe('rule-c');
    expect(matches[2].contributedProperties).toEqual(['lineHeight']);
    expect(matches[2].conflicts).toEqual(['fontSize']);
  });
});

// ============================================================================
// Conflict Detection Tests (T046)
// ============================================================================

describe('Rule Engine - Conflict Detection', () => {
  it('should detect major conflicts on layout properties', () => {
    const node = createMockFrameNode({ type: 'FRAME' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 10,
      selector: { type: 'FRAME' },
      transformer: { width: '100px', display: 'flex' },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 5,
      selector: { type: 'FRAME' },
      transformer: { width: '200px', padding: '8px' }, // width conflict = MAJOR
    };

    const matches = evaluateRules(node, [ruleA, ruleB]);

    expect(matches[1].severity).toBe('major');
    expect(matches[1].conflicts).toContain('width');
  });

  it('should detect minor conflicts on visual properties', () => {
    const node = createMockTextNode({ type: 'TEXT' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 10,
      selector: { type: 'TEXT' },
      transformer: { color: 'red', fontSize: '16px' },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 5,
      selector: { type: 'TEXT' },
      transformer: { color: 'blue' }, // color conflict = MINOR
    };

    const matches = evaluateRules(node, [ruleA, ruleB]);

    expect(matches[1].severity).toBe('minor');
    expect(matches[1].conflicts).toContain('color');
  });

  it('should classify mixed conflicts as major if any major property conflicts', () => {
    const conflicts = ['color', 'width', 'fontSize'];
    expect(detectConflictSeverity(conflicts)).toBe('major');
  });

  it('should classify pure visual conflicts as minor', () => {
    const conflicts = ['color', 'backgroundColor', 'fontSize'];
    expect(detectConflictSeverity(conflicts)).toBe('minor');
  });

  it('should return none for no conflicts', () => {
    expect(detectConflictSeverity([])).toBe('none');
  });
});

// ============================================================================
// Property Provenance Tests (T047)
// ============================================================================

describe('Rule Engine - Property Provenance', () => {
  it('should track which rule contributed each property', () => {
    const node = createMockFrameNode({ type: 'FRAME' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 10,
      selector: { type: 'FRAME' },
      transformer: {
        backgroundColor: 'red',
        padding: '16px',
      },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 5,
      selector: { type: 'FRAME' },
      transformer: {
        color: 'white',
      },
    };

    const matches = evaluateRules(node, [ruleA, ruleB]);
    const provenance = getPropertyProvenance(matches);

    expect(provenance.get('backgroundColor')).toBe('rule-a');
    expect(provenance.get('padding')).toBe('rule-a');
    expect(provenance.get('color')).toBe('rule-b');
  });

  it('should only track contributed properties (not conflicted ones)', () => {
    const node = createMockFrameNode({ type: 'FRAME' });

    const ruleA: SimpleMappingRule = {
      id: 'rule-a',
      name: 'Rule A',
      priority: 10,
      selector: { type: 'FRAME' },
      transformer: { width: '100px' },
    };

    const ruleB: SimpleMappingRule = {
      id: 'rule-b',
      name: 'Rule B',
      priority: 5,
      selector: { type: 'FRAME' },
      transformer: { width: '200px' }, // conflict - should NOT be in provenance
    };

    const matches = evaluateRules(node, [ruleA, ruleB]);
    const provenance = getPropertyProvenance(matches);

    expect(provenance.get('width')).toBe('rule-a'); // ruleA wins
    expect(provenance.size).toBe(1); // only 1 property in provenance
  });

  it('should build complete provenance map for complex scenario', () => {
    const node = createMockFrameNode({ type: 'FRAME' });

    const rules: SimpleMappingRule[] = [
      {
        id: 'rule-layout',
        name: 'Layout Rule',
        priority: 100,
        selector: { type: 'FRAME' },
        transformer: { display: 'flex', flexDirection: 'row', gap: '16px' },
      },
      {
        id: 'rule-colors',
        name: 'Colors Rule',
        priority: 50,
        selector: { type: 'FRAME' },
        transformer: { backgroundColor: '#fff', color: '#000' },
      },
      {
        id: 'rule-spacing',
        name: 'Spacing Rule',
        priority: 25,
        selector: { type: 'FRAME' },
        transformer: { padding: '8px', margin: '4px' },
      },
    ];

    const matches = evaluateRules(node, rules);
    const provenance = getPropertyProvenance(matches);

    expect(provenance.size).toBe(7);
    expect(provenance.get('display')).toBe('rule-layout');
    expect(provenance.get('flexDirection')).toBe('rule-layout');
    expect(provenance.get('gap')).toBe('rule-layout');
    expect(provenance.get('backgroundColor')).toBe('rule-colors');
    expect(provenance.get('color')).toBe('rule-colors');
    expect(provenance.get('padding')).toBe('rule-spacing');
    expect(provenance.get('margin')).toBe('rule-spacing');
  });
});

// ============================================================================
// Integration Tests - Full Evaluation Flow
// ============================================================================

describe('Rule Engine - Full Evaluation Integration', () => {
  it('should evaluate no rules when no selectors match', () => {
    const node = createMockFrameNode({ type: 'FRAME' });
    const rules: SimpleMappingRule[] = [
      {
        id: 'rule-1',
        name: 'Text Rule',
        priority: 10,
        selector: { type: 'TEXT' }, // doesn't match FRAME
        transformer: { color: 'red' },
      },
    ];

    const matches = evaluateRules(node, rules);
    expect(matches).toHaveLength(0);
  });

  it('should handle empty rules array', () => {
    const node = createMockFrameNode();
    const matches = evaluateRules(node, []);
    expect(matches).toHaveLength(0);
  });

  it('should handle rule with no transformer properties', () => {
    const node = createMockFrameNode({ type: 'FRAME' });
    const rules: SimpleMappingRule[] = [
      {
        id: 'rule-1',
        name: 'Empty Rule',
        priority: 10,
        selector: { type: 'FRAME' },
        transformer: {},
      },
    ];

    const matches = evaluateRules(node, rules);
    expect(matches).toHaveLength(1);
    expect(matches[0].contributedProperties).toHaveLength(0);
    expect(matches[0].severity).toBe('none');
  });

  it('should preserve rule order by priority after evaluation', () => {
    const node = createMockFrameNode({ type: 'FRAME' });
    const rules: SimpleMappingRule[] = [
      { id: 'rule-low', name: 'Low', priority: 1, selector: { type: 'FRAME' }, transformer: { a: '1' } },
      { id: 'rule-high', name: 'High', priority: 100, selector: { type: 'FRAME' }, transformer: { b: '2' } },
      { id: 'rule-medium', name: 'Medium', priority: 50, selector: { type: 'FRAME' }, transformer: { c: '3' } },
    ];

    const matches = evaluateRules(node, rules);

    expect(matches[0].ruleId).toBe('rule-high'); // 100
    expect(matches[1].ruleId).toBe('rule-medium'); // 50
    expect(matches[2].ruleId).toBe('rule-low'); // 1
  });
});
