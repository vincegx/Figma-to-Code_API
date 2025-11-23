/**
 * AltNode Transformation Engine Unit Tests
 *
 * Tests transformation from Figma JSON to normalized AltNode representation
 */

import { describe, it, expect } from 'vitest';
import {
  transformToAltNode,
  normalizeLayout,
  normalizeFills,
  normalizeStrokes,
  normalizeEffects,
  normalizeText,
  calculateZIndex,
  applyZIndexToChildren,
  detectMultiStyleText,
} from '@/lib/altnode-transform';
import type { FigmaNode } from '@/lib/types/figma';
import type { AltNode, CSSProperties } from '@/lib/types/altnode';

describe('AltNode Transformation', () => {
  describe('transformToAltNode', () => {
    it('should transform basic FRAME node', () => {
      const figmaNode: FigmaNode = {
        id: '1:2',
        name: 'Test Frame',
        type: 'FRAME',
      };

      const altNode = transformToAltNode(figmaNode);

      expect(altNode.id).toBe('1:2');
      expect(altNode.name).toBe('Test Frame');
      expect(altNode.type).toBe('container');
      expect(altNode.styles).toBeDefined();
      expect(altNode.figmaProperties).toBeDefined();
    });

    it('should transform TEXT node to text type', () => {
      const figmaNode: FigmaNode = {
        id: '1:3',
        name: 'Button Label',
        type: 'TEXT',
        characters: 'Click me',
        fontSize: 16,
        fontFamily: 'Inter',
      };

      const altNode = transformToAltNode(figmaNode);

      expect(altNode.type).toBe('text');
      expect(altNode.styles.fontSize).toBe('16px');
      expect(altNode.styles.fontFamily).toBe("'Inter', sans-serif");
    });

    it('should transform node with children recursively', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Parent',
        type: 'FRAME',
        children: [
          {
            id: '1:2',
            name: 'Child 1',
            type: 'FRAME',
          },
          {
            id: '1:3',
            name: 'Child 2',
            type: 'TEXT',
            characters: 'Text',
          },
        ],
      };

      const altNode = transformToAltNode(figmaNode);

      expect(altNode.children).toHaveLength(2);
      expect(altNode.children?.[0].id).toBe('1:2');
      expect(altNode.children?.[1].id).toBe('1:3');
      expect(altNode.children?.[1].type).toBe('text');
    });
  });

  describe('normalizeLayout', () => {
    it('should convert HORIZONTAL layout to flexbox row', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Horizontal Container',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        itemSpacing: 16,
      };

      const styles: CSSProperties = {};
      normalizeLayout(figmaNode, styles);

      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('row');
      expect(styles.gap).toBe('16px');
    });

    it('should convert VERTICAL layout to flexbox column', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Vertical Container',
        type: 'FRAME',
        layoutMode: 'VERTICAL',
        itemSpacing: 8,
      };

      const styles: CSSProperties = {};
      normalizeLayout(figmaNode, styles);

      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('column');
      expect(styles.gap).toBe('8px');
    });

    it('should handle layout without itemSpacing', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Container',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
      };

      const styles: CSSProperties = {};
      normalizeLayout(figmaNode, styles);

      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('row');
      expect(styles.gap).toBeUndefined();
    });

    it('should not set layout for nodes without layoutMode', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Simple Frame',
        type: 'FRAME',
      };

      const styles: CSSProperties = {};
      normalizeLayout(figmaNode, styles);

      expect(styles.display).toBeUndefined();
      expect(styles.flexDirection).toBeUndefined();
    });
  });

  describe('normalizeFills', () => {
    it('should convert SOLID fill to hex background', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Colored Frame',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0, a: 1 },
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeFills(figmaNode, styles);

      expect(styles.background).toBe('#FF0000');
    });

    it('should convert SOLID fill with opacity to rgba', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Semi-transparent Frame',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            color: { r: 0, g: 0.5, b: 1, a: 1 },
            opacity: 0.5,
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeFills(figmaNode, styles);

      expect(styles.background).toMatch(/^rgba\(0, 128, 255, 0\.50\)$/);
    });

    it('should handle empty fills array', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'No Fill Frame',
        type: 'FRAME',
        fills: [],
      };

      const styles: CSSProperties = {};
      normalizeFills(figmaNode, styles);

      expect(styles.background).toBeUndefined();
    });

    it('should handle node without fills', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
      };

      const styles: CSSProperties = {};
      normalizeFills(figmaNode, styles);

      expect(styles.background).toBeUndefined();
    });
  });

  describe('normalizeStrokes', () => {
    it('should convert stroke to border', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Bordered Frame',
        type: 'FRAME',
        strokes: [
          {
            type: 'SOLID',
            color: { r: 0, g: 0, b: 0, a: 1 },
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeStrokes(figmaNode, styles);

      expect(styles.border).toBe('1px solid #000000');
    });

    it('should handle stroke with opacity', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        strokes: [
          {
            type: 'SOLID',
            color: { r: 1, g: 0, b: 0, a: 1 },
            opacity: 0.5,
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeStrokes(figmaNode, styles);

      expect(styles.border).toMatch(/^1px solid rgba\(255, 0, 0, 0\.50\)$/);
    });

    it('should handle empty strokes array', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        strokes: [],
      };

      const styles: CSSProperties = {};
      normalizeStrokes(figmaNode, styles);

      expect(styles.border).toBeUndefined();
    });
  });

  describe('normalizeEffects', () => {
    it('should convert DROP_SHADOW to box-shadow', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Shadowed Frame',
        type: 'FRAME',
        effects: [
          {
            type: 'DROP_SHADOW',
            offset: { x: 2, y: 2 },
            radius: 4,
            color: { r: 0, g: 0, b: 0, a: 0.1 },
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeEffects(figmaNode, styles);

      expect(styles.boxShadow).toMatch(/^2px 2px 4px rgba\(0, 0, 0, 0\.10\)$/);
    });

    it('should combine multiple shadows', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        effects: [
          {
            type: 'DROP_SHADOW',
            offset: { x: 0, y: 1 },
            radius: 2,
            color: { r: 0, g: 0, b: 0, a: 0.1 },
          },
          {
            type: 'DROP_SHADOW',
            offset: { x: 0, y: 2 },
            radius: 4,
            color: { r: 0, g: 0, b: 0, a: 0.05 },
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeEffects(figmaNode, styles);

      expect(styles.boxShadow).toContain(',');
      expect(styles.boxShadow).toMatch(/0px 1px 2px.*0px 2px 4px/);
    });

    it('should ignore non-DROP_SHADOW effects', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        effects: [
          {
            type: 'LAYER_BLUR',
            radius: 4,
          },
        ],
      };

      const styles: CSSProperties = {};
      normalizeEffects(figmaNode, styles);

      expect(styles.boxShadow).toBeUndefined();
    });
  });

  describe('normalizeText', () => {
    it('should convert text properties to CSS', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Text Node',
        type: 'TEXT',
        fontSize: 16,
        fontFamily: 'Inter',
        characters: 'Hello World',
      };

      const styles: CSSProperties = {};
      normalizeText(figmaNode, styles);

      expect(styles.fontSize).toBe('16px');
      expect(styles.fontFamily).toBe("'Inter', sans-serif");
    });

    it('should handle text node without font properties', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Text Node',
        type: 'TEXT',
        characters: 'Text',
      };

      const styles: CSSProperties = {};
      normalizeText(figmaNode, styles);

      expect(styles.fontSize).toBeUndefined();
      expect(styles.fontFamily).toBeUndefined();
    });

    it('should not process non-TEXT nodes', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
      };

      const styles: CSSProperties = {};
      normalizeText(figmaNode, styles);

      expect(styles.fontSize).toBeUndefined();
      expect(styles.fontFamily).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    describe('calculateZIndex', () => {
      it('should calculate z-index from node position', () => {
        expect(calculateZIndex(0, 3)).toBe(1);
        expect(calculateZIndex(1, 3)).toBe(2);
        expect(calculateZIndex(2, 3)).toBe(3);
      });
    });

    describe('applyZIndexToChildren', () => {
      it('should apply z-index to absolutely positioned children', () => {
        const children: AltNode[] = [
          {
            id: '1:1',
            name: 'Child 1',
            type: 'container',
            styles: { position: 'absolute' },
          },
          {
            id: '1:2',
            name: 'Child 2',
            type: 'container',
            styles: { position: 'absolute' },
          },
        ];

        const result = applyZIndexToChildren(children);

        expect(result[0].styles.zIndex).toBe(1);
        expect(result[1].styles.zIndex).toBe(2);
      });

      it('should not apply z-index if no absolute positioning', () => {
        const children: AltNode[] = [
          {
            id: '1:1',
            name: 'Child 1',
            type: 'container',
            styles: {},
          },
          {
            id: '1:2',
            name: 'Child 2',
            type: 'container',
            styles: {},
          },
        ];

        const result = applyZIndexToChildren(children);

        expect(result[0].styles.zIndex).toBeUndefined();
        expect(result[1].styles.zIndex).toBeUndefined();
      });
    });

    describe('detectMultiStyleText', () => {
      it('should detect TEXT nodes', () => {
        const figmaNode: FigmaNode = {
          id: '1:1',
          name: 'Text',
          type: 'TEXT',
          characters: 'Hello World',
        };

        const result = detectMultiStyleText(figmaNode);

        expect(result.characterCount).toBe(11);
        expect(result.hasMultipleStyles).toBe(false);
      });

      it('should return zeros for non-TEXT nodes', () => {
        const figmaNode: FigmaNode = {
          id: '1:1',
          name: 'Frame',
          type: 'FRAME',
        };

        const result = detectMultiStyleText(figmaNode);

        expect(result.characterCount).toBe(0);
        expect(result.hasMultipleStyles).toBe(false);
      });
    });
  });

  describe('Complex Transformations', () => {
    it('should transform complete component with all features', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Primary Button',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        itemSpacing: 8,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 8,
        paddingBottom: 8,
        fills: [
          {
            type: 'SOLID',
            color: { r: 0.2, g: 0.4, b: 1, a: 1 },
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
        absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
        children: [
          {
            id: '1:2',
            name: 'Label',
            type: 'TEXT',
            characters: 'Click me',
            fontSize: 14,
            fontFamily: 'Inter',
          },
        ],
      };

      const altNode = transformToAltNode(figmaNode);

      // Check layout
      expect(altNode.styles.display).toBe('flex');
      expect(altNode.styles.flexDirection).toBe('row');
      expect(altNode.styles.gap).toBe('8px');

      // Check padding
      expect(altNode.styles.padding).toBe('8px 16px');

      // Check background
      expect(altNode.styles.background).toMatch(/^#[0-9A-F]{6}$/);

      // Check shadow
      expect(altNode.styles.boxShadow).toBeDefined();

      // Check dimensions
      expect(altNode.styles.width).toBe('120px');
      expect(altNode.styles.height).toBe('40px');

      // Check children
      expect(altNode.children).toHaveLength(1);
      expect(altNode.children?.[0].type).toBe('text');
      expect(altNode.children?.[0].styles.fontSize).toBe('14px');
    });
  });
});
