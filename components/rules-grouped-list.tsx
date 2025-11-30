'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RulesListItem } from './rules-list-item';
import type { MultiFrameworkRule } from '@/lib/types/rules';

interface RulesGroupedListProps {
  officialRules: MultiFrameworkRule[];
  communityRules: MultiFrameworkRule[];
  customRules: MultiFrameworkRule[];
  selectedRuleId: string | null;
  onRuleSelect: (ruleId: string) => void;
  // Collapse states
  officialCollapsed: boolean;
  communityCollapsed: boolean;
  customCollapsed: boolean;
  onOfficialCollapsedChange: (collapsed: boolean) => void;
  onCommunityCollapsedChange: (collapsed: boolean) => void;
  onCustomCollapsedChange: (collapsed: boolean) => void;
}

interface RuleGroupProps {
  title: string;
  rules: MultiFrameworkRule[];
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  selectedRuleId: string | null;
  onRuleSelect: (ruleId: string) => void;
  colorClass: string;
  dotColorClass: string;
}

function RuleGroup({
  title,
  rules,
  collapsed,
  onCollapsedChange,
  selectedRuleId,
  onRuleSelect,
  colorClass,
  dotColorClass,
}: RuleGroupProps) {
  if (rules.length === 0) return null;

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={(open) => onCollapsedChange(!open)}
    >
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-bg-hover transition-colors">
        <ChevronRight
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            !collapsed && 'rotate-90'
          )}
        />
        <span className={cn('text-base', dotColorClass)}>●</span>
        <span>{title}</span>
        <span
          className={cn(
            'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
            colorClass
          )}
        >
          {rules.length}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0 pb-1">
          {rules.map((rule) => (
            <RulesListItem
              key={rule.id}
              rule={rule}
              isSelected={selectedRuleId === rule.id}
              onSelect={() => onRuleSelect(rule.id)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RulesGroupedList({
  officialRules,
  communityRules,
  customRules,
  selectedRuleId,
  onRuleSelect,
  officialCollapsed,
  communityCollapsed,
  customCollapsed,
  onOfficialCollapsedChange,
  onCommunityCollapsedChange,
  onCustomCollapsedChange,
}: RulesGroupedListProps) {
  const totalRules =
    officialRules.length + communityRules.length + customRules.length;

  if (totalRules === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        <p>No rules match your filters</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        <RuleGroup
          title="Official"
          rules={officialRules}
          collapsed={officialCollapsed}
          onCollapsedChange={onOfficialCollapsedChange}
          selectedRuleId={selectedRuleId}
          onRuleSelect={onRuleSelect}
          colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          dotColorClass="text-blue-500"
        />
        <RuleGroup
          title="Community"
          rules={communityRules}
          collapsed={communityCollapsed}
          onCollapsedChange={onCommunityCollapsedChange}
          selectedRuleId={selectedRuleId}
          onRuleSelect={onRuleSelect}
          colorClass="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          dotColorClass="text-purple-500"
        />
        <RuleGroup
          title="Custom"
          rules={customRules}
          collapsed={customCollapsed}
          onCollapsedChange={onCustomCollapsedChange}
          selectedRuleId={selectedRuleId}
          onRuleSelect={onRuleSelect}
          colorClass="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          dotColorClass="text-green-500"
        />
      </div>
    </ScrollArea>
  );
}
