'use client';

import { useState, useMemo } from 'react';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { RuleCategorySection } from './rule-category-section';
import {
  detectRuleConflicts,
  groupRulesByCategory,
  getContributedProperties,
} from '@/lib/utils/rule-conflict-detector';
import { getMultiFrameworkRuleMatches } from '@/lib/rule-engine';

interface RulesPanelProps {
  node: SimpleAltNode | null;
  selectedFramework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  allRules: MultiFrameworkRule[];
}

export function RulesPanel({
  node,
  selectedFramework,
  onFrameworkChange,
  allRules,
}: RulesPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  // Get only rules that match the selected node
  const ruleMatches = useMemo(() => {
    if (!node) return [];
    return getMultiFrameworkRuleMatches(node, allRules, selectedFramework);
  }, [node, allRules, selectedFramework]);

  // Create a map for quick lookup
  const matchesMap = useMemo(() => {
    const map = new Map();
    ruleMatches.forEach(match => map.set(match.ruleId, match));
    return map;
  }, [ruleMatches]);

  // Extract just the rules from matches
  const applicableRules = useMemo(() => {
    return allRules.filter(rule => matchesMap.has(rule.id));
  }, [allRules, matchesMap]);

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Select a node to view applied rules
      </div>
    );
  }

  if (applicableRules.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="font-medium">No rules match this element</p>
          <p className="text-sm mt-1">Try selecting a different element or adding custom rules</p>
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
        .sort((a, b) => b.priority - a.priority) // DESCENDING: highest priority first
        .map((rule, index) => {
          const match = matchesMap.get(rule.id);
          return {
            rule,
            order: index + 1, // #1 = highest priority = wins
            isOverridden: (match?.conflicts.length || 0) > 0, // Has conflicts means it's overridden
            contributedProperties: Array.from(match?.contributedProperties || []) as string[],
          };
        }),
    }))
    .filter(({ category }) =>
      categoryFilter.length === 0 || categoryFilter.includes(category)
    )
    .sort((a, b) => b.rules.length - a.rules.length); // Categories with most rules first

  const totalRules = applicableRules.length;
  const priorityRange = applicableRules.length > 0
    ? `${Math.min(...applicableRules.map(r => r.priority))}-${Math.max(...applicableRules.map(r => r.priority))}`
    : 'N/A';

  return (
    <div className="h-full flex flex-col">
      {/* Header with Framework Selector */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Applied Rules</h2>
        <select
          value={selectedFramework}
          onChange={(e) => onFrameworkChange(e.target.value as FrameworkType)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="react-tailwind">React + Tailwind</option>
          <option value="html-css">HTML + CSS</option>
          <option value="react-inline">React Inline</option>
          <option value="swift-ui">SwiftUI</option>
          <option value="android-xml">Android XML</option>
        </select>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Total:</span> {totalRules} rules |{' '}
          <span className="font-medium">Priority Range:</span> {priorityRange}
        </div>
      </div>

      {/* Smart Filters - Only show if there are many rules or categories */}
      {(totalRules > 10 || Object.keys(rulesByCategory).length > 3) && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Filters
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(rulesByCategory).length > 3 && (
              <>
                <button
                  onClick={() => setCategoryFilter([])}
                  className={`px-2 py-1 text-xs border rounded transition-colors ${
                    categoryFilter.length === 0
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Categories
                </button>
                {Object.entries(rulesByCategory).map(([category, rules]) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter([category])}
                    className={`px-2 py-1 text-xs border rounded transition-colors ${
                      categoryFilter.includes(category)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category} ({rules.length})
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Category Sections */}
      <div className="flex-1 overflow-y-auto">
        {sortedRulesByCategory.length > 0 ? (
          sortedRulesByCategory.map(({ category, rules }) => (
            <RuleCategorySection
              key={category}
              category={category}
              rules={rules}
              defaultCollapsed={true}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No rules match the current filters
          </div>
        )}
      </div>
    </div>
  );
}
