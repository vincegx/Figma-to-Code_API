/**
 * Merge Store
 *
 * Server-side file-based storage for merge JSON files.
 * Provides type-safe CRUD operations for merge persistence.
 *
 * Storage: merges-data/{id}.json
 */

import { promises as fs } from 'fs';
import path from 'path';
import type {
  Merge,
  MergeListItem,
  MergeStatus,
  ListMergesOptions,
} from '../types/merge';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Base directory for merge storage.
 * Relative to project root (figma-rules-builder/).
 */
const MERGES_DIR = path.join(process.cwd(), 'merges-data');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure the merges directory exists
 */
async function ensureMergesDir(): Promise<void> {
  try {
    await fs.access(MERGES_DIR);
  } catch {
    await fs.mkdir(MERGES_DIR, { recursive: true });
  }
}

/**
 * Get the file path for a merge by ID
 */
function getMergePath(id: string): string {
  return path.join(MERGES_DIR, `${id}.json`);
}

/**
 * Generate a new merge ID using crypto.randomUUID
 */
export function generateMergeId(): string {
  return crypto.randomUUID();
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * List all merges with optional filtering and sorting.
 * Returns lightweight MergeListItem[] for efficient list views.
 */
export async function listMerges(options?: ListMergesOptions): Promise<MergeListItem[]> {
  await ensureMergesDir();

  try {
    const files = await fs.readdir(MERGES_DIR);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const merges: MergeListItem[] = [];

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(MERGES_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const merge: Merge = JSON.parse(content);

        // Convert to lightweight list item
        const listItem: MergeListItem = {
          id: merge.id,
          name: merge.name,
          status: merge.status,
          sourceNodes: merge.sourceNodes.map((node) => ({
            breakpoint: node.breakpoint,
            nodeName: node.nodeName,
            thumbnail: node.thumbnail,
          })),
          warningCount: merge.result?.warnings.length ?? 0,
          createdAt: merge.createdAt,
          updatedAt: merge.updatedAt,
        };

        merges.push(listItem);
      } catch (parseError) {
        // Skip invalid JSON files
        console.warn(`Failed to parse merge file ${file}:`, parseError);
      }
    }

    // Apply search filter
    let filtered = merges;
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        (merge) =>
          merge.name.toLowerCase().includes(searchLower) ||
          merge.sourceNodes.some((node) =>
            node.nodeName.toLowerCase().includes(searchLower)
          )
      );
    }

    // Apply status filter
    if (options?.status) {
      filtered = filtered.filter((merge) => merge.status === options.status);
    }

    // Apply sorting
    const sortField = options?.sort ?? 'updatedAt';
    const sortOrder = options?.order ?? 'desc';

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
        default:
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  } catch (error) {
    // If directory doesn't exist or is empty, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Get a single merge by ID.
 * Returns null if not found.
 */
export async function getMerge(id: string): Promise<Merge | null> {
  try {
    const filePath = getMergePath(id);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as Merge;
  } catch (error) {
    // Return null for not found, throw for other errors
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save a merge (create or update).
 * Updates the `updatedAt` timestamp automatically.
 */
export async function saveMerge(merge: Merge): Promise<void> {
  await ensureMergesDir();

  // Update the updatedAt timestamp
  const mergeToSave: Merge = {
    ...merge,
    updatedAt: new Date().toISOString(),
  };

  const filePath = getMergePath(merge.id);
  const content = JSON.stringify(mergeToSave, null, 2);
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Delete a merge by ID.
 * Returns true if deleted, false if not found.
 */
export async function deleteMerge(id: string): Promise<boolean> {
  try {
    const filePath = getMergePath(id);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    // Return false for not found
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a merge exists by ID
 */
export async function mergeExists(id: string): Promise<boolean> {
  try {
    const filePath = getMergePath(id);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get merge count by status
 */
export async function getMergeCountByStatus(): Promise<Record<MergeStatus, number>> {
  const merges = await listMerges();

  const counts: Record<MergeStatus, number> = {
    processing: 0,
    ready: 0,
    error: 0,
  };

  for (const merge of merges) {
    counts[merge.status]++;
  }

  return counts;
}
