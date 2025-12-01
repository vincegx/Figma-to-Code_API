/**
 * Versioning Types for Figma Node History
 *
 * WP40: Implements types for tracking Figma node versions,
 * diff detection, and refetch results.
 */

// ============================================================================
// Version Entry Types
// ============================================================================

/**
 * Represents a single version entry in the history
 */
export interface VersionEntry {
  /** ISO timestamp from Figma API (lastModified) */
  figmaLastModified: string;
  /** ISO timestamp when we fetched this version */
  fetchedAt: string;
  /** Folder name in history/, e.g. "figma_2025-11-28T10-30-00" */
  folder: string;
}

/**
 * Structure of versions.json file stored in figma-data/{nodeId}/
 */
export interface VersionsFile {
  /** Current version info */
  current: {
    figmaLastModified: string;
    fetchedAt: string;
  };
  /** Historical versions (oldest first) */
  history: VersionEntry[];
}

// ============================================================================
// Diff Types
// ============================================================================

/**
 * Represents a single property change in a node
 */
export interface PropertyChange {
  /** Property path (e.g., "width", "fills[0].color.r") */
  property: string;
  /** Old value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
}

/**
 * Represents changes detected in a single node
 */
export interface NodeDiff {
  /** Figma node ID */
  nodeId: string;
  /** Human-readable node name */
  nodeName: string;
  /** Type of change */
  type: 'added' | 'removed' | 'modified';
  /** Node type (FRAME, TEXT, etc.) */
  nodeType?: string;
  /** Detailed property changes (for modified nodes) */
  changes?: PropertyChange[];
}

/**
 * Summary of all diffs in a refetch operation
 */
export interface DiffSummary {
  /** Number of nodes added */
  nodesAdded: number;
  /** Number of nodes removed */
  nodesRemoved: number;
  /** Number of nodes modified */
  nodesModified: number;
  /** New images detected (imageRef values) */
  newImages: string[];
  /** Total number of property changes */
  totalChanges: number;
}

// ============================================================================
// Refetch Progress Types
// ============================================================================

/**
 * Progress steps during refetch operation
 */
export type RefetchStep =
  | 'checking_version'
  | 'fetching_node'
  | 'computing_diff'
  | 'creating_snapshot'
  | 'downloading_images'
  | 'saving'
  | 'complete';

/**
 * Progress state for UI updates
 */
export interface RefetchProgress {
  /** Current step */
  step: RefetchStep;
  /** Human-readable step description */
  description: string;
  /** Progress percentage (0-100) */
  percent: number;
}

// ============================================================================
// Refetch Result Types
// ============================================================================

/**
 * Result of a refetch operation
 */
export interface RefetchResult {
  /** Status of the refetch */
  status: 'up_to_date' | 'updated' | 'error';
  /** Detailed diffs if changes were found */
  diff?: NodeDiff[];
  /** Summary of changes */
  summary?: DiffSummary;
  /** New version info (if updated) */
  newVersion?: {
    figmaLastModified: string;
    fetchedAt: string;
  };
  /** Error message (if status is 'error') */
  error?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Response from GET /api/figma/node/[id]/versions
 */
export interface VersionsResponse {
  /** Node ID */
  nodeId: string;
  /** Current version info */
  current: {
    figmaLastModified: string;
    fetchedAt: string;
  };
  /** Historical versions */
  history: VersionEntry[];
}

/**
 * Response from GET /api/figma/node/[id]/version/[folder]
 */
export interface VersionDataResponse {
  /** Folder name */
  folder: string;
  /** Figma node data */
  data: unknown;
  /** Node metadata */
  metadata: unknown;
  /** Variables data */
  variables: unknown;
  /** Screenshot URL */
  screenshotUrl: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Properties to track for diff detection
 * Grouped by category for clarity
 */
export const TRACKED_PROPERTIES = {
  structure: ['children', 'visible', 'name'],
  layout: [
    'width', 'height', 'x', 'y',
    'layoutMode', 'primaryAxisSizingMode', 'counterAxisSizingMode',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'itemSpacing'
  ],
  style: [
    'fills', 'strokes', 'effects', 'opacity', 'blendMode',
    'cornerRadius', 'strokeWeight'
  ],
  text: [
    'characters', 'fontSize', 'fontFamily', 'fontWeight',
    'lineHeight', 'letterSpacing', 'textAlignHorizontal'
  ],
  component: ['componentProperties', 'overrides'],
  constraints: ['constraints', 'layoutAlign', 'layoutGrow']
} as const;

/**
 * Properties to ignore in diff (noise)
 */
export const IGNORED_PROPERTIES = [
  'id',
  'boundVariables',
  'absoluteBoundingBox',
  'absoluteRenderBounds',
  'relativeTransform'
] as const;

/**
 * Maximum versions to keep in history (to manage disk space)
 */
export const MAX_HISTORY_VERSIONS = 10;
