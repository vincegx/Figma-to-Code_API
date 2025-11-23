/**
 * AltNode Type Definitions
 *
 * Normalized, CSS-familiar representation of Figma nodes
 * Computed on-the-fly from FigmaNode via altnode-transform.ts
 */

import type { FigmaNode } from './figma';

/**
 * Normalized node types
 */
export type AltNodeType = 'container' | 'text' | 'image' | 'group';

/**
 * Normalized node representation with CSS-like properties
 *
 * AltNodes are transient - not persisted, regenerated when Figma cache changes
 */
export interface AltNode {
  /** Unique ID (same as FigmaNode.id) */
  id: string;

  /** Human-readable name (same as FigmaNode.name) */
  name: string;

  /** Normalized node type */
  type: AltNodeType;

  /** CSS-like styling properties */
  styles: CSSProperties;

  /** Transformed child nodes */
  children?: AltNode[];

  /** Complete original Figma node for property lookup */
  originalNode: FigmaNode;

  /** Unique component name with collision suffix (e.g., Button_01) */
  uniqueName: string;

  /** Whether node can be flattened to SVG (icons, vectors) */
  canBeFlattened: boolean;

  /** Pre-rendered SVG string if canBeFlattened is true */
  svg?: string;

  /** Base64-encoded image data for IMAGE nodes */
  base64?: string;

  /** Rotation in degrees (converted from Figma's radians) */
  rotation?: number;

  /** Cumulative rotation inherited from GROUP parents */
  cumulativeRotation?: number;

  /** Visibility flag (defaults to true) */
  visible: boolean;

  /** Layout sizing behavior (auto-layout) */
  layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
  layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';

  /** Layout wrapping behavior (auto-layout) */
  layoutWrap?: 'WRAP' | 'NO_WRAP';

  /** Primary axis alignment (auto-layout) */
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';

  /** Counter axis alignment (auto-layout) */
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';

  /** Original Figma properties for reference (deprecated - use originalNode instead) */
  figmaProperties?: Record<string, unknown>;
}

/**
 * CSS properties with familiar naming
 *
 * Supports common CSS properties used in code generation
 * Uses string values for flexibility (e.g., "16px", "1rem", "auto")
 */
export interface CSSProperties {
  /** Display type */
  display?: 'flex' | 'block' | 'inline' | 'inline-block';

  /** Flex direction */
  flexDirection?: 'row' | 'column';

  /** Gap between flex items */
  gap?: string;

  /** Padding (shorthand or individual) */
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;

  /** Margin (shorthand or individual) */
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  /** Background */
  background?: string;
  backgroundColor?: string;

  /** Text color */
  color?: string;

  /** Border */
  border?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;

  /** Shadow */
  boxShadow?: string;

  /** Typography */
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  lineHeight?: string | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';

  /** Positioning */
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;

  /** Dimensions */
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;

  /** Z-index */
  zIndex?: number;

  /** Overflow */
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';

  /** Opacity */
  opacity?: number;

  /** Flexbox alignment */
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';

  /** Allow additional CSS properties */
  [key: string]: string | number | undefined;
}
