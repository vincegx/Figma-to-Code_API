'use client';

/**
 * Merge Creation Modal
 *
 * Allows users to create a new responsive merge by:
 * 1. Entering a name for the merge
 * 2. Selecting 3 nodes from the library (mobile, tablet, desktop)
 * 3. Optionally customizing breakpoint widths
 */

import { useState, useEffect } from 'react';
import { Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
// Component
// ============================================================================

export function MergeCreationModal({
  open,
  onOpenChange,
  onCreated,
}: MergeCreationModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [selectedNodes, setSelectedNodes] = useState<Record<Breakpoint, string | null>>({
    mobile: null,
    tablet: null,
    desktop: null,
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
      setSelectedNodes({ mobile: null, tablet: null, desktop: null });
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

  const handleNodeSelect = (breakpoint: Breakpoint, nodeId: string) => {
    setSelectedNodes((prev) => ({
      ...prev,
      [breakpoint]: nodeId,
    }));
    setError(null);
  };

  const getSelectedNodeIds = (): string[] => {
    return Object.values(selectedNodes).filter((id): id is string => id !== null);
  };

  const isNodeDisabled = (nodeId: string, currentBreakpoint: Breakpoint): boolean => {
    // Disable if already selected for another breakpoint
    return Object.entries(selectedNodes).some(
      ([bp, selectedId]) => bp !== currentBreakpoint && selectedId === nodeId
    );
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Please enter a name for the merge';
    }
    if (name.length > 100) {
      return 'Name must be 100 characters or less';
    }
    if (!selectedNodes.mobile || !selectedNodes.tablet || !selectedNodes.desktop) {
      return 'Please select a node for each breakpoint';
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
            { breakpoint: 'mobile', nodeId: selectedNodes.mobile },
            { breakpoint: 'tablet', nodeId: selectedNodes.tablet },
            { breakpoint: 'desktop', nodeId: selectedNodes.desktop },
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
      <DialogContent className="max-w-lg">
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
            <Label>Source Nodes</Label>

            {BREAKPOINT_CONFIGS.map((config) => (
              <div key={config.breakpoint} className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {config.icon}
                  <span>{config.label}</span>
                  <span className="text-xs">({config.defaultWidth}px)</span>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={selectedNodes[config.breakpoint] || undefined}
                    onValueChange={(value) => handleNodeSelect(config.breakpoint, value)}
                    disabled={isSubmitting || isLoadingNodes}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a node..." />
                    </SelectTrigger>
                    <SelectContent>
                      {libraryNodes.map((node) => (
                        <SelectItem
                          key={node.id}
                          value={node.id}
                          disabled={isNodeDisabled(node.id, config.breakpoint)}
                        >
                          <div className="flex items-center gap-2">
                            {node.thumbnail && (
                              <img
                                src={node.thumbnail}
                                alt=""
                                className="h-6 w-6 rounded object-cover"
                              />
                            )}
                            <span className="truncate">{node.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {libraryNodes.length === 0 && !isLoadingNodes && (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          No nodes in library. Import some nodes first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Thumbnail preview */}
                  {selectedNodes[config.breakpoint] && (
                    <div className="h-10 w-10 overflow-hidden rounded border bg-muted">
                      {getNodeById(selectedNodes[config.breakpoint])?.thumbnail ? (
                        <img
                          src={getNodeById(selectedNodes[config.breakpoint])?.thumbnail}
                          alt={config.label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          {config.breakpoint.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
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
