'use client';

/**
 * Merge Creation Modal
 *
 * Allows users to create a new responsive merge by:
 * 1. Entering a name for the merge
 * 2. Selecting 3 nodes from the library (mobile, tablet, desktop)
 * 3. Customizing breakpoint widths
 */

import { useState, useEffect, useRef } from 'react';
import { Loader2, Monitor, Smartphone, Tablet, ChevronDown, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Merge, Breakpoint } from '@/lib/types/merge';
import type { LibraryNode } from '@/lib/types/library';

// ============================================================================
// Types
// ============================================================================

interface MergeCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (merge: Merge) => void;
}

interface BreakpointConfig {
  breakpoint: Breakpoint;
  label: string;
  icon: React.ReactNode;
  defaultWidth: number;
}

interface BreakpointSelection {
  nodeId: string | null;
  width: number;
}

// ============================================================================
// Constants
// ============================================================================

const BREAKPOINT_CONFIGS: BreakpointConfig[] = [
  {
    breakpoint: 'mobile',
    label: 'Mobile',
    icon: <Smartphone className="h-4 w-4" />,
    defaultWidth: 375,
  },
  {
    breakpoint: 'tablet',
    label: 'Tablet',
    icon: <Tablet className="h-4 w-4" />,
    defaultWidth: 768,
  },
  {
    breakpoint: 'desktop',
    label: 'Desktop',
    icon: <Monitor className="h-4 w-4" />,
    defaultWidth: 1280,
  },
];

// ============================================================================
// Custom Dropdown (to avoid portal issues with Select inside Dialog)
// ============================================================================

interface NodeDropdownProps {
  value: string | null;
  onChange: (nodeId: string) => void;
  nodes: LibraryNode[];
  disabledNodeIds: string[];
  disabled?: boolean;
  isLoading?: boolean;
  openDirection?: 'down' | 'up';
}

function NodeDropdown({ value, onChange, nodes, disabledNodeIds, disabled, isLoading, openDirection = 'down' }: NodeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedNode = nodes.find((n) => n.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-border-primary bg-bg-secondary px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-accent-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selectedNode && 'text-text-muted'
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : selectedNode ? (
          <span className="flex items-center gap-2 truncate">
            {selectedNode.thumbnail && (
              <img src={selectedNode.thumbnail} alt="" className="h-6 w-6 rounded object-cover" />
            )}
            <span className="truncate">{selectedNode.name}</span>
          </span>
        ) : (
          <span>Select a node...</span>
        )}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 max-h-60 w-full overflow-auto rounded-md border border-border-primary bg-bg-card shadow-lg",
          openDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
        )}>
          {nodes.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-muted">
              No nodes in library. Import some nodes first.
            </div>
          ) : (
            nodes.map((node) => {
              const isDisabled = disabledNodeIds.includes(node.id);
              const isSelected = node.id === value;

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(node.id);
                      setIsOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                    'hover:bg-bg-hover',
                    isSelected && 'bg-bg-hover',
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {node.thumbnail && (
                    <img src={node.thumbnail} alt="" className="h-6 w-6 rounded object-cover flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">{node.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-accent-primary flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function MergeCreationModal({
  open,
  onOpenChange,
  onCreated,
}: MergeCreationModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [selections, setSelections] = useState<Record<Breakpoint, BreakpointSelection>>({
    mobile: { nodeId: null, width: 375 },
    tablet: { nodeId: null, width: 768 },
    desktop: { nodeId: null, width: 1280 },
  });

  // Library nodes
  const [libraryNodes, setLibraryNodes] = useState<LibraryNode[]>([]);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch library nodes when modal opens
  useEffect(() => {
    if (open) {
      fetchLibraryNodes();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setName('');
      setSelections({
        mobile: { nodeId: null, width: 375 },
        tablet: { nodeId: null, width: 768 },
        desktop: { nodeId: null, width: 1280 },
      });
      setError(null);
    }
  }, [open]);

  const fetchLibraryNodes = async () => {
    setIsLoadingNodes(true);
    try {
      const response = await fetch('/api/figma/library');
      if (!response.ok) {
        throw new Error('Failed to load library nodes');
      }
      const data = await response.json();
      setLibraryNodes(data.nodes || []);
    } catch (err) {
      console.error('Failed to fetch library nodes:', err);
      setError('Failed to load library nodes');
    } finally {
      setIsLoadingNodes(false);
    }
  };

  const handleNodeSelect = async (breakpoint: Breakpoint, nodeId: string) => {
    // Update selection immediately with nodeId
    setSelections((prev) => ({
      ...prev,
      [breakpoint]: { ...prev[breakpoint], nodeId },
    }));
    setError(null);

    // Fetch node data to get actual width
    try {
      const selectedNode = libraryNodes.find((n) => n.id === nodeId);
      if (selectedNode) {
        const response = await fetch(`/api/figma/node/${selectedNode.id}`);
        if (response.ok) {
          const data = await response.json();
          const rawWidth = data.nodeData?.absoluteBoundingBox?.width;

          if (rawWidth) {
            // Auto-fill width from node, clamped to valid range [100, 3000]
            const autoWidth = Math.max(100, Math.min(3000, Math.round(rawWidth)));
            setSelections((prev) => ({
              ...prev,
              [breakpoint]: { ...prev[breakpoint], width: autoWidth },
            }));
          }
        }
      }
    } catch (err) {
      // Silently fail - user can still manually enter width
      console.error('Failed to fetch node dimensions:', err);
    }
  };

  const handleWidthChange = (breakpoint: Breakpoint, width: number) => {
    setSelections((prev) => ({
      ...prev,
      [breakpoint]: { ...prev[breakpoint], width },
    }));
  };

  const handleResetSelection = (breakpoint: Breakpoint) => {
    const config = BREAKPOINT_CONFIGS.find((c) => c.breakpoint === breakpoint);
    setSelections((prev) => ({
      ...prev,
      [breakpoint]: { nodeId: null, width: config?.defaultWidth || 375 },
    }));
  };

  const getDisabledNodeIds = (currentBreakpoint: Breakpoint): string[] => {
    return Object.entries(selections)
      .filter(([bp, sel]) => bp !== currentBreakpoint && sel.nodeId !== null)
      .map(([, sel]) => sel.nodeId as string);
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Please enter a name for the merge';
    }
    if (name.length > 100) {
      return 'Name must be 100 characters or less';
    }
    if (!selections.mobile.nodeId || !selections.tablet.nodeId || !selections.desktop.nodeId) {
      return 'Please select a node for each breakpoint';
    }
    // Validate widths
    for (const bp of ['mobile', 'tablet', 'desktop'] as Breakpoint[]) {
      if (selections[bp].width < 100 || selections[bp].width > 3000) {
        return `Width for ${bp} must be between 100 and 3000 pixels`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/merges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sourceNodes: [
            { breakpoint: 'mobile', nodeId: selections.mobile.nodeId, width: selections.mobile.width },
            { breakpoint: 'tablet', nodeId: selections.tablet.nodeId, width: selections.tablet.width },
            { breakpoint: 'desktop', nodeId: selections.desktop.nodeId, width: selections.desktop.width },
          ],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create merge');
      }

      const data = await response.json();
      onCreated(data.merge);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNodeById = (nodeId: string | null): LibraryNode | undefined => {
    if (!nodeId) return undefined;
    return libraryNodes.find((n) => n.id === nodeId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Responsive Merge</DialogTitle>
          <DialogDescription>
            Combine 3 Figma nodes into a single responsive component with
            mobile-first Tailwind classes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name input */}
          <div className="space-y-2">
            <Label htmlFor="merge-name">Name</Label>
            <Input
              id="merge-name"
              placeholder="e.g., Hero Section Responsive"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Breakpoint node selectors */}
          <div className="space-y-4">
            <Label>Source Nodes & Breakpoint Widths</Label>

            {BREAKPOINT_CONFIGS.map((config) => (
              <div key={config.breakpoint} className="space-y-2 p-3 rounded-lg border border-border-primary bg-bg-secondary/50">
                {/* Breakpoint header */}
                <div className="flex items-center gap-2 text-sm font-medium">
                  {config.icon}
                  <span>{config.label}</span>
                </div>

                {/* Node selector and width in a row */}
                <div className="flex gap-2">
                  {/* Node dropdown */}
                  <div className="flex-1">
                    <NodeDropdown
                      value={selections[config.breakpoint].nodeId}
                      onChange={(nodeId) => handleNodeSelect(config.breakpoint, nodeId)}
                      nodes={libraryNodes}
                      disabledNodeIds={getDisabledNodeIds(config.breakpoint)}
                      disabled={isSubmitting}
                      isLoading={isLoadingNodes}
                      openDirection={config.breakpoint === 'desktop' ? 'up' : 'down'}
                    />
                  </div>

                  {/* Width input */}
                  <div className="w-28">
                    <div className="relative">
                      <Input
                        type="number"
                        min={100}
                        max={3000}
                        value={selections[config.breakpoint].width}
                        onChange={(e) => handleWidthChange(config.breakpoint, parseInt(e.target.value) || config.defaultWidth)}
                        disabled={isSubmitting}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">px</span>
                    </div>
                  </div>

                  {/* Thumbnail preview + Reset button */}
                  {selections[config.breakpoint].nodeId && (
                    <>
                      <div className="h-10 w-10 overflow-hidden rounded border border-border-primary bg-bg-primary flex-shrink-0">
                        {getNodeById(selections[config.breakpoint].nodeId)?.thumbnail ? (
                          <img
                            src={getNodeById(selections[config.breakpoint].nodeId)?.thumbnail}
                            alt={config.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-text-muted">
                            {config.breakpoint.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResetSelection(config.breakpoint)}
                        disabled={isSubmitting}
                        className="h-10 w-10 flex items-center justify-center rounded border border-border-primary bg-bg-secondary hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Clear selection"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingNodes}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Merge'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
