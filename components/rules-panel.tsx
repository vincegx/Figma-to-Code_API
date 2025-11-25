'use client';

import { useState } from 'react';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { RuleCategorySection } from './rule-category-section';
import {
  detectRuleConflicts,
  groupRulesByCategory,
  getContributedProperties,
} from '@/lib/utils/rule-conflict-detector';

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

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Select a node to view applied rules
      </div>
    );
  }

  // TODO: Get applicable rules for this node from rule engine
  // For now, using all rules as placeholder
  const applicableRules = allRules;

  // Detect conflicts
  const conflicts = detectRuleConflicts(applicableRules, selectedFramework);

  // Group by category
  const rulesByCategory = groupRulesByCategory(applicableRules);

  // Sort within each category by priority (ascending for display order)
  const sortedRulesByCategory = Object.entries(rulesByCategory)
    .map(([category, rules]) => ({
      category,
      rules: rules
        .sort((a, b) => a.priority - b.priority)
        .map((rule, index) => {
          const conflict = conflicts.get(rule.id);
          return {
            rule,
            order: index + 1,
            isOverridden: conflict?.isOverridden || false,
            contributedProperties: getContributedProperties(rule, selectedFramework),
          };
        }),
    }))
    .filter(({ category }) =>
      categoryFilter.length === 0 || categoryFilter.includes(category)
    );

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

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Filters
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter([])}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            All Categories
          </button>
          <button
            onClick={() => setPriorityFilter([])}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            All Priorities
          </button>
        </div>
      </div>

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
