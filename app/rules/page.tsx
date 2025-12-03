'use client';

/**
 * Rules Page (WP42 Redesign V2)
 *
 * Layout based on Rules-new.png:
 *   [Header: "Figma Rules Builder" + API badge | Action buttons]
 *   [Left Sidebar | Right Panel (2-column grid)]
 *
 * Left Sidebar:
 *   - Search input
 *   - Dropdowns: All Categories, React + Tailwind
 *   - Checkbox: Enabled
 *   - Rules list (cards with border + gap)
 *   - Footer: "X rules • X enabled"
 *
 * Right Panel:
 *   - Header: Rule name + Breadcrumb
 *   - Row 1: BASIC | TAGS + Note
 *   - Row 2: SELECTOR | TRANSFORMERS
 *   - Row 3: FRAMEWORKS
 */

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { MultiFrameworkRule, FrameworkType, Selector } from '@/lib/types/rules';
import { CustomRuleModal } from '@/components/custom-rule-modal';
import {
  Search,
  Plus,
  ChevronDown,
  Copy,
  Trash2,
  Check,
  Pencil,
  Home,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuotaIndicator } from '@/components/quota/quota-indicator';

// Extended types for UI display
type ExtendedSelector = Selector & {
  nodeTypes?: string[];
  conditions?: Array<{ property: string; operator: string; value: unknown }>;
};

type ExtendedRule = MultiFrameworkRule & {
  description?: string;
  selector: ExtendedSelector;
};

// Framework options
const FRAMEWORK_OPTIONS: { value: FrameworkType; label: string }[] = [
  { value: 'react-tailwind', label: 'React + Tailwind' },
  { value: 'html-css', label: 'HTML/CSS' },
  { value: 'react-inline', label: 'React' },
];

// All possible frameworks for display
const ALL_FRAMEWORKS = ['React+TWS', 'HTML/CSS', 'React', 'Swift', 'Android'];

function RulesPageContent() {
  const searchParams = useSearchParams();

  // Framework selection
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>(
    (searchParams.get('framework') as FrameworkType) || 'react-tailwind'
  );

  // Rules state
  const [officialRules, setOfficialRules] = useState<MultiFrameworkRule[]>([]);
  const [communityRules, setCommunityRules] = useState<MultiFrameworkRule[]>([]);
  const [customRules, setCustomRules] = useState<MultiFrameworkRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEnabledOnly, setShowEnabledOnly] = useState(true);

  // Selection
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRule, setEditingRule] = useState<MultiFrameworkRule | null>(null);

  // Dropdowns
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [frameworkDropdownOpen, setFrameworkDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const frameworkDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (frameworkDropdownRef.current && !frameworkDropdownRef.current.contains(event.target as Node)) {
        setFrameworkDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load rules
  const loadRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (!response.ok) throw new Error(`Failed to load rules: ${response.statusText}`);
      const data = await response.json();
      setOfficialRules(data.officialRules || []);
      setCommunityRules(data.communityRules || []);
      setCustomRules(data.customRules || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
      toast.error('Failed to load rules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  // All rules combined
  const allRules = useMemo(
    () => [...officialRules, ...communityRules, ...customRules],
    [officialRules, communityRules, customRules]
  );

  // Available categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allRules.forEach((r) => {
      if (r.category) categories.add(r.category);
    });
    return Array.from(categories);
  }, [allRules]);

  // Filter rules
  const filteredRules = useMemo(() => {
    return allRules.filter((rule) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const ruleWithDesc = rule as ExtendedRule;
        if (
          !rule.name.toLowerCase().includes(search) &&
          !ruleWithDesc.description?.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && rule.category !== selectedCategory) {
        return false;
      }

      // Enabled filter
      if (showEnabledOnly && rule.enabled === false) {
        return false;
      }

      // Framework filter
      if (!rule.transformers[selectedFramework]) {
        return false;
      }

      return true;
    });
  }, [allRules, searchTerm, selectedCategory, showEnabledOnly, selectedFramework]);

  // Enabled count
  const enabledCount = useMemo(() => {
    return filteredRules.filter((r) => r.enabled !== false).length;
  }, [filteredRules]);

  // Selected rule
  const selectedRule = useMemo(
    () => (selectedRuleId ? allRules.find((r) => r.id === selectedRuleId) as ExtendedRule | undefined : null),
    [selectedRuleId, allRules]
  );

  // CRUD handlers
  const handleCreateRule = () => {
    setModalMode('create');
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: MultiFrameworkRule) => {
    setModalMode('edit');
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDuplicateRule = (rule: MultiFrameworkRule) => {
    const duplicatedRule: MultiFrameworkRule = {
      ...rule,
      id: `custom-${rule.id}-copy-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      type: 'custom',
    };
    setModalMode('create');
    setEditingRule(duplicatedRule);
    setIsModalOpen(true);
  };

  const handleDeleteRule = async (rule: MultiFrameworkRule) => {
    if (rule.type !== 'custom') {
      toast.error('Only custom rules can be deleted');
      return;
    }
    if (!confirm(`Delete rule "${rule.name}"?`)) return;

    try {
      const response = await fetch(`/api/rules/custom/${rule.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete rule');
      toast.success(`Rule deleted`);
      setSelectedRuleId(null);
      await loadRules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete rule');
    }
  };

  const handleSaveRule = async (rule: MultiFrameworkRule) => {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url = modalMode === 'create' ? '/api/rules/custom' : `/api/rules/custom/${rule.id}`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to save rule');
      toast.success(`Rule ${modalMode === 'create' ? 'created' : 'updated'}`);
      await loadRules();
    } catch (error) {
      throw error;
    }
  };

  // Get rule display info
  const getRuleSubtitle = (rule: ExtendedRule) => {
    const parts: string[] = [];
    if (rule.type === 'official') parts.push('System');
    else if (rule.type === 'community') parts.push('Community');
    else parts.push('Custom');
    if (rule.category) parts.push(rule.category);
    return parts.join(' • ');
  };

  const getRuleCount = (rule: MultiFrameworkRule) => {
    // Count how many frameworks this rule supports
    return Object.keys(rule.transformers).length;
  };

  // Get active frameworks for selected rule
  const getActiveFrameworks = (rule: ExtendedRule) => {
    const active: string[] = [];
    if (rule.transformers['react-tailwind']) active.push('React+TWS');
    if (rule.transformers['html-css']) active.push('HTML/CSS');
    if (rule.transformers['react-inline']) active.push('React');
    return active;
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Custom Rule Modal */}
      <CustomRuleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveRule}
        existingRule={editingRule}
        mode={modalMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover"
              >
                <span>{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg z-10 py-1">
                  <button
                    onClick={() => { setSelectedCategory('all'); setCategoryDropdownOpen(false); }}
                    className="w-full px-3 py-1.5 text-xs text-left text-text-secondary hover:bg-bg-hover"
                  >
                    All Categories
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setCategoryDropdownOpen(false); }}
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
              onClick={() => setShowEnabledOnly(!showEnabledOnly)}
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
                onClick={() => setFrameworkDropdownOpen(!frameworkDropdownOpen)}
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
                      onClick={() => { setSelectedFramework(fw.value); setFrameworkDropdownOpen(false); }}
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
                      onClick={() => setSelectedRuleId(rule.id)}
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

        {/* Right Panel */}
        <div className="flex-1 bg-bg-primary overflow-auto">
          {selectedRule ? (
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
                    onClick={() => handleDuplicateRule(selectedRule)}
                    className="p-1.5 rounded border border-border-primary bg-bg-card hover:bg-bg-hover text-text-muted"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {selectedRule.type === 'custom' && (
                    <button
                      onClick={() => handleDeleteRule(selectedRule)}
                      className="p-1.5 rounded border border-border-primary bg-bg-card hover:bg-bg-hover text-text-muted"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditRule(selectedRule)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-primary bg-bg-card hover:bg-bg-hover text-text-primary text-xs"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Rule
                  </button>
                  <button
                    onClick={handleCreateRule}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
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
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                              <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                            #{selectedRule.category || 'rule'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
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
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
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
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                  <Search className="w-8 h-8 opacity-50" />
                </div>
                <p className="text-lg font-medium text-text-secondary mb-1">No rule selected</p>
                <p className="text-sm">Select a rule from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RulesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-bg-primary">
          <div className="animate-spin h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <RulesPageContent />
    </Suspense>
  );
}
