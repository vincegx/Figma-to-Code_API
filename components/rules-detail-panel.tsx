'use client';

import { useState } from 'react';
import { X, Copy, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';

interface RulesDetailPanelProps {
  rule: MultiFrameworkRule;
  selectedFramework: FrameworkType;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const FRAMEWORK_LABELS: Record<FrameworkType, string> = {
  'react-tailwind': 'React+TW',
  'html-css': 'HTML/CSS',
  'react-inline': 'React',
  'swift-ui': 'Swift',
  'android-xml': 'Android',
};

const TYPE_CONFIG = {
  official: {
    label: 'Official',
    dotClass: 'bg-blue-500',
  },
  community: {
    label: 'Community',
    dotClass: 'bg-purple-500',
  },
  custom: {
    label: 'Custom',
    dotClass: 'bg-green-500',
  },
};

// Collapsible block component matching property-block.tsx style
function DetailBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-100 dark:bg-gray-800/40 rounded-md border border-gray-200 dark:border-gray-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-1.5 py-2 px-2.5 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors text-left rounded-t-md"
      >
        <ChevronRight
          className={cn(
            'w-3 h-3 transition-transform text-gray-400 dark:text-gray-500',
            isOpen && 'rotate-90'
          )}
        />
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5 pt-1 space-y-1">{children}</div>
      )}
    </div>
  );
}

// Property item matching property-block.tsx style
function DetailItem({
  label,
  value,
  inline = true,
}: {
  label: string;
  value: React.ReactNode;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-800 dark:text-gray-100">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
      <div className="text-sm text-gray-800 dark:text-gray-100 pl-2">
        {value}
      </div>
    </div>
  );
}

export function RulesDetailPanel({
  rule,
  selectedFramework,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}: RulesDetailPanelProps) {
  const typeConfig = TYPE_CONFIG[rule.type];
  const availableFrameworks = Object.keys(rule.transformers) as FrameworkType[];

  // Determine which framework tab to show (prefer selected, fallback to first available)
  const activeFramework = availableFrameworks.includes(selectedFramework)
    ? selectedFramework
    : availableFrameworks[0];

  return (
    <div className="h-full flex flex-col bg-bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border-primary">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-2 h-2 rounded-full shrink-0', typeConfig.dotClass)} />
          <h2 className="text-sm font-semibold text-text-primary truncate">
            {rule.name}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-7 w-7"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDuplicate}
            className="h-7 w-7"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            disabled={rule.type !== 'custom'}
            title={rule.type !== 'custom' ? 'Only custom rules can be deleted' : 'Delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
            title="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {/* Basic Info */}
          <DetailBlock title="Basic" defaultOpen={true}>
            <DetailItem label="ID" value={<span className="font-mono">{rule.id}</span>} />
            <DetailItem label="Type" value={typeConfig.label} />
            <DetailItem label="Category" value={rule.category} />
            <DetailItem label="Priority" value={rule.priority} />
            <DetailItem
              label="Status"
              value={
                <span className={rule.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                  {rule.enabled ? '✓ Enabled' : '○ Disabled'}
                </span>
              }
            />
          </DetailBlock>

          {/* Tags */}
          {rule.tags.length > 0 && (
            <DetailBlock title="Tags" defaultOpen={true}>
              <div className="flex flex-wrap gap-1">
                {rule.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </DetailBlock>
          )}

          {/* Warning for Official/Community */}
          {rule.type !== 'custom' && (
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Editing will create an override in custom rules.
              </p>
            </div>
          )}

          {/* Selector */}
          <DetailBlock title="Selector" defaultOpen={true}>
            <pre className="bg-gray-200/50 dark:bg-gray-900/50 rounded p-2 text-xs overflow-x-auto">
              <code className="text-gray-700 dark:text-gray-200">
                {JSON.stringify(rule.selector, null, 2)}
              </code>
            </pre>
          </DetailBlock>

          {/* Transformer */}
          <DetailBlock title="Transformer" defaultOpen={true}>
            {availableFrameworks.length > 0 ? (
              <Tabs defaultValue={activeFramework}>
                <TabsList className="h-8 p-0.5 bg-gray-200 dark:bg-gray-700">
                  {availableFrameworks.map((fw) => (
                    <TabsTrigger
                      key={fw}
                      value={fw}
                      className="text-xs px-2 h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"
                    >
                      {FRAMEWORK_LABELS[fw]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {availableFrameworks.map((fw) => (
                  <TabsContent key={fw} value={fw} className="mt-2">
                    <pre className="bg-gray-200/50 dark:bg-gray-900/50 rounded p-2 text-xs overflow-x-auto">
                      <code className="text-gray-700 dark:text-gray-200">
                        {JSON.stringify(rule.transformers[fw], null, 2)}
                      </code>
                    </pre>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p className="text-xs text-gray-500">No transformers defined</p>
            )}
          </DetailBlock>

          {/* Available Frameworks */}
          <DetailBlock title={`Frameworks (${availableFrameworks.length})`} defaultOpen={true}>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  'react-tailwind',
                  'html-css',
                  'react-inline',
                  'swift-ui',
                  'android-xml',
                ] as FrameworkType[]
              ).map((fw) => {
                const isAvailable = availableFrameworks.includes(fw);
                return (
                  <span
                    key={fw}
                    className={cn(
                      'px-1.5 py-0.5 text-xs rounded flex items-center gap-1',
                      isAvailable
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                    )}
                  >
                    {isAvailable ? '✓' : '○'} {FRAMEWORK_LABELS[fw]}
                  </span>
                );
              })}
            </div>
          </DetailBlock>
        </div>
      </div>

    </div>
  );
}
