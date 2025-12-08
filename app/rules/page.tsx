'use client';

/**
 * Rules Page (WP42 Redesign V2)
 *
 * Layout based on Rules-new.png:
 *   [Header: "Figma Rules Builder" + API badge | Action buttons]
 *   [Left Sidebar | Right Panel (2-column grid)]
 *
 * Phase 3 refactoring: extracted useRulesData hook and components
 */

import { Suspense } from 'react';
import { CustomRuleModal } from '@/components/custom-rule-modal';

// Phase 3: Extracted hook and components
import { useRulesData } from './_hooks/useRulesData';
import { RulesSidebar, RuleDetailPanel } from './_components';

function RulesPageContent() {
  const {
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
  } = useRulesData();

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
        <RulesSidebar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          availableCategories={availableCategories}
          showEnabledOnly={showEnabledOnly}
          onEnabledOnlyChange={setShowEnabledOnly}
          selectedFramework={selectedFramework}
          onFrameworkChange={setSelectedFramework}
          categoryDropdownOpen={categoryDropdownOpen}
          onCategoryDropdownChange={setCategoryDropdownOpen}
          categoryDropdownRef={categoryDropdownRef}
          frameworkDropdownOpen={frameworkDropdownOpen}
          onFrameworkDropdownChange={setFrameworkDropdownOpen}
          frameworkDropdownRef={frameworkDropdownRef}
          filteredRules={filteredRules}
          selectedRuleId={selectedRuleId}
          onRuleSelect={setSelectedRuleId}
          enabledCount={enabledCount}
          getRuleSubtitle={getRuleSubtitle}
          getRuleCount={getRuleCount}
        />

        {/* Right Panel */}
        <div className="flex-1 bg-bg-primary overflow-auto">
          <RuleDetailPanel
            selectedRule={selectedRule}
            selectedFramework={selectedFramework}
            onDuplicate={handleDuplicateRule}
            onDelete={handleDeleteRule}
            onEdit={handleEditRule}
            onCreate={handleCreateRule}
            getActiveFrameworks={getActiveFrameworks}
          />
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
