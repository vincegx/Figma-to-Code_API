/**
 * Mapping Rule Types
 *
 * Defines the rule engine for pattern matching and code generation.
 * Rules map Figma design patterns to code templates.
 */

import type { FigmaNodeType, LayoutMode } from './figma';
import type { AltNode } from './altnode';

// ============================================================================
// Rule Condition Types
// ============================================================================

export type ConditionOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'regex'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export interface RuleCondition {
  readonly field: string;
  readonly operator: ConditionOperator;
  readonly value: string | number | boolean | RegExp;
  readonly caseSensitive?: boolean;
}

export interface CompositeCondition {
  readonly operator: 'AND' | 'OR' | 'NOT';
  readonly conditions: readonly (RuleCondition | CompositeCondition)[];
}

export type Condition = RuleCondition | CompositeCondition;

// ============================================================================
// Rule Priority & Conflict Resolution
// ============================================================================

export type RulePriority = 'critical' | 'high' | 'medium' | 'low';

export type ConflictStrategy =
  | 'first-match' // Use first matching rule
  | 'highest-priority' // Use highest priority rule
  | 'most-specific' // Use rule with most conditions
  | 'merge'; // Merge all matching rules

// ============================================================================
// Code Template Types
// ============================================================================

export interface TemplateVariable {
  readonly name: string;
  readonly source: 'node' | 'style' | 'computed';
  readonly path: string; // JSONPath to extract value
  readonly transform?: string; // Name of transform function
  readonly defaultValue?: string | number | boolean;
}

export interface CodeTemplate {
  readonly language: 'tsx' | 'html' | 'vue' | 'swift';
  readonly template: string; // Mustache/Handlebars template
  readonly variables: readonly TemplateVariable[];
  readonly imports?: readonly string[];
  readonly wrappers?: {
    readonly before?: string;
    readonly after?: string;
  };
}

// ============================================================================
// Rule Metadata
// ============================================================================

export interface RuleMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly author?: string;
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly tags: readonly string[];
  readonly enabled: boolean;
}

// ============================================================================
// Core Mapping Rule
// ============================================================================

export interface MappingRule {
  readonly metadata: RuleMetadata;
  readonly priority: RulePriority;
  readonly conditions: Condition;
  readonly template: CodeTemplate;
  readonly conflictStrategy: ConflictStrategy;
  readonly allowNesting: boolean;
  readonly maxDepth?: number;
}

// ============================================================================
// Rule Match Results
// ============================================================================

export interface RuleMatch {
  readonly rule: MappingRule;
  readonly node: AltNode;
  readonly confidence: number; // 0-1 score
  readonly matchedConditions: readonly string[]; // Field paths that matched
  readonly variables: Record<string, unknown>; // Extracted template variables
  readonly priority: RulePriority;
}

export interface RuleConflict {
  readonly node: AltNode;
  readonly matches: readonly RuleMatch[];
  readonly resolvedMatch?: RuleMatch;
  readonly strategy: ConflictStrategy;
  readonly reason: string;
}

// ============================================================================
// Rule Evaluation Context
// ============================================================================

export interface EvaluationContext {
  readonly node: AltNode;
  readonly parent?: AltNode;
  readonly siblings: readonly AltNode[];
  readonly ancestors: readonly AltNode[];
  readonly depth: number;
  readonly nodeMap: ReadonlyMap<string, AltNode>;
}

// ============================================================================
// Rule Set Management
// ============================================================================

export interface RuleSet {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly rules: readonly MappingRule[];
  readonly defaultConflictStrategy: ConflictStrategy;
  readonly metadata: {
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly author?: string;
  };
}

export interface RuleSetImport {
  readonly source: string; // File path or URL
  readonly format: 'json' | 'yaml';
  readonly validation: {
    readonly strict: boolean;
    readonly allowPartial: boolean;
  };
}

export interface RuleSetExport {
  readonly destination: string;
  readonly format: 'json' | 'yaml';
  readonly includeMetadata: boolean;
  readonly prettyPrint: boolean;
}

// ============================================================================
// Built-in Rule Patterns
// ============================================================================

export interface ButtonPattern {
  readonly namePattern: RegExp;
  readonly hasBackground: boolean;
  readonly hasText: boolean;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly layoutMode?: LayoutMode;
}

export interface CardPattern {
  readonly nodeType: Extract<FigmaNodeType, 'FRAME' | 'COMPONENT'>;
  readonly hasShadow: boolean;
  readonly hasCornerRadius: boolean;
  readonly minChildren: number;
  readonly layoutMode: LayoutMode;
}

export interface InputPattern {
  readonly namePattern: RegExp;
  readonly hasTextNode: boolean;
  readonly hasBorder: boolean;
  readonly layoutMode?: LayoutMode;
}

export type BuiltInPattern = ButtonPattern | CardPattern | InputPattern;

// ============================================================================
// Rule Statistics & Analytics
// ============================================================================

export interface RuleStats {
  readonly ruleId: string;
  readonly totalMatches: number;
  readonly successfulMatches: number;
  readonly failedMatches: number;
  readonly averageConfidence: number;
  readonly conflictCount: number;
  readonly lastUsed?: string;
}

export interface RuleSetStats {
  readonly ruleSetId: string;
  readonly totalRules: number;
  readonly enabledRules: number;
  readonly disabledRules: number;
  readonly totalEvaluations: number;
  readonly ruleStats: readonly RuleStats[];
  readonly generatedAt: string;
}

// ============================================================================
// WP05 Rule Engine Types - Property-level composition approach
// ============================================================================

/**
 * Selector for WP05 Rule Engine (AND-logic matching)
 * All selector properties must match for rule to apply
 */
export interface Selector {
  readonly type?: FigmaNodeType;
  readonly name?: string | RegExp;
  readonly width?: { readonly min?: number; readonly max?: number };
  readonly height?: { readonly min?: number; readonly max?: number };
  readonly hasChildren?: boolean;
  readonly parentType?: FigmaNodeType;
}

/**
 * Simplified mapping rule for WP05 Rule Engine
 * Focuses on CSS property composition with priority-based conflict resolution
 */
export interface SimpleMappingRule {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  readonly selector: Selector;
  readonly transformer: Record<string, string | number>; // CSS properties
}

/**
 * Rule match result for WP05 Rule Engine
 * Tracks property provenance and conflict information
 */
export interface SimpleRuleMatch {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly priority: number;
  readonly contributedProperties: readonly string[];
  readonly conflicts: readonly string[];
  readonly severity: 'major' | 'minor' | 'none';
}
