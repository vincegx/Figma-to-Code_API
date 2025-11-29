'use client';

import { useState, useCallback, useEffect } from 'react';
import { useNodesStore, useUIStore } from '@/lib/store';
import { useFigmaProgress, type ProgressStep } from '@/hooks/use-figma-progress';
import { ImportProgress, type ImportStep } from '@/components/import-progress';
import { ImportLogs } from '@/components/import-logs';
import { ImportSuccess, FigmaErrors } from '@/lib/toast-utils';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImportDialog() {
  const [url, setUrl] = useState('');
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const importNodeToStore = useNodesStore((state) => state.importNode);
  const setImporting = useUIStore((state) => state.setImporting);
  const invalidateStats = useUIStore((state) => state.invalidateStats);

  const {
    isRunning,
    steps,
    logs,
    error,
    result,
    startImport,
    cancel,
    reset,
  } = useFigmaProgress();

  const [importedNode, setImportedNode] = useState<{ name: string; id: string } | null>(null);

  // Sync isRunning with UI store
  useEffect(() => {
    setImporting(isRunning);
  }, [isRunning, setImporting]);

  // Handle successful completion
  useEffect(() => {
    if (!isRunning && result && !error) {
      const nodeResult = result as { nodeId: string; name: string };
      setImportedNode({ name: nodeResult.name, id: nodeResult.nodeId });

      // Update library
      loadLibrary();
      invalidateStats();

      // Show success toast
      ImportSuccess.nodeImported(nodeResult.name, nodeResult.nodeId);
    }
  }, [isRunning, result, error, loadLibrary, invalidateStats]);

  // Handle errors
  useEffect(() => {
    if (!isRunning && error) {
      // Show appropriate error toast based on message
      if (error.includes('access token') || error.includes('Invalid token')) {
        FigmaErrors.invalidToken();
      } else if (error.includes('rate limit')) {
        FigmaErrors.rateLimit();
      } else if (error.includes('not found')) {
        FigmaErrors.nodeNotFound('unknown');
      } else if (error.includes('Network') || error.includes('fetch')) {
        FigmaErrors.networkError(() => handleImport());
      } else {
        FigmaErrors.generic(error);
      }
    }
  }, [isRunning, error]);

  const handleImport = useCallback(async () => {
    setImportedNode(null);
    await startImport(url);
  }, [url, startImport]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const handleImportAnother = useCallback(() => {
    reset();
    setUrl('');
    setImportedNode(null);
  }, [reset]);

  // Convert ProgressStep to ImportStep for compatibility
  const importSteps: ImportStep[] = steps.map((step: ProgressStep) => ({
    id: step.id,
    label: step.label,
    status: step.status === 'skipped' ? 'skipped' :
            step.status === 'in-progress' ? 'in-progress' :
            step.status === 'completed' ? 'completed' :
            step.status === 'error' ? 'error' : 'pending',
    message: step.message,
  }));

  const hasStarted = logs.length > 0;
  const isComplete = importedNode !== null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Import Figma Node</h3>

      {/* Input and buttons */}
      <div className="flex gap-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.figma.com/file/..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
          disabled={isRunning}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url && !isRunning) {
              handleImport();
            }
          }}
        />
        {isRunning ? (
          <Button
            onClick={handleCancel}
            variant="destructive"
            className="px-6"
          >
            <X size={16} className="mr-2" />
            Cancel
          </Button>
        ) : isComplete ? (
          <Button
            onClick={handleImportAnother}
            variant="outline"
            className="px-6"
          >
            <RotateCcw size={16} className="mr-2" />
            Import Another
          </Button>
        ) : (
          <Button
            onClick={handleImport}
            disabled={!url}
            className="px-6"
          >
            Import
          </Button>
        )}
      </div>

      {/* Progress UI - 8 steps with SSE */}
      {hasStarted && (
        <div className="mt-6 space-y-4">
          <ImportProgress steps={importSteps} />
          <ImportLogs logs={logs} />
        </div>
      )}

      {/* Error display (fallback if toast doesn't show) */}
      {error && !isRunning && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Success state */}
      {isComplete && (
        <div className="mt-4 p-4 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
          <p className="font-medium">Import successful!</p>
          <p className="text-sm mt-1">
            &quot;{importedNode.name}&quot; has been added to your library.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = `/viewer/${importedNode.id}`)}
            >
              View in Viewer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleImportAnother}
            >
              Import Another
            </Button>
          </div>
        </div>
      )}

      {/* Helper text */}
      {!hasStarted && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Paste a Figma URL with a node-id parameter to import a node into your library.
        </p>
      )}
    </div>
  );
}
