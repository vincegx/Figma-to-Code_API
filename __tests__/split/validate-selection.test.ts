/**
 * Tests for Selection Validation
 */

import { describe, it, expect } from 'vitest';
import { validateSelection, findNodeById } from '@/lib/split/validate-selection';
import { MAX_SELECTED_COMPONENTS } from '@/lib/types/split';
import type { FigmaNode } from '@/lib/types/figma';

// Create mock node helper
function createMockNode(
  id: string,
  name: string,
  type: string,
  children?: FigmaNode[]
): FigmaNode {
  return {
    id,
    name,
    type,
    visible: true,
    locked: false,
    children,
  } as FigmaNode;
}

describe('validateSelection', () => {
  const root = createMockNode('root', 'Page', 'FRAME', [
    createMockNode('header', 'Header', 'FRAME', [
      createMockNode('logo', 'Logo', 'FRAME', [
        createMockNode('logo-icon', 'Icon', 'VECTOR'),
        createMockNode('logo-text', 'Text', 'TEXT'),
        createMockNode('logo-bg', 'BG', 'RECTANGLE'),
      ]),
      createMockNode('nav', 'Nav', 'FRAME', [
        createMockNode('nav-item-1', 'Item1', 'TEXT'),
        createMockNode('nav-item-2', 'Item2', 'TEXT'),
        createMockNode('nav-item-3', 'Item3', 'TEXT'),
      ]),
    ]),
    createMockNode('body', 'Body', 'FRAME', [
      createMockNode('hero', 'Hero', 'FRAME', [
        createMockNode('title', 'Title', 'TEXT'),
        createMockNode('cta', 'CTA', 'FRAME'),
      ]),
      createMockNode('content', 'Content', 'FRAME', [
        createMockNode('para1', 'Para1', 'TEXT'),
        createMockNode('para2', 'Para2', 'TEXT'),
        createMockNode('para3', 'Para3', 'TEXT'),
      ]),
    ]),
    createMockNode('footer', 'Footer', 'FRAME', [
      createMockNode('footer-links', 'Links', 'FRAME'),
      createMockNode('footer-copy', 'Copyright', 'TEXT'),
      createMockNode('footer-social', 'Social', 'FRAME'),
    ]),
  ]);

  it('should pass with valid selection', () => {
    const result = validateSelection(['header', 'footer'], root);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.cleanedSelection).toContain('header');
    expect(result.cleanedSelection).toContain('footer');
  });

  it('should fail with empty selection', () => {
    const result = validateSelection([], root);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('at least one'))).toBe(true);
  });

  it('should fail when exceeding max selection', () => {
    const tooMany = Array(MAX_SELECTED_COMPONENTS + 1)
      .fill(null)
      .map((_, i) => `id-${i}`);

    const result = validateSelection(tooMany, root);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.toLowerCase().includes('too many'))).toBe(true);
  });

  it('should remove children when parent is selected', () => {
    // Select header AND its children (logo, nav)
    const result = validateSelection(['header', 'logo', 'nav'], root);

    // Should only keep header, remove logo and nav
    expect(result.cleanedSelection).toContain('header');
    expect(result.cleanedSelection).not.toContain('logo');
    expect(result.cleanedSelection).not.toContain('nav');
    expect(result.warnings.some(w => w.toLowerCase().includes('excluded'))).toBe(true);
  });

  it('should keep sibling selections', () => {
    const result = validateSelection(['header', 'body', 'footer'], root);

    expect(result.cleanedSelection).toHaveLength(3);
    expect(result.cleanedSelection).toContain('header');
    expect(result.cleanedSelection).toContain('body');
    expect(result.cleanedSelection).toContain('footer');
  });

  it('should handle deep nesting for parent/child detection', () => {
    // Select header and a deeply nested child
    const result = validateSelection(['header', 'logo-icon'], root);

    // logo-icon is inside logo which is inside header
    expect(result.cleanedSelection).toContain('header');
    expect(result.cleanedSelection).not.toContain('logo-icon');
  });

  it('should warn for large components', () => {
    // Create a node with 250 children
    const largeRoot = createMockNode('root', 'Page', 'FRAME', [
      createMockNode('large', 'LargeSection', 'FRAME',
        Array(250).fill(null).map((_, i) =>
          createMockNode(`item-${i}`, `Item${i}`, 'FRAME')
        )
      ),
    ]);

    const result = validateSelection(['large'], largeRoot);

    // Should have a warning about large component (251 nodes = 1 parent + 250 children)
    expect(result.warnings.some(w => w.includes('251') || w.includes('nodes'))).toBe(true);
  });

  it('should keep selection valid when all checks pass', () => {
    const result = validateSelection(['hero', 'content', 'footer'], root);

    expect(result.valid).toBe(true);
    expect(result.cleanedSelection).toHaveLength(3);
  });

  it('should handle non-existent IDs gracefully', () => {
    const result = validateSelection(['header', 'non-existent-id'], root);

    // Should still be valid (non-existent IDs are kept but won't affect validation)
    expect(result.valid).toBe(true);
    expect(result.cleanedSelection).toContain('header');
    expect(result.cleanedSelection).toContain('non-existent-id');
  });

  it('should not remove siblings even if they look similar', () => {
    // Select two sibling children of body
    const result = validateSelection(['hero', 'content'], root);

    expect(result.cleanedSelection).toContain('hero');
    expect(result.cleanedSelection).toContain('content');
    expect(result.cleanedSelection).toHaveLength(2);
  });

  it('should handle selecting all children without parent', () => {
    // Select all children of header without selecting header itself
    const result = validateSelection(['logo', 'nav'], root);

    expect(result.cleanedSelection).toContain('logo');
    expect(result.cleanedSelection).toContain('nav');
    expect(result.cleanedSelection).toHaveLength(2);
  });
});

describe('findNodeById', () => {
  const root = createMockNode('root', 'Root', 'FRAME', [
    createMockNode('a', 'A', 'FRAME', [
      createMockNode('a1', 'A1', 'FRAME', [
        createMockNode('a1-deep', 'A1Deep', 'TEXT'),
      ]),
      createMockNode('a2', 'A2', 'FRAME'),
    ]),
    createMockNode('b', 'B', 'FRAME', [
      createMockNode('b1', 'B1', 'TEXT'),
    ]),
  ]);

  it('should find root node', () => {
    const found = findNodeById(root, 'root');
    expect(found).toBeDefined();
    expect(found?.name).toBe('Root');
  });

  it('should find direct child', () => {
    const found = findNodeById(root, 'a');
    expect(found).toBeDefined();
    expect(found?.name).toBe('A');
  });

  it('should find nested node', () => {
    const found = findNodeById(root, 'a1');
    expect(found).toBeDefined();
    expect(found?.name).toBe('A1');
  });

  it('should find deeply nested node', () => {
    const found = findNodeById(root, 'a1-deep');
    expect(found).toBeDefined();
    expect(found?.name).toBe('A1Deep');
  });

  it('should return null for non-existent ID', () => {
    const found = findNodeById(root, 'non-existent');
    expect(found).toBeNull();
  });

  it('should find nodes in different branches', () => {
    const foundA = findNodeById(root, 'a2');
    const foundB = findNodeById(root, 'b1');

    expect(foundA).toBeDefined();
    expect(foundA?.name).toBe('A2');
    expect(foundB).toBeDefined();
    expect(foundB?.name).toBe('B1');
  });

  it('should handle nodes without children', () => {
    const leaf = createMockNode('leaf', 'Leaf', 'TEXT');
    const found = findNodeById(leaf, 'leaf');

    expect(found).toBeDefined();
    expect(found?.name).toBe('Leaf');
  });

  it('should handle empty children array', () => {
    const nodeWithEmptyChildren = createMockNode('parent', 'Parent', 'FRAME', []);
    const found = findNodeById(nodeWithEmptyChildren, 'parent');

    expect(found).toBeDefined();
    expect(found?.name).toBe('Parent');
  });
});
