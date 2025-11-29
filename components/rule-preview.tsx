'use client';

import type { MultiFrameworkRule } from '@/lib/types/rules';

interface RulePreviewProps {
  rule: MultiFrameworkRule;
}

export function RulePreview({ rule }: RulePreviewProps) {
  const jsonString = JSON.stringify(rule, null, 2);

  return (
    <div className="border border-border-primary rounded-lg bg-bg-secondary overflow-hidden">
      <div className="bg-bg-hover px-4 py-2 border-b border-border-primary">
        <h4 className="text-sm font-semibold text-text-secondary">
          JSON Preview
        </h4>
      </div>
      <pre className="p-4 overflow-auto max-h-96 text-sm text-text-primary">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
