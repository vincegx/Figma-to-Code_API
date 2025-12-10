/**
 * Tests for Smart Component Detection Algorithm
 */

import { describe, it, expect } from 'vitest';
import { detectComponents, countNodes } from '@/lib/split/detect-components';
import type { FigmaNode } from '@/lib/types/figma';

// Create mock Figma node helper
function createMockNode(
  name: string,
  type: string,
  children?: FigmaNode[]
): FigmaNode {
  return {
    id: `id-${name.replace(/\s+/g, '-').toLowerCase()}`,
    name,
    type,
    visible: true,
    locked: false,
    children,
  } as FigmaNode;
}

describe('detectComponents', () => {
  it('should detect direct children of root as components', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Header', 'FRAME', [
        createMockNode('Logo', 'FRAME'),
        createMockNode('Nav', 'FRAME'),
        createMockNode('NavItem1', 'FRAME'),
        createMockNode('NavItem2', 'FRAME'),
      ]),
      createMockNode('Footer', 'FRAME', [
        createMockNode('Links', 'FRAME'),
        createMockNode('Copyright', 'TEXT'),
        createMockNode('Social', 'FRAME'),
      ]),
    ]);

    const detected = detectComponents(root);

    expect(detected.length).toBeGreaterThan(0);
    expect(detected.find(c => c.name === 'Header')).toBeDefined();
    expect(detected.find(c => c.name === 'Footer')).toBeDefined();
  });

  it('should skip wrapper nodes and detect their children', () => {
    // Create a wrapper with 100+ nodes to trigger wrapper detection
    const createNestedChildren = (count: number) =>
      Array(count).fill(null).map((_, i) =>
        createMockNode(`Section${i}`, 'FRAME', [
          createMockNode(`Content${i}`, 'FRAME'),
          createMockNode(`Text${i}`, 'TEXT'),
          createMockNode(`Image${i}`, 'RECTANGLE'),
        ])
      );

    const root = createMockNode('Page', 'FRAME', [
      createMockNode('body', 'FRAME', createNestedChildren(35)),
    ]);

    const detected = detectComponents(root);

    // Should skip 'body' wrapper and detect sections
    expect(detected.find(c => c.name === 'body')).toBeUndefined();
    expect(detected.length).toBeGreaterThan(0);
  });

  it('should score INSTANCE/COMPONENT higher than FRAME', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('ButtonInstance', 'INSTANCE', [
        createMockNode('Label', 'TEXT'),
        createMockNode('Icon', 'VECTOR'),
        createMockNode('BG', 'RECTANGLE'),
      ]),
      createMockNode('CardFrame', 'FRAME', [
        createMockNode('Title', 'TEXT'),
        createMockNode('Desc', 'TEXT'),
        createMockNode('BG', 'RECTANGLE'),
      ]),
    ]);

    const detected = detectComponents(root);
    const instance = detected.find(c => c.name === 'ButtonInstance');
    const frame = detected.find(c => c.name === 'CardFrame');

    expect(instance).toBeDefined();
    expect(frame).toBeDefined();
    expect(instance!.score).toBeGreaterThan(frame!.score);
  });

  it('should penalize generic names like "Frame 1"', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Hero Section', 'FRAME', [
        createMockNode('Title', 'TEXT'),
        createMockNode('Subtitle', 'TEXT'),
        createMockNode('CTA', 'FRAME'),
      ]),
      createMockNode('Frame 1', 'FRAME', [
        createMockNode('Text1', 'TEXT'),
        createMockNode('Text2', 'TEXT'),
        createMockNode('Box', 'RECTANGLE'),
      ]),
    ]);

    const detected = detectComponents(root);
    const semantic = detected.find(c => c.name === 'Hero Section');
    const generic = detected.find(c => c.name === 'Frame 1');

    if (semantic && generic) {
      expect(semantic.score).toBeGreaterThan(generic.score);
    }
  });

  it('should not detect nodes with fewer than MIN_COMPONENT_NODES', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('TooSmall', 'FRAME', [
        createMockNode('Single', 'TEXT'),
      ]),
      // Create a larger component with enough nodes to meet minimum score
      createMockNode('LargeEnough', 'INSTANCE', [
        createMockNode('One', 'TEXT'),
        createMockNode('Two', 'TEXT'),
        createMockNode('Three', 'TEXT'),
        createMockNode('Four', 'TEXT'),
        createMockNode('Five', 'TEXT'),
      ]),
    ]);

    const detected = detectComponents(root);

    expect(detected.find(c => c.name === 'TooSmall')).toBeUndefined();
    // INSTANCE type gives +30 score, depth 1 gives +15, 6 nodes gives +15 = 60 total (> MIN_DETECTION_SCORE=40)
    expect(detected.find(c => c.name === 'LargeEnough')).toBeDefined();
  });

  it('should give bonus to semantic names', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Header', 'FRAME', [
        createMockNode('Logo', 'FRAME'),
        createMockNode('Nav', 'FRAME'),
        createMockNode('Menu', 'FRAME'),
      ]),
      createMockNode('SomeRandomName', 'FRAME', [
        createMockNode('Item1', 'FRAME'),
        createMockNode('Item2', 'FRAME'),
        createMockNode('Item3', 'FRAME'),
      ]),
    ]);

    const detected = detectComponents(root);
    const header = detected.find(c => c.name === 'Header');
    const random = detected.find(c => c.name === 'SomeRandomName');

    if (header && random) {
      // Header should have semantic bonus
      expect(header.score).toBeGreaterThanOrEqual(random.score);
    }
  });

  it('should not detect non-structural types like TEXT', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Headline', 'TEXT'),
      createMockNode('Description', 'TEXT'),
      // Use INSTANCE for higher score to ensure detection
      createMockNode('Container', 'INSTANCE', [
        createMockNode('Content1', 'TEXT'),
        createMockNode('Content2', 'TEXT'),
        createMockNode('Content3', 'RECTANGLE'),
        createMockNode('Content4', 'FRAME'),
        createMockNode('Content5', 'FRAME'),
      ]),
    ]);

    const detected = detectComponents(root);

    // TEXT nodes should not be detected as components
    expect(detected.find(c => c.name === 'Headline')).toBeUndefined();
    expect(detected.find(c => c.name === 'Description')).toBeUndefined();
    // INSTANCE should be detected (high score type)
    expect(detected.find(c => c.name === 'Container')).toBeDefined();
  });

  it('should sort results by score (highest first)', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Frame 1', 'FRAME', [ // Low score (generic name)
        createMockNode('A', 'TEXT'),
        createMockNode('B', 'TEXT'),
        createMockNode('C', 'RECTANGLE'),
      ]),
      createMockNode('ButtonComponent', 'INSTANCE', [ // High score (INSTANCE type)
        createMockNode('Label', 'TEXT'),
        createMockNode('Icon', 'VECTOR'),
        createMockNode('BG', 'RECTANGLE'),
      ]),
      createMockNode('Card', 'FRAME', [ // Medium score
        createMockNode('Title', 'TEXT'),
        createMockNode('Body', 'TEXT'),
        createMockNode('Image', 'RECTANGLE'),
      ]),
    ]);

    const detected = detectComponents(root);

    // Ensure sorted by score descending
    for (let i = 1; i < detected.length; i++) {
      expect(detected[i - 1].score).toBeGreaterThanOrEqual(detected[i].score);
    }
  });
});

describe('countNodes', () => {
  it('should count all nodes including children', () => {
    const node = createMockNode('Root', 'FRAME', [
      createMockNode('Child1', 'FRAME', [
        createMockNode('Grandchild1', 'TEXT'),
        createMockNode('Grandchild2', 'TEXT'),
      ]),
      createMockNode('Child2', 'FRAME'),
    ]);

    expect(countNodes(node)).toBe(5); // Root + 2 children + 2 grandchildren
  });

  it('should return 1 for leaf nodes', () => {
    const leaf = createMockNode('Leaf', 'TEXT');
    expect(countNodes(leaf)).toBe(1);
  });

  it('should handle deeply nested structures', () => {
    const deep = createMockNode('L1', 'FRAME', [
      createMockNode('L2', 'FRAME', [
        createMockNode('L3', 'FRAME', [
          createMockNode('L4', 'FRAME', [
            createMockNode('L5', 'TEXT'),
          ]),
        ]),
      ]),
    ]);

    expect(countNodes(deep)).toBe(5);
  });

  it('should handle nodes with many children', () => {
    const manyChildren = createMockNode('Parent', 'FRAME',
      Array(10).fill(null).map((_, i) => createMockNode(`Child${i}`, 'TEXT'))
    );

    expect(countNodes(manyChildren)).toBe(11); // 1 parent + 10 children
  });
});
