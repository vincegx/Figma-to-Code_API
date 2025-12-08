/**
 * AltNode Types
 *
 * Type definitions for the AltNode transformation engine.
 * VERBATIM from altnode-transform.ts
 */

import type { FigmaNode } from '../types/figma';

// Simple AltNode structure for transformation engine
export interface SimpleAltNode {
  id: string;
  name: string;
  uniqueName: string;
  type: string;
  originalType: string; // T177: Preserve original Figma type for TEXT detection
  styles: Record<string, string | number>;
  children: SimpleAltNode[];
  originalNode: FigmaNode;
  visible: boolean;
  canBeFlattened: boolean;
  cumulativeRotation: number;
  isIcon?: boolean;

  // T228: Add SVG data for VECTOR nodes
  svgData?: {
    fillGeometry?: any[];
    strokeGeometry?: any[];
    fills?: any[];
    strokes?: any[];
    strokeWeight?: number;
    bounds: { x: number; y: number; width: number; height: number };
  };

  // T230: Add image data for IMAGE fills (kept for backward compatibility)
  imageData?: {
    imageRef: string;
    nodeId: string;
    scaleMode: string;
  };

  // WP32: All fills in render order (bottom to top)
  // Enables rendering all layers like MCP does
  fillsData?: FillData[];

  // WP31: Negative itemSpacing handling (gap doesn't support negative values)
  // Store negative spacing so children can apply margin instead
  negativeItemSpacing?: number;
  layoutDirection?: 'row' | 'column';

  // WP38 Fix #23: Figma mask pattern support
  // When a GROUP has isMask: true on first child, masked children get this imageRef
  // The generator resolves the URL and applies CSS mask-image
  maskImageRef?: string;

  // WP08: Responsive styles for merge feature
  // Contains style overrides for tablet (md:) and desktop (lg:) breakpoints
  // Base styles in 'styles' field = mobile-first
  responsiveStyles?: {
    md?: Record<string, string | number>;  // Tablet overrides (md: prefix)
    lg?: Record<string, string | number>;  // Desktop overrides (lg: prefix)
  };

  // WP08: Presence tracking for merge feature
  // Indicates which breakpoints contained this element before merging
  presence?: {
    mobile: boolean;
    tablet: boolean;
    desktop: boolean;
  };
}

// WP32: Fill data structure for multi-layer rendering
export interface FillData {
  type: 'IMAGE' | 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  visible: boolean;
  opacity?: number;
  // For IMAGE fills
  imageRef?: string;
  scaleMode?: string;
  // For SOLID fills
  color?: { r: number; g: number; b: number; a?: number };
  // For GRADIENT fills
  gradientStops?: Array<{
    color: { r: number; g: number; b: number; a?: number };
    position: number;
  }>;
  gradientTransform?: number[][];
  gradientHandlePositions?: Array<{ x: number; y: number }>;
}
