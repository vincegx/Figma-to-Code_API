/**
 * Runtime Type Guards and Validation
 *
 * Provides type-safe runtime validation for external data
 * (Figma API responses, user-authored rules, etc.)
 */

import type {
  FigmaNode,
  FigmaNodeType,
  Paint,
  Color,
  Effect,
} from '../types/figma';
import type { AltNode, AltNodeType } from '../types/altnode';
import type { MappingRule, Selector, Transformer } from '../types/rule';
import type { GeneratedCode, CodeFormat } from '../types/generated-code';

/**
 * Valid Figma node types
 */
const FIGMA_NODE_TYPES: ReadonlySet<string> = new Set([
  'FRAME',
  'GROUP',
  'TEXT',
  'RECTANGLE',
  'ELLIPSE',
  'VECTOR',
  'COMPONENT',
  'INSTANCE',
]);

/**
 * Valid AltNode types
 */
const ALT_NODE_TYPES: ReadonlySet<string> = new Set([
  'container',
  'text',
  'image',
  'group',
]);

/**
 * Valid code generation formats
 */
const CODE_FORMATS: ReadonlySet<string> = new Set([
  'react-jsx',
  'react-tailwind',
  'html-css',
]);

/**
 * Type guard for FigmaNodeType
 */
export function isFigmaNodeType(value: unknown): value is FigmaNodeType {
  return typeof value === 'string' && FIGMA_NODE_TYPES.has(value);
}

/**
 * Type guard for AltNodeType
 */
export function isAltNodeType(value: unknown): value is AltNodeType {
  return typeof value === 'string' && ALT_NODE_TYPES.has(value);
}

/**
 * Type guard for CodeFormat
 */
export function isCodeFormat(value: unknown): value is CodeFormat {
  return typeof value === 'string' && CODE_FORMATS.has(value);
}

/**
 * Type guard for Color
 */
export function isColor(value: unknown): value is Color {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.r === 'number' &&
    typeof obj.g === 'number' &&
    typeof obj.b === 'number' &&
    typeof obj.a === 'number' &&
    obj.r >= 0 &&
    obj.r <= 1 &&
    obj.g >= 0 &&
    obj.g <= 1 &&
    obj.b >= 0 &&
    obj.b <= 1 &&
    obj.a >= 0 &&
    obj.a <= 1
  );
}

/**
 * Type guard for Paint
 */
export function isPaint(value: unknown): value is Paint {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.type !== 'string') {
    return false;
  }

  const validPaintTypes = new Set([
    'SOLID',
    'GRADIENT_LINEAR',
    'GRADIENT_RADIAL',
    'IMAGE',
  ]);

  if (!validPaintTypes.has(obj.type)) {
    return false;
  }

  if (obj.color !== undefined && !isColor(obj.color)) {
    return false;
  }

  if (obj.opacity !== undefined && typeof obj.opacity !== 'number') {
    return false;
  }

  return true;
}

/**
 * Type guard for Effect
 */
export function isEffect(value: unknown): value is Effect {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.type !== 'string') {
    return false;
  }

  const validEffectTypes = new Set([
    'DROP_SHADOW',
    'INNER_SHADOW',
    'LAYER_BLUR',
  ]);

  return validEffectTypes.has(obj.type);
}

/**
 * Type guard for FigmaNode
 */
export function isFigmaNode(value: unknown): value is FigmaNode {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    return false;
  }

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    return false;
  }

  if (!isFigmaNodeType(obj.type)) {
    return false;
  }

  // Check optional arrays
  if (obj.children !== undefined) {
    if (!Array.isArray(obj.children)) {
      return false;
    }
    // Recursive check would be expensive, skip for performance
  }

  if (obj.fills !== undefined) {
    if (!Array.isArray(obj.fills)) {
      return false;
    }
  }

  if (obj.strokes !== undefined) {
    if (!Array.isArray(obj.strokes)) {
      return false;
    }
  }

  if (obj.effects !== undefined) {
    if (!Array.isArray(obj.effects)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for AltNode
 */
export function isAltNode(value: unknown): value is AltNode {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    return false;
  }

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    return false;
  }

  if (!isAltNodeType(obj.type)) {
    return false;
  }

  if (typeof obj.styles !== 'object' || obj.styles === null) {
    return false;
  }

  // Check optional children array
  if (obj.children !== undefined && !Array.isArray(obj.children)) {
    return false;
  }

  return true;
}

/**
 * Type guard for Selector
 */
export function isSelector(value: unknown): value is Selector {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Selector can be empty, but if properties exist they must be valid
  if (obj.nodeType !== undefined && !isAltNodeType(obj.nodeType)) {
    return false;
  }

  if (
    obj.layoutMode !== undefined &&
    obj.layoutMode !== 'horizontal' &&
    obj.layoutMode !== 'vertical'
  ) {
    return false;
  }

  if (obj.hasChildren !== undefined && typeof obj.hasChildren !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Type guard for Transformer
 */
export function isTransformer(value: unknown): value is Transformer {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // htmlTag is required
  if (typeof obj.htmlTag !== 'string' || obj.htmlTag.length === 0) {
    return false;
  }

  // Optional arrays and objects
  if (obj.cssClasses !== undefined && !Array.isArray(obj.cssClasses)) {
    return false;
  }

  if (
    obj.inlineStyles !== undefined &&
    (typeof obj.inlineStyles !== 'object' || obj.inlineStyles === null)
  ) {
    return false;
  }

  if (
    obj.attributes !== undefined &&
    (typeof obj.attributes !== 'object' || obj.attributes === null)
  ) {
    return false;
  }

  return true;
}

/**
 * Type guard for MappingRule
 */
export function isMappingRule(value: unknown): value is MappingRule {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    return false;
  }

  if (typeof obj.name !== 'string' || obj.name.length === 0) {
    return false;
  }

  if (!isSelector(obj.selector)) {
    return false;
  }

  if (!isTransformer(obj.transformer)) {
    return false;
  }

  if (typeof obj.priority !== 'number' || obj.priority < 0) {
    return false;
  }

  // Check optional fields
  if (obj.enabled !== undefined && typeof obj.enabled !== 'boolean') {
    return false;
  }

  if (obj.description !== undefined && typeof obj.description !== 'string') {
    return false;
  }

  return true;
}

/**
 * Type guard for GeneratedCode
 */
export function isGeneratedCode(value: unknown): value is GeneratedCode {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Check required fields
  if (!isCodeFormat(obj.format)) {
    return false;
  }

  if (typeof obj.code !== 'string') {
    return false;
  }

  if (typeof obj.language !== 'string' || obj.language.length === 0) {
    return false;
  }

  // Check optional fields
  if (obj.styles !== undefined && typeof obj.styles !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validates that a numeric value is non-negative
 */
export function isNonNegative(value: number): boolean {
  return typeof value === 'number' && value >= 0;
}

/**
 * Validates a Figma node ID format (fileId:nodeId)
 */
export function isValidFigmaNodeId(id: string): boolean {
  return /^[a-zA-Z0-9]+:[a-zA-Z0-9]+$/.test(id);
}
