'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { useUIStore } from '@/lib/store';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { RulesFilterBar } from '@/components/rules-filter-bar';
import { RulesGroupedList } from '@/components/rules-grouped-list';
import { RulesDetailPanel } from '@/components/rules-detail-panel';
import { RulesDetailSheet } from '@/components/rules-detail-sheet';
import { CustomRuleModal } from '@/components/custom-rule-modal';
import { useMediaQuery } from '@/hooks/use-media-query';

function RulesPageContent() {
  const searchParams = useSearchParams();

  // Detect mobile viewport
  const isMobile = !useMediaQuery('(min-width: 768px)');

  // Framework selection (from URL or default)
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>(
    (searchParams.get('framework') as FrameworkType) || 'react-tailwind'
  );

  // Rules state (WP20: 3-tier system)
  const [officialRules, setOfficialRules] = useState<MultiFrameworkRule[]>([]);
  const [communityRules, setCommunityRules] = useState<MultiFrameworkRule[]>(
    []
  );
  const [customRules, setCustomRules] = useState<MultiFrameworkRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI Store for panel states
  const {
    rulesDetailPanelVisible,
    rulesSelectedRuleId,
    rulesOfficialCollapsed,
    rulesCommunityCollapsed,
    rulesCustomCollapsed,
    setRulesDetailPanelVisible,
    setRulesSelectedRuleId,
    setRulesOfficialCollapsed,
    setRulesCommunityCollapsed,
    setRulesCustomCollapsed,
  } = useUIStore();

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);

  // Custom Rule Modal (WP23)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRule, setEditingRule] = useState<MultiFrameworkRule | null>(
    null
  );

  // Load rules from API (WP20: 3-tier system)
  const loadRules = async () => {
    try {
      const response = await fetch('/api/rules');

      if (!response.ok) {
        throw new Error(`Failed to load rules: ${response.statusText}`);
      }

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

  // WP23: Handlers for custom rule CRUD
  const handleCreateRule = () => {
    setModalMode('create');
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEditRule = (rule: MultiFrameworkRule) => {
    // Allow editing all rules (for official/community, it will create an override)
    setModalMode('edit');
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDuplicateRule = (rule: MultiFrameworkRule) => {
    // Create a copy with new ID
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

    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/rules/custom/${rule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete rule');
      }

      toast.success(`Rule "${rule.name}" deleted successfully`);
      setRulesSelectedRuleId(null);
      setRulesDetailPanelVisible(false);
      await loadRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete rule'
      );
    }
  };

  const handleSaveRule = async (rule: MultiFrameworkRule) => {
    try {
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const url =
        modalMode === 'create'
          ? '/api/rules/custom'
          : `/api/rules/custom/${rule.id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save rule');
      }

      toast.success(
        `Rule "${rule.name}" ${modalMode === 'create' ? 'created' : 'updated'} successfully`
      );
      await loadRules();
    } catch (error) {
      console.error('Failed to save rule:', error);
      throw error; // Re-throw to let modal handle it
    }
  };

  // Handle rule selection
  const handleRuleSelect = (ruleId: string) => {
    setRulesSelectedRuleId(ruleId);
    setRulesDetailPanelVisible(true);
  };

  // Handle close panel
  const handleClosePanel = () => {
    setRulesSelectedRuleId(null);
    setRulesDetailPanelVisible(false);
  };

  // All rules combined (for search)
  const allRules = useMemo(() => {
    return [...officialRules, ...communityRules, ...customRules];
  }, [officialRules, communityRules, customRules]);

  // Filter rules by framework, category, and enabled status
  const filterRules = (rules: MultiFrameworkRule[]) => {
    return rules.filter((rule) => {
      // Framework filter
      if (!rule.transformers[selectedFramework]) {
        return false;
      }

      // Category filter
      if (selectedCategory && rule.category !== selectedCategory) {
        return false;
      }

      // Enabled filter
      if (showEnabledOnly && !rule.enabled) {
        return false;
      }

      return true;
    });
  };

  const filteredOfficialRules = useMemo(
    () => filterRules(officialRules),
    [officialRules, selectedFramework, selectedCategory, showEnabledOnly]
  );

  const filteredCommunityRules = useMemo(
    () => filterRules(communityRules),
    [communityRules, selectedFramework, selectedCategory, showEnabledOnly]
  );

  const filteredCustomRules = useMemo(
    () => filterRules(customRules),
    [customRules, selectedFramework, selectedCategory, showEnabledOnly]
  );

  const totalFilteredRules =
    filteredOfficialRules.length +
    filteredCommunityRules.length +
    filteredCustomRules.length;

  // Get selected rule
  const selectedRule = useMemo(() => {
    if (!rulesSelectedRuleId) return null;
    return allRules.find((r) => r.id === rulesSelectedRuleId) || null;
  }, [rulesSelectedRuleId, allRules]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-primary border-r-transparent mb-4"></div>
          <p className="text-text-secondary">Loading Rules Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Custom Rule Modal (WP23) */}
      <CustomRuleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveRule}
        existingRule={editingRule}
        mode={modalMode}
      />

      {/* Unified Filter Bar with Search */}
      <RulesFilterBar
        rules={allRules}
        onRuleSelect={handleRuleSelect}
        selectedFramework={selectedFramework}
        onFrameworkChange={setSelectedFramework}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showEnabledOnly={showEnabledOnly}
        onShowEnabledOnlyChange={setShowEnabledOnly}
        onCreateRule={handleCreateRule}
        onEditRule={() => selectedRule && handleEditRule(selectedRule)}
        onDeleteRule={() => selectedRule && handleDeleteRule(selectedRule)}
        hasSelection={!!selectedRule}
        canDelete={selectedRule?.type === 'custom'}
      />

      {/* Main Content - Master-Detail Layout */}
      <div className="flex-1 overflow-hidden">
        {isMobile ? (
          // Mobile: Full-width list + Sheet for details
          <>
            <RulesGroupedList
              officialRules={filteredOfficialRules}
              communityRules={filteredCommunityRules}
              customRules={filteredCustomRules}
              selectedRuleId={rulesSelectedRuleId}
              onRuleSelect={handleRuleSelect}
              officialCollapsed={rulesOfficialCollapsed}
              communityCollapsed={rulesCommunityCollapsed}
              customCollapsed={rulesCustomCollapsed}
              onOfficialCollapsedChange={setRulesOfficialCollapsed}
              onCommunityCollapsedChange={setRulesCommunityCollapsed}
              onCustomCollapsedChange={setRulesCustomCollapsed}
            />
            <RulesDetailSheet
              rule={selectedRule}
              selectedFramework={selectedFramework}
              open={rulesDetailPanelVisible && !!selectedRule}
              onClose={handleClosePanel}
              onEdit={() => selectedRule && handleEditRule(selectedRule)}
              onDuplicate={() => selectedRule && handleDuplicateRule(selectedRule)}
              onDelete={() => selectedRule && handleDeleteRule(selectedRule)}
            />
          </>
        ) : rulesDetailPanelVisible && selectedRule ? (
          // Desktop: Two-panel layout with ResizablePanelGroup
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* List Panel */}
            <ResizablePanel
              defaultSize={35}
              minSize={25}
              maxSize={50}
              className="bg-bg-primary"
            >
              <RulesGroupedList
                officialRules={filteredOfficialRules}
                communityRules={filteredCommunityRules}
                customRules={filteredCustomRules}
                selectedRuleId={rulesSelectedRuleId}
                onRuleSelect={handleRuleSelect}
                officialCollapsed={rulesOfficialCollapsed}
                communityCollapsed={rulesCommunityCollapsed}
                customCollapsed={rulesCustomCollapsed}
                onOfficialCollapsedChange={setRulesOfficialCollapsed}
                onCommunityCollapsedChange={setRulesCommunityCollapsed}
                onCustomCollapsedChange={setRulesCustomCollapsed}
              />
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-border-primary hover:bg-accent-primary transition-colors" />

            {/* Detail Panel */}
            <ResizablePanel
              defaultSize={65}
              minSize={50}
              maxSize={75}
              className="bg-bg-card"
            >
              <RulesDetailPanel
                rule={selectedRule}
                selectedFramework={selectedFramework}
                onClose={handleClosePanel}
                onEdit={() => handleEditRule(selectedRule)}
                onDuplicate={() => handleDuplicateRule(selectedRule)}
                onDelete={() => handleDeleteRule(selectedRule)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          // Desktop: Full-width list (no selection)
          <RulesGroupedList
            officialRules={filteredOfficialRules}
            communityRules={filteredCommunityRules}
            customRules={filteredCustomRules}
            selectedRuleId={rulesSelectedRuleId}
            onRuleSelect={handleRuleSelect}
            officialCollapsed={rulesOfficialCollapsed}
            communityCollapsed={rulesCommunityCollapsed}
            customCollapsed={rulesCustomCollapsed}
            onOfficialCollapsedChange={setRulesOfficialCollapsed}
            onCommunityCollapsedChange={setRulesCommunityCollapsed}
            onCustomCollapsedChange={setRulesCustomCollapsed}
          />
        )}
      </div>
    </div>
  );
}

export default function RulesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-bg-primary">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-accent-primary border-r-transparent mb-4"></div>
            <p className="text-text-secondary">Loading Rules Manager...</p>
          </div>
        </div>
      }
    >
      <RulesPageContent />
    </Suspense>
  );
}
