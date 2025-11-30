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
      <div className="flex items-center justify-center h-full text-sm text-gray-500 dark:text-gray-400">
        Select a node to view applied rules
      </div>
    );
  }

  if (applicableRules.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-primary">
          <span className="text-sm font-medium text-text-primary">Applied Rules</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          No rules match this element
        </div>
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

  const totalRules = applicableRules.length;
  const activeRules = sortedRulesByCategory.reduce(
    (acc, cat) => acc + cat.rules.filter((r) => !r.isOverridden).length,
    0
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-primary">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Applied Rules</span>
          <span className="px-1.5 py-0.5 bg-accent-primary text-white text-xs rounded">
            {activeRules}/{totalRules}
          </span>
        </div>
      </div>

      {/* Category Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {sortedRulesByCategory.map(({ category, rules }) => (
          <RuleCategorySection
            key={category}
            category={category}
            rules={rules}
            defaultCollapsed={false}
          />
        ))}
      </div>
    </div>
  );
}
