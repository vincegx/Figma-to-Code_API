/**
 * File Storage Tests
 *
 * Tests for multi-node file storage utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import {
  saveNodeData,
  loadNodeData,
  loadNodeMetadata,
  deleteNodeData,
  nodeDataExists,
  getAllNodeIds,
  updateNodeMetadata,
} from '@/lib/utils/file-storage';
import type { FigmaNode } from '@/lib/types/figma';

const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');

// Clean up before and after each test
beforeEach(async () => {
  // Clean up any existing test data
  await fs.rm(FIGMA_DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(FIGMA_DATA_DIR, { recursive: true });
});

afterEach(async () => {
  // Clean up test directory
  await fs.rm(FIGMA_DATA_DIR, { recursive: true, force: true });
});

describe('File Storage', () => {
  const mockFigmaNode: FigmaNode = {
    id: '1:2',
    name: 'Test Node',
    type: 'FRAME',
    visible: true,
    locked: false,
    children: [],
  };

  const mockScreenshot = Buffer.from('test-image-data');
  const fileKey = 'ABC123';
  const fileName = 'Test File';

  describe('saveNodeData', () => {
    it('should save node data to filesystem', async () => {
      const result = await saveNodeData(
        '1:2',
        mockFigmaNode,
        fileKey,
        mockScreenshot,
        fileName
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('lib-1-2');
      expect(result.figmaNodeId).toBe('1:2');
      expect(result.name).toBe('Test Node');
      expect(result.metadata.fileKey).toBe(fileKey);
      expect(result.metadata.fileName).toBe(fileName);
    });

    it('should sanitize node ID for file path', async () => {
      const result = await saveNodeData(
        '123:456',
        mockFigmaNode,
        fileKey,
        mockScreenshot,
        fileName
      );

      expect(result.id).toBe('lib-123-456');
    });
  });

  describe('loadNodeData', () => {
    it('should return null for non-existent node', async () => {
      const result = await loadNodeData('999:999');
      expect(result).toBeNull();
    });

    it('should load saved node data', async () => {
      // First save a node
      await saveNodeData('1:2', mockFigmaNode, fileKey, mockScreenshot, fileName);

      // Then load it
      const result = await loadNodeData('1:2');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1:2');
      expect(result?.name).toBe('Test Node');
    });
  });

  describe('loadNodeMetadata', () => {
    it('should return null for non-existent node', async () => {
      const result = await loadNodeMetadata('999:999');
      expect(result).toBeNull();
    });

    it('should load saved metadata', async () => {
      // First save a node
      await saveNodeData('1:2', mockFigmaNode, fileKey, mockScreenshot, fileName);

      // Then load metadata
      const result = await loadNodeMetadata('1:2');
      expect(result).toBeDefined();
      expect(result?.figmaNodeId).toBe('1:2');
      expect(result?.metadata.fileKey).toBe(fileKey);
    });
  });

  describe('deleteNodeData', () => {
    it('should delete node directory', async () => {
      // First save a node
      await saveNodeData('1:2', mockFigmaNode, fileKey, mockScreenshot, fileName);

      // Verify it exists
      const existsBefore = await nodeDataExists('1:2');
      expect(existsBefore).toBe(true);

      // Delete it
      await deleteNodeData('1:2');

      // Verify it's gone
      const existsAfter = await nodeDataExists('1:2');
      expect(existsAfter).toBe(false);
    });

    it('should not throw error for non-existent node', async () => {
      await expect(deleteNodeData('999:999')).resolves.not.toThrow();
    });
  });

  describe('nodeDataExists', () => {
    it('should return false for non-existent node', async () => {
      const exists = await nodeDataExists('999:999');
      expect(exists).toBe(false);
    });

    it('should return true for existing node', async () => {
      await saveNodeData('1:2', mockFigmaNode, fileKey, mockScreenshot, fileName);

      const exists = await nodeDataExists('1:2');
      expect(exists).toBe(true);
    });
  });

  describe('getAllNodeIds', () => {
    it('should return empty array when no nodes exist', async () => {
      const nodeIds = await getAllNodeIds();
      expect(nodeIds).toEqual([]);
    });

    it('should return all node IDs', async () => {
      // Save multiple nodes
      await saveNodeData('1:2', mockFigmaNode, fileKey, mockScreenshot, fileName);
      await saveNodeData('3:4', { ...mockFigmaNode, id: '3:4', name: 'Node 2' }, fileKey, mockScreenshot, fileName);

      const nodeIds = await getAllNodeIds();
      expect(nodeIds).toHaveLength(2);
      expect(nodeIds).toContain('1:2');
      expect(nodeIds).toContain('3:4');
    });
  });

  describe('updateNodeMetadata', () => {
    it('should update node metadata', async () => {
      // Save initial node
      await saveNodeData('1:2', mockFigmaNode, fileKey, mockScreenshot, fileName);

      // Update metadata
      await updateNodeMetadata('1:2', {
        tags: ['test', 'updated'],
        category: 'UI Components',
      });

      // Load and verify
      const metadata = await loadNodeMetadata('1:2');
      expect(metadata?.tags).toEqual(['test', 'updated']);
      expect(metadata?.category).toBe('UI Components');
    });

    it('should throw error for non-existent node', async () => {
      await expect(
        updateNodeMetadata('999:999', { tags: ['test'] })
      ).rejects.toThrow('Node 999:999 not found');
    });
  });
});
