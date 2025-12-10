'use client';

/**
 * Split Components Modal
 *
 * Multi-step modal for selecting and exporting components:
 * Step 1: Smart Detection (detected-list.tsx)
 * Step 1b: Tree Explorer (tree-explorer.tsx) - optional
 * Step 2: Export Progress/Complete (export-progress.tsx)
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
import type { DetectedComponent, SplitModalStep, SplitFramework, ExportedFile } from '@/lib/types/split';
import type { SimpleAltNode } from '@/lib/altnode-transform';

interface SplitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeName: string;
  framework: SplitFramework;
  language: 'typescript' | 'javascript';
  rootAltNode: SimpleAltNode | null;
}

export function SplitModal({
  open,
  onOpenChange,
  nodeId,
  nodeName,
  framework,
  language,
  rootAltNode,
}: SplitModalProps) {
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
  }, [open, nodeId]);

  // Fetch detected components
  const fetchDetectedComponents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/split/detect/${nodeId}`);
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
  }, [nodeId]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one component');
      return;
    }

    setStep('exporting');
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch('/api/split/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId,
          componentIds: selectedIds,
          framework,
          language,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the blob and trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${nodeName.replace(/[^a-zA-Z0-9-_]/g, '-')}-components.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Build file list from selected components
      const extension = language === 'typescript' ? 'tsx' : 'jsx';
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
  }, [nodeId, nodeName, selectedIds, framework, language, detectedComponents]);

  // Framework display name
  const frameworkLabel = framework === 'react-tailwind-v4' ? 'React + Tailwind v4' : 'React + Tailwind';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-bg-card border-border-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <Scissors className="w-5 h-5" />
            Split into Components
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            {nodeName} &bull; {frameworkLabel}
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
              {rootAltNode && (
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
          {!isLoading && step === 'tree-explorer' && rootAltNode && (
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
                rootNode={rootAltNode}
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
