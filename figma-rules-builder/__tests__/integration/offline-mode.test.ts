/**
 * Offline Mode Integration Tests
 *
 * Verifies Constitutional Principle III: Data Locality
 * - Fetch once from Figma API
 * - Subsequent requests load from cache (no API calls)
 * - Works completely offline when cache exists
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import type { FigmaNode } from '@/lib/types/figma';
import {
  saveFigmaNode,
  loadFigmaNode,
  deleteCachedNode,
} from '@/lib/utils/file-storage';

describe('Offline Mode', () => {
  const testNodeId = 'test:offline:1';
  const testFileKey = 'offline-test-key';
  const testCacheDir = path.join(process.cwd(), 'figma-data');

  const mockNode: FigmaNode = {
    id: testNodeId,
    name: 'Offline Test Frame',
    type: 'FRAME',
    children: [],
    layoutMode: 'VERTICAL',
    itemSpacing: 8,
  };

  beforeAll(async () => {
    // Ensure cache directory exists
    await fs.mkdir(testCacheDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await deleteCachedNode(testNodeId);
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should save node to cache and retrieve it without API call', async () => {
    const lastModified = new Date().toISOString();

    // Save to cache (simulating initial fetch)
    await saveFigmaNode(testNodeId, testFileKey, mockNode, lastModified);

    // Load from cache (simulating offline mode)
    const cached = await loadFigmaNode(testNodeId);

    expect(cached).not.toBeNull();
    expect(cached?.nodeId).toBe(testNodeId);
    expect(cached?.fileKey).toBe(testFileKey);
    expect(cached?.document).toEqual(mockNode);
    expect(cached?.lastModified).toBe(lastModified);
    // cachedAt is system-generated, just verify it exists and is valid
    expect(cached?.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should persist cache across multiple reads', async () => {
    const timestamp = new Date().toISOString();

    // Save once
    await saveFigmaNode(testNodeId, testFileKey, mockNode, timestamp);

    // Read multiple times
    const read1 = await loadFigmaNode(testNodeId);
    const read2 = await loadFigmaNode(testNodeId);
    const read3 = await loadFigmaNode(testNodeId);

    // All reads should return the same cached data
    expect(read1).toEqual(read2);
    expect(read2).toEqual(read3);
    // Verify cachedAt stays the same (no re-fetching)
    expect(read1?.cachedAt).toBe(read2?.cachedAt);
    expect(read2?.cachedAt).toBe(read3?.cachedAt);
  });

  it('should return null when cache does not exist', async () => {
    const nonExistentId = 'nonexistent:node:999';
    const cached = await loadFigmaNode(nonExistentId);

    expect(cached).toBeNull();
  });

  it('should successfully delete cached node', async () => {
    const timestamp = new Date().toISOString();
    const deleteTestId = 'test:delete:1';

    // Save node
    await saveFigmaNode(deleteTestId, testFileKey, mockNode, timestamp);

    // Verify it exists
    let cached = await loadFigmaNode(deleteTestId);
    expect(cached).not.toBeNull();

    // Delete cache
    await deleteCachedNode(deleteTestId);

    // Verify it's gone
    cached = await loadFigmaNode(deleteTestId);
    expect(cached).toBeNull();
  });

  it('should validate cache file structure', async () => {
    const timestamp = new Date().toISOString();
    const structureTestId = 'test:structure:1';

    await saveFigmaNode(structureTestId, testFileKey, mockNode, timestamp);

    // Read raw file to verify structure
    const cacheFilePath = path.join(testCacheDir, `${structureTestId}.json`);
    const rawContent = await fs.readFile(cacheFilePath, 'utf-8');
    const parsed = JSON.parse(rawContent);

    // Validate all required fields exist
    expect(parsed).toHaveProperty('nodeId');
    expect(parsed).toHaveProperty('fileKey');
    expect(parsed).toHaveProperty('document');
    expect(parsed).toHaveProperty('cachedAt');
    expect(parsed).toHaveProperty('lastModified');

    // Validate ISO timestamp format
    expect(parsed.cachedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(parsed.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Cleanup
    await deleteCachedNode(structureTestId);
  });

  it('should demonstrate Constitutional Principle III: fetch once, cache forever', async () => {
    const principleTestId = 'test:principle:1';
    const initialTimestamp = new Date().toISOString();

    // Initial "fetch" - save to cache
    await saveFigmaNode(
      principleTestId,
      testFileKey,
      mockNode,
      initialTimestamp
    );

    // Get the initial cache timestamp
    const firstRead = await loadFigmaNode(principleTestId);
    const initialCachedAt = firstRead?.cachedAt;

    // Simulate multiple page loads over time
    const cachedReads = [];
    for (let i = 0; i < 5; i++) {
      const cached = await loadFigmaNode(principleTestId);
      cachedReads.push(cached);

      // Small delay between reads (simulate real usage)
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // All reads should return same cached data (no re-fetching)
    cachedReads.forEach((cached) => {
      expect(cached?.cachedAt).toBe(initialCachedAt);
      expect(cached?.document).toEqual(mockNode);
    });

    // Verify cache timestamp never changed (no automatic re-fetching)
    const finalCached = await loadFigmaNode(principleTestId);
    expect(finalCached?.cachedAt).toBe(initialCachedAt);

    // Cleanup
    await deleteCachedNode(principleTestId);
  });
});
