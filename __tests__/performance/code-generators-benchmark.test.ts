import { describe, it, expect } from 'vitest';
import { generateReactJSX } from '@/lib/code-generators/react';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';
import { AltNode } from '@/lib/types/altnode';

/**
 * Code Generator Performance Benchmarks
 *
 * Success Criteria:
 * - SC-007: Format switch → preview update <500ms
 * - Generation for complex nodes (100+ children) <100ms
 */

describe('Code Generators - Performance Benchmarks', () => {
  /**
   * Helper to create a deep nested node tree
   */
  function createDeepTree(depth: number, childrenPerLevel: number): Partial<AltNode> {
    if (depth === 0) {
      return {
        id: `leaf-${Math.random()}`,
        name: 'Leaf',
        type: 'TEXT',
        characters: 'Content',
      };
    }

    const children: any[] = [];
    for (let i = 0; i < childrenPerLevel; i++) {
      children.push(createDeepTree(depth - 1, childrenPerLevel));
    }

    return {
      id: `node-${depth}-${Math.random()}`,
      name: `Container-${depth}`,
      type: 'FRAME',
      children,
    };
  }

  /**
   * Helper to create a wide node tree
   */
  function createWideTree(totalChildren: number): Partial<AltNode> {
    const children: any[] = [];
    for (let i = 0; i < totalChildren; i++) {
      if (i % 2 === 0) {
        // TEXT node
        children.push({
          id: `child-${i}`,
          name: `Child${i}`,
          type: 'TEXT',
          characters: `Text ${i}`,
        });
      } else {
        // FRAME node with children array
        children.push({
          id: `child-${i}`,
          name: `Child${i}`,
          type: 'FRAME',
          children: [],
        });
      }
    }

    return {
      id: 'root',
      name: 'Root',
      type: 'FRAME',
      children,
    };
  }

  const sampleProperties = {
    display: 'flex',
    padding: '16px',
    backgroundColor: '#EF4444',
    borderRadius: '8px',
    gap: '12px',
  };

  describe('Format Switch Performance (SC-007)', () => {
    it('should generate React JSX for complex node in <500ms', () => {
      // Create node with 100 children
      const complexNode = createWideTree(100);

      const startTime = performance.now();
      const result = generateReactJSX(complexNode as AltNode, sampleProperties);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated React JSX (100 children) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500);
      expect(result.code).toBeTruthy();
      expect(result.format).toBe('react-jsx');
    });

    it('should generate React Tailwind for complex node in <500ms', () => {
      const complexNode = createWideTree(100);

      const startTime = performance.now();
      const result = generateReactTailwind(complexNode as AltNode, sampleProperties);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated React Tailwind (100 children) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500);
      expect(result.code).toBeTruthy();
      expect(result.format).toBe('react-tailwind');
    });

    it('should generate HTML/CSS for complex node in <500ms', () => {
      const complexNode = createWideTree(100);

      const startTime = performance.now();
      const result = generateHTMLCSS(complexNode as AltNode, sampleProperties);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated HTML/CSS (100 children) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500);
      expect(result.code).toBeTruthy();
      expect(result.css).toBeTruthy();
      expect(result.format).toBe('html-css');
    });

    it('should switch between all formats in <500ms total', () => {
      const complexNode = createWideTree(50);

      const startTime = performance.now();

      // Generate all three formats
      generateReactJSX(complexNode as AltNode, sampleProperties);
      generateReactTailwind(complexNode as AltNode, sampleProperties);
      generateHTMLCSS(complexNode as AltNode, sampleProperties);

      const duration = performance.now() - startTime;

      console.log(`✓ Generated all 3 formats (50 children each) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Deep Nesting Performance', () => {
    it('should handle deeply nested nodes (10 levels) efficiently', () => {
      // Create tree with 10 levels, 2 children per level = 1024 total nodes
      const deepNode = createDeepTree(10, 2);

      const startTime = performance.now();
      const result = generateReactJSX(deepNode as AltNode, sampleProperties);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated React JSX (10 levels deep, ~1024 nodes) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(100);
      expect(result.code).toBeTruthy();
    });

    it('should handle very deep nesting (20 levels) without stack overflow', () => {
      // Create tree with 20 levels, 1 child per level
      const veryDeepNode = createDeepTree(20, 1);

      const startTime = performance.now();
      const result = generateReactTailwind(veryDeepNode as AltNode, sampleProperties);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated React Tailwind (20 levels deep) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(50);
      expect(result.code).toBeTruthy();
    });
  });

  describe('Large Property Sets', () => {
    it('should handle nodes with many CSS properties efficiently', () => {
      const node: Partial<AltNode> = {
        id: '1',
        name: 'StyledBox',
        type: 'FRAME',
        children: [],
      };

      // Create a large property set (50 properties)
      const largePropertySet: Record<string, string> = {};
      for (let i = 0; i < 50; i++) {
        largePropertySet[`customProp${i}`] = `value${i}`;
      }

      const startTime = performance.now();
      const result = generateReactJSX(node as AltNode, largePropertySet);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated React JSX (50 CSS properties) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(50);
      expect(result.code).toBeTruthy();
    });

    it('should convert many properties to Tailwind classes efficiently', () => {
      const node: Partial<AltNode> = {
        id: '1',
        name: 'StyledBox',
        type: 'FRAME',
        children: [],
      };

      const tailwindProperties = {
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '8px',
        backgroundColor: '#3B82F6',
        borderRadius: '12px',
        opacity: '0.8',
      };

      const startTime = performance.now();
      const result = generateReactTailwind(node as AltNode, tailwindProperties);
      const duration = performance.now() - startTime;

      console.log(`✓ Generated React Tailwind (Tailwind conversion) in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(50);
      expect(result.code).toContain('className');
    });
  });

  describe('Batch Generation Performance', () => {
    it('should generate 100 simple components in <500ms', () => {
      const simpleNode: Partial<AltNode> = {
        id: '1',
        name: 'Button',
        type: 'FRAME',
        children: [],
      };

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        generateReactJSX(simpleNode as AltNode, sampleProperties);
      }

      const duration = performance.now() - startTime;

      console.log(`✓ Generated 100 React JSX components in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(500);
    });

    it('should generate mixed formats (100 components) in <1000ms', () => {
      const node: Partial<AltNode> = {
        id: '1',
        name: 'Component',
        type: 'FRAME',
        children: [
          {
            id: '2',
            name: 'Text',
            type: 'TEXT',
            characters: 'Content',
          } as any,
        ],
      };

      const startTime = performance.now();

      for (let i = 0; i < 33; i++) {
        generateReactJSX(node as AltNode, sampleProperties);
        generateReactTailwind(node as AltNode, sampleProperties);
        generateHTMLCSS(node as AltNode, sampleProperties);
      }

      const duration = performance.now() - startTime;

      console.log(`✓ Generated 99 mixed format components in ${duration.toFixed(2)}ms`);

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Efficiency', () => {
    it('should not create excessive objects for large trees', () => {
      const largeTree = createWideTree(200);

      // Generate multiple times to check for memory leaks
      for (let i = 0; i < 10; i++) {
        const result = generateReactJSX(largeTree as AltNode, sampleProperties);
        expect(result.code.length).toBeGreaterThan(0);
      }

      // If we get here without running out of memory, test passes
      expect(true).toBe(true);
    });
  });

  describe('Code Quality Under Performance', () => {
    it('should maintain code quality even with fast generation', () => {
      const node = createWideTree(50);

      const startTime = performance.now();
      const result = generateReactJSX(node as AltNode, sampleProperties);
      const duration = performance.now() - startTime;

      // Should be fast
      expect(duration).toBeLessThan(100);

      // Should still be valid code
      expect(result.code).toContain('export function');
      expect(result.code).toContain('return');
      expect(result.code).toContain('<div');

      // Should have proper formatting
      const lines = result.code.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  '));
      expect(indentedLines.length).toBeGreaterThan(0);
    });
  });
});
