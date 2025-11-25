'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { RulesSidebar } from '@/components/rules-sidebar';
import { RulesList } from '@/components/rules-list';
import { RuleEditor } from '@/components/rule-editor';

function RulesPageContent() {
  const searchParams = useSearchParams();

  // Framework selection (from URL or default)
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>(
    (searchParams.get('framework') as FrameworkType) || 'react-tailwind'
  );

  // Rules state (WP20: 3-tier system)
  const [officialRules, setOfficialRules] = useState<MultiFrameworkRule[]>([]);
  const [communityRules, setCommunityRules] = useState<MultiFrameworkRule[]>([]);
  const [customRules, setCustomRules] = useState<MultiFrameworkRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOfficialRules, setShowOfficialRules] = useState(true);
  const [showCommunityRules, setShowCommunityRules] = useState(true);
  const [showCustomRules, setShowCustomRules] = useState(true);
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const RULES_PER_PAGE = 50;

  // Load rules from API (WP20: 3-tier system)
  useEffect(() => {
    async function loadRules() {
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
      } finally {
        setIsLoading(false);
      }
    }

    loadRules();
  }, []);

  // Combine and filter rules (WP20: 3-tier system)
  const allRules = useMemo(() => {
    const combined: MultiFrameworkRule[] = [];

    if (showOfficialRules) {
      combined.push(...officialRules);
    }

    if (showCommunityRules) {
      combined.push(...communityRules);
    }

    if (showCustomRules) {
      combined.push(...customRules);
    }

    return combined;
  }, [officialRules, communityRules, customRules, showOfficialRules, showCommunityRules, showCustomRules]);

  // Filter rules
  const filteredRules = useMemo(() => {
    return allRules.filter(rule => {
      // Framework filter
      if (!rule.transformers[selectedFramework]) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = rule.name.toLowerCase().includes(query);
        const matchesId = rule.id.toLowerCase().includes(query);
        const matchesTags = rule.tags.some(tag => tag.toLowerCase().includes(query));

        if (!matchesName && !matchesId && !matchesTags) {
          return false;
        }
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
  }, [allRules, selectedFramework, searchQuery, selectedCategory, showEnabledOnly]);

  // Paginate rules
  const paginatedRules = useMemo(() => {
    const startIndex = (currentPage - 1) * RULES_PER_PAGE;
    const endIndex = startIndex + RULES_PER_PAGE;
    return filteredRules.slice(startIndex, endIndex);
  }, [filteredRules, currentPage]);

  const totalPages = Math.ceil(filteredRules.length / RULES_PER_PAGE);

  // Get selected rule
  const selectedRule = useMemo(() => {
    if (!selectedRuleId) return null;
    return allRules.find(r => r.id === selectedRuleId) || null;
  }, [selectedRuleId, allRules]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rules Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredRules.length} rules • {selectedFramework}
          </p>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - 20% desktop */}
        <div className="hidden lg:block lg:w-1/5 border-r border-gray-200 dark:border-gray-700 overflow-auto bg-white dark:bg-gray-800">
          <RulesSidebar
            selectedFramework={selectedFramework}
            onFrameworkChange={setSelectedFramework}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showOfficialRules={showOfficialRules}
            onShowOfficialRulesChange={setShowOfficialRules}
            showCommunityRules={showCommunityRules}
            onShowCommunityRulesChange={setShowCommunityRules}
            showCustomRules={showCustomRules}
            onShowCustomRulesChange={setShowCustomRules}
            showEnabledOnly={showEnabledOnly}
            onShowEnabledOnlyChange={setShowEnabledOnly}
            allRules={allRules}
          />
        </div>

        {/* Rules list - 40% desktop */}
        <div className="w-full lg:w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900">
          <RulesList
            rules={paginatedRules}
            selectedRuleId={selectedRuleId}
            onRuleSelect={setSelectedRuleId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        </div>

        {/* Rule editor - 40% desktop */}
        <div className="hidden lg:block lg:w-2/5 overflow-auto bg-white dark:bg-gray-800">
          {selectedRule ? (
            <RuleEditor
              rule={selectedRule}
              framework={selectedFramework}
              onClose={() => setSelectedRuleId(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">No rule selected</p>
                <p className="text-sm">Select a rule from the list to edit</p>
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
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Rules Manager...</p>
        </div>
      </div>
    }>
      <RulesPageContent />
    </Suspense>
  );
}
