'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MultiFrameworkRule } from '@/lib/types/rules';

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

// Priority badge colors based on value
function getPriorityColor(priority: number): string {
  if (priority >= 75) return 'bg-pink-500 text-white';
  if (priority >= 50) return 'bg-emerald-500 text-white';
  return 'bg-blue-500 text-white';
}

export function RuleCategorySection({
  category,
  rules,
  defaultCollapsed = false,
}: RuleCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  const overriddenRules = rules.filter((r) => r.isOverridden).length;

  return (
    <div className="mb-2">
      {/* Category Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-1.5 px-1 hover:bg-bg-hover transition-colors text-left rounded"
      >
        <ChevronRight
          className={cn(
            'w-3 h-3 transition-transform text-text-muted',
            isOpen && 'rotate-90'
          )}
        />
        <span className="text-xs font-medium text-text-primary">
          {categoryLabels[category] || category}
        </span>
        <span className="px-1.5 py-0.5 bg-bg-secondary text-text-muted rounded text-xs">
          {rules.length}
        </span>
        {overriddenRules > 0 && (
          <AlertTriangle className="w-3 h-3 text-amber-500" />
        )}
        <span className="text-xs text-text-muted">{overriddenRules}</span>
      </button>

      {/* Rules List */}
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {rules.map(({ rule, order, isOverridden }) => (
            <Link
              key={rule.id}
              href={`/rules?ruleId=${encodeURIComponent(rule.id)}`}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded text-xs cursor-pointer hover:bg-bg-hover transition-colors',
                isOverridden && 'opacity-50'
              )}
            >
              {/* Order */}
              <span className="text-text-muted font-mono">#{order}</span>

              {/* Type dot */}
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                rule.type === 'official' ? 'bg-blue-500' :
                rule.type === 'community' ? 'bg-purple-500' : 'bg-emerald-500'
              )} />

              {/* Name */}
              <span className="flex-1 text-text-primary truncate">{rule.name}</span>

              {/* Warning if overridden */}
              {isOverridden && (
                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
              )}

              {/* Priority badge */}
              <span className={cn(
                'px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0',
                getPriorityColor(rule.priority)
              )}>
                {rule.priority}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
