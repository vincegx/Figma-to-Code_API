/**
 * Rule Engine for Figma-to-Code Mapping
 *
 * Matches AltNodes against user-defined rules and resolves property conflicts
 * Performance target: <10ms for 50 rules × 100 nodes
 */

import type { AltNode } from './types/altnode';
import type {
  MappingRule,
  Selector,
  RuleMatch,
  ResolvedProperties,
  ConflictSeverity,
} from './types/rule';

/**
 * Evaluate all rules against an AltNode and return matches
 *
 * @param altNode - The node to match against
 * @param rules - Array of mapping rules to evaluate
 * @returns Sorted array of matches (highest priority first)
 *
 * @example
 * const matches = evaluateRules(altNode, rules);
 * // matches[0] is highest priority rule
 */
export function evaluateRules(
  altNode: AltNode,
  rules: MappingRule[]
): RuleMatch[] {
  const matches: RuleMatch[] = [];

  // Filter to enabled rules
  const enabledRules = rules.filter((rule) => rule.enabled !== false);

  // Match each rule against the node
  for (const rule of enabledRules) {
    if (selectorMatches(altNode, rule.selector)) {
      // Extract properties from transformer
      const contributedProperties = extractContributedProperties(
        rule.transformer
      );

      matches.push({
        ruleId: rule.id,
        priority: rule.priority,
        contributedProperties,
      });
    }
  }

  // Sort by priority (descending - highest first)
  matches.sort((a, b) => b.priority - a.priority);

  // Detect conflicts between matches
  detectConflicts(matches);

  return matches;
}

/**
 * Check if an AltNode matches a selector pattern
 *
 * Uses AND logic: ALL selector properties must match
 *
 * @param altNode - Node to check
 * @param selector - Selector pattern
 * @returns True if all selector properties match
 *
 * @example
 * const matches = selectorMatches(altNode, {
 *   nodeType: 'container',
 *   layoutMode: 'horizontal'
 * }); // True only if BOTH match
 */
export function selectorMatches(
  altNode: AltNode,
  selector: Selector
): boolean {
  // Check node type
  if (selector.nodeType !== undefined && altNode.type !== selector.nodeType) {
    return false;
  }

  // Check layout mode
  if (selector.layoutMode !== undefined) {
    const hasHorizontalLayout =
      altNode.styles.display === 'flex' &&
      altNode.styles.flexDirection === 'row';
    const hasVerticalLayout =
      altNode.styles.display === 'flex' &&
      altNode.styles.flexDirection === 'column';

    if (selector.layoutMode === 'horizontal' && !hasHorizontalLayout) {
      return false;
    }
    if (selector.layoutMode === 'vertical' && !hasVerticalLayout) {
      return false;
    }
  }

  // Check children existence
  if (selector.hasChildren !== undefined) {
    const hasChildren =
      altNode.children !== undefined && altNode.children.length > 0;
    if (selector.hasChildren !== hasChildren) {
      return false;
    }
  }

  // Check custom properties
  if (selector.customProperties) {
    for (const [key, value] of Object.entries(selector.customProperties)) {
      // Handle undefined properties
      const nodeValue = altNode.styles[key];
      if (nodeValue === undefined || nodeValue !== value) {
        return false;
      }
    }
  }

  // All checks passed
  return true;
}

/**
 * Resolve conflicts between multiple rule matches
 *
 * Property-level resolution: higher priority wins on conflicts,
 * non-conflicting properties merge
 *
 * @param matches - Sorted array of rule matches (highest priority first)
 * @returns Resolved properties and provenance tracking
 *
 * @example
 * const resolved = resolveConflicts(matches);
 * // resolved.resolved = { htmlTag: 'button', cssClasses: [...] }
 * // resolved.propertyProvenance = { htmlTag: 'rule-001', cssClasses: 'rule-002' }
 */
export function resolveConflicts(matches: RuleMatch[]): ResolvedProperties {
  const resolved: Record<string, string> = {};
  const propertyProvenance: Record<string, string> = {};

  // Process matches in priority order (already sorted)
  for (const match of matches) {
    for (const [property, value] of Object.entries(
      match.contributedProperties
    )) {
      if (resolved[property] === undefined) {
        // Property not yet set - accept from this rule
        resolved[property] = value;
        propertyProvenance[property] = match.ruleId;
      }
      // else: property already set by higher-priority rule, skip
    }
  }

  return { resolved, propertyProvenance };
}

/**
 * Extract CSS properties from transformer
 *
 * Converts transformer definition to flat CSS property map
 *
 * @param transformer - Transformer from mapping rule
 * @returns Flat map of CSS properties
 */
function extractContributedProperties(
  transformer: MappingRule['transformer']
): Record<string, string> {
  const properties: Record<string, string> = {};

  // HTML tag as special property
  properties.htmlTag = transformer.htmlTag;

  // CSS classes (combine into single property)
  if (transformer.cssClasses && transformer.cssClasses.length > 0) {
    properties.cssClasses = transformer.cssClasses.join(' ');
  }

  // Inline styles (merge into properties)
  if (transformer.inlineStyles) {
    for (const [key, value] of Object.entries(transformer.inlineStyles)) {
      properties[key] = value;
    }
  }

  // Attributes (serialize as JSON)
  if (transformer.attributes) {
    properties.attributes = JSON.stringify(transformer.attributes);
  }

  return properties;
}

/**
 * Detect conflicts between rule matches
 *
 * Mutates matches to add conflictsWith and conflictSeverity
 *
 * - Minor conflict: Same property, different values (style properties)
 * - Major conflict: Incompatible layout properties (display, position, htmlTag)
 *
 * @param matches - Array of rule matches to analyze
 */
function detectConflicts(matches: RuleMatch[]): void {
  // Build property ownership map with values
  const propertyToMatches = new Map<
    string,
    Array<{ ruleId: string; value: string }>
  >();

  for (const match of matches) {
    for (const [property, value] of Object.entries(
      match.contributedProperties
    )) {
      if (!propertyToMatches.has(property)) {
        propertyToMatches.set(property, []);
      }
      propertyToMatches.get(property)!.push({ ruleId: match.ruleId, value });
    }
  }

  // Identify conflicts
  for (const match of matches) {
    const conflictingRules = new Set<string>();
    let maxSeverity: ConflictSeverity | undefined;

    for (const [property, value] of Object.entries(
      match.contributedProperties
    )) {
      const matchesForProperty = propertyToMatches.get(property) ?? [];

      if (matchesForProperty.length > 1) {
        // Check if there are different values (actual conflict)
        const hasConflictingValues = matchesForProperty.some(
          (m) => m.value !== value
        );

        if (hasConflictingValues) {
          // This property has multiple rules with different values - conflict exists
          const severity = getConflictSeverity(property);

          // Add other rules with different values to conflicts
          for (const other of matchesForProperty) {
            if (other.ruleId !== match.ruleId && other.value !== value) {
              conflictingRules.add(other.ruleId);
            }
          }

          // Track highest severity
          if (!maxSeverity || severity === 'major') {
            maxSeverity = severity;
          }
        }
      }
    }

    // Update match with conflict info
    if (conflictingRules.size > 0 && maxSeverity !== undefined) {
      match.conflictsWith = Array.from(conflictingRules);
      match.conflictSeverity = maxSeverity;
    }
  }
}

/**
 * Determine conflict severity for a property
 *
 * Major conflicts: Layout-affecting properties (display, position, flexDirection)
 * Minor conflicts: Style properties (colors, spacing, typography)
 *
 * @param property - CSS property name
 * @returns Conflict severity
 */
function getConflictSeverity(property: string): ConflictSeverity {
  const majorConflictProperties = [
    'htmlTag',
    'display',
    'position',
    'flexDirection',
  ];

  return majorConflictProperties.includes(property) ? 'major' : 'minor';
}

/**
 * Evaluate rules for all nodes in a tree recursively
 *
 * Convenience function for processing entire AltNode tree
 *
 * @param altNode - Root node
 * @param rules - Mapping rules
 * @returns Map of node ID to rule matches
 *
 * @example
 * const allMatches = evaluateRulesForTree(rootNode, rules);
 * const matchesForNode = allMatches.get(nodeId);
 */
export function evaluateRulesForTree(
  altNode: AltNode,
  rules: MappingRule[]
): Map<string, RuleMatch[]> {
  const results = new Map<string, RuleMatch[]>();

  function traverse(node: AltNode): void {
    // Evaluate rules for this node
    const matches = evaluateRules(node, rules);
    results.set(node.id, matches);

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(altNode);
  return results;
}
