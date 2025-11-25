'use client';

import type { MultiFrameworkRule } from '@/lib/types/rules';

interface RulePreviewProps {
  rule: MultiFrameworkRule;
}

export function RulePreview({ rule }: RulePreviewProps) {
  const jsonString = JSON.stringify(rule, null, 2);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          JSON Preview
        </h4>
      </div>
      <pre className="p-4 overflow-auto max-h-96 text-sm text-gray-800 dark:text-gray-200">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
