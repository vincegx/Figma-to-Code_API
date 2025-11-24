/**
 * Base Figma API Types
 *
 * Matches official Figma REST API v1 response structure.
 * These types represent the raw data received from Figma API endpoints.
 */

// ============================================================================
// Discriminated Union Types
// ============================================================================

export type FigmaNodeType =
  | 'FRAME'
  | 'GROUP'
  | 'TEXT'
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'VECTOR'
  | 'COMPONENT'
  | 'INSTANCE';

export type PaintType =
  | 'SOLID'
  | 'GRADIENT_LINEAR'
  | 'GRADIENT_RADIAL'
  | 'IMAGE';

export type EffectType =
  | 'DROP_SHADOW'
  | 'INNER_SHADOW'
  | 'LAYER_BLUR'
  | 'BACKGROUND_BLUR';

export type ConstraintType =
  | 'MIN'
  | 'CENTER'
  | 'MAX'
  | 'STRETCH'
  | 'SCALE';

// ============================================================================
// Base Types
// ============================================================================

export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface Constraints {
  readonly horizontal: ConstraintType;
  readonly vertical: ConstraintType;
}

// ============================================================================
// Paint Types
// ============================================================================

interface BasePaint {
  readonly type: PaintType;
  readonly visible: boolean;
  readonly opacity: number;
}

export interface SolidPaint extends BasePaint {
  readonly type: 'SOLID';
  readonly color: Color;
}

export interface GradientStop {
  readonly position: number;
  readonly color: Color;
}

export interface GradientPaint extends BasePaint {
  readonly type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  readonly gradientStops: readonly GradientStop[];
}

export interface ImagePaint extends BasePaint {
  readonly type: 'IMAGE';
  readonly scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  readonly imageRef?: string;
}

export type Paint = SolidPaint | GradientPaint | ImagePaint;

// ============================================================================
// Effect Types
// ============================================================================

export interface Effect {
  readonly type: EffectType;
  readonly visible: boolean;
  readonly radius: number;
  readonly color?: Color;
  readonly offset?: {
    readonly x: number;
    readonly y: number;
  };
  readonly spread?: number;
}

// ============================================================================
// Style Types
// ============================================================================

export interface TypeStyle {
  readonly fontFamily: string;
  readonly fontWeight: number;
  readonly fontSize: number;
  readonly lineHeightPx: number;
  readonly letterSpacing: number;
  readonly textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  readonly textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
}

// ============================================================================
// Layout Types
// ============================================================================

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';

export type LayoutAlign = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH';

export interface LayoutGrid {
  readonly pattern: 'COLUMNS' | 'ROWS' | 'GRID';
  readonly sectionSize: number;
  readonly visible: boolean;
  readonly color: Color;
}

// ============================================================================
// Core Node Types
// ============================================================================

interface BaseFigmaNode {
  readonly id: string;
  readonly name: string;
  readonly type: FigmaNodeType;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity?: number;
  readonly blendMode?: string;
  readonly layoutAlign?: LayoutAlign;
  readonly layoutGrow?: number;
  readonly constraints?: Constraints;
  readonly absoluteBoundingBox?: Rectangle;
  readonly relativeTransform?: readonly [
    readonly [number, number, number],
    readonly [number, number, number]
  ];
  readonly effects?: readonly Effect[];
  readonly children?: readonly FigmaNode[];
}

export interface FrameNode extends BaseFigmaNode {
  readonly type: 'FRAME';
  readonly layoutMode?: LayoutMode;
  readonly primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  readonly counterAxisSizingMode?: 'FIXED' | 'AUTO';
  readonly primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  readonly counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  readonly paddingLeft?: number;
  readonly paddingRight?: number;
  readonly paddingTop?: number;
  readonly paddingBottom?: number;
  readonly itemSpacing?: number;
  readonly layoutGrids?: readonly LayoutGrid[];
  readonly fills?: readonly Paint[];
  readonly strokes?: readonly Paint[];
  readonly strokeWeight?: number;
  readonly strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  readonly cornerRadius?: number;
  readonly rectangleCornerRadii?: readonly [number, number, number, number];
  readonly children: readonly FigmaNode[];
}

export interface GroupNode extends BaseFigmaNode {
  readonly type: 'GROUP';
  readonly children: readonly FigmaNode[];
}

export interface TextNode extends BaseFigmaNode {
  readonly type: 'TEXT';
  readonly characters: string;
  readonly style: TypeStyle;
  readonly fills?: readonly Paint[];
}

export interface RectangleNode extends BaseFigmaNode {
  readonly type: 'RECTANGLE';
  readonly fills?: readonly Paint[];
  readonly strokes?: readonly Paint[];
  readonly strokeWeight?: number;
  readonly strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  readonly cornerRadius?: number;
  readonly rectangleCornerRadii?: readonly [number, number, number, number];
}

export interface EllipseNode extends BaseFigmaNode {
  readonly type: 'ELLIPSE';
  readonly fills?: readonly Paint[];
  readonly strokes?: readonly Paint[];
  readonly strokeWeight?: number;
  readonly strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
}

export interface VectorNode extends BaseFigmaNode {
  readonly type: 'VECTOR';
  readonly fills?: readonly Paint[];
  readonly strokes?: readonly Paint[];
  readonly strokeWeight?: number;
  readonly strokeCap?: 'NONE' | 'ROUND' | 'SQUARE';
  readonly strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
}

export interface ComponentNode extends BaseFigmaNode {
  readonly type: 'COMPONENT';
  readonly children: readonly FigmaNode[];
  readonly fills?: readonly Paint[];
  readonly strokes?: readonly Paint[];
}

export interface InstanceNode extends BaseFigmaNode {
  readonly type: 'INSTANCE';
  readonly componentId: string;
  readonly children?: readonly FigmaNode[];
}

export type FigmaNode =
  | FrameNode
  | GroupNode
  | TextNode
  | RectangleNode
  | EllipseNode
  | VectorNode
  | ComponentNode
  | InstanceNode;

// ============================================================================
// API Response Types
// ============================================================================

export interface FigmaFileResponse {
  readonly name: string;
  readonly lastModified: string;
  readonly thumbnailUrl: string;
  readonly version: string;
  readonly document: FigmaNode;
}

export interface FigmaNodeResponse {
  readonly nodes: Record<string, {
    readonly document: FigmaNode;
  }>;
}
