'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { SelectorEditor } from './selector-editor';
import { TransformerEditor } from './transformer-editor';
import { RulePreview } from './rule-preview';

interface CustomRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: MultiFrameworkRule) => Promise<void>;
  existingRule?: MultiFrameworkRule | null;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  'layout',
  'colors',
  'typography',
  'spacing',
  'borders',
  'effects',
  'components',
  'constraints',
  'other',
  'custom',
] as const;

const FRAMEWORKS: FrameworkType[] = [
  'react-tailwind',
  'html-css',
  'react-inline',
  'swift-ui',
  'android-xml',
];

export function CustomRuleModal({
  open,
  onOpenChange,
  onSave,
  existingRule,
  mode,
}: CustomRuleModalProps) {
  // Form state
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('layout');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [priority, setPriority] = useState(100);
  const [enabled, setEnabled] = useState(true);
  const [selector, setSelector] = useState<MultiFrameworkRule['selector']>({});
  const [transformers, setTransformers] = useState<MultiFrameworkRule['transformers']>({});
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType>('react-tailwind');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form with existing rule data (for edit mode)
  useEffect(() => {
    if (existingRule && mode === 'edit') {
      setId(existingRule.id);
      setName(existingRule.name);
      setCategory(existingRule.category);
      setTags([...existingRule.tags]);
      setPriority(existingRule.priority);
      setEnabled(existingRule.enabled);
      setSelector({ ...existingRule.selector });
      setTransformers({ ...existingRule.transformers });
    } else {
      // Reset for create mode
      resetForm();
    }
  }, [existingRule, mode, open]);

  const resetForm = () => {
    setId('');
    setName('');
    setCategory('layout');
    setTags([]);
    setTagInput('');
    setPriority(100);
    setEnabled(true);
    setSelector({});
    setTransformers({});
    setErrors([]);
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!id.trim()) newErrors.push('Rule ID is required');
    if (!name.trim()) newErrors.push('Rule name is required');
    if (priority < 100) newErrors.push('Custom rules must have priority >= 100');
    if (Object.keys(selector).length === 0) newErrors.push('Selector must have at least one property');
    if (Object.keys(transformers).length === 0) newErrors.push('At least one framework transformer is required');

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const rule: MultiFrameworkRule = {
        id,
        name,
        type: 'custom',
        category,
        tags,
        enabled,
        priority,
        selector,
        transformers,
      };

      await onSave(rule);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save custom rule:', error);
      setErrors([error instanceof Error ? error.message : 'Failed to save rule']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-card rounded-lg border border-border-primary shadow-xl z-50 w-[90vw] max-w-5xl max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-bg-card border-b border-border-primary p-6 flex items-center justify-between z-10">
            <Dialog.Title className="text-2xl font-bold text-text-primary">
              {mode === 'create' ? '+ New Custom Rule' : 'Edit Custom Rule'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-text-muted hover:text-text-secondary">
                <X size={24} />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-status-error-bg border border-status-error-border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-status-error-text mb-2">
                  Validation Errors:
                </h4>
                <ul className="text-sm text-status-error-text list-disc list-inside">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Info Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Basic Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Rule ID *
                  </label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    disabled={mode === 'edit'}
                    placeholder="custom-my-rule"
                    className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Custom Rule"
                    className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                    className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Priority (min: 100)
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    min={100}
                    className="w-full px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 border border-border-primary rounded-lg bg-bg-primary text-text-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-bg-secondary text-text-secondary rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-status-error-text"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded"
                  />
                  Enabled
                </label>
              </div>
            </section>

            {/* Selector Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Selector *
              </h3>
              <SelectorEditor
                selector={selector}
                onChange={setSelector}
              />
            </section>

            {/* Transformers Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Transformers *
              </h3>
              <div className="border border-border-primary rounded-lg overflow-hidden">
                {/* Framework Tabs */}
                <div className="flex border-b border-border-primary bg-bg-secondary">
                  {FRAMEWORKS.map(fw => (
                    <button
                      key={fw}
                      onClick={() => setSelectedFramework(fw)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        selectedFramework === fw
                          ? 'bg-bg-card text-accent-primary border-b-2 border-accent-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {fw}
                      {transformers[fw] && (
                        <span className="ml-1 text-status-success-text">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Transformer Editor */}
                <div className="p-4 bg-bg-card">
                  <TransformerEditor
                    framework={selectedFramework}
                    transformer={transformers[selectedFramework]}
                    onChange={(newTransformer) => {
                      if (newTransformer && Object.keys(newTransformer).length > 0) {
                        setTransformers({ ...transformers, [selectedFramework]: newTransformer });
                      } else {
                        const newTransformers = { ...transformers };
                        delete newTransformers[selectedFramework];
                        setTransformers(newTransformers);
                      }
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Preview Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Preview
              </h3>
              <RulePreview
                rule={{
                  id,
                  name,
                  type: 'custom',
                  category,
                  tags,
                  enabled,
                  priority,
                  selector,
                  transformers,
                }}
              />
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-bg-card border-t border-border-primary p-6 flex items-center justify-end gap-4 z-10">
            <Dialog.Close asChild>
              <button
                className="px-6 py-2 border border-border-primary text-text-secondary rounded-lg hover:bg-bg-hover"
                disabled={isSaving}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-accent-primary text-text-inverse rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Rule' : 'Update Rule'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
