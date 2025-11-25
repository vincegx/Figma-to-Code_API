'use client';

import type { MultiFrameworkRule } from '@/lib/types/rules';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: number;
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  const tier = priority >= 100 ? 'custom' : priority >= 75 ? 'community' : 'official';

  const styles = {
    custom: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    community: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    official: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  const labels = {
    custom: '🟢 Custom',
    community: '🟣 Community',
    official: '🔵 Official',
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", styles[tier])}>
      {labels[tier]} ({priority})
    </span>
  );
}

interface RuleCardProps {
  rule: MultiFrameworkRule;
  order: number;
  isOverridden: boolean;
  contributedProperties: string[];
}

export function RuleCard({ rule, order, isOverridden, contributedProperties }: RuleCardProps) {
  return (
    <div className={cn(
      "border rounded-lg p-3 bg-white dark:bg-gray-800 transition-colors",
      isOverridden && "opacity-60 border-orange-300 dark:border-orange-700"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-500 dark:text-gray-400">#{order}</span>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{rule.name}</h4>
          {isOverridden && (
            <span
              className="text-orange-500"
              title="This rule is overridden by a higher priority rule"
              role="img"
              aria-label="Warning: Rule overridden"
            >
              ⚠️
            </span>
          )}
        </div>
        <PriorityBadge priority={rule.priority} />
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        <span className="font-medium">Contributes:</span>{' '}
        {contributedProperties.length > 0 ? contributedProperties.join(', ') : 'No properties'}
      </div>

      {rule.category && (
        <div className="text-xs text-gray-500 dark:text-gray-500">
          <span className="font-medium">Category:</span> {rule.category}
        </div>
      )}

      {rule.tags && rule.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {rule.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
