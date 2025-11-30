'use client';

import type { MultiFrameworkRule } from '@/lib/types/rules';
import { cn } from '@/lib/utils';

interface RuleCardProps {
  rule: MultiFrameworkRule;
  order: number;
  isOverridden: boolean;
  contributedProperties: string[];
}

const TYPE_CONFIG = {
  official: {
    label: 'Official',
    dotClass: 'bg-blue-500',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  community: {
    label: 'Community',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  custom: {
    label: 'Custom',
    dotClass: 'bg-green-500',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

export function RuleCard({ rule, order, isOverridden, contributedProperties }: RuleCardProps) {
  const typeConfig = TYPE_CONFIG[rule.type] || TYPE_CONFIG.official;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
        'bg-gray-100 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50',
        isOverridden && 'opacity-50'
      )}
    >
      {/* Order number */}
      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-6 shrink-0">
        #{order}
      </span>

      {/* Type dot */}
      <span className={cn('w-2 h-2 rounded-full shrink-0', typeConfig.dotClass)} />

      {/* Rule info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
            {rule.name}
          </span>
          {isOverridden && (
            <span className="text-orange-500 text-xs" title="Overridden by higher priority rule">
              ⚠️
            </span>
          )}
        </div>
        {contributedProperties.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            → {contributedProperties.join(', ')}
          </div>
        )}
      </div>

      {/* Priority badge */}
      <span
        className={cn(
          'px-2 py-0.5 text-xs font-medium rounded shrink-0',
          typeConfig.badgeClass
        )}
      >
        {rule.priority}
      </span>
    </div>
  );
}
