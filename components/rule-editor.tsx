'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRulesStore } from '@/lib/store/rules-store';
import { MappingRule } from '@/lib/types/rules';
import { X } from 'lucide-react';

// Dynamic import Monaco Editor (reduce bundle size)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

interface RuleEditorProps {
  mode: 'new' | 'edit';
  ruleId?: string;
  onClose: () => void;
}

export default function RuleEditor({ mode, ruleId, onClose }: RuleEditorProps) {
  const rules = useRulesStore((state) => state.rules);
  const createRule = useRulesStore((state) => state.createRule);
  const updateRule = useRulesStore((state) => state.updateRule);
  const saveRules = useRulesStore((state) => state.saveRules);

  const existingRule =
    mode === 'edit' && ruleId
      ? rules.find((r) => r.metadata.id === ruleId)
      : null;

  // Template for new rule
  const templateRule: MappingRule = {
    metadata: {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      description: 'Enter a description for this rule',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      enabled: true,
    },
    priority: 'medium',
    conditions: {
      field: 'type',
      operator: 'equals',
      value: 'FRAME',
    },
    template: {
      language: 'tsx',
      template: '<div>{children}</div>',
      variables: [],
    },
    conflictStrategy: 'first-match',
    allowNesting: true,
  };

  const [jsonValue, setJsonValue] = useState(
    JSON.stringify(existingRule || templateRule, null, 2)
  );
  const [error, setError] = useState('');

  // Configure Monaco JSON language service for schema validation
  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: 'http://myapp.com/mapping-rule-schema.json',
          fileMatch: ['*'],
          schema: {
            type: 'object',
            required: ['metadata', 'priority', 'conditions', 'template', 'conflictStrategy', 'allowNesting'],
            properties: {
              metadata: {
                type: 'object',
                required: ['id', 'name', 'description', 'version', 'createdAt', 'updatedAt', 'tags', 'enabled'],
                properties: {
                  id: { type: 'string', description: 'Unique rule ID' },
                  name: { type: 'string', description: 'Human-readable rule name' },
                  description: { type: 'string', description: 'Rule description' },
                  author: { type: 'string', description: 'Rule author (optional)' },
                  version: { type: 'string', description: 'Rule version (semver)' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  tags: { type: 'array', items: { type: 'string' } },
                  enabled: { type: 'boolean', description: 'Whether rule is active' },
                },
              },
              priority: {
                type: 'string',
                enum: ['critical', 'high', 'medium', 'low'],
                description: 'Rule priority for conflict resolution',
              },
              conditions: {
                type: 'object',
                description: 'Rule matching conditions',
                required: ['field', 'operator', 'value'],
                properties: {
                  field: { type: 'string' },
                  operator: {
                    type: 'string',
                    enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'],
                  },
                  value: {
                    oneOf: [
                      { type: 'string' },
                      { type: 'number' },
                      { type: 'boolean' },
                    ],
                  },
                  caseSensitive: { type: 'boolean' },
                },
              },
              template: {
                type: 'object',
                required: ['language', 'template', 'variables'],
                properties: {
                  language: {
                    type: 'string',
                    enum: ['tsx', 'html', 'vue', 'swift'],
                  },
                  template: { type: 'string' },
                  variables: { type: 'array' },
                  imports: { type: 'array', items: { type: 'string' } },
                  wrappers: {
                    type: 'object',
                    properties: {
                      before: { type: 'string' },
                      after: { type: 'string' },
                    },
                  },
                },
              },
              conflictStrategy: {
                type: 'string',
                enum: ['first-match', 'highest-priority', 'most-specific', 'merge'],
              },
              allowNesting: { type: 'boolean' },
              maxDepth: { type: 'number' },
            },
          },
        },
      ],
    });
  };

  const handleSave = async () => {
    try {
      const parsedRule: any = JSON.parse(jsonValue);

      // Basic validation
      if (
        !parsedRule.metadata?.id ||
        !parsedRule.metadata?.name ||
        parsedRule.priority === undefined
      ) {
        throw new Error(
          'Missing required fields: metadata.id, metadata.name, priority'
        );
      }

      // Update timestamps (create new object to avoid readonly errors)
      const now = new Date().toISOString();
      const rule: MappingRule = {
        ...parsedRule,
        metadata: {
          ...parsedRule.metadata,
          updatedAt: now,
          createdAt: mode === 'new' ? now : parsedRule.metadata.createdAt,
        },
      };

      if (mode === 'new') {
        createRule(rule);
      } else if (mode === 'edit' && ruleId) {
        updateRule(ruleId, rule);
      }

      // Auto-save to filesystem
      await saveRules();

      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid JSON');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            {mode === 'new' ? 'New Rule' : 'Edit Rule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language="json"
            value={jsonValue}
            onChange={(value) => setJsonValue(value || '')}
            beforeMount={handleEditorWillMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              formatOnPaste: true,
              formatOnType: true,
            }}
            theme="vs-dark"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!error && <div></div>}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
