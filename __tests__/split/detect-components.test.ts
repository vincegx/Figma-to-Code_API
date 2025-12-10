/**
 * Tests for Smart Component Detection Algorithm (v2)
 *
 * The v2 algorithm uses structural detection:
 * - Descends through wrappers (<=2 children)
 * - Detects components when finding >2 substantial children
 * - Stops descending into detected components
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

// Helper to create N children with enough nodes to be substantial
function createSubstantialChildren(count: number, prefix = 'Section') {
  return Array(count).fill(null).map((_, i) =>
    createMockNode(`${prefix}${i + 1}`, 'FRAME', [
      createMockNode(`Content${i}A`, 'FRAME'),
      createMockNode(`Content${i}B`, 'TEXT'),
      createMockNode(`Content${i}C`, 'RECTANGLE'),
    ])
  );
}

describe('detectComponents', () => {
  it('should detect components when root has >2 substantial children', () => {
    // Root with 3 substantial children - should detect all 3
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Header', 'FRAME', [
        createMockNode('Logo', 'FRAME'),
        createMockNode('Nav', 'FRAME'),
        createMockNode('NavItem1', 'FRAME'),
      ]),
      createMockNode('Main', 'FRAME', [
        createMockNode('Hero', 'FRAME'),
        createMockNode('Content', 'FRAME'),
        createMockNode('CTA', 'FRAME'),
      ]),
      createMockNode('Footer', 'FRAME', [
        createMockNode('Links', 'FRAME'),
        createMockNode('Copyright', 'TEXT'),
        createMockNode('Social', 'FRAME'),
      ]),
    ]);

    const detected = detectComponents(root);

    expect(detected.length).toBe(3);
    expect(detected.find(c => c.name === 'Header')).toBeDefined();
    expect(detected.find(c => c.name === 'Main')).toBeDefined();
    expect(detected.find(c => c.name === 'Footer')).toBeDefined();
  });

  it('should descend through wrapper (<=2 children) and detect inner components', () => {
    // Root has only 1 child (wrapper), which has 4 substantial children
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('body', 'FRAME', [
        createMockNode('Container', 'FRAME', createSubstantialChildren(4)),
      ]),
    ]);

    const detected = detectComponents(root);

    // Should skip body and Container (wrappers), detect the 4 sections
    expect(detected.find(c => c.name === 'body')).toBeUndefined();
    expect(detected.find(c => c.name === 'Container')).toBeUndefined();
    expect(detected.length).toBe(4);
    expect(detected.find(c => c.name === 'Section1')).toBeDefined();
    expect(detected.find(c => c.name === 'Section4')).toBeDefined();
  });

  it('should exclude dominant children (>80% of parent nodes) and descend into them', () => {
    // Helper to create many nodes to make body dominant (>80% of total)
    const createManyNodes = (count: number, prefix: string) =>
      Array(count).fill(null).map((_, i) =>
        createMockNode(`${prefix}${i}`, 'FRAME', [
          createMockNode(`${prefix}${i}A`, 'TEXT'),
          createMockNode(`${prefix}${i}B`, 'TEXT'),
        ])
      );

    // Root total will be: 1 (root) + 4 (header) + 4 (footer) + body's nodes
    // Body needs to have >80% so it needs many more nodes
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Header', 'INSTANCE', [
        createMockNode('Logo', 'FRAME'),
        createMockNode('Nav', 'FRAME'),
        createMockNode('Menu', 'FRAME'),
      ]),
      // Body with MANY nested nodes to be dominant (>80%)
      // Body will have: 1 + 1 + (4*4) + (30*3) = 1 + 1 + 16 + 90 = 108 nodes
      createMockNode('body', 'FRAME', [
        createMockNode('Container', 'FRAME', [
          ...createSubstantialChildren(4, 'Section'),
          ...createManyNodes(30, 'Extra'),
        ]),
      ]),
      createMockNode('Footer', 'FRAME', [
        createMockNode('Links', 'FRAME'),
        createMockNode('Social', 'FRAME'),
        createMockNode('Copy', 'TEXT'),
      ]),
    ]);

    const detected = detectComponents(root);

    // Header and Footer should be detected (not dominant)
    expect(detected.find(c => c.name === 'Header')).toBeDefined();
    expect(detected.find(c => c.name === 'Footer')).toBeDefined();
    // Body should NOT be detected (dominant wrapper >80%)
    expect(detected.find(c => c.name === 'body')).toBeUndefined();
    // Body's inner sections should be detected
    expect(detected.find(c => c.name === 'Section1')).toBeDefined();
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
      createMockNode('ThirdComponent', 'FRAME', [
        createMockNode('A', 'TEXT'),
        createMockNode('B', 'TEXT'),
        createMockNode('C', 'RECTANGLE'),
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
      createMockNode('Another Section', 'FRAME', [
        createMockNode('A', 'TEXT'),
        createMockNode('B', 'TEXT'),
        createMockNode('C', 'RECTANGLE'),
      ]),
    ]);

    const detected = detectComponents(root);
    const semantic = detected.find(c => c.name === 'Hero Section');
    const generic = detected.find(c => c.name === 'Frame 1');

    expect(semantic).toBeDefined();
    expect(generic).toBeDefined();
    expect(semantic!.score).toBeGreaterThan(generic!.score);
  });

  it('should not detect nodes with fewer than MIN_COMPONENT_NODES', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('TooSmall', 'FRAME', [
        createMockNode('Single', 'TEXT'),
      ]),
      createMockNode('LargeEnough', 'FRAME', [
        createMockNode('One', 'TEXT'),
        createMockNode('Two', 'TEXT'),
        createMockNode('Three', 'TEXT'),
      ]),
      createMockNode('AlsoLarge', 'FRAME', [
        createMockNode('A', 'TEXT'),
        createMockNode('B', 'TEXT'),
        createMockNode('C', 'TEXT'),
      ]),
    ]);

    const detected = detectComponents(root);

    // TooSmall has only 2 nodes (itself + 1 child), below MIN_COMPONENT_NODES (3)
    expect(detected.find(c => c.name === 'TooSmall')).toBeUndefined();
    expect(detected.find(c => c.name === 'LargeEnough')).toBeDefined();
    expect(detected.find(c => c.name === 'AlsoLarge')).toBeDefined();
  });

  it('should not detect non-structural types like TEXT', () => {
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Headline', 'TEXT'),
      createMockNode('Description', 'TEXT'),
      createMockNode('Container', 'FRAME', [
        createMockNode('Content1', 'TEXT'),
        createMockNode('Content2', 'TEXT'),
        createMockNode('Content3', 'RECTANGLE'),
      ]),
      createMockNode('AnotherFrame', 'FRAME', [
        createMockNode('A', 'TEXT'),
        createMockNode('B', 'TEXT'),
        createMockNode('C', 'RECTANGLE'),
      ]),
      createMockNode('ThirdFrame', 'FRAME', [
        createMockNode('X', 'TEXT'),
        createMockNode('Y', 'TEXT'),
        createMockNode('Z', 'RECTANGLE'),
      ]),
    ]);

    const detected = detectComponents(root);

    // TEXT nodes should not be detected as components (not structural)
    expect(detected.find(c => c.name === 'Headline')).toBeUndefined();
    expect(detected.find(c => c.name === 'Description')).toBeUndefined();
    // FRAMEs should be detected
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
    expect(detected.length).toBeGreaterThan(0);
    for (let i = 1; i < detected.length; i++) {
      expect(detected[i - 1].score).toBeGreaterThanOrEqual(detected[i].score);
    }
  });

  it('should stop at MAX_DETECTION_DEPTH', () => {
    // Create deeply nested structure
    const root = createMockNode('Page', 'FRAME', [
      createMockNode('Level1', 'FRAME', [
        createMockNode('Level2', 'FRAME', [
          createMockNode('Level3', 'FRAME', [
            createMockNode('Level4', 'FRAME', [
              createMockNode('Level5', 'FRAME', [
                // These should not be detected (too deep)
                ...createSubstantialChildren(4, 'Deep'),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    const detected = detectComponents(root);

    // Deep sections should not be detected due to MAX_DETECTION_DEPTH
    expect(detected.find(c => c.name === 'Deep1')).toBeUndefined();
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
