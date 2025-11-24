/**
 * AltNode Types - Transformed Figma Nodes
 *
 * Enhanced version of FigmaNode with 23 property improvements from FigmaToCode.
 * These types represent processed nodes ready for code generation.
 *
 * CRITICAL Enhancements (5):
 * - isRelative (T090): Detect responsive/relative sizing
 * - cornerRadius (T091): Improved corner radius handling
 * - fillStyleId (T092): Better fill style references
 * - layoutMode (T093): Enhanced auto-layout detection
 * - strokeStyleId (T094): Improved stroke style references
 *
 * HIGH Priority Enhancements (12):
 * - T095-T106: Additional layout, style, and structural improvements
 */

import type { FigmaNode, FigmaNodeType, Paint, Effect, Color, Rectangle, LayoutMode, LayoutAlign, TypeStyle } from './figma';

// ============================================================================
// Size & Positioning Types
// ============================================================================

export type SizingMode = 'FIXED' | 'HUG' | 'FILL';

export interface AltRectangle extends Rectangle {
  readonly isRelative: boolean; // T090: Responsive sizing detection
}

// ============================================================================
// Enhanced Layout Types
// ============================================================================

export interface AltLayoutProperties {
  readonly layoutMode: LayoutMode | 'AUTO'; // T093: Enhanced auto-layout
  readonly primaryAxisSizingMode?: SizingMode;
  readonly counterAxisSizingMode?: SizingMode;
  readonly primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  readonly counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  readonly paddingLeft: number;
  readonly paddingRight: number;
  readonly paddingTop: number;
  readonly paddingBottom: number;
  readonly itemSpacing: number;
  readonly layoutAlign?: LayoutAlign;
  readonly layoutGrow?: number;
}

// ============================================================================
// Enhanced Style Types
// ============================================================================

export interface AltCornerRadius {
  readonly topLeft: number;
  readonly topRight: number;
  readonly bottomRight: number;
  readonly bottomLeft: number;
  readonly isUniform: boolean; // T091: Simplified corner radius detection
}

export interface AltStroke {
  readonly paints: readonly Paint[];
  readonly weight: number;
  readonly align: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  readonly styleId?: string; // T094: Stroke style references
}

export interface AltFill {
  readonly paints: readonly Paint[];
  readonly styleId?: string; // T092: Fill style references
}

// ============================================================================
// Enhanced Text Types
// ============================================================================

export interface AltTextStyle extends TypeStyle {
  readonly fills: readonly Paint[];
  readonly textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  readonly textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
}

// ============================================================================
// Base AltNode Interface
// ============================================================================

interface BaseAltNode {
  readonly id: string;
  readonly name: string;
  readonly type: FigmaNodeType;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity: number;
  readonly blendMode: string;

  // Enhanced positioning (T090)
  readonly absoluteBoundingBox: AltRectangle;
  readonly relativeTransform: readonly [
    readonly [number, number, number],
    readonly [number, number, number]
  ];

  // Enhanced effects
  readonly effects: readonly Effect[];

  // Parent reference for traversal
  readonly parent?: AltNode;

  // Original Figma node reference
  readonly originalNode: FigmaNode;
}

// ============================================================================
// Container Node Types
// ============================================================================

export interface AltFrameNode extends BaseAltNode {
  readonly type: 'FRAME';
  readonly children: readonly AltNode[];
  readonly layout: AltLayoutProperties;
  readonly fills: AltFill;
  readonly strokes: AltStroke;
  readonly cornerRadius: AltCornerRadius; // T091
  readonly clipsContent: boolean;
  readonly isComponent: boolean;
}

export interface AltGroupNode extends BaseAltNode {
  readonly type: 'GROUP';
  readonly children: readonly AltNode[];
  readonly isAutoLayout: boolean; // T093: Detect implicit auto-layout
}

// ============================================================================
// Leaf Node Types
// ============================================================================

export interface AltTextNode extends BaseAltNode {
  readonly type: 'TEXT';
  readonly characters: string;
  readonly style: AltTextStyle;
  readonly textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
  readonly maxLines?: number;
  readonly lineHeight: number | 'AUTO';
}

export interface AltRectangleNode extends BaseAltNode {
  readonly type: 'RECTANGLE';
  readonly fills: AltFill;
  readonly strokes: AltStroke;
  readonly cornerRadius: AltCornerRadius; // T091
}

export interface AltEllipseNode extends BaseAltNode {
  readonly type: 'ELLIPSE';
  readonly fills: AltFill;
  readonly strokes: AltStroke;
  readonly arcData?: {
    readonly startingAngle: number;
    readonly endingAngle: number;
    readonly innerRadius: number;
  };
}

export interface AltVectorNode extends BaseAltNode {
  readonly type: 'VECTOR';
  readonly fills: AltFill;
  readonly strokes: AltStroke;
  readonly strokeCap: 'NONE' | 'ROUND' | 'SQUARE';
  readonly strokeJoin: 'MITER' | 'BEVEL' | 'ROUND';
  readonly vectorData?: string;
}

// ============================================================================
// Component Node Types
// ============================================================================

export interface AltComponentNode extends BaseAltNode {
  readonly type: 'COMPONENT';
  readonly children: readonly AltNode[];
  readonly componentKey: string;
  readonly description?: string;
  readonly layout: AltLayoutProperties;
  readonly fills: AltFill;
  readonly strokes: AltStroke;
}

export interface AltInstanceNode extends BaseAltNode {
  readonly type: 'INSTANCE';
  readonly componentId: string;
  readonly componentKey?: string;
  readonly mainComponent?: AltComponentNode;
  readonly children: readonly AltNode[];
  readonly overrides: Record<string, unknown>;
}

// ============================================================================
// Union Type
// ============================================================================

export type AltNode =
  | AltFrameNode
  | AltGroupNode
  | AltTextNode
  | AltRectangleNode
  | AltEllipseNode
  | AltVectorNode
  | AltComponentNode
  | AltInstanceNode;

// ============================================================================
// Tree Structure Types
// ============================================================================

export interface AltSceneNode {
  readonly root: AltNode;
  readonly nodeMap: ReadonlyMap<string, AltNode>;
  readonly metadata: {
    readonly fileName: string;
    readonly lastModified: string;
    readonly version: string;
    readonly totalNodes: number;
  };
}

// ============================================================================
// Transformation Options
// ============================================================================

export interface TransformOptions {
  readonly preserveOriginal: boolean;
  readonly inferAutoLayout: boolean; // T093: Auto-layout inference
  readonly normalizeCornerRadius: boolean; // T091: Corner radius normalization
  readonly resolveStyleReferences: boolean; // T092, T094: Style ID resolution
  readonly detectRelativeSizing: boolean; // T090: Relative size detection
  readonly includeHiddenNodes: boolean;
  readonly maxDepth?: number;
}

export const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  preserveOriginal: true,
  inferAutoLayout: true,
  normalizeCornerRadius: true,
  resolveStyleReferences: true,
  detectRelativeSizing: true,
  includeHiddenNodes: false,
};

// ============================================================================
// Utility Types
// ============================================================================

export type AltNodeWithChildren = Extract<AltNode, { children: readonly AltNode[] }>;

export type AltLeafNode = Exclude<AltNode, { children: readonly AltNode[] }>;

export type AltContainerNode = AltFrameNode | AltGroupNode | AltComponentNode | AltInstanceNode;
