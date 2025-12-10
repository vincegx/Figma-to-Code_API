'use client';

/**
 * Detected Components List
 *
 * Displays Smart Detection results with checkboxes for selection.
 * Shows component name, type, node count, and optional score badge.
 */

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { DetectedComponent } from '@/lib/types/split';

interface DetectedListProps {
  components: DetectedComponent[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

/**
 * Badge color based on node type
 */
function getTypeBadgeColor(type: string): string {
  switch (type) {
    case 'INSTANCE':
      return 'bg-purple-500/20 text-purple-400';
    case 'COMPONENT':
      return 'bg-green-500/20 text-green-400';
    case 'FRAME':
      return 'bg-blue-500/20 text-blue-400';
    case 'GROUP':
      return 'bg-yellow-500/20 text-yellow-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export function DetectedList({
  components,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: DetectedListProps) {
  const allSelected = components.length > 0 && components.every(c => selectedIds.includes(c.id));
  const someSelected = components.some(c => selectedIds.includes(c.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(components.map(c => c.id));
    }
  };

  const toggleComponent = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const totalNodes = components
    .filter(c => selectedIds.includes(c.id))
    .reduce((sum, c) => sum + c.nodeCount, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Select All */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={toggleAll}
          disabled={disabled || components.length === 0}
          className="text-xs text-text-muted hover:text-text-primary disabled:opacity-50"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
        <span className="text-xs text-text-muted">
          {components.length} detected
        </span>
      </div>

      {/* Component List */}
      <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-secondary">
        <div className="max-h-[300px] overflow-y-auto">
          {components.length === 0 ? (
            <div className="p-4 text-center text-text-muted text-sm">
              No components detected
            </div>
          ) : (
            <ul className="divide-y divide-border-primary">
              {components.map((component) => {
                const isSelected = selectedIds.includes(component.id);
                return (
                  <li
                    key={component.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 hover:bg-bg-hover transition-colors',
                      disabled && 'opacity-50 pointer-events-none'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleComponent(component.id)}
                      disabled={disabled}
                      className="data-[state=checked]:bg-accent-primary data-[state=checked]:border-accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-primary truncate">
                          {component.name}
                        </span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded font-medium',
                          getTypeBadgeColor(component.type)
                        )}>
                          {component.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted tabular-nums">
                      {component.nodeCount} nodes
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-1 text-xs text-text-muted">
        <span>
          Selected: <span className="text-text-primary">{selectedIds.length}/{components.length}</span>
        </span>
        <span>
          <span className="text-text-primary">{totalNodes}</span> nodes
        </span>
      </div>
    </div>
  );
}
