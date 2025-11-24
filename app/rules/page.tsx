'use client';

import { useEffect, useState } from 'react';
import { useRulesStore } from '@/lib/store/rules-store';
import { useNodesStore } from '@/lib/store/nodes-store';
import { useRuleMatches } from '@/hooks/use-rule-matches';
import { Search, Plus, Upload, Download } from 'lucide-react';
import { MappingRule } from '@/lib/types/rules';
import RuleEditor from '@/components/rule-editor';

interface RuleListItemProps {
  rule: MappingRule;
  isSelected: boolean;
  onSelect: () => void;
}

function RuleListItem({ rule, isSelected, onSelect }: RuleListItemProps) {
  const matchCount = useRuleMatches(rule.metadata.id);

  return (
    <div
      onClick={onSelect}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-semibold text-sm truncate flex-1">
          {rule.metadata.name}
        </h3>

        {/* Match count badge */}
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            matchCount === 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {matchCount}
        </span>
      </div>

      <div className="text-xs text-gray-500">
        Priority: {rule.priority} • ID: {rule.metadata.id.slice(0, 8)}
      </div>

      {/* Unused warning */}
      {matchCount === 0 && (
        <div className="text-xs text-yellow-700 mt-1 flex items-center gap-1">
          ⚠️ Unused
        </div>
      )}
    </div>
  );
}

interface MainPanelProps {
  rule: MappingRule;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function MainPanel({ rule, onEdit, onDuplicate, onDelete }: MainPanelProps) {
  const matchCount = useRuleMatches(rule.metadata.id);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{rule.metadata.name}</h1>
        <div className="text-sm text-gray-500">
          ID: {rule.metadata.id} • Priority: {rule.priority}
        </div>
      </div>

      {/* Rule metadata */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <p className="text-sm text-gray-700">
            {rule.metadata.description || 'No description'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
              rule.metadata.enabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {rule.metadata.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Conditions preview */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Conditions</h3>
        <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-48">
          {JSON.stringify(rule.conditions, null, 2)}
        </pre>
      </div>

      {/* Template preview */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Code Template</h3>
        <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-48">
          {JSON.stringify(rule.template, null, 2)}
        </pre>
      </div>

      {/* Match count */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Match Count</h3>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">{matchCount} nodes</div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              matchCount === 0
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {matchCount === 0 ? '⚠️ Unused' : '✓ In Use'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Edit JSON
        </button>
        <button
          onClick={onDuplicate}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Duplicate
        </button>
        <button
          onClick={onDelete}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function RuleManagerPage() {
  const rules = useRulesStore((state) => state.rules);
  const selectedRuleId = useRulesStore((state) => state.selectedRuleId);
  const selectRule = useRulesStore((state) => state.selectRule);
  const loadRules = useRulesStore((state) => state.loadRules);
  const deleteRule = useRulesStore((state) => state.deleteRule);
  const duplicateRule = useRulesStore((state) => state.duplicateRule);
  const exportRules = useRulesStore((state) => state.exportRules);
  const importRules = useRulesStore((state) => state.importRules);
  const saveRules = useRulesStore((state) => state.saveRules);

  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState<'new' | 'edit'>('new');

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // Filter rules by search
  const filteredRules = rules.filter(
    (rule) =>
      rule.metadata.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.metadata.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedRule = rules.find((r) => r.metadata.id === selectedRuleId);

  const handleExport = () => {
    const json = exportRules();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mapping-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      try {
        await importRules(text);
        console.log('Rules imported successfully');
      } catch (err: any) {
        alert(`Import failed: ${err.message}`);
      }
    };
    input.click();
  };

  const handleDelete = (ruleId: string, ruleName: string) => {
    if (confirm(`Delete rule "${ruleName}"?`)) {
      deleteRule(ruleId);
      if (selectedRuleId === ruleId) {
        selectRule(null);
      }
      saveRules();
    }
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar: Rule list */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Top actions */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setEditorMode('new');
                setShowEditor(true);
              }}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              New Rule
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="flex-1 px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 text-sm"
            >
              <Upload size={14} />
              Import
            </button>
            <button
              onClick={handleExport}
              className="flex-1 px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 text-sm"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rules..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Rule list */}
        <div className="flex-1 overflow-auto">
          {filteredRules.map((rule) => (
            <RuleListItem
              key={rule.metadata.id}
              rule={rule}
              isSelected={selectedRuleId === rule.metadata.id}
              onSelect={() => selectRule(rule.metadata.id)}
            />
          ))}

          {filteredRules.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm ? 'No matching rules' : 'No rules created yet'}
            </div>
          )}
        </div>
      </div>

      {/* Main panel: Selected rule details */}
      <div className="flex-1 overflow-auto">
        {selectedRule ? (
          <MainPanel
            rule={selectedRule}
            onEdit={() => {
              setEditorMode('edit');
              setShowEditor(true);
            }}
            onDuplicate={() => {
              duplicateRule(selectedRule.metadata.id);
              saveRules();
            }}
            onDelete={() =>
              handleDelete(selectedRule.metadata.id, selectedRule.metadata.name)
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a rule to view details
          </div>
        )}
      </div>

      {/* Monaco Editor Modal */}
      {showEditor && (
        <RuleEditor
          mode={editorMode}
          ruleId={editorMode === 'edit' ? selectedRuleId || undefined : undefined}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  );
}
