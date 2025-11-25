'use client';

import type { FrameworkType, MultiFrameworkRule } from '@/lib/types/rules';

interface RulesSidebarProps {
  selectedFramework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showOfficialRules: boolean;
  onShowOfficialRulesChange: (show: boolean) => void;
  showCommunityRules: boolean;
  onShowCommunityRulesChange: (show: boolean) => void;
  showCustomRules: boolean;
  onShowCustomRulesChange: (show: boolean) => void;
  showEnabledOnly: boolean;
  onShowEnabledOnlyChange: (show: boolean) => void;
  allRules: MultiFrameworkRule[]; // WP20: For category and type counters
  onCreateRule?: () => void; // WP23: Handler to open custom rule modal
}

const CATEGORIES = [
  { id: 'layout', label: 'Layout', icon: '📐' },
  { id: 'colors', label: 'Colors', icon: '🎨' },
  { id: 'typography', label: 'Typography', icon: '📝' },
  { id: 'spacing', label: 'Spacing', icon: '📏' },
  { id: 'borders', label: 'Borders', icon: '🔲' },
  { id: 'effects', label: 'Effects', icon: '✨' },
  { id: 'components', label: 'Components', icon: '🧩' },
  { id: 'custom', label: 'Custom', icon: '👤' },
];

const FRAMEWORKS: { value: FrameworkType; label: string }[] = [
  { value: 'react-tailwind', label: 'React + Tailwind' },
  { value: 'html-css', label: 'HTML + CSS' },
  { value: 'react-inline', label: 'React Inline' },
  { value: 'swift-ui', label: 'SwiftUI' },
  { value: 'android-xml', label: 'Android XML' },
];

export function RulesSidebar({
  selectedFramework,
  onFrameworkChange,
  selectedCategory,
  onCategoryChange,
  showOfficialRules,
  onShowOfficialRulesChange,
  showCommunityRules,
  onShowCommunityRulesChange,
  showCustomRules,
  onShowCustomRulesChange,
  showEnabledOnly,
  onShowEnabledOnlyChange,
  allRules,
  onCreateRule,
}: RulesSidebarProps) {
  // WP20: Calculate counts by category
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = allRules.filter(rule => rule.category === cat.id && rule.transformers[selectedFramework]).length;
    return acc;
  }, {} as Record<string, number>);

  const totalRulesCount = allRules.filter(rule => rule.transformers[selectedFramework]).length;

  // WP20: Calculate counts by type
  const officialCount = allRules.filter(rule => rule.type === 'official' && rule.transformers[selectedFramework]).length;
  const communityCount = allRules.filter(rule => rule.type === 'community' && rule.transformers[selectedFramework]).length;
  const customCount = allRules.filter(rule => rule.type === 'custom' && rule.transformers[selectedFramework]).length;
  return (
    <div className="p-4 space-y-6">
      {/* Framework Selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Target Framework
        </label>
        <select
          value={selectedFramework}
          onChange={(e) => onFrameworkChange(e.target.value as FrameworkType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {FRAMEWORKS.map((fw) => (
            <option key={fw.value} value={fw.value}>
              {fw.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories (WP20: with counters) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Categories
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
              selectedCategory === null
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>All Categories</span>
            <span className="text-xs opacity-70">{totalRulesCount}</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </span>
              <span className="text-xs opacity-70">{categoryCounts[cat.id] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters (WP20: 3-tier system with counters) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Rule Types
          </h3>
          {onCreateRule && (
            <button
              onClick={onCreateRule}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              title="Create new custom rule"
            >
              + New
            </button>
          )}
        </div>
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOfficialRules}
                onChange={(e) => onShowOfficialRulesChange(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="flex items-center gap-1">
                <span className="text-blue-500">🔵</span>
                Official Rules
              </span>
            </span>
            <span className="text-xs opacity-70">{officialCount}</span>
          </label>
          <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCommunityRules}
                onChange={(e) => onShowCommunityRulesChange(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="flex items-center gap-1">
                <span className="text-purple-500">🟣</span>
                Community Rules
              </span>
            </span>
            <span className="text-xs opacity-70">{communityCount}</span>
          </label>
          <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showCustomRules}
                onChange={(e) => onShowCustomRulesChange(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="flex items-center gap-1">
                <span className="text-green-500">🟢</span>
                Custom Rules
              </span>
            </span>
            <span className="text-xs opacity-70">{customCount}</span>
          </label>
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Status
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showEnabledOnly}
              onChange={(e) => onShowEnabledOnlyChange(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <span>Enabled Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
