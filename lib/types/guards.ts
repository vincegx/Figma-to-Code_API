/**
 * Type Guards and Runtime Validators
 *
 * Provides runtime type checking for TypeScript types.
 * Uses the `is` keyword for type narrowing.
 */

import type { FigmaNode, FigmaNodeType, FrameNode, GroupNode, TextNode, RectangleNode, EllipseNode, VectorNode, ComponentNode, InstanceNode, Paint, SolidPaint, GradientPaint, ImagePaint, Effect } from './figma';
import type { AltNode, AltFrameNode, AltGroupNode, AltTextNode, AltRectangleNode, AltEllipseNode, AltVectorNode, AltComponentNode, AltInstanceNode, AltNodeWithChildren, AltLeafNode } from './altnode';
import type { RuleCondition, CompositeCondition, MappingRule, RuleMatch } from './rules';
import type { GenerationSuccess, GenerationFailure, GenerationResult } from './code-generation';
import type { LibraryNode, LibraryNodeWithCode } from './library';

// ============================================================================
// Figma Node Type Guards
// ============================================================================

export function isFigmaNode(value: unknown): value is FigmaNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'type' in value &&
    'visible' in value &&
    typeof (value as FigmaNode).id === 'string' &&
    typeof (value as FigmaNode).name === 'string' &&
    typeof (value as FigmaNode).visible === 'boolean'
  );
}

export function isFrameNode(node: FigmaNode): node is FrameNode {
  return node.type === 'FRAME';
}

export function isGroupNode(node: FigmaNode): node is GroupNode {
  return node.type === 'GROUP';
}

export function isTextNode(node: FigmaNode): node is TextNode {
  return node.type === 'TEXT';
}

export function isRectangleNode(node: FigmaNode): node is RectangleNode {
  return node.type === 'RECTANGLE';
}

export function isEllipseNode(node: FigmaNode): node is EllipseNode {
  return node.type === 'ELLIPSE';
}

export function isVectorNode(node: FigmaNode): node is VectorNode {
  return node.type === 'VECTOR';
}

export function isComponentNode(node: FigmaNode): node is ComponentNode {
  return node.type === 'COMPONENT';
}

export function isInstanceNode(node: FigmaNode): node is InstanceNode {
  return node.type === 'INSTANCE';
}

export function hasChildren(node: FigmaNode): node is FrameNode | GroupNode | ComponentNode | InstanceNode {
  return 'children' in node && Array.isArray(node.children);
}

// ============================================================================
// Paint Type Guards
// ============================================================================

export function isPaint(value: unknown): value is Paint {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'visible' in value &&
    'opacity' in value
  );
}

export function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === 'SOLID';
}

export function isGradientPaint(paint: Paint): paint is GradientPaint {
  return paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL';
}

export function isImagePaint(paint: Paint): paint is ImagePaint {
  return paint.type === 'IMAGE';
}

// ============================================================================
// AltNode Type Guards
// ============================================================================

export function isAltNode(value: unknown): value is AltNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'type' in value &&
    'originalNode' in value &&
    typeof (value as AltNode).id === 'string' &&
    typeof (value as AltNode).name === 'string'
  );
}

export function isAltFrameNode(node: AltNode): node is AltFrameNode {
  return node.type === 'FRAME';
}

export function isAltGroupNode(node: AltNode): node is AltGroupNode {
  return node.type === 'GROUP';
}

export function isAltTextNode(node: AltNode): node is AltTextNode {
  return node.type === 'TEXT';
}

export function isAltRectangleNode(node: AltNode): node is AltRectangleNode {
  return node.type === 'RECTANGLE';
}

export function isAltEllipseNode(node: AltNode): node is AltEllipseNode {
  return node.type === 'ELLIPSE';
}

export function isAltVectorNode(node: AltNode): node is AltVectorNode {
  return node.type === 'VECTOR';
}

export function isAltComponentNode(node: AltNode): node is AltComponentNode {
  return node.type === 'COMPONENT';
}

export function isAltInstanceNode(node: AltNode): node is AltInstanceNode {
  return node.type === 'INSTANCE';
}

export function isAltNodeWithChildren(node: AltNode): node is AltNodeWithChildren {
  return 'children' in node && Array.isArray(node.children);
}

export function isAltLeafNode(node: AltNode): node is AltLeafNode {
  return !('children' in node);
}

// ============================================================================
// Rule Type Guards
// ============================================================================

export function isRuleCondition(condition: unknown): condition is RuleCondition {
  return (
    typeof condition === 'object' &&
    condition !== null &&
    'field' in condition &&
    'operator' in condition &&
    'value' in condition &&
    typeof (condition as RuleCondition).field === 'string' &&
    typeof (condition as RuleCondition).operator === 'string'
  );
}

export function isCompositeCondition(condition: unknown): condition is CompositeCondition {
  return (
    typeof condition === 'object' &&
    condition !== null &&
    'operator' in condition &&
    'conditions' in condition &&
    Array.isArray((condition as CompositeCondition).conditions) &&
    ['AND', 'OR', 'NOT'].includes((condition as CompositeCondition).operator)
  );
}

export function isMappingRule(value: unknown): value is MappingRule {
  return (
    typeof value === 'object' &&
    value !== null &&
    'metadata' in value &&
    'priority' in value &&
    'conditions' in value &&
    'template' in value &&
    typeof (value as MappingRule).metadata === 'object' &&
    (value as MappingRule).metadata !== null
  );
}

export function isRuleMatch(value: unknown): value is RuleMatch {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rule' in value &&
    'node' in value &&
    'confidence' in value &&
    typeof (value as RuleMatch).confidence === 'number' &&
    (value as RuleMatch).confidence >= 0 &&
    (value as RuleMatch).confidence <= 1
  );
}

// ============================================================================
// Generation Result Type Guards
// ============================================================================

export function isGenerationResult(value: unknown): value is GenerationResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    ((value as GenerationResult).status === 'success' || (value as GenerationResult).status === 'failure')
  );
}

export function isGenerationSuccess(result: GenerationResult): result is GenerationSuccess {
  return result.status === 'success';
}

export function isGenerationFailure(result: GenerationResult): result is GenerationFailure {
  return result.status === 'failure';
}

// ============================================================================
// Library Type Guards
// ============================================================================

export function isLibraryNode(value: unknown): value is LibraryNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'figmaNodeId' in value &&
    'name' in value &&
    'altNode' in value &&
    'tags' in value &&
    'addedAt' in value &&
    typeof (value as LibraryNode).id === 'string' &&
    typeof (value as LibraryNode).figmaNodeId === 'string' &&
    Array.isArray((value as LibraryNode).tags)
  );
}

export function isLibraryNodeWithCode(node: LibraryNode): node is LibraryNodeWithCode {
  return 'generatedCode' in node && 'ruleMatch' in node;
}

// ============================================================================
// Validation Utilities
// ============================================================================

export function isValidNodeType(type: string): type is FigmaNodeType {
  return [
    'FRAME',
    'GROUP',
    'TEXT',
    'RECTANGLE',
    'ELLIPSE',
    'VECTOR',
    'COMPONENT',
    'INSTANCE'
  ].includes(type);
}

export function isValidColor(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const color = value as { r?: unknown; g?: unknown; b?: unknown; a?: unknown };
  return (
    typeof color.r === 'number' &&
    typeof color.g === 'number' &&
    typeof color.b === 'number' &&
    typeof color.a === 'number' &&
    color.r >= 0 && color.r <= 1 &&
    color.g >= 0 && color.g <= 1 &&
    color.b >= 0 && color.b <= 1 &&
    color.a >= 0 && color.a <= 1
  );
}

export function isValidRectangle(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const rect = value as { x?: unknown; y?: unknown; width?: unknown; height?: unknown };
  return (
    typeof rect.x === 'number' &&
    typeof rect.y === 'number' &&
    typeof rect.width === 'number' &&
    typeof rect.height === 'number' &&
    rect.width >= 0 &&
    rect.height >= 0
  );
}

export function isValidEffect(value: unknown): value is Effect {
  if (typeof value !== 'object' || value === null) return false;
  const effect = value as Effect;
  return (
    'type' in effect &&
    'visible' in effect &&
    'radius' in effect &&
    typeof effect.visible === 'boolean' &&
    typeof effect.radius === 'number'
  );
}

// ============================================================================
// Array Type Guards
// ============================================================================

export function isFigmaNodeArray(value: unknown): value is readonly FigmaNode[] {
  return Array.isArray(value) && value.every(isFigmaNode);
}

export function isAltNodeArray(value: unknown): value is readonly AltNode[] {
  return Array.isArray(value) && value.every(isAltNode);
}

export function isPaintArray(value: unknown): value is readonly Paint[] {
  return Array.isArray(value) && value.every(isPaint);
}

export function isEffectArray(value: unknown): value is readonly Effect[] {
  return Array.isArray(value) && value.every(isValidEffect);
}

export function isRuleMatchArray(value: unknown): value is readonly RuleMatch[] {
  return Array.isArray(value) && value.every(isRuleMatch);
}

// ============================================================================
// Assertion Functions (throw on invalid)
// ============================================================================

export function assertFigmaNode(value: unknown): asserts value is FigmaNode {
  if (!isFigmaNode(value)) {
    throw new TypeError('Value is not a valid FigmaNode');
  }
}

export function assertAltNode(value: unknown): asserts value is AltNode {
  if (!isAltNode(value)) {
    throw new TypeError('Value is not a valid AltNode');
  }
}

export function assertMappingRule(value: unknown): asserts value is MappingRule {
  if (!isMappingRule(value)) {
    throw new TypeError('Value is not a valid MappingRule');
  }
}

export function assertLibraryNode(value: unknown): asserts value is LibraryNode {
  if (!isLibraryNode(value)) {
    throw new TypeError('Value is not a valid LibraryNode');
  }
}

// ============================================================================
// Validation Result Type
// ============================================================================

export interface ValidationResult<T> {
  readonly valid: boolean;
  readonly value?: T;
  readonly errors: readonly string[];
}

export function validate<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage: string
): ValidationResult<T> {
  if (guard(value)) {
    return {
      valid: true,
      value,
      errors: [],
    };
  }
  return {
    valid: false,
    errors: [errorMessage],
  };
}
