'use client';

import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search } from 'lucide-react';
import type { MultiFrameworkRule } from '@/lib/types/rules';

interface RulesCommandSearchProps {
  rules: MultiFrameworkRule[];
  onSelect: (ruleId: string) => void;
  placeholder?: string;
}

export function RulesCommandSearch({
  rules,
  onSelect,
  placeholder = 'Search rules...',
}: RulesCommandSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Cmd+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter rules
  const filteredRules = rules.filter((rule) => {
    const query = search.toLowerCase();
    return (
      rule.name.toLowerCase().includes(query) ||
      rule.id.toLowerCase().includes(query) ||
      rule.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      rule.category.toLowerCase().includes(query)
    );
  });

  // Group by type
  const officialRules = filteredRules.filter((r) => r.type === 'official');
  const communityRules = filteredRules.filter((r) => r.type === 'community');
  const customRules = filteredRules.filter((r) => r.type === 'custom');

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-muted bg-bg-secondary border border-border-primary rounded-lg hover:bg-bg-hover transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">{placeholder}</span>
        <kbd className="px-1.5 py-0.5 text-xs bg-bg-card border border-border-primary rounded font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by name, ID, tag, or category..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No rules found.</CommandEmpty>

          {officialRules.length > 0 && (
            <CommandGroup heading="Official">
              {officialRules.map((rule) => (
                <CommandItem
                  key={rule.id}
                  value={`${rule.id}-${rule.name}`}
                  onSelect={() => {
                    onSelect(rule.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="cursor-pointer"
                >
                  <span className="mr-2 text-blue-500">●</span>
                  <span className="flex-1">{rule.name}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    {rule.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {communityRules.length > 0 && (
            <CommandGroup heading="Community">
              {communityRules.map((rule) => (
                <CommandItem
                  key={rule.id}
                  value={`${rule.id}-${rule.name}`}
                  onSelect={() => {
                    onSelect(rule.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="cursor-pointer"
                >
                  <span className="mr-2 text-purple-500">●</span>
                  <span className="flex-1">{rule.name}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    {rule.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {customRules.length > 0 && (
            <CommandGroup heading="Custom">
              {customRules.map((rule) => (
                <CommandItem
                  key={rule.id}
                  value={`${rule.id}-${rule.name}`}
                  onSelect={() => {
                    onSelect(rule.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="cursor-pointer"
                >
                  <span className="mr-2 text-green-500">●</span>
                  <span className="flex-1">{rule.name}</span>
                  <span className="ml-auto text-xs text-text-muted">
                    {rule.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
