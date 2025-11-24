/**
 * Rule Engine - WP05
 *
 * Evaluates mapping rules against AltNodes with AND-logic selectors,
 * priority-based conflict resolution, and property provenance tracking.
 *
 * Core functions:
 * - evaluateRules(): Main entry point - evaluate all rules against a node
 * - selectorMatches(): AND-logic pattern matching
 * - resolveConflicts(): Priority-based property composition
 * - detectConflictSeverity(): Major vs minor conflict classification
 * - getPropertyProvenance(): Property attribution for Applied Rules Inspector
 */

import type { AltNode } from './types/altnode';
import type { Selector, SimpleMappingRule, SimpleRuleMatch } from './types/rules';

// ============================================================================
// Main Entry Point (T043)
// ============================================================================

/**
 * Evaluate all rules against a single AltNode
 * Returns array of matches ordered by priority (highest first)
 *
 * @param altNode - The node to evaluate rules against
 * @param rules - All available rules from rule library
 * @returns Array of SimpleRuleMatch objects with resolved properties
 */
export function evaluateRules(
  altNode: AltNode,
  rules: SimpleMappingRule[]
): SimpleRuleMatch[] {
  // Filter to matching rules
  const matchingRules = rules.filter(rule =>
    selectorMatches(altNode, rule.selector)
  );

  // Sort by priority (descending - highest first)
  const sortedMatches = matchingRules.sort((a, b) => b.priority - a.priority);

  // Resolve conflicts and build SimpleRuleMatch objects
  const resolvedMatches = resolveConflicts(sortedMatches, altNode);

  return resolvedMatches;
}

// ============================================================================
// Selector Matching - AND Logic (T044)
// ============================================================================

/**
 * Check if AltNode matches selector criteria (AND logic)
 * Returns true only if ALL selector properties match
 *
 * Examples:
 *   selector: { type: "FRAME", name: "Button" }
 *   → matches FRAME nodes with name "Button" only
 *
 *   selector: { type: "TEXT" }
 *   → matches all TEXT nodes
 *
 *   selector: { name: "Icon", width: { min: 16, max: 64 } }
 *   → matches nodes named "Icon" with width 16-64px
 *
 * @param altNode - The node to match against
 * @param selector - The selector criteria from rule
 * @returns true if ALL selector properties match
 */
export function selectorMatches(
  altNode: AltNode,
  selector: Selector
): boolean {
  // Type matching
  if (selector.type !== undefined && altNode.type !== selector.type) {
    return false;
  }

  // Name matching (exact match or regex)
  if (selector.name !== undefined) {
    if (typeof selector.name === 'string') {
      if (altNode.name !== selector.name) {
        return false;
      }
    } else if (selector.name instanceof RegExp) {
      if (!selector.name.test(altNode.name)) {
        return false;
      }
    }
  }

  // Width range matching
  if (selector.width !== undefined) {
    const nodeWidth = altNode.absoluteBoundingBox.width;
    if (typeof nodeWidth !== 'number') {
      return false;
    }
    if (selector.width.min !== undefined && nodeWidth < selector.width.min) {
      return false;
    }
    if (selector.width.max !== undefined && nodeWidth > selector.width.max) {
      return false;
    }
  }

  // Height range matching
  if (selector.height !== undefined) {
    const nodeHeight = altNode.absoluteBoundingBox.height;
    if (typeof nodeHeight !== 'number') {
      return false;
    }
    if (selector.height.min !== undefined && nodeHeight < selector.height.min) {
      return false;
    }
    if (selector.height.max !== undefined && nodeHeight > selector.height.max) {
      return false;
    }
  }

  // Children count matching
  if (selector.hasChildren !== undefined) {
    const hasChildren = 'children' in altNode && altNode.children.length > 0;
    if (selector.hasChildren !== hasChildren) {
      return false;
    }
  }

  // Parent type matching (if available in AltNode)
  if (selector.parentType !== undefined && altNode.parent) {
    if (altNode.parent.type !== selector.parentType) {
      return false;
    }
  }

  // All checks passed - selector matches
  return true;
}

// ============================================================================
// Conflict Resolution - Property-level Composition (T045)
// ============================================================================

/**
 * Resolve conflicts between multiple matching rules
 * Returns array of SimpleRuleMatch objects with property provenance
 *
 * Logic:
 * - Rules already sorted by priority (highest first)
 * - For each property, highest priority rule wins
 * - Track provenance (which rule contributed each property)
 * - Detect conflicts (multiple rules targeting same property)
 *
 * @param matchedRules - Array of rules that matched, sorted by priority
 * @param altNode - The node being evaluated (for context)
 * @returns Array of SimpleRuleMatch objects with resolved properties
 */
export function resolveConflicts(
  matchedRules: SimpleMappingRule[],
  altNode: AltNode
): SimpleRuleMatch[] {
  const ruleMatches: SimpleRuleMatch[] = [];
  const propertyOwnership: Map<string, string> = new Map(); // property name → rule ID

  // Process rules in priority order (highest first)
  for (const rule of matchedRules) {
    const contributedProperties: string[] = [];
    const ruleConflicts: string[] = [];

    // Check each transformer property
    for (const propName of Object.keys(rule.transformer)) {
      const existingOwner = propertyOwnership.get(propName);

      if (existingOwner === undefined) {
        // No conflict - this rule owns the property
        propertyOwnership.set(propName, rule.id);
        contributedProperties.push(propName);
      } else {
        // Conflict detected - higher priority rule already owns this property
        ruleConflicts.push(propName);
      }
    }

    // Build SimpleRuleMatch object
    const ruleMatch: SimpleRuleMatch = {
      ruleId: rule.id,
      ruleName: rule.name,
      priority: rule.priority,
      contributedProperties,
      conflicts: ruleConflicts,
      severity: ruleConflicts.length > 0 ? detectConflictSeverity(ruleConflicts) : 'none',
    };

    ruleMatches.push(ruleMatch);
  }

  return ruleMatches;
}

// ============================================================================
// Conflict Severity Detection (T046)
// ============================================================================

/**
 * Classify CSS properties by conflict severity
 *
 * MAJOR conflicts (red - layout-breaking):
 *   Layout: width, height, display, position, flexDirection, flex, grid
 *   Spacing: gap, padding, margin, top, right, bottom, left
 *   Auto-layout: alignItems, justifyContent, flexWrap
 *
 * MINOR conflicts (yellow - visual only):
 *   Colors: color, backgroundColor, borderColor
 *   Typography: fontSize, fontWeight, fontFamily, lineHeight
 *   Effects: boxShadow, opacity, transform, filter
 *   Borders: border, borderRadius, borderWidth
 */
const MAJOR_PROPERTIES = new Set([
  // Layout
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'display', 'position', 'flexDirection', 'flex', 'flexGrow', 'flexShrink',
  'grid', 'gridTemplateColumns', 'gridTemplateRows',

  // Spacing
  'gap', 'rowGap', 'columnGap',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'top', 'right', 'bottom', 'left',

  // Auto-layout
  'alignItems', 'justifyContent', 'alignContent', 'flexWrap',
]);

/**
 * Detect conflict severity based on property types
 *
 * @param conflictedProperties - Array of property names in conflict
 * @returns 'major' | 'minor' | 'none'
 */
export function detectConflictSeverity(
  conflictedProperties: readonly string[]
): 'major' | 'minor' | 'none' {
  if (conflictedProperties.length === 0) {
    return 'none';
  }

  const hasMajorConflict = conflictedProperties.some(prop =>
    MAJOR_PROPERTIES.has(prop)
  );

  return hasMajorConflict ? 'major' : 'minor';
}

// ============================================================================
// Property Provenance Tracking (T047)
// ============================================================================

/**
 * Build complete property provenance map for Applied Rules Inspector
 *
 * Returns map of CSS property → rule that contributed it
 * Example: { "backgroundColor": "rule-123", "padding": "rule-456" }
 *
 * @param ruleMatches - Array of SimpleRuleMatch objects from evaluateRules()
 * @returns Map of property name → rule ID
 */
export function getPropertyProvenance(
  ruleMatches: readonly SimpleRuleMatch[]
): Map<string, string> {
  const provenance = new Map<string, string>();

  for (const match of ruleMatches) {
    for (const property of match.contributedProperties) {
      provenance.set(property, match.ruleId);
    }
  }

  return provenance;
}
