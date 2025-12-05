/**
 * WP47: Code Generator Types for React Props Generation
 *
 * Types for collecting props during AltNode traversal and generating
 * TypeScript interfaces for React components.
 */

/**
 * Represents a collected prop from a TEXT or IMAGE node
 */
export interface CollectedProp {
  /** camelCase prop name (e.g., "heroImage", "title") */
  name: string;
  /** Type of content: text or image */
  type: 'text' | 'image';
  /** Default value (original text content or image src) */
  defaultValue: string;
  /** Original Figma layer name for debugging */
  layerName: string;
  /** Unique node ID for lookup */
  nodeId: string;
}

/**
 * Options for code generation
 */
export interface GenerateOptions {
  /** Generate with props interface (true) or inline values (false) */
  withProps?: boolean;
}
