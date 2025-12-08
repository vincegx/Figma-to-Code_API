'use client';

/**
 * RulesSidebar Component
 *
 * Left sidebar with search, filters, and rules list.
 * VERBATIM from rules/page.tsx - Phase 3 refactoring
 */

import { RefObject } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuotaIndicator } from '@/components/quota/quota-indicator';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { FRAMEWORK_OPTIONS, type ExtendedRule } from '../_hooks/useRulesData';

interface RulesSidebarProps {
  // Search & Filters
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  availableCategories: string[];
  showEnabledOnly: boolean;
  onEnabledOnlyChange: (value: boolean) => void;
  selectedFramework: FrameworkType;
  onFrameworkChange: (value: FrameworkType) => void;

  // Dropdowns
  categoryDropdownOpen: boolean;
  onCategoryDropdownChange: (value: boolean) => void;
  categoryDropdownRef: RefObject<HTMLDivElement>;
  frameworkDropdownOpen: boolean;
  onFrameworkDropdownChange: (value: boolean) => void;
  frameworkDropdownRef: RefObject<HTMLDivElement>;

  // Rules
  filteredRules: MultiFrameworkRule[];
  selectedRuleId: string | null;
  onRuleSelect: (ruleId: string) => void;
  enabledCount: number;

  // Helpers
  getRuleSubtitle: (rule: ExtendedRule) => string;
  getRuleCount: (rule: MultiFrameworkRule) => number;
}

export function RulesSidebar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  showEnabledOnly,
  onEnabledOnlyChange,
  selectedFramework,
  onFrameworkChange,
  categoryDropdownOpen,
  onCategoryDropdownChange,
  categoryDropdownRef,
  frameworkDropdownOpen,
  onFrameworkDropdownChange,
  frameworkDropdownRef,
  filteredRules,
  selectedRuleId,
  onRuleSelect,
  enabledCount,
  getRuleSubtitle,
  getRuleCount,
}: RulesSidebarProps) {
  return (
    <div className="w-72 border-r border-border-primary bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border-primary">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-text-primary">Figma Rules Builder</h1>
          <QuotaIndicator compact popoverSide="right" />
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rules..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-lg focus:outline-none focus:ring-1 focus:ring-border-secondary text-text-primary placeholder:text-text-muted"
          />
        </div>
      </div>

      {/* Filters Row 1: Category + Enabled */}
      <div className="px-4 pb-2 flex gap-2">
        {/* Category Dropdown */}
        <div className="relative flex-1" ref={categoryDropdownRef}>
          <button
            onClick={() => onCategoryDropdownChange(!categoryDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover"
          >
            <span>{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {categoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg z-10 py-1">
              <button
                onClick={() => { onCategoryChange('all'); onCategoryDropdownChange(false); }}
                className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:bg-bg-hover"
              >
                All Categories
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { onCategoryChange(cat); onCategoryDropdownChange(false); }}
                  className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:bg-bg-hover capitalize"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Enabled Filter Chip */}
        <button
          onClick={() => onEnabledOnlyChange(!showEnabledOnly)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors',
            showEnabledOnly
              ? 'bg-bg-card border-border-secondary text-text-primary'
              : 'bg-bg-secondary border-border-primary text-text-muted'
          )}
        >
          {showEnabledOnly && <Check className="w-3 h-3" />}
          Enabled
        </button>
      </div>

      {/* Filters Row 2: Framework */}
      <div className="px-4 pb-3">
        <div className="relative" ref={frameworkDropdownRef}>
          <button
            onClick={() => onFrameworkDropdownChange(!frameworkDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover"
          >
            <span>{FRAMEWORK_OPTIONS.find(f => f.value === selectedFramework)?.label}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {frameworkDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg z-10 py-1">
              {FRAMEWORK_OPTIONS.map((fw) => (
                <button
                  key={fw.value}
                  onClick={() => { onFrameworkChange(fw.value); onFrameworkDropdownChange(false); }}
                  className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:bg-bg-hover"
                >
                  {fw.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="space-y-2">
          {filteredRules.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-8">No rules found</div>
          ) : (
            filteredRules.map((r) => {
              const rule = r as ExtendedRule;
              const isSelected = rule.id === selectedRuleId;
              const count = getRuleCount(rule);
              const isEnabled = rule.enabled !== false;

              return (
                <button
                  key={rule.id}
                  onClick={() => onRuleSelect(rule.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    isSelected
                      ? 'bg-bg-card border-border-secondary'
                      : 'bg-bg-card/50 border-border-primary hover:bg-bg-card hover:border-border-secondary'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {rule.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {getRuleSubtitle(rule)}
                      </p>
                      <p className="text-xs text-text-muted">
                        #layout.align
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-text-muted">{count}</span>
                      {isEnabled && (
                        <Check className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border-primary">
        <p className="text-xs text-text-muted">
          {filteredRules.length} rules • {enabledCount} enabled
        </p>
      </div>
    </div>
  );
}
