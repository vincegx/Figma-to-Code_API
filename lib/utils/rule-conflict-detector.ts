import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';

export interface RuleConflict {
  ruleId: string;
  isOverridden: boolean;
  overriddenBy?: string;
  conflictingProperties: string[];
}

/**
 * Detects if a rule's properties are overridden by higher priority rules
 *
 * Rules are sorted by priority (ascending), so lower priority rules are applied first.
 * When a higher priority rule contributes the same property, it overrides the lower one.
 */
export function detectRuleConflicts(
  rules: MultiFrameworkRule[],
  framework: FrameworkType
): Map<string, RuleConflict> {
  // WP39: For react-tailwind-v4, fallback to react-tailwind transformer
  const effectiveFramework = framework === 'react-tailwind-v4' ? 'react-tailwind' : framework;

  // Sort rules by priority (ascending - lower priority first)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
  const conflicts = new Map<string, RuleConflict>();

  // Track which properties have been set by which rules
  const propertyOwnership = new Map<string, string>(); // property -> ruleId

  for (const rule of sortedRules) {
    const transformer = rule.transformers[framework] || rule.transformers[effectiveFramework];
    if (!transformer) {
      conflicts.set(rule.id, {
        ruleId: rule.id,
        isOverridden: false,
        conflictingProperties: [],
      });
      continue;
    }

    // Get properties this rule contributes
    const ruleProperties = Object.keys(transformer);
    const conflictingProperties: string[] = [];
    let isOverridden = false;
    let overriddenBy: string | undefined;

    // Check if any of this rule's properties are already owned by a higher priority rule
    for (const prop of ruleProperties) {
      if (propertyOwnership.has(prop)) {
        isOverridden = true;
        overriddenBy = propertyOwnership.get(prop);
        conflictingProperties.push(prop);
      } else {
        // This rule owns this property
        propertyOwnership.set(prop, rule.id);
      }
    }

    conflicts.set(rule.id, {
      ruleId: rule.id,
      isOverridden,
      overriddenBy,
      conflictingProperties,
    });
  }

  return conflicts;
}

/**
 * Group rules by category
 */
export function groupRulesByCategory(
  rules: MultiFrameworkRule[]
): Record<string, MultiFrameworkRule[]> {
  const grouped: Record<string, MultiFrameworkRule[]> = {};

  for (const rule of rules) {
    const category = rule.category || 'other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(rule);
  }

  return grouped;
}

/**
 * Get contributed properties from a rule for a specific framework
 */
export function getContributedProperties(
  rule: MultiFrameworkRule,
  framework: FrameworkType
): string[] {
  // WP39: For react-tailwind-v4, fallback to react-tailwind transformer
  const effectiveFramework = framework === 'react-tailwind-v4' ? 'react-tailwind' : framework;
  const transformer = rule.transformers[framework] || rule.transformers[effectiveFramework];
  if (!transformer) return [];
  return Object.keys(transformer);
}
