'use client';

/**
 * useRulesData Hook
 *
 * Handles rules data management for the Rules page:
 * - Rules loading (official, community, custom)
 * - Filtering and search
 * - CRUD operations
 *
 * VERBATIM from rules/page.tsx - Phase 3 refactoring
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { MultiFrameworkRule, FrameworkType, Selector } from '@/lib/types/rules';

// Extended types for UI display
export type ExtendedSelector = Selector & {
  nodeTypes?: string[];
  conditions?: Array<{ property: string; operator: string; value: unknown }>;
};

export type ExtendedRule = MultiFrameworkRule & {
  description?: string;
  selector: ExtendedSelector;
};

// Framework options
export const FRAMEWORK_OPTIONS: { value: FrameworkType; label: string }[] = [
  { value: 'react-tailwind', label: 'React + Tailwind' },
  { value: 'html-css', label: 'HTML/CSS' },
  { value: 'react-inline', label: 'React' },
];

// All possible frameworks for display
export const ALL_FRAMEWORKS = ['React+TWS', 'HTML/CSS', 'React', 'Swift', 'Android'];

export function useRulesData() {
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

  // Selection - WP38 Fix #25: Initialize from URL query param if present
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(
    searchParams.get('ruleId')
  );

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
  const loadRules = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

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
  const handleCreateRule = useCallback(() => {
    setModalMode('create');
    setEditingRule(null);
    setIsModalOpen(true);
  }, []);

  const handleEditRule = useCallback((rule: MultiFrameworkRule) => {
    setModalMode('edit');
    setEditingRule(rule);
    setIsModalOpen(true);
  }, []);

  const handleDuplicateRule = useCallback((rule: MultiFrameworkRule) => {
    const duplicatedRule: MultiFrameworkRule = {
      ...rule,
      id: `custom-${rule.id}-copy-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      type: 'custom',
    };
    setModalMode('create');
    setEditingRule(duplicatedRule);
    setIsModalOpen(true);
  }, []);

  const handleDeleteRule = useCallback(async (rule: MultiFrameworkRule) => {
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
  }, [loadRules]);

  const handleSaveRule = useCallback(async (rule: MultiFrameworkRule) => {
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
  }, [modalMode, loadRules]);

  // Helper functions
  const getRuleSubtitle = useCallback((rule: ExtendedRule) => {
    const parts: string[] = [];
    if (rule.type === 'official') parts.push('System');
    else if (rule.type === 'community') parts.push('Community');
    else parts.push('Custom');
    if (rule.category) parts.push(rule.category);
    return parts.join(' • ');
  }, []);

  const getRuleCount = useCallback((rule: MultiFrameworkRule) => {
    // Count how many frameworks this rule supports
    return Object.keys(rule.transformers).length;
  }, []);

  const getActiveFrameworks = useCallback((rule: ExtendedRule) => {
    const active: string[] = [];
    if (rule.transformers['react-tailwind']) active.push('React+TWS');
    if (rule.transformers['html-css']) active.push('HTML/CSS');
    if (rule.transformers['react-inline']) active.push('React');
    return active;
  }, []);

  return {
    // State
    isLoading,
    selectedFramework,
    searchTerm,
    selectedCategory,
    showEnabledOnly,
    selectedRuleId,
    isModalOpen,
    modalMode,
    editingRule,
    categoryDropdownOpen,
    frameworkDropdownOpen,

    // Refs
    categoryDropdownRef,
    frameworkDropdownRef,

    // Computed
    filteredRules,
    enabledCount,
    selectedRule,
    availableCategories,

    // Setters
    setSelectedFramework,
    setSearchTerm,
    setSelectedCategory,
    setShowEnabledOnly,
    setSelectedRuleId,
    setIsModalOpen,
    setCategoryDropdownOpen,
    setFrameworkDropdownOpen,

    // Handlers
    handleCreateRule,
    handleEditRule,
    handleDuplicateRule,
    handleDeleteRule,
    handleSaveRule,

    // Helpers
    getRuleSubtitle,
    getRuleCount,
    getActiveFrameworks,
  };
}
