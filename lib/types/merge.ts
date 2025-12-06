/**
 * Responsive Merge Types
 *
 * Types for the responsive merge feature that combines 3 Figma nodes
 * (mobile, tablet, desktop) into a single responsive component.
 *
 * Source of truth: kitty-specs/002-responsive-merge-manager/data-model.md
 */

import type { FigmaNodeType } from './figma';
import type { FillData } from '../altnode-transform';

// ============================================================================
// Breakpoint Types
// ============================================================================

/**
 * Breakpoint identifiers for responsive design
 */
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/**
 * Default breakpoint widths in pixels
 */
export const BREAKPOINT_WIDTHS: Readonly<Record<Breakpoint, number>> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
} as const;

// ============================================================================
// Source Node Types
// ============================================================================

/**
 * A reference to a source Figma node with its assigned breakpoint
 */
export interface MergeSourceNode {
  /** Assigned breakpoint for this node */
  readonly breakpoint: Breakpoint;

  /** Reference to LibraryNode.id from 001 library */
  readonly nodeId: string;

  /** Node name snapshot at merge time (for display if node deleted) */
  readonly nodeName: string;

  /** Thumbnail data URL or path (snapshot at merge time) */
  readonly thumbnail?: string;

  /** Custom breakpoint width in pixels (default: mobile=375, tablet=768, desktop=1280) */
  readonly width: number;

  /** Timestamp when node was captured for merge */
  readonly snapshotAt: string;
}

// ============================================================================
// Merge Status & Core Entity
// ============================================================================

/**
 * Processing status of a merge
 */
export type MergeStatus = 'processing' | 'ready' | 'error';

/**
 * The primary entity representing a responsive merge configuration and result
 */
export interface Merge {
  /** Unique identifier (UUID v4) */
  readonly id: string;

  /** User-provided name for the merge */
  readonly name: string;

  /** Processing status */
  readonly status: MergeStatus;

  /** The 3 source nodes (mobile, tablet, desktop) */
  readonly sourceNodes: readonly [MergeSourceNode, MergeSourceNode, MergeSourceNode];

  /** Merge result (populated when status = 'ready') */
  readonly result?: MergeResult;

  /** Error message (populated when status = 'error') */
  readonly error?: string;

  /** Creation timestamp */
  readonly createdAt: string;

  /** Last update timestamp */
  readonly updatedAt: string;
}

// ============================================================================
// Merge Result Types
// ============================================================================

/**
 * The output of the merge process
 */
export interface MergeResult {
  /** The unified component tree with responsive styles */
  readonly unifiedTree: UnifiedElement;

  /** Generated code for each framework */
  readonly generatedCode: {
    readonly 'react-tailwind': string;
    readonly 'react-tailwind-v4': string;
    readonly 'html-css': string;
  };

  /** WP08: Google Fonts URL for fonts used in the design */
  readonly googleFontsUrl?: string;

  /** Warnings generated during merge */
  readonly warnings: readonly MergeWarning[];

  /** Merge statistics */
  readonly stats: MergeStats;

  /** Timestamp when merge was computed */
  readonly computedAt: string;
}

/**
 * Supported framework types for code generation
 */
export type FrameworkType = keyof MergeResult['generatedCode'];

// ============================================================================
// Unified Element Types
// ============================================================================

/**
 * Source element reference for debugging
 */
export interface ElementSource {
  readonly nodeId: string;
  readonly name: string;
}

/**
 * Image data for a specific breakpoint
 */
export interface BreakpointImageData {
  readonly imageRef: string;
  readonly nodeId: string;
  readonly scaleMode: string;
}

/**
 * SVG data for a specific breakpoint
 */
export interface BreakpointSvgData {
  readonly fillGeometry?: unknown[];
  readonly strokeGeometry?: unknown[];
  readonly fills?: unknown[];
  readonly strokes?: unknown[];
  readonly strokeWeight?: number;
  readonly bounds: { x: number; y: number; width: number; height: number };
}

/**
 * Assets (images, SVG, fills) for a specific breakpoint
 */
export interface BreakpointAssets {
  readonly fillsData?: readonly FillData[];
  readonly imageData?: BreakpointImageData;
  readonly svgData?: BreakpointSvgData;
}

/**
 * Assets organized by breakpoint for responsive rendering
 * When assets differ between breakpoints, all are kept with visibility classes
 */
export interface ResponsiveAssets {
  readonly mobile?: BreakpointAssets;
  readonly tablet?: BreakpointAssets;
  readonly desktop?: BreakpointAssets;
  /** True if assets are identical across all breakpoints (optimization) */
  readonly isUniform: boolean;
}

/**
 * A node in the unified component tree with responsive style mappings
 */
export interface UnifiedElement {
  /** Element identifier (derived from layer name) */
  readonly id: string;

  /** Original layer name (disambiguated with suffix if duplicate) */
  readonly name: string;

  /** Element type from Figma */
  readonly type: FigmaNodeType;

  /** Which breakpoints contain this element */
  readonly presence: {
    readonly mobile: boolean;
    readonly tablet: boolean;
    readonly desktop: boolean;
  };

  /** Visibility classes based on presence */
  readonly visibilityClasses: string;

  /** Responsive style mappings */
  readonly styles: ResponsiveStyles;

  /**
   * Pre-merged Tailwind classes ready for code generation.
   * Contains base classes + md: overrides + lg: overrides already combined.
   * Example: "flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8"
   */
  readonly mergedTailwindClasses: string;

  /**
   * Assets (images, SVG, fills) organized by breakpoint.
   * When assets differ between breakpoints, all are preserved with visibility classes.
   */
  readonly assets?: ResponsiveAssets;

  /** Text content (if TEXT node) - uses mobile as base */
  readonly textContent?: string;

  /** Child elements (for container types) */
  readonly children?: readonly UnifiedElement[];

  /** Source element references for debugging */
  readonly sources: {
    readonly mobile?: ElementSource;
    readonly tablet?: ElementSource;
    readonly desktop?: ElementSource;
  };
}

// ============================================================================
// Responsive Styles Types
// ============================================================================

/**
 * Tailwind classes organized by breakpoint
 */
export interface ResponsiveStyles {
  /** Base styles (mobile-first, no prefix) */
  readonly base: string;

  /** Tablet overrides (md: prefix) */
  readonly tablet?: string;

  /** Desktop overrides (lg: prefix) */
  readonly desktop?: string;

  /** Combined class string for output */
  readonly combined: string;
}

// ============================================================================
// Warning Types
// ============================================================================

/**
 * Types of warnings that can be generated during merge
 */
export type WarningType =
  | 'unmatched-element'      // Element exists in only some breakpoints
  | 'text-content-mismatch'  // Text differs across breakpoints
  | 'structure-mismatch'     // Different child structures
  | 'source-node-deleted'    // Source node no longer in library
  | 'duplicate-layer-name';  // Layer name was disambiguated

/**
 * A warning generated during merge process
 */
export interface MergeWarning {
  readonly type: WarningType;
  readonly message: string;
  readonly elementName?: string;
  readonly breakpoints?: readonly Breakpoint[];
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Statistics about the merge operation
 */
export interface MergeStats {
  /** Total elements in unified tree */
  readonly totalElements: number;

  /** Elements present in all 3 breakpoints */
  readonly commonElements: number;

  /** Elements unique to specific breakpoints */
  readonly uniqueElements: {
    readonly mobile: number;
    readonly tablet: number;
    readonly desktop: number;
  };

  /** Style differences detected */
  readonly styleOverrides: {
    readonly tablet: number;
    readonly desktop: number;
  };

  /** Number of warnings generated */
  readonly warningCount: number;

  /** Processing time in milliseconds */
  readonly processingTimeMs: number;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Lightweight representation for library list view
 */
export interface MergeListItem {
  readonly id: string;
  readonly name: string;
  readonly status: MergeStatus;
  readonly sourceNodes: readonly {
    readonly breakpoint: Breakpoint;
    readonly nodeName: string;
    readonly thumbnail?: string;
  }[];
  readonly warningCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Source node input for creating a merge
 */
export interface SourceNodeInput {
  readonly breakpoint: Breakpoint;
  readonly nodeId: string;
  /** Custom width in pixels (optional, defaults: mobile=375, tablet=768, desktop=1280) */
  readonly width?: number;
}

/**
 * Request body for creating a new merge
 */
export interface CreateMergeRequest {
  /** User-provided name for the merge */
  readonly name: string;

  /** Source node assignments (one per breakpoint) */
  readonly sourceNodes: readonly [
    SourceNodeInput & { readonly breakpoint: 'mobile' },
    SourceNodeInput & { readonly breakpoint: 'tablet' },
    SourceNodeInput & { readonly breakpoint: 'desktop' }
  ];
}

/**
 * Options for listing merges
 */
export interface ListMergesOptions {
  readonly search?: string;
  readonly status?: MergeStatus;
  readonly sort?: 'name' | 'createdAt' | 'updatedAt';
  readonly order?: 'asc' | 'desc';
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a merge is ready (has result)
 */
export function isMergeReady(merge: Merge): merge is Merge & { status: 'ready'; result: MergeResult } {
  return merge.status === 'ready' && merge.result !== undefined;
}

/**
 * Type guard to check if a merge has an error
 */
export function isMergeError(merge: Merge): merge is Merge & { status: 'error'; error: string } {
  return merge.status === 'error' && merge.error !== undefined;
}

/**
 * Type guard to check if a merge is processing
 */
export function isMergeProcessing(merge: Merge): merge is Merge & { status: 'processing' } {
  return merge.status === 'processing';
}

/**
 * Validate that a breakpoint value is valid
 */
export function isValidBreakpoint(value: string): value is Breakpoint {
  return value === 'mobile' || value === 'tablet' || value === 'desktop';
}

/**
 * Validate that a merge status value is valid
 */
export function isValidMergeStatus(value: string): value is MergeStatus {
  return value === 'processing' || value === 'ready' || value === 'error';
}
