/**
 * Mapping Rule Type Definitions
 *
 * User-authored rules that select AltNodes and define output transformations
 * Persisted in mapping-rules.json
 */

import type { AltNodeType } from './altnode';

/**
 * User-defined mapping rule
 *
 * Rules match AltNodes via selector pattern and define code generation transformations
 */
export interface MappingRule {
  /** Unique rule identifier */
  id: string;

  /** Human-readable rule name */
  name: string;

  /** Pattern to match AltNodes */
  selector: Selector;

  /** Output structure definition */
  transformer: Transformer;

  /**
   * Conflict resolution priority
   * Higher priority wins when multiple rules match the same property
   */
  priority: number;

  /** Whether rule is active (default: true) */
  enabled?: boolean;

  /** Documentation for rule purpose */
  description?: string;
}

/**
 * Pattern matching criteria for AltNodes
 *
 * All specified properties must match (AND logic)
 */
export interface Selector {
  /** Match specific node type */
  nodeType?: AltNodeType;

  /** Match layout direction */
  layoutMode?: 'horizontal' | 'vertical';

  /** Match nodes with/without children */
  hasChildren?: boolean;

  /** Match specific CSS properties */
  customProperties?: Record<string, unknown>;
}

/**
 * Output transformation definition
 *
 * Defines HTML structure and styling for matched nodes
 */
export interface Transformer {
  /** HTML tag to generate (e.g., "div", "button", "span") */
  htmlTag: string;

  /** CSS classes to apply (for Tailwind or external CSS) */
  cssClasses?: string[];

  /** Inline CSS properties */
  inlineStyles?: Record<string, string>;

  /** HTML attributes (e.g., { "aria-label": "Button" }) */
  attributes?: Record<string, string>;
}

/**
 * Result of matching a rule against an AltNode
 *
 * Tracks which properties each rule contributes
 */
export interface RuleMatch {
  /** ID of matched rule */
  ruleId: string;

  /** Rule priority (from MappingRule) */
  priority: number;

  /** CSS properties contributed by this rule */
  contributedProperties: Record<string, string>;

  /** IDs of rules with conflicting properties */
  conflictsWith?: string[];

  /** Severity of detected conflicts */
  conflictSeverity?: ConflictSeverity;
}

/**
 * Conflict severity classification
 *
 * - minor: Same property, compatible values
 * - major: Incompatible properties (e.g., display: flex vs block)
 */
export type ConflictSeverity = 'minor' | 'major';

/**
 * Result of conflict resolution
 *
 * Shows final CSS properties and which rule contributed each property
 */
export interface ResolvedProperties {
  /** Final CSS properties after conflict resolution */
  resolved: Record<string, string>;

  /** Mapping of property → rule ID that provided it */
  propertyProvenance: Record<string, string>;
}
