'use client';

import type { FrameworkType } from '@/lib/types/rules';

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
}: RulesSidebarProps) {
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

      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Categories
        </h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters (WP20: 3-tier system) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Rule Types
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
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
