/**
 * Split Components Types
 *
 * Types for the "Split into Components" feature that allows users
 * to extract multiple React components from a Figma node.
 */

// ============================================================================
// Detection Types
// ============================================================================

/**
 * A detected component candidate from the Smart Detection algorithm
 */
export interface DetectedComponent {
  /** Figma node ID */
  readonly id: string;
  /** Node name from Figma */
  readonly name: string;
  /** Figma node type (FRAME, INSTANCE, COMPONENT, GROUP) */
  readonly type: string;
  /** Total number of child nodes (recursive) */
  readonly nodeCount: number;
  /** Depth from root (1 = direct children) */
  readonly depth: number;
  /** Quality score for component candidacy (higher = better) */
  readonly score: number;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Supported React frameworks for split export
 */
export type SplitFramework = 'react-tailwind' | 'react-tailwind-v4';

/**
 * Request body for split export API
 */
export interface SplitExportRequest {
  /** Root node ID containing the components */
  readonly nodeId: string;
  /** IDs of selected components to export */
  readonly componentIds: readonly string[];
  /** Target framework */
  readonly framework: SplitFramework;
  /** Export language (typescript or javascript) */
  readonly language: 'typescript' | 'javascript';
}

/**
 * A single exported component file
 */
export interface ExportedFile {
  /** Filename (e.g., "Header.tsx") */
  readonly filename: string;
  /** File content */
  readonly content: string;
  /** File size in bytes */
  readonly size: number;
}

/**
 * Result of split export operation
 */
export interface SplitExportResult {
  /** Whether export succeeded */
  readonly success: boolean;
  /** List of exported files */
  readonly files: readonly ExportedFile[];
  /** Total ZIP size in bytes */
  readonly totalSize: number;
  /** Error message if failed */
  readonly error?: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Result of validating user selection
 */
export interface ValidationResult {
  /** Whether selection is valid for export */
  readonly valid: boolean;
  /** Blocking errors */
  readonly errors: readonly string[];
  /** Non-blocking warnings */
  readonly warnings: readonly string[];
  /** Cleaned selection (parent/child overlaps removed) */
  readonly cleanedSelection: readonly string[];
}

// ============================================================================
// Modal State Types
// ============================================================================

/**
 * Current step in the split modal
 */
export type SplitModalStep = 'detection' | 'tree-explorer' | 'exporting' | 'complete';

// ============================================================================
// Constants
// ============================================================================

/** Minimum nodes for a component to be detected */
export const MIN_COMPONENT_NODES = 3;

/** Maximum components that can be selected */
export const MAX_SELECTED_COMPONENTS = 20;

/** Maximum depth for detection traversal */
export const MAX_DETECTION_DEPTH = 4;

/** Minimum score for component detection */
export const MIN_DETECTION_SCORE = 40;

/** Warning threshold for large components */
export const LARGE_COMPONENT_THRESHOLD = 200;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for valid split framework
 */
export function isValidSplitFramework(value: string): value is SplitFramework {
  return value === 'react-tailwind' || value === 'react-tailwind-v4';
}
