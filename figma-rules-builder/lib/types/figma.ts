/**
 * Figma API Type Definitions
 *
 * Based on Figma REST API v1 (2025-11-23)
 * Source: https://www.figma.com/developers/api#get-files-endpoint
 */

/**
 * Figma node types supported by the Rule Builder
 */
export type FigmaNodeType =
  | 'FRAME'
  | 'GROUP'
  | 'TEXT'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'VECTOR'
  | 'COMPONENT'
  | 'INSTANCE';

/**
 * Auto-layout direction
 */
export type LayoutMode = 'HORIZONTAL' | 'VERTICAL' | null;

/**
 * Main Figma node interface representing a design element
 * Cached locally in figma-data/{node-id}.json
 */
export interface FigmaNode {
  /** Unique Figma node ID (format: "fileId:nodeId") */
  id: string;

  /** Human-readable node name from Figma */
  name: string;

  /** Node type determining rendering behavior */
  type: FigmaNodeType;

  /** Child nodes (nested hierarchy) */
  children?: FigmaNode[];

  /** Auto-layout direction (null for non-auto-layout) */
  layoutMode?: LayoutMode;

  /** Gap between children in auto-layout (pixels) */
  itemSpacing?: number;

  /** Layout sizing behavior (auto-layout) */
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';

  /** Layout wrapping behavior (auto-layout) */
  layoutWrap?: 'WRAP' | 'NO_WRAP';

  /** Primary axis alignment (auto-layout) */
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

  /** Counter axis alignment (auto-layout) */
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';

  /** Left padding (pixels) */
  paddingLeft?: number;

  /** Right padding (pixels) */
  paddingRight?: number;

  /** Top padding (pixels) */
  paddingTop?: number;

  /** Bottom padding (pixels) */
  paddingBottom?: number;

  /** Background fills (colors, gradients, images) */
  fills?: Paint[];

  /** Border strokes */
  strokes?: Paint[];

  /** Individual stroke weights for variable borders */
  strokeTopWeight?: number;
  strokeBottomWeight?: number;
  strokeLeftWeight?: number;
  strokeRightWeight?: number;

  /** Visual effects (shadows, blurs) */
  effects?: Effect[];

  /** Text font size (TEXT nodes only) */
  fontSize?: number;

  /** Text font family (TEXT nodes only) */
  fontFamily?: string;

  /** Text content (TEXT nodes only) */
  characters?: string;

  /** Absolute position and size in Figma canvas */
  absoluteBoundingBox?: Rectangle;

  /** Layout constraints for responsive behavior */
  constraints?: Constraints;

  /** Rotation angle in degrees */
  rotation?: number;

  /** Visibility flag (hidden elements) */
  visible?: boolean;

  /** Blend mode for compositing */
  blendMode?: 'NORMAL' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY' | string;

  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Figma paint (fill or stroke)
 */
export interface Paint {
  /** Paint type */
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';

  /** Color (for SOLID and gradients) */
  color?: Color;

  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * RGBA color with normalized values
 */
export interface Color {
  /** Red channel (0-1) */
  r: number;

  /** Green channel (0-1) */
  g: number;

  /** Blue channel (0-1) */
  b: number;

  /** Alpha channel (0-1) */
  a: number;
}

/**
 * Visual effect (shadow or blur)
 */
export interface Effect {
  /** Effect type */
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR';

  /** Effect color (for shadows) */
  color?: Color;

  /** Shadow offset */
  offset?: { x: number; y: number };

  /** Blur radius (pixels) */
  radius?: number;
}

/**
 * Bounding box rectangle
 */
export interface Rectangle {
  /** X coordinate */
  x: number;

  /** Y coordinate */
  y: number;

  /** Width */
  width: number;

  /** Height */
  height: number;
}

/**
 * Layout constraints for responsive behavior
 */
export interface Constraints {
  /** Horizontal constraint */
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';

  /** Vertical constraint */
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
}
