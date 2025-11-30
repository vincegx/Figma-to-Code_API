'use client';

import { cn } from '@/lib/utils';
import type { MultiFrameworkRule } from '@/lib/types/rules';

interface RulesListItemProps {
  rule: MultiFrameworkRule;
  isSelected: boolean;
  onSelect: () => void;
}

const TYPE_COLORS = {
  official: 'text-blue-500',
  community: 'text-purple-500',
  custom: 'text-green-500',
};

export function RulesListItem({
  rule,
  isSelected,
  onSelect,
}: RulesListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors',
        isSelected
          ? 'bg-accent-secondary border-l-2 border-l-accent-primary'
          : 'hover:bg-bg-hover border-l-2 border-l-transparent'
      )}
    >
      {/* Type indicator */}
      <span className={cn('text-lg', TYPE_COLORS[rule.type])}>●</span>

      {/* Rule info */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm text-text-primary truncate block">
          {rule.name}
        </span>
        <span className="text-xs text-text-muted truncate block">
          {rule.category}
          {rule.tags.length > 0 && (
            <span className="ml-1">
              •{' '}
              {rule.tags
                .slice(0, 2)
                .map((t) => `#${t}`)
                .join(' ')}
              {rule.tags.length > 2 && ` +${rule.tags.length - 2}`}
            </span>
          )}
        </span>
      </div>

      {/* Priority */}
      <span className="text-xs text-text-muted w-12 text-right font-mono">
        P:{rule.priority}
      </span>

      {/* Status */}
      <span
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
          rule.enabled
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
        )}
      >
        {rule.enabled ? '✓' : '○'}
      </span>
    </button>
  );
}
