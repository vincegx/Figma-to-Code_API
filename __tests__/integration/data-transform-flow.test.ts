/**
 * Integration Test: Data Transform Flow
 *
 * Tests the flow: data.json → transformToAltNode → AltNode
 * Verifies Constitutional Principle III: "Compute AltNode on-the-fly, don't persist"
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  transformToAltNode,
  resetNameCounters,
  SimpleAltNode,
} from '@/lib/altnode-transform';
import type { FigmaNode } from '@/lib/types/figma';

describe('Data Transform Flow Integration', () => {
  beforeEach(() => {
    resetNameCounters();
  });

  describe('transformToAltNode', () => {
    it('transforms basic FigmaNode to SimpleAltNode', () => {
      const figmaNode: FigmaNode = {
        id: '1:2',
        name: 'TestFrame',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1:2');
      expect(result?.name).toBe('TestFrame');
      expect(result?.type).toBe('div'); // FRAME → div
      expect(result?.visible).toBe(true);
      expect(result?.originalNode).toBe(figmaNode);
    });

    it('filters out invisible nodes', () => {
      const figmaNode: FigmaNode = {
        id: '1:3',
        name: 'HiddenFrame',
        type: 'FRAME',
        visible: false,
        locked: false,
        children: [],
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result).toBeNull();
    });

    it('generates unique names for duplicate node names', () => {
      const figmaNode1: FigmaNode = {
        id: '1:1',
        name: 'Button',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      } as FigmaNode;

      const figmaNode2: FigmaNode = {
        id: '1:2',
        name: 'Button',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      } as FigmaNode;

      const result1 = transformToAltNode(figmaNode1);
      const result2 = transformToAltNode(figmaNode2);

      expect(result1?.uniqueName).toBe('Button');
      expect(result2?.uniqueName).toBe('Button_01');
    });

    it('transforms nested children recursively', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'ParentFrame',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [
          {
            id: '1:2',
            name: 'ChildText',
            type: 'TEXT',
            visible: true,
            locked: false,
            characters: 'Hello',
          } as FigmaNode,
          {
            id: '1:3',
            name: 'ChildFrame',
            type: 'FRAME',
            visible: true,
            locked: false,
            children: [],
          } as FigmaNode,
        ],
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result).not.toBeNull();
      expect(result?.children).toHaveLength(2);
      expect(result?.children[0].name).toBe('ChildText');
      expect(result?.children[0].type).toBe('span'); // TEXT → span
      expect(result?.children[1].name).toBe('ChildFrame');
    });

    it('inlines GROUP nodes (skip wrapper, process children)', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'ContainerFrame',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [
          {
            id: '1:2',
            name: 'GroupWrapper',
            type: 'GROUP',
            visible: true,
            locked: false,
            children: [
              {
                id: '1:3',
                name: 'InnerElement',
                type: 'RECTANGLE',
                visible: true,
                locked: false,
              } as FigmaNode,
            ],
          } as FigmaNode,
        ],
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      // GROUP should be inlined, children promoted to parent
      expect(result?.children).toHaveLength(1);
      expect(result?.children[0].name).toBe('InnerElement');
    });

    it('preserves originalNode reference for rule evaluation', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'TestNode',
        type: 'FRAME',
        visible: true,
        locked: false,
        absoluteBoundingBox: { x: 10, y: 20, width: 300, height: 400 },
        children: [],
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result?.originalNode).toBe(figmaNode);
      expect(result?.originalNode.absoluteBoundingBox?.width).toBe(300);
      expect(result?.originalNode.absoluteBoundingBox?.height).toBe(400);
    });

    it('handles TEXT node type correctly', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Label',
        type: 'TEXT',
        visible: true,
        locked: false,
        characters: 'Hello World',
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result?.type).toBe('span');
      expect(result?.name).toBe('Label');
    });

    it('handles VECTOR node type correctly', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Icon',
        type: 'VECTOR',
        visible: true,
        locked: false,
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result?.type).toBe('svg');
    });

    it('detects icon candidates', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'SmallIcon',
        type: 'VECTOR',
        visible: true,
        locked: false,
        absoluteBoundingBox: { x: 0, y: 0, width: 24, height: 24 },
      } as FigmaNode;

      const result = transformToAltNode(figmaNode);

      expect(result?.isIcon).toBe(true);
    });
  });

  describe('Constitutional Principle III Compliance', () => {
    it('does not persist altNode - always computed on-the-fly', () => {
      const figmaNode: FigmaNode = {
        id: '1:1',
        name: 'Frame',
        type: 'FRAME',
        visible: true,
        locked: false,
        children: [],
      } as FigmaNode;

      // First transformation
      const result1 = transformToAltNode(figmaNode);

      // Reset counters and transform again (simulating fresh load)
      resetNameCounters();
      const result2 = transformToAltNode(figmaNode);

      // Both should produce valid results with same structure
      expect(result1?.id).toBe(result2?.id);
      expect(result1?.name).toBe(result2?.name);
      expect(result1?.type).toBe(result2?.type);
    });
  });
});
