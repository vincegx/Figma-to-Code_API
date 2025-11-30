'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search } from 'lucide-react';
import type { FrameworkType, MultiFrameworkRule } from '@/lib/types/rules';

interface RulesFilterBarProps {
  // Search
  rules: MultiFrameworkRule[];
  onRuleSelect: (ruleId: string) => void;
  // Filters
  selectedFramework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showEnabledOnly: boolean;
  onShowEnabledOnlyChange: (show: boolean) => void;
  // Actions
  onCreateRule: () => void;
  onEditRule: () => void;
  onDeleteRule: () => void;
  // State
  hasSelection: boolean;
  canDelete: boolean;
}

const FRAMEWORKS: { value: FrameworkType; label: string }[] = [
  { value: 'react-tailwind', label: 'React + Tailwind' },
  { value: 'html-css', label: 'HTML + CSS' },
  { value: 'react-inline', label: 'React Inline' },
  { value: 'swift-ui', label: 'SwiftUI' },
  { value: 'android-xml', label: 'Android XML' },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'layout', label: 'Layout' },
  { value: 'colors', label: 'Colors' },
  { value: 'typography', label: 'Typography' },
  { value: 'spacing', label: 'Spacing' },
  { value: 'borders', label: 'Borders' },
  { value: 'effects', label: 'Effects' },
  { value: 'components', label: 'Components' },
  { value: 'constraints', label: 'Constraints' },
  { value: 'other', label: 'Other' },
  { value: 'custom', label: 'Custom' },
];

export function RulesFilterBar({
  rules,
  onRuleSelect,
  selectedFramework,
  onFrameworkChange,
  selectedCategory,
  onCategoryChange,
  showEnabledOnly,
  onShowEnabledOnlyChange,
  onCreateRule,
}: RulesFilterBarProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K shortcut to focus search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter rules for search (only when there's a query)
  const filteredRules = search.trim()
    ? rules.filter((rule) => {
        const query = search.toLowerCase();
        return (
          rule.name.toLowerCase().includes(query) ||
          rule.id.toLowerCase().includes(query) ||
          rule.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          rule.category.toLowerCase().includes(query)
        );
      })
    : [];

  // Group by type
  const officialRules = filteredRules.filter((r) => r.type === 'official');
  const communityRules = filteredRules.filter((r) => r.type === 'community');
  const customRules = filteredRules.filter((r) => r.type === 'custom');

  const hasResults = filteredRules.length > 0;
  const showDropdown = isOpen && search.trim().length > 0;

  const handleSelect = (ruleId: string) => {
    onRuleSelect(ruleId);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary bg-bg-secondary">
      {/* Search with Autocomplete */}
      <Popover open={showDropdown} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input
              ref={inputRef}
              placeholder="Search rules..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-9 pr-12 h-9 bg-bg-secondary border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-text-muted bg-bg-card border border-border-primary rounded font-mono">
              ⌘K
            </kbd>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[400px] p-0 bg-bg-card border border-border-primary shadow-lg"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e: Event) => e.preventDefault()}
        >
          <ScrollArea className="max-h-[300px]">
            {!hasResults ? (
              <div className="p-4 text-sm text-text-muted text-center">
                No rules found for &quot;{search}&quot;
              </div>
            ) : (
              <div className="py-1">
                {officialRules.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-text-muted">
                      Official
                    </div>
                    {officialRules.map((rule) => (
                      <button
                        key={rule.id}
                        onClick={() => handleSelect(rule.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors text-left"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="flex-1 truncate">{rule.name}</span>
                        <span className="text-xs text-text-muted">
                          {rule.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {communityRules.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-text-muted">
                      Community
                    </div>
                    {communityRules.map((rule) => (
                      <button
                        key={rule.id}
                        onClick={() => handleSelect(rule.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors text-left"
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                        <span className="flex-1 truncate">{rule.name}</span>
                        <span className="text-xs text-text-muted">
                          {rule.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {customRules.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-text-muted">
                      Custom
                    </div>
                    {customRules.map((rule) => (
                      <button
                        key={rule.id}
                        onClick={() => handleSelect(rule.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors text-left"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <span className="flex-1 truncate">{rule.name}</span>
                        <span className="text-xs text-text-muted">
                          {rule.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Framework */}
      <Select
        value={selectedFramework}
        onValueChange={(v) => onFrameworkChange(v as FrameworkType)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FRAMEWORKS.map((fw) => (
            <SelectItem key={fw.value} value={fw.value}>
              {fw.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category */}
      <Select
        value={selectedCategory || 'all'}
        onValueChange={(v) => onCategoryChange(v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Enabled Only */}
      <div className="flex items-center gap-2">
        <Switch
          checked={showEnabledOnly}
          onCheckedChange={onShowEnabledOnlyChange}
          id="enabled-only"
        />
        <label
          htmlFor="enabled-only"
          className="text-sm text-text-secondary cursor-pointer select-none whitespace-nowrap"
        >
          Enabled only
        </label>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New Rule Button */}
      <Button onClick={onCreateRule} size="sm">
        <Plus className="w-4 h-4 mr-1" />
        New Rule
      </Button>
    </div>
  );
}
