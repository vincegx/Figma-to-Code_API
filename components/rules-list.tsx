'use client';

import { Search, Edit, Trash2 } from 'lucide-react';
import type { MultiFrameworkRule } from '@/lib/types/rules';

interface RulesListProps {
  rules: MultiFrameworkRule[];
  selectedRuleId: string | null;
  onRuleSelect: (ruleId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onEditRule?: (rule: MultiFrameworkRule) => void; // WP23
  onDeleteRule?: (rule: MultiFrameworkRule) => void; // WP23
}

export function RulesList({
  rules,
  selectedRuleId,
  onRuleSelect,
  searchQuery,
  onSearchChange,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  onEditRule,
  onDeleteRule,
}: RulesListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-border-primary">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search rules by name, ID, or tag..."
            className="w-full pl-10 pr-4 py-2 border border-border-primary rounded-lg bg-bg-card text-text-primary placeholder-text-muted focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Rules list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-muted">Loading rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-text-muted">
              <p className="text-lg mb-2">No rules found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`w-full text-left p-4 transition-colors ${
                  selectedRuleId === rule.id
                    ? 'bg-accent-secondary border-l-4 border-l-accent-primary'
                    : 'hover:bg-bg-hover'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => onRuleSelect(rule.id)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <h3 className="font-semibold text-sm text-text-primary truncate">
                      {rule.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      {rule.id} • Priority: {rule.priority}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* WP23: Edit/Delete buttons for custom rules */}
                    {rule.type === 'custom' && (onEditRule || onDeleteRule) && (
                      <div className="flex gap-1">
                        {onEditRule && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRule(rule);
                            }}
                            className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-accent-secondary rounded transition-colors"
                            title="Edit rule"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {onDeleteRule && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteRule(rule);
                            }}
                            className="p-1.5 text-text-secondary hover:text-status-error-text hover:bg-status-error-bg rounded transition-colors"
                            title="Delete rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    {/* Type badge (WP20: 3-tier system) */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                        rule.type === 'official'
                          ? 'bg-accent-secondary text-accent-primary'
                          : rule.type === 'community'
                          ? 'bg-status-info-bg text-status-info-text'
                          : 'bg-status-success-bg text-status-success-text'
                      }`}
                    >
                      <span>
                        {rule.type === 'official' ? '🔵' : rule.type === 'community' ? '🟣' : '🟢'}
                      </span>
                      {rule.type}
                    </span>
                    {/* Enabled badge */}
                    {!rule.enabled && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-bg-secondary text-text-muted">
                        disabled
                      </span>
                    )}
                  </div>
                </div>
                {/* Tags */}
                {rule.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rule.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full text-xs bg-bg-secondary text-text-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                    {rule.tags.length > 3 && (
                      <span className="text-xs text-text-muted">
                        +{rule.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border-primary">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-card border border-border-primary rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-text-secondary">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-card border border-border-primary rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
