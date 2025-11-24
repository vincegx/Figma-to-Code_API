// @ts-nocheck - Test file uses partial mock objects for simplicity
import { describe, it, expect, beforeEach } from 'vitest';
import { transformToAltNode, resetNameCounters } from '../../../lib/altnode-transform';
import type { FigmaNode } from '../../../lib/types/figma';

describe('AltNode Transformation Engine', () => {
  beforeEach(() => {
    // Reset name counters between tests
    resetNameCounters();
  });

  describe('CRITICAL: Invisible node filtering', () => {
    it('should filter out invisible nodes', () => {
      const invisibleNode: FigmaNode = {
        id: '1:1',
        name: 'InvisibleFrame',
        type: 'FRAME',
        visible: false,
        children: [],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(invisibleNode);
      expect(result).toBeNull();
    });

    it('should include visible nodes', () => {
      const visibleNode: FigmaNode = {
        id: '1:2',
        name: 'VisibleFrame',
        type: 'FRAME',
        visible: true,
        children: [],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(visibleNode);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('VisibleFrame');
    });

    it('should filter invisible children from parent', () => {
      const parentWithMixedChildren: FigmaNode = {
        id: '1:3',
        name: 'Parent',
        type: 'FRAME',
        visible: true,
        children: [
          {
            id: '1:4',
            name: 'VisibleChild',
            type: 'FRAME',
            visible: true,
            absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
          },
          {
            id: '1:5',
            name: 'InvisibleChild',
            type: 'FRAME',
            visible: false,
            absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(parentWithMixedChildren);
      expect(result?.children).toHaveLength(1);
      expect(result?.children[0].name).toBe('VisibleChild');
    });
  });

  describe('CRITICAL: GROUP node inlining', () => {
    it('should inline single-child GROUP nodes', () => {
      const groupWithOneChild: FigmaNode = {
        id: '2:1',
        name: 'GroupWrapper',
        type: 'GROUP',
        children: [
          {
            id: '2:2',
            name: 'ActualContent',
            type: 'FRAME',
            absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(groupWithOneChild);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('ActualContent'); // Child promoted, not wrapper
      expect(result?.type).toBe('div'); // FRAME → div
    });

    it('should skip empty GROUP nodes entirely', () => {
      const emptyGroup: FigmaNode = {
        id: '2:3',
        name: 'EmptyGroup',
        type: 'GROUP',
        children: [],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(emptyGroup);
      expect(result).toBeNull();
    });

    it('should create container for multi-child GROUP', () => {
      const groupWithMultipleChildren: FigmaNode = {
        id: '2:4',
        name: 'MultiGroup',
        type: 'GROUP',
        children: [
          {
            id: '2:5',
            name: 'Child1',
            type: 'FRAME',
            absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
          },
          {
            id: '2:6',
            name: 'Child2',
            type: 'FRAME',
            absoluteBoundingBox: { x: 50, y: 0, width: 50, height: 50 },
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(groupWithMultipleChildren);
      expect(result).not.toBeNull();
      expect(result?.children).toHaveLength(2);
      expect(result?.name).toBe('MultiGroup');
    });
  });

  describe('CRITICAL: Unique name generation', () => {
    it('should generate unique names with suffix counters', () => {
      const createButton = (id: string): FigmaNode => ({
        id,
        name: 'Button',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 40 },
      });

      const button1 = transformToAltNode(createButton('3:1'));
      const button2 = transformToAltNode(createButton('3:2'));
      const button3 = transformToAltNode(createButton('3:3'));

      expect(button1?.uniqueName).toBe('Button');
      expect(button2?.uniqueName).toBe('Button_01');
      expect(button3?.uniqueName).toBe('Button_02');
    });

    it('should sanitize names with special characters', () => {
      const nodeWithSpecialChars: FigmaNode = {
        id: '3:4',
        name: 'My Button (Primary)!',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 40 },
      };

      const result = transformToAltNode(nodeWithSpecialChars);
      expect(result?.uniqueName).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*$/); // Valid JS identifier
    });

    it('should handle names starting with numbers', () => {
      const nodeStartingWithNumber: FigmaNode = {
        id: '3:5',
        name: '404Error',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 40 },
      };

      const result = transformToAltNode(nodeStartingWithNumber);
      expect(result?.uniqueName).toMatch(/^Component/); // Prefixed
    });
  });

  describe('CRITICAL: originalNode preservation', () => {
    it('should preserve complete Figma node data', () => {
      const complexNode: FigmaNode = {
        id: '4:1',
        name: 'ComplexFrame',
        type: 'FRAME',
        rotation: 45,
        opacity: 0.8,
        blendMode: 'MULTIPLY',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            radius: 10,
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(complexNode);
      expect(result?.originalNode).toEqual(complexNode);
      expect(result?.originalNode.rotation).toBe(45);
      expect(result?.originalNode.opacity).toBe(0.8);
      expect(result?.originalNode.blendMode).toBe('MULTIPLY');
    });
  });

  describe('Layout normalization', () => {
    it('should convert HORIZONTAL auto-layout to flexbox', () => {
      const horizontalLayout: FigmaNode = {
        id: '5:1',
        name: 'HorizontalRow',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        primaryAxisAlignItems: 'MIN',
        counterAxisAlignItems: 'CENTER',
        itemSpacing: 16,
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 10,
        paddingBottom: 10,
        absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 60 },
      };

      const result = transformToAltNode(horizontalLayout);
      expect(result?.styles.display).toBe('flex');
      expect(result?.styles.flexDirection).toBe('row');
      expect(result?.styles.justifyContent).toBe('flex-start');
      expect(result?.styles.alignItems).toBe('center');
      expect(result?.styles.gap).toBe('16px');
      expect(result?.styles.padding).toBe('10px 20px');
    });

    it('should convert VERTICAL auto-layout to flexbox', () => {
      const verticalLayout: FigmaNode = {
        id: '5:2',
        name: 'VerticalColumn',
        type: 'FRAME',
        layoutMode: 'VERTICAL',
        primaryAxisAlignItems: 'SPACE_BETWEEN',
        counterAxisAlignItems: 'MAX',
        itemSpacing: 8,
        absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 400 },
      };

      const result = transformToAltNode(verticalLayout);
      expect(result?.styles.display).toBe('flex');
      expect(result?.styles.flexDirection).toBe('column');
      expect(result?.styles.justifyContent).toBe('space-between');
      expect(result?.styles.alignItems).toBe('flex-end');
      expect(result?.styles.gap).toBe('8px');
    });

    it('should handle layoutWrap for wrapping layouts', () => {
      const wrappingLayout: FigmaNode = {
        id: '5:3',
        name: 'WrappingGrid',
        type: 'FRAME',
        layoutMode: 'HORIZONTAL',
        layoutWrap: 'WRAP',
        absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 200 },
      };

      const result = transformToAltNode(wrappingLayout);
      expect(result?.styles.flexWrap).toBe('wrap');
    });
  });

  describe('Fill normalization', () => {
    it('should convert solid fills to CSS background', () => {
      const solidFillNode: FigmaNode = {
        id: '6:1',
        name: 'SolidBox',
        type: 'FRAME',
        fills: [
          {
            type: 'SOLID',
            visible: true,
            opacity: 1,
            color: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(solidFillNode);
      expect(result?.styles.background).toMatch(/^rgba?\(/);
      expect(result?.styles.background).toContain('51'); // r: 0.2 * 255 ≈ 51
      expect(result?.styles.background).toContain('102'); // g: 0.4 * 255 ≈ 102
      expect(result?.styles.background).toContain('204'); // b: 0.8 * 255 ≈ 204
    });

    it('should convert linear gradients to CSS', () => {
      const gradientNode: FigmaNode = {
        id: '6:2',
        name: 'GradientBox',
        type: 'FRAME',
        fills: [
          {
            type: 'GRADIENT_LINEAR',
            visible: true,
            opacity: 1,
            gradientHandlePositions: [
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
            gradientStops: [
              { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
              { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
            ],
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(gradientNode);
      expect(result?.styles.background).toContain('linear-gradient');
    });

    it('should handle image fills', () => {
      const imageNode: FigmaNode = {
        id: '6:3',
        name: 'ImageBox',
        type: 'FRAME',
        fills: [
          {
            type: 'IMAGE',
            visible: true,
            opacity: 1,
            scaleMode: 'FILL',
            imageRef: 'abc123',
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 150 },
      };

      const result = transformToAltNode(imageNode);
      expect(result?.styles.backgroundImage).toContain('url(');
      expect(result?.styles.backgroundSize).toBe('cover');
    });
  });

  describe('Stroke normalization', () => {
    it('should convert strokes to CSS border', () => {
      const strokedNode: FigmaNode = {
        id: '7:1',
        name: 'StrokedBox',
        type: 'FRAME',
        strokes: [
          {
            type: 'SOLID',
            visible: true,
            opacity: 1,
            color: { r: 0, g: 0, b: 0, a: 1 },
            blendMode: 'NORMAL',
          },
        ],
        strokeWeight: 2,
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(strokedNode);
      expect(result?.styles.border).toContain('2px solid');
    });

    it('should apply border radius', () => {
      const roundedNode: FigmaNode = {
        id: '7:2',
        name: 'RoundedBox',
        type: 'FRAME',
        cornerRadius: 8,
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(roundedNode);
      expect(result?.styles.borderRadius).toBe('8px');
    });

    it('should handle individual corner radii', () => {
      const customRoundedNode: FigmaNode = {
        id: '7:3',
        name: 'CustomRoundedBox',
        type: 'FRAME',
        rectangleCornerRadii: [10, 5, 0, 15],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(customRoundedNode);
      expect(result?.styles.borderRadius).toBe('10px 5px 0px 15px');
    });
  });

  describe('Effect normalization', () => {
    it('should convert drop shadows to box-shadow', () => {
      const shadowNode: FigmaNode = {
        id: '8:1',
        name: 'ShadowBox',
        type: 'FRAME',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            radius: 10,
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(shadowNode);
      expect(result?.styles.boxShadow).toContain('0px 4px 10px');
    });

    it('should handle multiple shadows', () => {
      const multiShadowNode: FigmaNode = {
        id: '8:2',
        name: 'MultiShadowBox',
        type: 'FRAME',
        effects: [
          {
            type: 'DROP_SHADOW',
            visible: true,
            radius: 4,
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 2 },
            blendMode: 'NORMAL',
          },
          {
            type: 'DROP_SHADOW',
            visible: true,
            radius: 8,
            color: { r: 0, g: 0, b: 0, a: 0.2 },
            offset: { x: 0, y: 4 },
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(multiShadowNode);
      expect(result?.styles.boxShadow).toContain(','); // Multiple shadows separated by comma
    });

    it('should convert inner shadows with inset', () => {
      const innerShadowNode: FigmaNode = {
        id: '8:3',
        name: 'InnerShadowBox',
        type: 'FRAME',
        effects: [
          {
            type: 'INNER_SHADOW',
            visible: true,
            radius: 5,
            color: { r: 0, g: 0, b: 0, a: 0.15 },
            offset: { x: 0, y: 2 },
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(innerShadowNode);
      expect(result?.styles.boxShadow).toContain('inset');
    });
  });

  describe('Text normalization', () => {
    it('should convert text properties to CSS font styles', () => {
      const textNode: FigmaNode = {
        id: '9:1',
        name: 'Heading',
        type: 'TEXT',
        characters: 'Hello World',
        style: {
          fontFamily: 'Inter',
          fontSize: 24,
          fontWeight: 700,
          lineHeightPx: 32,
          textAlignHorizontal: 'CENTER',
          letterSpacing: 0.5,
        },
        fills: [
          {
            type: 'SOLID',
            visible: true,
            opacity: 1,
            color: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
            blendMode: 'NORMAL',
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 200, height: 32 },
      };

      const result = transformToAltNode(textNode);
      expect(result?.styles.fontFamily).toBe('Inter');
      expect(result?.styles.fontSize).toBe('24px');
      expect(result?.styles.fontWeight).toBe('700');
      expect(result?.styles.lineHeight).toBe('32px');
      expect(result?.styles.textAlign).toBe('center');
      expect(result?.styles.letterSpacing).toBe('0.5px');
    });

    it('should handle text decorations', () => {
      const decoratedTextNode: FigmaNode = {
        id: '9:2',
        name: 'DecoratedText',
        type: 'TEXT',
        characters: 'Decorated',
        style: {
          fontFamily: 'Arial',
          fontSize: 16,
          fontWeight: 400,
          textDecoration: 'UNDERLINE',
        },
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 20 },
      };

      const result = transformToAltNode(decoratedTextNode);
      expect(result?.styles.textDecoration).toBe('underline');
    });

    it('should handle text transformations', () => {
      const upperCaseNode: FigmaNode = {
        id: '9:3',
        name: 'UpperCase',
        type: 'TEXT',
        characters: 'uppercase',
        style: {
          fontFamily: 'Arial',
          fontSize: 14,
          fontWeight: 400,
          textCase: 'UPPER',
        },
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 20 },
      };

      const result = transformToAltNode(upperCaseNode);
      expect(result?.styles.textTransform).toBe('uppercase');
    });
  });

  describe('HIGH: Icon detection', () => {
    it('should detect VECTOR nodes as icons', () => {
      const vectorIcon: FigmaNode = {
        id: '10:1',
        name: 'Icon',
        type: 'VECTOR',
        absoluteBoundingBox: { x: 0, y: 0, width: 24, height: 24 },
      };

      const result = transformToAltNode(vectorIcon);
      expect(result?.isIcon).toBe(true);
    });

    it('should detect small nodes with exports as icons', () => {
      const exportedSmallNode: FigmaNode = {
        id: '10:2',
        name: 'SmallIcon',
        type: 'FRAME',
        exportSettings: [{ format: 'SVG', suffix: '' }],
        absoluteBoundingBox: { x: 0, y: 0, width: 32, height: 32 },
      };

      const result = transformToAltNode(exportedSmallNode);
      expect(result?.isIcon).toBe(true);
    });

    it('should not mark large frames as icons', () => {
      const largeFrame: FigmaNode = {
        id: '10:3',
        name: 'LargeFrame',
        type: 'FRAME',
        absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 200 },
      };

      const result = transformToAltNode(largeFrame);
      expect(result?.isIcon).toBeFalsy();
    });
  });

  describe('HIGH: Rotation handling', () => {
    it('should convert rotation from radians to degrees', () => {
      const rotatedNode: FigmaNode = {
        id: '11:1',
        name: 'RotatedBox',
        type: 'FRAME',
        rotation: Math.PI / 4, // 45 degrees in radians
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(rotatedNode);
      expect(result?.styles.transform).toContain('rotate(');
      expect(result?.styles.transform).toContain('45deg');
    });

    it('should track cumulative rotation through tree', () => {
      const parentRotation = Math.PI / 6; // 30 degrees
      const childRotation = Math.PI / 6; // 30 degrees

      const parentNode: FigmaNode = {
        id: '11:2',
        name: 'Parent',
        type: 'FRAME',
        rotation: parentRotation,
        children: [
          {
            id: '11:3',
            name: 'Child',
            type: 'FRAME',
            rotation: childRotation,
            absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(parentNode);
      expect(result?.children[0].cumulativeRotation).toBeCloseTo(-60, 1); // 30 + 30 = 60 degrees
    });
  });

  describe('Performance', () => {
    it('should transform 100-node tree in under 50ms', () => {
      // Create a tree with 100 nodes (10 children per level, 2 levels deep)
      const createNode = (id: number, depth: number): any => {
        const node: any = {
          id: `node-${id}`,
          name: `Node${id}`,
          type: 'FRAME',
          layoutMode: 'VERTICAL',
          itemSpacing: 8,
          fills: [
            {
              type: 'SOLID',
              visible: true,
              opacity: 1,
              color: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
            },
          ],
          absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
          children: [],
        };

        if (depth > 0) {
          for (let i = 0; i < 10; i++) {
            node.children.push(createNode(id * 10 + i, depth - 1));
          }
        }

        return node;
      };

      const largeTree: FigmaNode = createNode(1, 2); // 1 + 10 + 100 = 111 nodes

      const startTime = performance.now();
      const result = transformToAltNode(largeTree);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result).not.toBeNull();
      expect(duration).toBeLessThan(50); // Should complete in under 50ms
    });
  });

  describe('Complex integration scenarios', () => {
    it('should handle deeply nested component trees', () => {
      const complexTree: FigmaNode = {
        id: '12:1',
        name: 'Page',
        type: 'FRAME',
        layoutMode: 'VERTICAL',
        children: [
          {
            id: '12:2',
            name: 'Header',
            type: 'FRAME',
            layoutMode: 'HORIZONTAL',
            children: [
              {
                id: '12:3',
                name: 'Logo',
                type: 'VECTOR',
                absoluteBoundingBox: { x: 0, y: 0, width: 40, height: 40 },
              },
              {
                id: '12:4',
                name: 'Nav',
                type: 'FRAME',
                layoutMode: 'HORIZONTAL',
                itemSpacing: 16,
                children: [
                  {
                    id: '12:5',
                    name: 'NavItem',
                    type: 'TEXT',
                    characters: 'Home',
                    absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 20 },
                  },
                  {
                    id: '12:6',
                    name: 'NavItem',
                    type: 'TEXT',
                    characters: 'About',
                    absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 20 },
                  },
                ],
                absoluteBoundingBox: { x: 0, y: 0, width: 116, height: 20 },
              },
            ],
            absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 60 },
          },
          {
            id: '12:7',
            name: 'Content',
            type: 'FRAME',
            visible: true,
            absoluteBoundingBox: { x: 0, y: 60, width: 300, height: 400 },
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 300, height: 500 },
      };

      const result = transformToAltNode(complexTree);
      expect(result).not.toBeNull();
      expect(result?.children).toHaveLength(2); // Header + Content
      expect(result?.children[0].children).toHaveLength(2); // Logo + Nav
      expect(result?.children[0].children[1].children).toHaveLength(2); // NavItem x2

      // Check unique names
      const navItems = result?.children[0].children[1].children || [];
      expect(navItems[0].uniqueName).toBe('NavItem');
      expect(navItems[1].uniqueName).toBe('NavItem_01');
    });

    it('should handle mixed visibility and GROUP inlining', () => {
      const mixedTree: FigmaNode = {
        id: '13:1',
        name: 'Container',
        type: 'FRAME',
        children: [
          {
            id: '13:2',
            name: 'VisibleGroup',
            type: 'GROUP',
            children: [
              {
                id: '13:3',
                name: 'OnlyChild',
                type: 'FRAME',
                absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
              },
            ],
            absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
          },
          {
            id: '13:4',
            name: 'InvisibleFrame',
            type: 'FRAME',
            visible: false,
            absoluteBoundingBox: { x: 0, y: 0, width: 50, height: 50 },
          },
        ],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
      };

      const result = transformToAltNode(mixedTree);
      expect(result?.children).toHaveLength(1); // Only visible child
      expect(result?.children[0].name).toBe('OnlyChild'); // GROUP inlined
    });
  });
});
