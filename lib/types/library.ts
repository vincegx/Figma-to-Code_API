/**
 * Library Management Types
 *
 * Defines types for managing imported Figma nodes as a reusable library.
 * Supports multi-node imports with search, filtering, and organization.
 */

import type { AltNode, AltSceneNode } from './altnode';
import type { GeneratedCode } from './code-generation';
import type { RuleMatch } from './rules';

// ============================================================================
// Library Entry Types
// ============================================================================

export interface LibraryNode {
  readonly id: string;
  readonly figmaNodeId: string;
  readonly name: string;
  readonly altNode: AltNode;
  readonly thumbnail?: string;
  readonly tags: readonly string[];
  readonly category?: string;
  readonly description?: string;
  readonly addedAt: string;
  readonly lastModified: string;
  readonly usage: {
    readonly viewCount: number;
    readonly exportCount: number;
    readonly lastUsed?: string;
  };
  readonly metadata: {
    readonly fileKey: string;
    readonly fileName: string;
    readonly nodeUrl: string;
  };
}

// ============================================================================
// Library Index Types
// ============================================================================

export interface LibraryIndex {
  readonly version: string;
  readonly totalNodes: number;
  readonly categories: ReadonlyMap<string, readonly LibraryNode[]>;
  readonly tags: ReadonlyMap<string, readonly LibraryNode[]>;
  readonly nodeMap: ReadonlyMap<string, LibraryNode>;
  readonly lastUpdated: string;
}

export interface LibraryStats {
  readonly totalNodes: number;
  readonly totalCategories: number;
  readonly totalTags: number;
  readonly mostUsedNodes: readonly LibraryNode[];
  readonly recentlyAdded: readonly LibraryNode[];
  readonly recentlyUsed: readonly LibraryNode[];
}

// ============================================================================
// Search & Filter Types
// ============================================================================

export type SearchField = 'name' | 'description' | 'tags' | 'category';

export interface SearchQuery {
  readonly term: string;
  readonly fields: readonly SearchField[];
  readonly caseSensitive: boolean;
  readonly exactMatch: boolean;
}

export type SortField = 'name' | 'addedAt' | 'lastModified' | 'viewCount' | 'exportCount' | 'date' | 'type' | 'coverage';

export type SortDirection = 'asc' | 'desc';

// Aliases for backward compatibility
export type LibrarySortCriteria = SortField;
export type SortOrder = SortDirection;
export type LibraryFilters = FilterOptions;

export interface FilterOptions {
  readonly categories?: readonly string[];
  readonly tags?: readonly string[];
  readonly type?: readonly string[]; // Figma node types (FRAME, COMPONENT, etc.)
  readonly coverage?: 'full' | 'partial' | 'none'; // Rule coverage level
  readonly dateRange?: {
    readonly start: string;
    readonly end: string;
  };
  readonly minUsage?: number;
  readonly hasGeneratedCode?: boolean;
}

export interface SearchOptions {
  readonly query?: SearchQuery;
  readonly filters?: FilterOptions;
  readonly sort?: {
    readonly field: SortField;
    readonly direction: SortDirection;
  };
  readonly pagination?: {
    readonly page: number;
    readonly pageSize: number;
  };
}

export interface SearchResult {
  readonly nodes: readonly LibraryNode[];
  readonly totalMatches: number;
  readonly page: number;
  readonly totalPages: number;
  readonly hasMore: boolean;
}

// ============================================================================
// Import Types
// ============================================================================

export interface FigmaImportSource {
  readonly fileKey: string;
  readonly nodeIds: readonly string[];
  readonly accessToken: string;
}

export interface ImportOptions {
  readonly source: FigmaImportSource;
  readonly autoTransform: boolean;
  readonly autoGenerateCode: boolean;
  readonly defaultCategory?: string;
  readonly defaultTags?: readonly string[];
  readonly overwriteExisting: boolean;
}

export interface ImportProgress {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly current?: {
    readonly nodeId: string;
    readonly nodeName: string;
    readonly status: 'fetching' | 'transforming' | 'generating';
  };
}

export interface ImportResult {
  readonly successful: readonly LibraryNode[];
  readonly failed: readonly {
    readonly nodeId: string;
    readonly error: string;
  }[];
  readonly totalProcessed: number;
  readonly duration: number;
  readonly importedAt: string;
}

// ============================================================================
// Library Node with Generated Code
// ============================================================================

export interface LibraryNodeWithCode extends LibraryNode {
  readonly generatedCode: GeneratedCode;
  readonly ruleMatch: RuleMatch;
  readonly codeGeneratedAt: string;
}

// ============================================================================
// Export Types
// ============================================================================

export interface LibraryExportOptions {
  readonly nodeIds: readonly string[];
  readonly includeMetadata: boolean;
  readonly includeCode: boolean;
  readonly includeAltNodes: boolean;
  readonly format: 'json' | 'yaml';
}

export interface LibraryExportResult {
  readonly nodes: readonly (LibraryNode | LibraryNodeWithCode)[];
  readonly metadata: {
    readonly exportedAt: string;
    readonly version: string;
    readonly totalNodes: number;
  };
}

// ============================================================================
// Collection Types
// ============================================================================

export interface NodeCollection {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly nodeIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly color?: string;
  readonly icon?: string;
}

export interface CollectionStats {
  readonly totalCollections: number;
  readonly averageNodesPerCollection: number;
  readonly largestCollection: NodeCollection;
  readonly recentlyUpdated: readonly NodeCollection[];
}

// ============================================================================
// Multi-Node Operations
// ============================================================================

export interface BulkUpdateOptions {
  readonly nodeIds: readonly string[];
  readonly updates: {
    readonly tags?: {
      readonly add?: readonly string[];
      readonly remove?: readonly string[];
    };
    readonly category?: string;
    readonly description?: string;
  };
}

export interface BulkDeleteOptions {
  readonly nodeIds: readonly string[];
  readonly deleteGeneratedCode: boolean;
  readonly confirmationRequired: boolean;
}

export interface BulkOperationResult {
  readonly successful: readonly string[];
  readonly failed: readonly {
    readonly nodeId: string;
    readonly error: string;
  }[];
  readonly totalProcessed: number;
}

// ============================================================================
// Library Storage Types
// ============================================================================

export type StorageBackend = 'localStorage' | 'indexedDB' | 'filesystem';

export interface StorageConfig {
  readonly backend: StorageBackend;
  readonly namespace: string;
  readonly maxSize?: number; // bytes
  readonly compression: boolean;
  readonly encryption?: {
    readonly enabled: boolean;
    readonly algorithm: string;
  };
}

export interface StorageStats {
  readonly backend: StorageBackend;
  readonly totalSize: number; // bytes
  readonly availableSize?: number; // bytes
  readonly totalKeys: number;
  readonly lastBackup?: string;
}

// ============================================================================
// Library Configuration
// ============================================================================

export interface LibraryConfig {
  readonly storage: StorageConfig;
  readonly autoSync: boolean;
  readonly syncInterval?: number; // milliseconds
  readonly defaultCategory: string;
  readonly defaultTags: readonly string[];
  readonly maxNodesPerImport: number;
  readonly thumbnailSize: {
    readonly width: number;
    readonly height: number;
  };
  readonly enableAnalytics: boolean;
}

export const DEFAULT_LIBRARY_CONFIG: LibraryConfig = {
  storage: {
    backend: 'indexedDB',
    namespace: 'figma-rules-builder',
    compression: true,
  },
  autoSync: false,
  defaultCategory: 'Uncategorized',
  defaultTags: [],
  maxNodesPerImport: 100,
  thumbnailSize: {
    width: 200,
    height: 150,
  },
  enableAnalytics: true,
};
