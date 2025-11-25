'use client';

import { useState, useCallback } from 'react';
import { useNodesStore, useUIStore } from '@/lib/store';
import { parseFigmaUrl } from '@/lib/utils/url-parser';
import { useImportProgress } from '@/hooks/use-import-progress';
import { ImportProgress } from '@/components/import-progress';
import { ImportLogs } from '@/components/import-logs';
import { ImportSuccess, FigmaErrors } from '@/lib/toast-utils';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImportDialog() {
  const [url, setUrl] = useState('');
  const importNodeToStore = useNodesStore((state) => state.importNode);
  const loadLibrary = useNodesStore((state) => state.loadLibrary);
  const setImporting = useUIStore((state) => state.setImporting);
  const invalidateStats = useUIStore((state) => state.invalidateStats);

  const {
    isImporting,
    steps,
    logs,
    error,
    startImport,
    advanceStep,
    completeStep,
    setStepError,
    addLog,
    cancelImport,
    reset,
    abortController,
  } = useImportProgress();

  const [importedNode, setImportedNode] = useState<{ name: string; id: string } | null>(null);

  const handleImport = useCallback(async () => {
    // Reset any previous import state
    setImportedNode(null);
    startImport();
    setImporting(true);

    // Step 1: URL Parsing
    advanceStep('parse');
    let fileKey: string;
    let nodeId: string;

    try {
      const parsed = parseFigmaUrl(url);
      fileKey = parsed.fileKey;
      nodeId = parsed.nodeId;
      addLog(`File key: ${fileKey}`, 'info');
      addLog(`Node ID: ${nodeId}`, 'info');
      completeStep('parse');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid Figma URL';
      setStepError('parse', message);
      setImporting(false);
      return;
    }

    // Step 2-4: API calls (combined into one request)
    // We advance through steps to show progress, though the actual API does them together
    advanceStep('metadata');

    try {
      const response = await fetch('/api/figma/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: abortController?.signal,
      });

      // Simulate progress through remaining steps
      completeStep('metadata');
      advanceStep('node');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      completeStep('node');
      advanceStep('screenshot');

      const apiResponse = await response.json();
      completeStep('screenshot');

      // Extract metadata
      const nodeMetadata = apiResponse.metadata;

      // Update nodes store
      importNodeToStore(nodeMetadata);

      // Reload library
      await loadLibrary();

      // Invalidate stats cache
      invalidateStats();

      // Store imported node info for success state
      setImportedNode({ name: nodeMetadata.name, id: apiResponse.nodeId });

      // Show success toast
      ImportSuccess.nodeImported(nodeMetadata.name, apiResponse.nodeId);

      addLog(`Import completed: "${nodeMetadata.name}"`, 'success');
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Import was cancelled
        return;
      }

      const message = err instanceof Error ? err.message : 'Import failed';

      // Determine which step failed based on current progress
      const currentStep = steps.find((s) => s.status === 'in-progress');
      if (currentStep) {
        setStepError(currentStep.id as 'parse' | 'metadata' | 'node' | 'screenshot', message);
      }

      // Show appropriate error toast based on message
      if (message.includes('access token') || message.includes('Invalid token')) {
        FigmaErrors.invalidToken();
      } else if (message.includes('rate limit')) {
        FigmaErrors.rateLimit();
      } else if (message.includes('not found')) {
        FigmaErrors.nodeNotFound(nodeId!);
      } else if (message.includes('Network') || message.includes('fetch')) {
        FigmaErrors.networkError(() => handleImport());
      } else {
        FigmaErrors.generic(message);
      }
    } finally {
      setImporting(false);
    }
  }, [
    url,
    startImport,
    advanceStep,
    completeStep,
    setStepError,
    addLog,
    setImporting,
    importNodeToStore,
    loadLibrary,
    invalidateStats,
    abortController,
    steps,
  ]);

  const handleCancel = useCallback(() => {
    cancelImport();
    setImporting(false);
  }, [cancelImport, setImporting]);

  const handleImportAnother = useCallback(() => {
    reset();
    setUrl('');
    setImportedNode(null);
  }, [reset]);

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
          disabled={isImporting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url && !isImporting) {
              handleImport();
            }
          }}
        />
        {isImporting ? (
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

      {/* Progress UI */}
      {hasStarted && (
        <div className="mt-6 space-y-4">
          <ImportProgress steps={steps} />
          <ImportLogs logs={logs} />
        </div>
      )}

      {/* Error display (fallback if toast doesn't show) */}
      {error && !isImporting && (
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
