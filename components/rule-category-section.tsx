'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
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
  defaultCollapsed = false,
}: RuleCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const activeRules = rules.filter((r) => !r.isOverridden).length;
  const overriddenRules = rules.filter((r) => r.isOverridden).length;
  const priorityRange =
    rules.length > 0
      ? `${Math.min(...rules.map((r) => r.rule.priority))}-${Math.max(...rules.map((r) => r.rule.priority))}`
      : '';

  return (
    <div className="bg-gray-100 dark:bg-gray-800/40 rounded-md border border-gray-200 dark:border-gray-700/50 mx-3 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-2 px-2.5 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors text-left rounded-t-md"
      >
        <ChevronRight
          className={cn(
            'w-3.5 h-3.5 transition-transform text-gray-400 dark:text-gray-500',
            isOpen && 'rotate-90'
          )}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          {categoryLabels[category] || category}
        </span>
        <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
          {rules.length}
        </span>
        {overriddenRules > 0 && (
          <span
            className="text-xs text-orange-500"
            title={`${overriddenRules} overridden`}
          >
            ⚠️ {overriddenRules}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 font-mono">
          {priorityRange}
        </span>
      </button>

      {isOpen && (
        <div className="px-2.5 pb-2.5 pt-1 space-y-1.5">
          {rules.map(({ rule, order, isOverridden, contributedProperties }) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              order={order}
              isOverridden={isOverridden}
              contributedProperties={contributedProperties}
            />
          ))}
        </div>
      )}
    </div>
  );
}
