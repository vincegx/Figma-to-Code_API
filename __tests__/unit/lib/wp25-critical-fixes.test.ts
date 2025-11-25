/**
 * WP25 Critical Fixes - Validation Tests
 * T186: Comprehensive tests for all critical bug fixes
 */

import { describe, it, expect } from 'vitest';
import { selectorMatches } from '../../../lib/rule-engine';
import { transformToAltNode, resetNameCounters, SimpleAltNode } from '../../../lib/altnode-transform';
import { generateHTMLCSS } from '../../../lib/code-generators/html-css';
import { generateReactTailwind } from '../../../lib/code-generators/react-tailwind';
import { generateReactJSX } from '../../../lib/code-generators/react';
import { extractCSSVariables, extractSVGContent, extractImageURL } from '../../../lib/code-generators/helpers';
import type { FigmaNode } from '../../../lib/types/figma';
import type { Selector } from '../../../lib/types/rules';

describe('WP25: Critical Code Generation Fixes', () => {
  describe('T176: Dynamic selector validation', () => {
    it('should reject nodes when selector has properties node lacks', () => {
      const node: SimpleAltNode = {
        id: '1',
        name: 'Button',
        uniqueName: 'Button',
        type: 'div',
        originalType: 'FRAME',
        styles: {},
        children: [],
        originalNode: {
          id: '1',
          name: 'Button',
          type: 'FRAME',
          visible: true,
        } as FigmaNode,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const selector: Selector = {
        type: 'FRAME',
        layoutMode: 'HORIZONTAL', // Node doesn't have this property
      };

      const matches = selectorMatches(node, selector);
      expect(matches).toBe(false); // Should NOT match - missing property
    });

    it('should match when all selector properties are present and correct', () => {
      const node: SimpleAltNode = {
        id: '2',
        name: 'Container',
        uniqueName: 'Container',
        type: 'div',
        originalType: 'FRAME',
        styles: {},
        children: [],
        originalNode: {
          id: '2',
          name: 'Container',
          type: 'FRAME',
          visible: true,
          layoutMode: 'HORIZONTAL',
          paddingLeft: 16,
        } as any,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const selector: Selector = {
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        paddingLeft: 16,
      };

      const matches = selectorMatches(node, selector);
      expect(matches).toBe(true); // Should match - all properties present
    });

    it('should support array-type selectors for property values', () => {
      const node: SimpleAltNode = {
        id: '3',
        name: 'Icon',
        uniqueName: 'Icon',
        type: 'svg',
        originalType: 'VECTOR',
        styles: {},
        children: [],
        originalNode: {
          id: '3',
          name: 'Icon',
          type: 'VECTOR',
          visible: true,
          blendMode: 'PASS_THROUGH',
        } as any,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const selector: Selector = {
        blendMode: ['PASS_THROUGH', 'NORMAL'], // Array of acceptable values
      };

      const matches = selectorMatches(node, selector);
      expect(matches).toBe(true); // Should match - blendMode is in array
    });
  });

  describe('T177: Preserve originalType for TEXT detection', () => {
    beforeEach(() => {
      resetNameCounters();
    });

    it('should preserve originalType field in SimpleAltNode', () => {
      const figmaNode: FigmaNode = {
        id: '4',
        name: 'Heading',
        type: 'TEXT',
        visible: true,
      };

      const altNode = transformToAltNode(figmaNode);
      expect(altNode).not.toBeNull();
      expect(altNode!.originalType).toBe('TEXT'); // Should preserve Figma type
      expect(altNode!.type).toBe('span'); // HTML tag
    });

    it('should use originalType for TEXT detection in code generation', () => {
      const textNode: SimpleAltNode = {
        id: '5',
        name: 'Title',
        uniqueName: 'Title',
        type: 'span', // HTML tag
        originalType: 'TEXT', // Figma type
        styles: {},
        children: [],
        originalNode: {
          id: '5',
          name: 'Title',
          type: 'TEXT',
          visible: true,
          characters: 'Hello World',
        } as any,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const htmlCode = generateHTMLCSS(textNode, []);
      expect(htmlCode.code).toContain('Hello World'); // Should extract text content
      expect(htmlCode.code).toContain('<span'); // Should use correct tag
    });
  });

  describe('T178: data-layer attributes', () => {
    it('should add data-layer attribute to all elements', () => {
      const node: SimpleAltNode = {
        id: '6',
        name: 'Button/Primary',
        uniqueName: 'ButtonPrimary',
        type: 'div',
        originalType: 'FRAME',
        styles: {},
        children: [],
        originalNode: {
          id: '6',
          name: 'Button/Primary',
          type: 'FRAME',
          visible: true,
        } as FigmaNode,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const htmlCode = generateHTMLCSS(node, []);
      expect(htmlCode.code).toContain('data-layer="Button/Primary"');
    });
  });

  describe('T179: PascalCase class naming', () => {
    it('should generate PascalCase class names instead of kebab-case', () => {
      const node: SimpleAltNode = {
        id: '7',
        name: 'button-primary',
        uniqueName: 'ButtonPrimary',
        type: 'div',
        originalType: 'FRAME',
        styles: {},
        children: [],
        originalNode: {
          id: '7',
          name: 'button-primary',
          type: 'FRAME',
          visible: true,
        } as FigmaNode,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const htmlCode = generateHTMLCSS(node, []);
      expect(htmlCode.code).toContain('class="ButtonPrimary"'); // PascalCase, not kebab-case
      expect(htmlCode.code).not.toContain('button-primary'); // Old format should not appear
    });
  });

  describe('T180: Component properties as data-* attributes', () => {
    it('should extract component properties as data-* attributes', () => {
      const node: SimpleAltNode = {
        id: '8',
        name: 'Button',
        uniqueName: 'Button',
        type: 'div',
        originalType: 'INSTANCE',
        styles: {},
        children: [],
        originalNode: {
          id: '8',
          name: 'Button',
          type: 'INSTANCE',
          visible: true,
          componentProperties: {
            variant: { value: 'primary' },
            size: { value: 'large' },
          },
        } as any,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const htmlCode = generateHTMLCSS(node, []);
      expect(htmlCode.code).toContain('data-variant="primary"');
      expect(htmlCode.code).toContain('data-size="large"');
    });
  });

  describe('T184: Expanded Tailwind mapping', () => {
    it('should map width/height to Tailwind classes', () => {
      const node: SimpleAltNode = {
        id: '9',
        name: 'Box',
        uniqueName: 'Box',
        type: 'div',
        originalType: 'FRAME',
        styles: {
          width: '64px',
          height: '32px',
        },
        children: [],
        originalNode: {
          id: '9',
          name: 'Box',
          type: 'FRAME',
          visible: true,
        } as FigmaNode,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const tailwindCode = generateReactTailwind(node, []);
      expect(tailwindCode.code).toContain('w-16'); // 64px → w-16
      expect(tailwindCode.code).toContain('h-8');  // 32px → h-8
    });

    it('should map flexbox properties to Tailwind classes', () => {
      const node: SimpleAltNode = {
        id: '10',
        name: 'Flex',
        uniqueName: 'Flex',
        type: 'div',
        originalType: 'FRAME',
        styles: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: 'row',
        },
        children: [],
        originalNode: {
          id: '10',
          name: 'Flex',
          type: 'FRAME',
          visible: true,
        } as FigmaNode,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const tailwindCode = generateReactTailwind(node, []);
      expect(tailwindCode.code).toContain('flex');
      expect(tailwindCode.code).toContain('items-center');
      expect(tailwindCode.code).toContain('justify-between');
      expect(tailwindCode.code).toContain('flex-row');
    });

    it('should map typography to Tailwind classes', () => {
      const node: SimpleAltNode = {
        id: '11',
        name: 'Text',
        uniqueName: 'Text',
        type: 'span',
        originalType: 'TEXT',
        styles: {
          fontSize: '16px',
          fontWeight: '700',
          textAlign: 'center',
        },
        children: [],
        originalNode: {
          id: '11',
          name: 'Text',
          type: 'TEXT',
          visible: true,
          characters: 'Hello',
        } as any,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const tailwindCode = generateReactTailwind(node, []);
      expect(tailwindCode.code).toContain('text-4'); // 16px → text-4
      expect(tailwindCode.code).toContain('font-bold');
      expect(tailwindCode.code).toContain('text-center');
    });
  });

  describe('T185: Preserve line breaks in text', () => {
    it('should convert newlines to <br/> tags in HTML', () => {
      const node: SimpleAltNode = {
        id: '12',
        name: 'MultiLineText',
        uniqueName: 'MultiLineText',
        type: 'span',
        originalType: 'TEXT',
        styles: {},
        children: [],
        originalNode: {
          id: '12',
          name: 'MultiLineText',
          type: 'TEXT',
          visible: true,
          characters: 'Line 1\nLine 2\n\nLine 4',
        } as any,
        visible: true,
        canBeFlattened: false,
        cumulativeRotation: 0,
      };

      const htmlCode = generateHTMLCSS(node, []);
      expect(htmlCode.code).toContain('Line 1<br/>Line 2<br/><br/>Line 4');
    });
  });

  describe('Stub implementations', () => {
    it('T181: extractCSSVariables should return empty object (stub)', () => {
      const result = extractCSSVariables({});
      expect(result).toEqual({});
    });

    it('T182: extractSVGContent should return null (stub)', () => {
      const result = extractSVGContent({});
      expect(result).toBeNull();
    });

    it('T183: extractImageURL should return null (stub)', () => {
      const result = extractImageURL({});
      expect(result).toBeNull();
    });
  });
});
