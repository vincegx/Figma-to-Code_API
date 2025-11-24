/**
 * URL Parser Tests
 *
 * Tests for Figma URL parsing functionality
 */

import { describe, it, expect } from 'vitest';
import {
  parseFigmaUrl,
  isValidFigmaUrl,
  extractFileKey,
  buildFigmaUrl,
  isValidNodeId,
  normalizeNodeId,
} from '@/lib/utils/url-parser';

describe('URL Parser', () => {
  describe('parseFigmaUrl', () => {
    it('should parse valid Figma file URL', () => {
      const url = 'https://www.figma.com/file/ABC123/My-Design?node-id=1-2';
      const result = parseFigmaUrl(url);

      expect(result.fileKey).toBe('ABC123');
      expect(result.nodeId).toBe('1:2');
    });

    it('should parse Figma design URL', () => {
      const url = 'https://www.figma.com/design/XYZ789/Project?node-id=10-20';
      const result = parseFigmaUrl(url);

      expect(result.fileKey).toBe('XYZ789');
      expect(result.nodeId).toBe('10:20');
    });

    it('should parse Figma proto URL', () => {
      const url = 'https://www.figma.com/proto/TEST456/Prototype?node-id=5-10';
      const result = parseFigmaUrl(url);

      expect(result.fileKey).toBe('TEST456');
      expect(result.nodeId).toBe('5:10');
    });

    it('should normalize node ID with dashes to colons', () => {
      const url = 'https://www.figma.com/file/ABC123/Design?node-id=1-2';
      const result = parseFigmaUrl(url);

      expect(result.nodeId).toBe('1:2');
    });

    it('should throw error for missing node-id parameter', () => {
      const url = 'https://www.figma.com/file/ABC123/Design';

      expect(() => parseFigmaUrl(url)).toThrow('Missing node-id parameter');
    });

    it('should throw error for invalid domain', () => {
      const url = 'https://www.notfigma.com/file/ABC123/Design?node-id=1-2';

      expect(() => parseFigmaUrl(url)).toThrow('must be from figma.com');
    });

    it('should throw error for invalid URL format', () => {
      const url = 'not-a-url';

      expect(() => parseFigmaUrl(url)).toThrow('Invalid URL');
    });

    it('should throw error for invalid node ID format', () => {
      const url = 'https://www.figma.com/file/ABC123/Design?node-id=invalid';

      expect(() => parseFigmaUrl(url)).toThrow('Invalid node-id format');
    });
  });

  describe('isValidFigmaUrl', () => {
    it('should return true for valid URL', () => {
      const url = 'https://www.figma.com/file/ABC123/Design?node-id=1-2';
      expect(isValidFigmaUrl(url)).toBe(true);
    });

    it('should return false for invalid URL', () => {
      const url = 'https://www.notfigma.com/file/ABC123/Design';
      expect(isValidFigmaUrl(url)).toBe(false);
    });

    it('should return false for URL without node-id', () => {
      const url = 'https://www.figma.com/file/ABC123/Design';
      expect(isValidFigmaUrl(url)).toBe(false);
    });
  });

  describe('extractFileKey', () => {
    it('should extract file key from valid URL', () => {
      const url = 'https://www.figma.com/file/ABC123/Design?node-id=1-2';
      expect(extractFileKey(url)).toBe('ABC123');
    });

    it('should extract file key from design URL', () => {
      const url = 'https://www.figma.com/design/XYZ789/Project';
      expect(extractFileKey(url)).toBe('XYZ789');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://www.notfigma.com/file/ABC123/Design';
      expect(extractFileKey(url)).toBeNull();
    });
  });

  describe('buildFigmaUrl', () => {
    it('should build URL with file name', () => {
      const url = buildFigmaUrl('ABC123', '1:2', 'My Design');
      expect(url).toBe('https://www.figma.com/file/ABC123/my-design?node-id=1-2');
    });

    it('should build URL without file name', () => {
      const url = buildFigmaUrl('ABC123', '1:2');
      expect(url).toBe('https://www.figma.com/file/ABC123/untitled?node-id=1-2');
    });

    it('should encode node ID with dashes', () => {
      const url = buildFigmaUrl('ABC123', '10:20', 'Test');
      expect(url).toContain('node-id=10-20');
    });
  });

  describe('isValidNodeId', () => {
    it('should return true for valid node ID', () => {
      expect(isValidNodeId('1:2')).toBe(true);
      expect(isValidNodeId('123:456')).toBe(true);
    });

    it('should return false for invalid node ID', () => {
      expect(isValidNodeId('1-2')).toBe(false);
      expect(isValidNodeId('invalid')).toBe(false);
      expect(isValidNodeId('123')).toBe(false);
    });
  });

  describe('normalizeNodeId', () => {
    it('should normalize node ID with dashes to colons', () => {
      expect(normalizeNodeId('1-2')).toBe('1:2');
      expect(normalizeNodeId('123-456')).toBe('123:456');
    });

    it('should not change node ID with colons', () => {
      expect(normalizeNodeId('1:2')).toBe('1:2');
      expect(normalizeNodeId('123:456')).toBe('123:456');
    });
  });
});
