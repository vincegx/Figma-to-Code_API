'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MultiFrameworkRule } from '@/lib/types/rules';
import { RuleCard } from './rule-card';

interface RuleCategorySectionProps {
  category: string;
  rules: Array<{
    rule: MultiFrameworkRule;
    order: number;
    isOverridden: boolean;
    contributedProperties: string[];
  }>;
  defaultCollapsed?: boolean;
}

const categoryLabels: Record<string, string> = {
  layout: 'Layout',
  colors: 'Colors',
  typography: 'Typography',
  spacing: 'Spacing',
  borders: 'Borders',
  effects: 'Effects',
  components: 'Components',
  constraints: 'Constraints',
  custom: 'Custom',
  other: 'Other',
};

export function RuleCategorySection({
  category,
  rules,
  defaultCollapsed = true,
}: RuleCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  // Calculate priority statistics
  const highestPriority = rules.length > 0 ? Math.max(...rules.map(r => r.rule.priority)) : 0;
  const lowestPriority = rules.length > 0 ? Math.min(...rules.map(r => r.rule.priority)) : 0;
  const activeRules = rules.filter(r => !r.isOverridden).length;
  const overriddenRules = rules.filter(r => r.isOverridden).length;

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1">
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform text-gray-500",
              isOpen && "rotate-180"
            )}
          />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
            {categoryLabels[category] || category}
          </h3>
          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
            {rules.length}
          </span>
          {overriddenRules > 0 && (
            <span className="text-xs text-orange-500" title={`${overriddenRules} overridden rules`}>
              ⚠️ {overriddenRules}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span className="font-mono">Priority: {lowestPriority}-{highestPriority}</span>
        </div>
      </button>

      {isOpen && (
        <div className="px-2 pb-3 space-y-2">
          {rules.length > 0 ? (
            rules.map(({ rule, order, isOverridden, contributedProperties }) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                order={order}
                isOverridden={isOverridden}
                contributedProperties={contributedProperties}
              />
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-2">
              No rules in this category
            </div>
          )}
        </div>
      )}
    </div>
  );
}
