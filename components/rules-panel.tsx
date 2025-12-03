'use client';

import { useMemo } from 'react';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { RuleCategorySection } from './rule-category-section';
import {
  groupRulesByCategory,
} from '@/lib/utils/rule-conflict-detector';
import { getMultiFrameworkRuleMatches } from '@/lib/rule-engine';

interface RulesPanelProps {
  node: SimpleAltNode | null;
  selectedFramework: FrameworkType;
  allRules: MultiFrameworkRule[];
}

export function RulesPanel({
  node,
  selectedFramework,
  allRules,
}: RulesPanelProps) {
  // Get only rules that match the selected node
  const ruleMatches = useMemo(() => {
    if (!node) return [];
    return getMultiFrameworkRuleMatches(node, allRules, selectedFramework);
  }, [node, allRules, selectedFramework]);

  // Create a map for quick lookup
  const matchesMap = useMemo(() => {
    const map = new Map();
    ruleMatches.forEach((match) => map.set(match.ruleId, match));
    return map;
  }, [ruleMatches]);

  // Extract just the rules from matches
  const applicableRules = useMemo(() => {
    return allRules.filter((rule) => matchesMap.has(rule.id));
  }, [allRules, matchesMap]);

  if (!node) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-text-muted">
        Select a node to view applied rules
      </div>
    );
  }

  if (applicableRules.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-text-muted">
        No rules match this element
      </div>
    );
  }

  // Group by category
  const rulesByCategory = groupRulesByCategory(applicableRules);

  // Sort within each category by priority (DESCENDING - highest priority first = wins)
  const sortedRulesByCategory = Object.entries(rulesByCategory)
    .map(([category, rules]) => ({
      category,
      rules: rules
        .sort((a, b) => b.priority - a.priority)
        .map((rule, index) => {
          const match = matchesMap.get(rule.id);
          return {
            rule,
            order: index + 1,
            isOverridden: (match?.conflicts.length || 0) > 0,
            contributedProperties: Array.from(
              match?.contributedProperties || []
            ) as string[],
          };
        }),
    }))
    .sort((a, b) => b.rules.length - a.rules.length);

  return (
    <div className="max-h-[290px] overflow-auto">
      {sortedRulesByCategory.map(({ category, rules }) => (
        <RuleCategorySection
          key={category}
          category={category}
          rules={rules}
          defaultCollapsed={false}
        />
      ))}
    </div>
  );
}
