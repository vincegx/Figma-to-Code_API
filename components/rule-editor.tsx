'use client';

import { X } from 'lucide-react';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';

interface RuleEditorProps {
  rule: MultiFrameworkRule;
  framework: FrameworkType;
  onClose: () => void;
}

const FRAMEWORK_LABELS: Record<FrameworkType, string> = {
  'react-tailwind': 'React + Tailwind',
  'html-css': 'HTML + CSS',
  'react-inline': 'React Inline',
  'swift-ui': 'SwiftUI',
  'android-xml': 'Android XML',
};

export function RuleEditor({ rule, framework, onClose }: RuleEditorProps) {
  // WP20: All rules are now editable, but show info banner for official/community rules
  const isOfficialRule = rule.type === 'official';
  const isCommunityRule = rule.type === 'community';
  const isCustomRule = rule.type === 'custom';
  const currentTransformer = rule.transformers[framework];
  const availableFrameworks = Object.keys(rule.transformers) as FrameworkType[];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{rule.name}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rule.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Rule type info banner (WP20) */}
        {isOfficialRule && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <span>🔵</span>
              <strong>Official Rule</strong> - From Figma API spec (priority: 50)
            </p>
          </div>
        )}
        {isCommunityRule && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <p className="text-sm text-purple-800 dark:text-purple-200 flex items-center gap-2">
              <span>🟣</span>
              <strong>Community Rule</strong> - From FigmaToCode (priority: 75)
            </p>
          </div>
        )}
        {isCustomRule && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
              <span>🟢</span>
              <strong>Custom Rule</strong> - User-created (priority: {rule.priority})
            </p>
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Basic Info</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-gray-500 dark:text-gray-400">Type</label>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{rule.type}</p>
            </div>
            <div>
              <label className="text-gray-500 dark:text-gray-400">Category</label>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{rule.category}</p>
            </div>
            <div>
              <label className="text-gray-500 dark:text-gray-400">Priority</label>
              <p className="font-medium text-gray-900 dark:text-white">{rule.priority}</p>
            </div>
            <div>
              <label className="text-gray-500 dark:text-gray-400">Status</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {rule.enabled ? (
                  <span className="text-green-600 dark:text-green-400">Enabled</span>
                ) : (
                  <span className="text-gray-500">Disabled</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {rule.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {rule.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selector */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Selector</h3>
          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs overflow-x-auto">
            <code className="text-gray-900 dark:text-gray-100">
              {JSON.stringify(rule.selector, null, 2)}
            </code>
          </pre>
        </div>

        {/* Current Framework Transformer */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Transformer for {FRAMEWORK_LABELS[framework]}
          </h3>
          {currentTransformer ? (
            <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs overflow-x-auto">
              <code className="text-gray-900 dark:text-gray-100">
                {JSON.stringify(currentTransformer, null, 2)}
              </code>
            </pre>
          ) : (
            <p className="text-sm text-gray-400 italic">No transformer defined for this framework</p>
          )}
        </div>

        {/* Available Frameworks */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Available Frameworks ({availableFrameworks.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableFrameworks.map((fw) => (
              <span
                key={fw}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  fw === framework
                    ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {FRAMEWORK_LABELS[fw]}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
