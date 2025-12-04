'use client';

/**
 * CustomRuleModal - Create/Edit Rule Modal (WP42 Redesign V2)
 *
 * Dark mode styling matching the Rules page design
 */

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Check, ChevronDown } from 'lucide-react';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { SelectorEditor } from './selector-editor';
import { TransformerEditor } from './transformer-editor';
import { RulePreview } from './rule-preview';
import { cn } from '@/lib/utils';

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

const FRAMEWORKS: { value: FrameworkType; label: string }[] = [
  { value: 'react-tailwind', label: 'React + Tailwind' },
  { value: 'html-css', label: 'HTML/CSS' },
  { value: 'react-inline', label: 'React Inline' },
  { value: 'swift-ui', label: 'Swift UI' },
  { value: 'android-xml', label: 'Android XML' },
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
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

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
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-primary rounded-xl border border-border-primary shadow-2xl z-50 w-[90vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-primary bg-bg-card">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              {mode === 'create' ? 'New Rule' : 'Edit Rule'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Errors */}
            {errors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs font-medium text-red-400 mb-1">Validation Errors:</p>
                <ul className="text-xs text-red-400 list-disc list-inside space-y-0.5">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                BASIC INFO
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Rule ID */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Rule ID *</label>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    disabled={mode === 'edit'}
                    placeholder="custom-my-rule"
                    className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Rule Name */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Rule Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Custom Rule"
                    className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-border-secondary"
                  />
                </div>

                {/* Category */}
                <div className="relative">
                  <label className="block text-xs text-text-muted mb-1.5">Category *</label>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-lg text-text-primary hover:bg-bg-hover"
                  >
                    <span className="capitalize">{category}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-card border border-border-primary rounded-lg shadow-lg z-20 py-1 max-h-48 overflow-auto">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setCategory(cat); setCategoryDropdownOpen(false); }}
                          className="w-full px-3 py-1.5 text-sm text-left text-text-secondary hover:bg-bg-hover capitalize"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Priority (min: 100)</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    min={100}
                    className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-border-secondary"
                  />
                </div>

                {/* Tags */}
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1.5">Tags</label>
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
                      className="flex-1 px-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-border-secondary"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-accent-primary hover:bg-accent-hover text-white text-sm rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-xs"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-cyan-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enabled */}
                <div className="col-span-2">
                  <label className="block text-xs text-text-muted mb-1.5">Status</label>
                  <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-bg-secondary text-text-muted border border-border-primary'
                    )}
                  >
                    {enabled && <Check className="w-3 h-3" />}
                    {enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            {/* Selector Section */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                SELECTOR *
              </h3>
              <SelectorEditor
                selector={selector}
                onChange={setSelector}
              />
            </div>

            {/* Transformers Section */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                TRANSFORMERS *
              </h3>

              {/* Framework Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                {FRAMEWORKS.map(fw => {
                  const isActive = selectedFramework === fw.value;
                  const hasTransformer = !!transformers[fw.value];
                  return (
                    <button
                      key={fw.value}
                      type="button"
                      onClick={() => setSelectedFramework(fw.value)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                        isActive
                          ? 'bg-accent-primary text-white border-accent-primary'
                          : hasTransformer
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-bg-secondary text-text-muted border-border-primary hover:bg-bg-hover'
                      )}
                    >
                      {hasTransformer && !isActive && <Check className="w-3 h-3" />}
                      {fw.label}
                    </button>
                  );
                })}
              </div>

              {/* Transformer Editor */}
              <div className="p-3 rounded-lg bg-bg-secondary">
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

            {/* Preview Section */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-primary">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
                PREVIEW
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-primary bg-bg-card">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 text-xs font-medium text-text-secondary border border-border-primary rounded-lg hover:bg-bg-hover transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium bg-accent-primary hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create Rule' : 'Update Rule'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
