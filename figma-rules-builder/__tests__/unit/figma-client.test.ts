/**
 * Figma Client Unit Tests
 *
 * Tests Figma API client functions with mocked responses
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchNode, parseFigmaUrl } from '@/lib/figma-client';
import type { FigmaNode } from '@/lib/types/figma';

// Mock fetch globally
global.fetch = vi.fn();

describe('Figma Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseFigmaUrl', () => {
    it('should parse valid Figma file URL', () => {
      const url =
        'https://www.figma.com/file/abc123/Test-File?node-id=1-2';
      const result = parseFigmaUrl(url);

      expect(result.fileKey).toBe('abc123');
      expect(result.nodeId).toBe('1:2');
    });

    it('should parse valid Figma design URL', () => {
      const url =
        'https://www.figma.com/design/xyz789/Another-File?node-id=10-20';
      const result = parseFigmaUrl(url);

      expect(result.fileKey).toBe('xyz789');
      expect(result.nodeId).toBe('10:20');
    });

    it('should throw error for invalid URL format', () => {
      const url = 'https://example.com/invalid';

      expect(() => parseFigmaUrl(url)).toThrow(
        'Invalid Figma URL: could not find file key'
      );
    });

    it('should throw error for missing node-id parameter', () => {
      const url = 'https://www.figma.com/file/abc123/Test-File';

      expect(() => parseFigmaUrl(url)).toThrow(
        'Invalid Figma URL: missing node-id parameter'
      );
    });
  });

  describe('fetchNode', () => {
    const mockFigmaNode: FigmaNode = {
      id: '1:2',
      name: 'Test Frame',
      type: 'FRAME',
      children: [],
      layoutMode: 'HORIZONTAL',
      itemSpacing: 16,
      fills: [
        {
          type: 'SOLID',
          color: { r: 1, g: 0, b: 0, a: 1 },
        },
      ],
    };

    it('should fetch node successfully', async () => {
      const mockResponse = {
        nodes: {
          '1:2': {
            document: mockFigmaNode,
          },
        },
        name: 'Test File',
        lastModified: '2025-11-23T00:00:00Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchNode('abc123', '1:2', {
        accessToken: 'test-token',
      });

      expect(result).toEqual(mockFigmaNode);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.figma.com/v1/files/abc123/nodes?ids=1:2',
        expect.objectContaining({
          headers: {
            'X-Figma-Token': 'test-token',
          },
        })
      );
    });

    it('should throw error when node not found', async () => {
      const mockResponse = {
        nodes: {},
        name: 'Test File',
        lastModified: '2025-11-23T00:00:00Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(
        fetchNode('abc123', '1:2', { accessToken: 'test-token' })
      ).rejects.toThrow('Node 1:2 not found in Figma file abc123');
    });

    it('should handle 401 authentication error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ err: 'Invalid token' }),
      });

      await expect(
        fetchNode('abc123', '1:2', { accessToken: 'invalid-token' })
      ).rejects.toThrow('Figma API error (401): Invalid token');
    });

    it('should handle timeout', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('AbortError');
              error.name = 'AbortError';
              reject(error);
            }, 100);
          })
      );

      await expect(
        fetchNode('abc123', '1:2', {
          accessToken: 'test-token',
          timeout: 50,
        })
      ).rejects.toThrow('Figma API request timed out');
    });
  });
});
