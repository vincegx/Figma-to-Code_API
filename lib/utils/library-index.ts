/**
 * Library Index Management
 *
 * Manages the library-index.json file which serves as the single source of truth
 * for all imported nodes. Provides search, filter, and sort operations.
 */

import fs from 'fs/promises';
import path from 'path';
import type { LibraryIndex, LibraryNode, LibraryFilters, LibrarySortCriteria, SortOrder } from '../types/library';

const LIBRARY_INDEX_PATH = path.join(process.cwd(), 'figma-data', 'library-index.json');

/**
 * Mutable version of LibraryIndex for internal use
 */
interface MutableLibraryIndex {
  version: string;
  totalNodes: number;
  categories: Map<string, LibraryNode[]>;
  tags: Map<string, LibraryNode[]>;
  nodeMap: Map<string, LibraryNode>;
  lastUpdated: string;
}

/**
 * Convert LibraryIndex to mutable version for internal operations
 */
function toMutable(index: LibraryIndex): MutableLibraryIndex {
  // Create mutable copies of Maps with mutable arrays
  const categories = new Map<string, LibraryNode[]>();
  for (const [key, value] of index.categories) {
    categories.set(key, [...value]);
  }

  const tags = new Map<string, LibraryNode[]>();
  for (const [key, value] of index.tags) {
    tags.set(key, [...value]);
  }

  return {
    version: index.version,
    totalNodes: index.totalNodes,
    categories,
    tags,
    nodeMap: new Map(index.nodeMap),
    lastUpdated: index.lastUpdated,
  };
}

/**
 * Load library index from disk
 *
 * Creates empty index if file doesn't exist.
 *
 * @returns LibraryIndex object
 */
export async function loadLibraryIndex(): Promise<LibraryIndex> {
  try {
    const fileContent = await fs.readFile(LIBRARY_INDEX_PATH, 'utf-8');
    const data = JSON.parse(fileContent);

    // Convert from serialized format (nodes array) to Map objects
    const nodeMap = new Map<string, LibraryNode>();
    const categories = new Map<string, readonly LibraryNode[]>();
    const tags = new Map<string, readonly LibraryNode[]>();

    // Build nodeMap from nodes array
    if (data.nodes && Array.isArray(data.nodes)) {
      for (const node of data.nodes) {
        nodeMap.set(node.id, node);

        // Rebuild categories index
        if (node.category) {
          const categoryNodes = categories.get(node.category) || [];
          categories.set(node.category, [...categoryNodes, node]);
        }

        // Rebuild tags index
        if (node.tags && Array.isArray(node.tags)) {
          for (const tag of node.tags) {
            const tagNodes = tags.get(tag) || [];
            tags.set(tag, [...tagNodes, node]);
          }
        }
      }
    }

    return {
      version: data.version,
      lastUpdated: data.lastUpdated,
      categories,
      tags,
      nodeMap,
      totalNodes: data.totalNodes || nodeMap.size,
    };
  } catch (error) {
    // Initialize empty index if not exists
    const emptyIndex: LibraryIndex = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      categories: new Map(),
      tags: new Map(),
      nodeMap: new Map(),
      totalNodes: 0,
    };
    await saveLibraryIndex(emptyIndex);
    return emptyIndex;
  }
}

/**
 * Save library index to disk
 *
 * @param index - LibraryIndex to save
 */
export async function saveLibraryIndex(index: LibraryIndex): Promise<void> {
  await fs.mkdir(path.dirname(LIBRARY_INDEX_PATH), { recursive: true });

  // Convert Maps to objects for JSON serialization
  const serializable = {
    version: index.version,
    lastUpdated: index.lastUpdated,
    nodes: Array.from(index.nodeMap.values()),
    totalNodes: index.totalNodes,
  };

  await fs.writeFile(LIBRARY_INDEX_PATH, JSON.stringify(serializable, null, 2), 'utf-8');
}

/**
 * Add or update a node in the library index
 *
 * @param node - LibraryNode to add
 */
export async function addNode(node: LibraryNode): Promise<void> {
  const loaded = await loadLibraryIndex();
  const index = toMutable(loaded);

  // Update or add node
  index.nodeMap.set(node.id, node);
  index.totalNodes = index.nodeMap.size;

  // Update category index
  if (node.category) {
    const categoryNodes = index.categories.get(node.category) || [];
    if (!categoryNodes.find(n => n.id === node.id)) {
      categoryNodes.push(node);
    }
    index.categories.set(node.category, categoryNodes);
  }

  // Update tag indexes
  for (const tag of node.tags) {
    const tagNodes = index.tags.get(tag) || [];
    if (!tagNodes.find(n => n.id === node.id)) {
      tagNodes.push(node);
    }
    index.tags.set(tag, tagNodes);
  }

  index.lastUpdated = new Date().toISOString();
  await saveLibraryIndex(index as LibraryIndex);
}

/**
 * Remove a node from the library index
 *
 * @param nodeId - Library node ID (format: "lib-{figmaNodeId}")
 */
export async function removeNode(nodeId: string): Promise<void> {
  const loaded = await loadLibraryIndex();
  const index = toMutable(loaded);
  const node = index.nodeMap.get(nodeId);

  if (node) {
    // Remove from main map
    index.nodeMap.delete(nodeId);
    index.totalNodes = index.nodeMap.size;

    // Remove from category index
    if (node.category) {
      const categoryNodes = index.categories.get(node.category) || [];
      index.categories.set(
        node.category,
        categoryNodes.filter(n => n.id !== nodeId)
      );
    }

    // Remove from tag indexes
    for (const tag of node.tags) {
      const tagNodes = index.tags.get(tag) || [];
      index.tags.set(tag, tagNodes.filter(n => n.id !== nodeId));
    }

    index.lastUpdated = new Date().toISOString();
    await saveLibraryIndex(index as LibraryIndex);
  }
}

/**
 * Get a specific node from the library index
 *
 * @param nodeId - Library node ID
 * @returns LibraryNode or undefined if not found
 */
export async function getNode(nodeId: string): Promise<LibraryNode | undefined> {
  const index = await loadLibraryIndex();
  return index.nodeMap.get(nodeId);
}

/**
 * Get all nodes from the library index
 *
 * @returns Array of all LibraryNodes
 */
export async function getAllNodes(): Promise<LibraryNode[]> {
  const index = await loadLibraryIndex();
  return Array.from(index.nodeMap.values());
}

/**
 * Search nodes by name or ID
 *
 * Case-insensitive search on node name and Figma node ID.
 *
 * @param query - Search query string
 * @returns Array of matching LibraryNodes
 */
export async function searchNodes(query: string): Promise<LibraryNode[]> {
  const nodes = await getAllNodes();
  const lowerQuery = query.toLowerCase();

  return nodes.filter(node =>
    node.name.toLowerCase().includes(lowerQuery) ||
    node.figmaNodeId.toLowerCase().includes(lowerQuery) ||
    node.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter nodes by criteria
 *
 * @param filters - Filter criteria
 * @returns Array of filtered LibraryNodes
 */
export async function filterNodes(filters: LibraryFilters): Promise<LibraryNode[]> {
  let nodes = await getAllNodes();

  // Filter by type (Figma node types like FRAME, COMPONENT, etc.)
  if (filters.type && filters.type.length > 0) {
    nodes = nodes.filter(node =>
      node.altNode?.type && filters.type?.includes(String(node.altNode.type))
    );
  }

  // Filter by coverage (requires altNode to be populated)
  if (filters.coverage) {
    if (filters.coverage === 'full') {
      // Full coverage: altNode exists
      nodes = nodes.filter(node => node.altNode !== undefined);
    } else if (filters.coverage === 'none') {
      // No coverage: altNode doesn't exist
      nodes = nodes.filter(node => node.altNode === undefined);
    }
    // 'partial' would be handled when we have rule matching (WP05)
  }

  return nodes;
}

/**
 * Sort nodes by criteria
 *
 * @param criteria - Sort criteria (name, date, type, coverage)
 * @param order - Sort order (asc or desc)
 * @returns Array of sorted LibraryNodes
 */
export async function sortNodes(
  criteria: LibrarySortCriteria,
  order: SortOrder = 'asc'
): Promise<LibraryNode[]> {
  const nodes = await getAllNodes();

  const sorted = [...nodes].sort((a, b) => {
    let comparison = 0;

    switch (criteria) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        break;
      case 'type':
        comparison = String(a.altNode?.type || '').localeCompare(String(b.altNode?.type || ''));
        break;
      case 'coverage':
        // Coverage would be calculated by rule matches (WP05)
        // For now, just check if altNode exists
        const aCoverage = a.altNode ? 1 : 0;
        const bCoverage = b.altNode ? 1 : 0;
        comparison = aCoverage - bCoverage;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get nodes by category
 *
 * @param category - Category name
 * @returns Array of LibraryNodes in that category
 */
export async function getNodesByCategory(category: string): Promise<LibraryNode[]> {
  const index = await loadLibraryIndex();
  const nodes = index.categories.get(category) || [];
  return [...nodes]; // Convert readonly array to mutable
}

/**
 * Get nodes by tag
 *
 * @param tag - Tag name
 * @returns Array of LibraryNodes with that tag
 */
export async function getNodesByTag(tag: string): Promise<LibraryNode[]> {
  const index = await loadLibraryIndex();
  const nodes = index.tags.get(tag) || [];
  return [...nodes]; // Convert readonly array to mutable
}

/**
 * Get all categories
 *
 * @returns Array of category names
 */
export async function getAllCategories(): Promise<string[]> {
  const index = await loadLibraryIndex();
  return Array.from(index.categories.keys());
}

/**
 * Get all tags
 *
 * @returns Array of tag names
 */
export async function getAllTags(): Promise<string[]> {
  const index = await loadLibraryIndex();
  return Array.from(index.tags.keys());
}

/**
 * Rebuild library index from file system
 *
 * Scans figma-data/ directory and rebuilds index from metadata files.
 * Useful for recovery or migration.
 *
 * @returns Number of nodes indexed
 */
export async function rebuildIndex(): Promise<number> {
  const { getAllNodeIds } = await import('./file-storage');
  const { loadNodeMetadata } = await import('./file-storage');

  const nodeIds = await getAllNodeIds();
  const nodes: LibraryNode[] = [];

  for (const nodeId of nodeIds) {
    const metadata = await loadNodeMetadata(nodeId);
    if (metadata) {
      nodes.push(metadata);
    }
  }

  const index: MutableLibraryIndex = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    categories: new Map(),
    tags: new Map(),
    nodeMap: new Map(nodes.map(n => [n.id, n])),
    totalNodes: nodes.length,
  };

  // Rebuild category and tag indexes
  for (const node of nodes) {
    if (node.category) {
      const categoryNodes = index.categories.get(node.category) || [];
      categoryNodes.push(node);
      index.categories.set(node.category, categoryNodes);
    }

    for (const tag of node.tags) {
      const tagNodes = index.tags.get(tag) || [];
      tagNodes.push(node);
      index.tags.set(tag, tagNodes);
    }
  }

  await saveLibraryIndex(index as LibraryIndex);
  return nodes.length;
}
