'use client';

/**
 * RuleDetailPanel Component
 *
 * Right panel showing selected rule details.
 * VERBATIM from rules/page.tsx - Phase 3 refactoring
 */

import {
  Copy,
  Trash2,
  Check,
  Pencil,
  Home,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { ALL_FRAMEWORKS, type ExtendedRule } from '../_hooks/useRulesData';

interface RuleDetailPanelProps {
  selectedRule: ExtendedRule | null | undefined;
  selectedFramework: FrameworkType;
  onDuplicate: (rule: MultiFrameworkRule) => void;
  onDelete: (rule: MultiFrameworkRule) => void;
  onEdit: (rule: MultiFrameworkRule) => void;
  onCreate: () => void;
  getActiveFrameworks: (rule: ExtendedRule) => string[];
}

export function RuleDetailPanel({
  selectedRule,
  selectedFramework,
  onDuplicate,
  onDelete,
  onEdit,
  onCreate,
  getActiveFrameworks,
}: RuleDetailPanelProps) {
  if (!selectedRule) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
            <Search className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-lg font-medium text-text-secondary mb-1">No rule selected</p>
          <p className="text-sm">Select a rule from the list to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">
            {selectedRule.name}
          </h2>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-3 h-3" />
            <span>Rules</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text-secondary">{selectedRule.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDuplicate(selectedRule)}
            className="p-1.5 rounded border border-border-primary bg-bg-card hover:bg-bg-hover text-text-muted"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {selectedRule.type === 'custom' && (
            <button
              onClick={() => onDelete(selectedRule)}
              className="p-1.5 rounded border border-border-primary bg-bg-card hover:bg-bg-hover text-text-muted"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(selectedRule)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-primary bg-bg-card hover:bg-bg-hover text-text-primary text-xs"
          >
            <Pencil className="w-3 h-3" />
            Edit Rule
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent-primary hover:bg-accent-hover text-white text-xs font-medium"
          >
            <Plus className="w-3 h-3" />
            New Rule
          </button>
        </div>
      </div>

      {/* Row 1: BASIC | TAGS */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* BASIC */}
        <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            BASIC
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs mb-1">ID</p>
              <p className="text-text-primary font-mono text-xs">{selectedRule.id}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Type</p>
              <p className="text-text-primary capitalize">{selectedRule.type || 'Property'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Category</p>
              <p className="text-text-primary capitalize">{selectedRule.category || 'Official'}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs mb-1">Display</p>
              <p className="text-text-primary">Other</p>
            </div>
            <div className="col-span-2">
              <p className="text-text-muted text-xs mb-2">Status</p>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                selectedRule.enabled !== false
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  selectedRule.enabled !== false ? 'bg-emerald-400' : 'bg-red-400'
                )} />
                {selectedRule.enabled !== false ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* TAGS + Note */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              TAGS
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedRule.tags && selectedRule.tags.length > 0 ? (
                selectedRule.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-toggle-active-bg text-toggle-active-text border border-toggle-active-border"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    #{tag}
                  </span>
                ))
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-toggle-active-bg text-toggle-active-text border border-toggle-active-border">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    #{selectedRule.category || 'rule'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-toggle-active-bg text-toggle-active-text border border-toggle-active-border">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    #figma-api
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="px-4">
            <p className="text-xs text-text-muted mb-1">Note</p>
            <p className="text-sm text-amber-400/80 italic">
              Editing will create an override in custom rules.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: SELECTOR | TRANSFORMERS */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* SELECTOR */}
        <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              SELECTOR
            </h3>
            <button className="p-1 hover:bg-bg-hover rounded text-text-muted">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="text-xs font-mono p-3 rounded-lg bg-bg-secondary overflow-auto max-h-48 text-text-secondary">
            {JSON.stringify(selectedRule.selector, null, 2)}
          </pre>
        </div>

        {/* TRANSFORMERS */}
        <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
            TRANSFORMERS
          </h3>
          <div className="space-y-2 mb-4">
            {['HTML/CSS', 'React', 'React+TWS'].map((fw) => {
              const isActive = getActiveFrameworks(selectedRule).includes(fw);
              return (
                <div
                  key={fw}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-bg-secondary text-text-muted'
                  )}
                >
                  {isActive && <Check className="w-4 h-4" />}
                  <span>{fw}</span>
                </div>
              );
            })}
          </div>
          {/* Code preview */}
          <pre className="text-xs font-mono p-3 rounded-lg bg-bg-secondary overflow-auto max-h-48 text-text-secondary">
            {selectedRule.transformers[selectedFramework]
              ? JSON.stringify(selectedRule.transformers[selectedFramework], null, 2)
              : 'No transformer for this framework'}
          </pre>
        </div>
      </div>

      {/* Row 3: FRAMEWORKS */}
      <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
          FRAMEWORKS ({getActiveFrameworks(selectedRule).length})
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {ALL_FRAMEWORKS.map((fw) => {
            const isActive = getActiveFrameworks(selectedRule).includes(fw);
            return (
              <span
                key={fw}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border',
                  isActive
                    ? 'bg-toggle-active-bg text-toggle-active-text border-toggle-active-border'
                    : 'bg-bg-secondary text-text-muted border-border-primary'
                )}
              >
                {isActive ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="w-3 h-3 rounded-full border border-current" />
                )}
                {fw}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-text-muted">
          {getActiveFrameworks(selectedRule).length} frameworks active
        </p>
      </div>
    </div>
  );
}
