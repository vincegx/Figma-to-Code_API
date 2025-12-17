'use client';

/**
 * Split Components Modal
 *
 * Multi-step modal for selecting and exporting components:
 * Step 1: Smart Detection (detected-list.tsx)
 * Step 1b: Tree Explorer (tree-explorer.tsx) - optional
 * Step 2: Export Progress/Complete (export-progress.tsx)
 *
 * Supports two modes:
 * - Node mode: For splitting a single Figma node (default)
 * - Merge mode: For splitting a responsive merge (when mergeId is provided)
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Scissors, TreeDeciduous, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DetectedList } from './detected-list';
import { TreeExplorer } from './tree-explorer';
import { ExportProgress } from './export-progress';
import type { DetectedComponent, SplitModalStep, SplitFramework, MergeSplitFramework, ExportedFile } from '@/lib/types/split';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { UnifiedElement } from '@/lib/types/merge';

interface SplitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: SplitFramework | MergeSplitFramework;
  language: 'typescript' | 'javascript';

  // Node mode props (original)
  nodeId?: string;
  nodeName?: string;
  rootAltNode?: SimpleAltNode | null;

  // Merge mode props (new)
  mergeId?: string;
  mergeName?: string;
  unifiedTree?: UnifiedElement | null;
}

export function SplitModal({
  open,
  onOpenChange,
  framework,
  language,
  // Node mode
  nodeId,
  nodeName,
  rootAltNode,
  // Merge mode
  mergeId,
  mergeName,
  unifiedTree,
}: SplitModalProps) {
  // Detect mode: merge if mergeId is provided, otherwise node
  const isMergeMode = Boolean(mergeId);
  const displayName = isMergeMode ? mergeName : nodeName;
  const sourceId = isMergeMode ? mergeId : nodeId;

  // Tree for explorer: unifiedTree for merge, rootAltNode for node
  // Both have compatible structure for TreeExplorer (id, name, type, children)
  const treeRoot = isMergeMode ? unifiedTree : rootAltNode;

  // Modal state
  const [step, setStep] = useState<SplitModalStep>('detection');
  const [detectedComponents, setDetectedComponents] = useState<DetectedComponent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFiles, setExportedFiles] = useState<ExportedFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep('detection');
      setSelectedIds([]);
      setExportedFiles([]);
      setTotalSize(0);
      setError(null);
      fetchDetectedComponents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sourceId]);

  // Fetch detected components - different API based on mode
  const fetchDetectedComponents = useCallback(async () => {
    if (!sourceId) return;

    setIsLoading(true);
    setError(null);
    try {
      // Different API endpoints for node vs merge
      const url = isMergeMode
        ? `/api/merges/${sourceId}/split/detect`
        : `/api/split/detect/${sourceId}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Detection failed');
      }

      setDetectedComponents(data.components);
      // Pre-select all detected components
      setSelectedIds(data.components.map((c: DetectedComponent) => c.id));
    } catch (err) {
      console.error('[SplitModal] Detection error:', err);
      setError(err instanceof Error ? err.message : 'Detection failed');
    } finally {
      setIsLoading(false);
    }
  }, [sourceId, isMergeMode]);

  // Handle export - different API and request body based on mode
  const handleExport = useCallback(async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one component');
      return;
    }

    setStep('exporting');
    setIsExporting(true);
    setError(null);

    try {
      // Different API endpoints and request bodies for node vs merge
      const url = isMergeMode
        ? `/api/merges/${sourceId}/split/export`
        : '/api/split/export';

      const body = isMergeMode
        ? { componentIds: selectedIds, framework, language }
        : { nodeId: sourceId, componentIds: selectedIds, framework, language };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      const safeName = (displayName || 'components').replace(/[^a-zA-Z0-9-_]/g, '-');
      a.download = `${safeName}-components.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url2);

      // Build file list from selected components
      const extension = framework === 'html-css' ? 'html' : (language === 'typescript' ? 'tsx' : 'jsx');
      const files: ExportedFile[] = selectedIds.map(id => {
        const component = detectedComponents.find(c => c.id === id);
        const name = component?.name || 'Component';
        // Sanitize name for filename
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '');
        const pascalName = safeName.charAt(0).toUpperCase() + safeName.slice(1);
        return {
          filename: `${pascalName}.${extension}`,
          content: '', // We don't have the actual content client-side
          size: 0, // Approximate
        };
      });

      setExportedFiles(files);
      setTotalSize(blob.size);
      setStep('complete');
    } catch (err) {
      console.error('[SplitModal] Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [sourceId, displayName, selectedIds, framework, language, detectedComponents, isMergeMode]);

  // Framework display name
  const frameworkLabel =
    framework === 'react-tailwind-v4' ? 'React + Tailwind v4' :
    framework === 'html-css' ? 'HTML + CSS' :
    'React + Tailwind';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-bg-card border-border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <Scissors className="w-5 h-5" />
            Split into Components
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            {displayName} &bull; {frameworkLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              <span className="text-sm text-text-muted">Detecting components...</span>
            </div>
          )}

          {/* Error State */}
          {error && step === 'detection' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <p className="text-sm text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDetectedComponents}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Step 1: Smart Detection */}
          {!isLoading && !error && step === 'detection' && (
            <div className="space-y-4">
              <DetectedList
                components={detectedComponents}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />

              {/* Tree Explorer Link */}
              {treeRoot && (
                <div className="flex items-center justify-between pt-2 border-t border-border-primary">
                  <span className="text-xs text-text-muted">Need more control?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep('tree-explorer')}
                    className="gap-1.5"
                  >
                    <TreeDeciduous className="w-3.5 h-3.5" />
                    Open Tree Explorer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 1b: Tree Explorer */}
          {!isLoading && step === 'tree-explorer' && treeRoot && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('detection')}
                className="gap-1.5 -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Smart Detection
              </Button>

              <TreeExplorer
                rootNode={treeRoot as SimpleAltNode}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>
          )}

          {/* Step 2: Export Progress/Complete */}
          {(step === 'exporting' || step === 'complete') && (
            <ExportProgress
              isExporting={isExporting}
              files={exportedFiles}
              totalSize={totalSize}
              error={error}
              onDone={() => onOpenChange(false)}
            />
          )}
        </div>

        {/* Footer - only show for selection steps */}
        {(step === 'detection' || step === 'tree-explorer') && !isLoading && !error && (
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={selectedIds.length === 0}
              className="gap-1.5"
            >
              Export
              <span className="text-xs opacity-70">({selectedIds.length})</span>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
