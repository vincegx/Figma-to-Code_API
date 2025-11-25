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

import type { SimpleAltNode } from './altnode-transform';
import type {
  Selector,
  SimpleMappingRule,
  SimpleRuleMatch,
  MultiFrameworkRule,
  FrameworkType,
  ResolvedProperties,
  MultiFrameworkRuleMatch
} from './types/rules';

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
  altNode: SimpleAltNode,
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
  altNode: SimpleAltNode,
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

  // Width range matching (access via originalNode)
  if (selector.width !== undefined) {
    const nodeWidth = altNode.originalNode?.absoluteBoundingBox?.width;
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

  // Height range matching (access via originalNode)
  if (selector.height !== undefined) {
    const nodeHeight = altNode.originalNode?.absoluteBoundingBox?.height;
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
    const hasChildren = altNode.children && altNode.children.length > 0;
    if (selector.hasChildren !== hasChildren) {
      return false;
    }
  }

  // Parent type matching - not available in SimpleAltNode, skip for now
  // TODO: Add parent reference to SimpleAltNode if needed
  if (selector.parentType !== undefined) {
    // Cannot match parent type without parent reference
    return false;
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
  altNode: SimpleAltNode
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

// ============================================================================
// WP17 Multi-Framework Rule Engine (T152)
// ============================================================================

/**
 * Evaluate multi-framework rules against a single AltNode for a specific framework
 *
 * @param altNode - The node to evaluate rules against
 * @param rules - All available multi-framework rules
 * @param framework - Target framework (react-tailwind, html-css, etc.)
 * @returns ResolvedProperties with merged properties, provenance, and conflicts
 */
export function evaluateMultiFrameworkRules(
  altNode: SimpleAltNode,
  rules: MultiFrameworkRule[],
  framework: FrameworkType
): ResolvedProperties {
  // Filter to rules that:
  // 1. Are enabled
  // 2. Have a transformer for the selected framework
  // 3. Match the selector
  const matchingRules = rules.filter(rule =>
    rule.enabled &&
    rule.transformers[framework] !== undefined &&
    selectorMatches(altNode, rule.selector)
  );

  // Sort by priority (descending - highest first)
  const sortedRules = matchingRules.sort((a, b) => b.priority - a.priority);

  // Resolve conflicts and build resolved properties
  return resolveMultiFrameworkConflicts(sortedRules, framework, altNode);
}

/**
 * Resolve conflicts between multiple matching multi-framework rules
 *
 * @param matchedRules - Array of rules that matched, sorted by priority
 * @param framework - Target framework
 * @param altNode - The node being evaluated (for context)
 * @returns ResolvedProperties with properties, provenance, and conflicts
 */
function resolveMultiFrameworkConflicts(
  matchedRules: MultiFrameworkRule[],
  framework: FrameworkType,
  altNode: SimpleAltNode
): ResolvedProperties {
  const properties: Record<string, string> = {};
  const provenance: Record<string, string> = {};
  const conflictMap: Map<string, Set<string>> = new Map(); // property → Set of rule IDs

  // Process rules in priority order (highest first)
  for (const rule of matchedRules) {
    const transformer = rule.transformers[framework];
    if (!transformer) continue;

    // Extract properties from transformer based on framework
    const ruleProperties = extractTransformerProperties(transformer, framework);

    for (const [propName, propValue] of Object.entries(ruleProperties)) {
      if (properties[propName] === undefined) {
        // No conflict - this rule owns the property
        properties[propName] = propValue;
        provenance[propName] = rule.id;
      } else {
        // Conflict detected - track it
        if (!conflictMap.has(propName)) {
          conflictMap.set(propName, new Set([provenance[propName]]));
        }
        conflictMap.get(propName)!.add(rule.id);
      }
    }
  }

  // Build conflicts array
  const conflicts = Array.from(conflictMap.entries()).map(([property, ruleIds]) => ({
    property,
    rules: Array.from(ruleIds)
  }));

  return {
    framework,
    properties,
    provenance,
    conflicts
  };
}

/**
 * Extract properties from a framework-specific transformer
 *
 * @param transformer - Framework-specific transformer object
 * @param framework - Target framework
 * @returns Record of property name → value
 */
function extractTransformerProperties(
  transformer: any,
  framework: FrameworkType
): Record<string, string> {
  const properties: Record<string, string> = {};

  switch (framework) {
    case 'react-tailwind':
      if (transformer.className) {
        properties.className = transformer.className;
      }
      if (transformer.htmlTag) {
        properties.htmlTag = transformer.htmlTag;
      }
      break;

    case 'html-css':
      if (transformer.cssProperties) {
        for (const [key, value] of Object.entries(transformer.cssProperties)) {
          properties[key] = String(value);
        }
      }
      if (transformer.cssClass) {
        properties.cssClass = transformer.cssClass;
      }
      if (transformer.htmlTag) {
        properties.htmlTag = transformer.htmlTag;
      }
      break;

    case 'react-inline':
      if (transformer.style) {
        for (const [key, value] of Object.entries(transformer.style)) {
          properties[key] = String(value);
        }
      }
      if (transformer.htmlTag) {
        properties.htmlTag = transformer.htmlTag;
      }
      break;

    case 'swift-ui':
      if (transformer.component) {
        properties.component = transformer.component;
      }
      if (transformer.modifiers) {
        properties.modifiers = (transformer.modifiers as string[]).join(' ');
      }
      break;

    case 'android-xml':
      if (transformer.viewType) {
        properties.viewType = transformer.viewType;
      }
      if (transformer.attributes) {
        for (const [key, value] of Object.entries(transformer.attributes)) {
          properties[key] = String(value);
        }
      }
      break;
  }

  return properties;
}

/**
 * Get multi-framework rule matches for Applied Rules Inspector
 *
 * @param altNode - The node to evaluate rules against
 * @param rules - All available multi-framework rules
 * @param framework - Target framework
 * @returns Array of MultiFrameworkRuleMatch objects
 */
export function getMultiFrameworkRuleMatches(
  altNode: SimpleAltNode,
  rules: MultiFrameworkRule[],
  framework: FrameworkType
): MultiFrameworkRuleMatch[] {
  // Filter to matching rules
  const matchingRules = rules.filter(rule =>
    rule.enabled &&
    rule.transformers[framework] !== undefined &&
    selectorMatches(altNode, rule.selector)
  );

  // Sort by priority (descending - highest first)
  const sortedRules = matchingRules.sort((a, b) => b.priority - a.priority);

  const ruleMatches: MultiFrameworkRuleMatch[] = [];
  const propertyOwnership: Map<string, string> = new Map(); // property name → rule ID

  // Process rules in priority order
  for (const rule of sortedRules) {
    const transformer = rule.transformers[framework];
    if (!transformer) continue;

    const ruleProperties = extractTransformerProperties(transformer, framework);
    const contributedProperties: string[] = [];
    const ruleConflicts: string[] = [];
    const ruleProvenance: Record<string, string> = {};

    for (const propName of Object.keys(ruleProperties)) {
      const existingOwner = propertyOwnership.get(propName);

      if (existingOwner === undefined) {
        // No conflict - this rule owns the property
        propertyOwnership.set(propName, rule.id);
        contributedProperties.push(propName);
        ruleProvenance[propName] = rule.id;
      } else {
        // Conflict detected
        ruleConflicts.push(propName);
      }
    }

    const ruleMatch: MultiFrameworkRuleMatch = {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.type,
      priority: rule.priority,
      framework,
      contributedProperties,
      conflicts: ruleConflicts,
      severity: ruleConflicts.length > 0 ? detectConflictSeverity(ruleConflicts) : 'none',
      provenance: ruleProvenance
    };

    ruleMatches.push(ruleMatch);
  }

  return ruleMatches;
}
