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
      <div className="p-4 border-b border-border-primary flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{rule.name}</h2>
          <p className="text-xs text-text-muted mt-1">{rule.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
        >
          <X size={18} className="text-text-muted" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Rule type info banner (WP20) */}
        {isOfficialRule && (
          <div className="bg-accent-secondary border border-accent-primary/20 rounded-lg p-3">
            <p className="text-sm text-accent-primary flex items-center gap-2">
              <span>🔵</span>
              <strong>Official Rule</strong> - From Figma API spec (priority: 50)
            </p>
          </div>
        )}
        {isCommunityRule && (
          <div className="bg-status-info-bg border border-status-info-text/20 rounded-lg p-3">
            <p className="text-sm text-status-info-text flex items-center gap-2">
              <span>🟣</span>
              <strong>Community Rule</strong> - From FigmaToCode (priority: 75)
            </p>
          </div>
        )}
        {isCustomRule && (
          <div className="bg-status-success-bg border border-status-success-text/20 rounded-lg p-3">
            <p className="text-sm text-status-success-text flex items-center gap-2">
              <span>🟢</span>
              <strong>Custom Rule</strong> - User-created (priority: {rule.priority})
            </p>
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Basic Info</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-text-muted">Type</label>
              <p className="font-medium text-text-primary capitalize">{rule.type}</p>
            </div>
            <div>
              <label className="text-text-muted">Category</label>
              <p className="font-medium text-text-primary capitalize">{rule.category}</p>
            </div>
            <div>
              <label className="text-text-muted">Priority</label>
              <p className="font-medium text-text-primary">{rule.priority}</p>
            </div>
            <div>
              <label className="text-text-muted">Status</label>
              <p className="font-medium text-text-primary">
                {rule.enabled ? (
                  <span className="text-status-success-text">Enabled</span>
                ) : (
                  <span className="text-text-muted">Disabled</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {rule.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-secondary mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {rule.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs bg-bg-secondary text-text-secondary"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selector */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Selector</h3>
          <pre className="bg-bg-secondary border border-border-primary rounded-lg p-3 text-xs overflow-x-auto">
            <code className="text-text-primary">
              {JSON.stringify(rule.selector, null, 2)}
            </code>
          </pre>
        </div>

        {/* Current Framework Transformer */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            Transformer for {FRAMEWORK_LABELS[framework]}
          </h3>
          {currentTransformer ? (
            <pre className="bg-bg-secondary border border-border-primary rounded-lg p-3 text-xs overflow-x-auto">
              <code className="text-text-primary">
                {JSON.stringify(currentTransformer, null, 2)}
              </code>
            </pre>
          ) : (
            <p className="text-sm text-text-muted italic">No transformer defined for this framework</p>
          )}
        </div>

        {/* Available Frameworks */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            Available Frameworks ({availableFrameworks.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {availableFrameworks.map((fw) => (
              <span
                key={fw}
                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  fw === framework
                    ? 'bg-accent-secondary border-accent-primary text-accent-primary'
                    : 'bg-bg-card border-border-primary text-text-secondary'
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
