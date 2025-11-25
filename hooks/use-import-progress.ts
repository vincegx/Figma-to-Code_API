'use client';

import { useState, useCallback, useRef } from 'react';
import type { ImportStep, ImportStepStatus } from '@/components/import-progress';
import type { LogEntry, LogLevel } from '@/components/import-logs';

export type ImportStepId = 'parse' | 'metadata' | 'node' | 'screenshot';

interface UseImportProgressState {
  isImporting: boolean;
  currentStep: ImportStepId | null;
  steps: ImportStep[];
  logs: LogEntry[];
  error: string | null;
}

interface UseImportProgressReturn extends UseImportProgressState {
  startImport: () => void;
  advanceStep: (stepId: ImportStepId) => void;
  completeStep: (stepId: ImportStepId) => void;
  setStepError: (stepId: ImportStepId, errorMessage: string) => void;
  addLog: (message: string, level?: LogLevel) => void;
  setError: (error: string | null) => void;
  cancelImport: () => void;
  reset: () => void;
  abortController: AbortController | null;
}

const initialSteps: ImportStep[] = [
  { id: 'parse', label: 'URL Parsing', status: 'pending' },
  { id: 'metadata', label: 'File Metadata', status: 'pending' },
  { id: 'node', label: 'Node Data', status: 'pending' },
  { id: 'screenshot', label: 'Screenshot', status: 'pending' },
];

let logIdCounter = 0;

export function useImportProgress(): UseImportProgressReturn {
  const [state, setState] = useState<UseImportProgressState>({
    isImporting: false,
    currentStep: null,
    steps: initialSteps,
    logs: [],
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = useCallback((message: string, level: LogLevel = 'info') => {
    const entry: LogEntry = {
      id: `log-${++logIdCounter}`,
      timestamp: new Date(),
      message,
      level,
    };
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, entry],
    }));
  }, []);

  const updateStepStatus = useCallback(
    (stepId: ImportStepId, status: ImportStepStatus) => {
      setState((prev) => ({
        ...prev,
        steps: prev.steps.map((step) =>
          step.id === stepId ? { ...step, status } : step
        ),
      }));
    },
    []
  );

  const startImport = useCallback(() => {
    // Create new abort controller for this import
    abortControllerRef.current = new AbortController();

    setState({
      isImporting: true,
      currentStep: null,
      steps: initialSteps,
      logs: [],
      error: null,
    });
    addLog('Starting import...', 'info');
  }, [addLog]);

  const advanceStep = useCallback(
    (stepId: ImportStepId) => {
      setState((prev) => ({
        ...prev,
        currentStep: stepId,
      }));
      updateStepStatus(stepId, 'in-progress');

      const stepLabels: Record<ImportStepId, string> = {
        parse: 'Parsing Figma URL...',
        metadata: 'Fetching file metadata...',
        node: 'Fetching node data...',
        screenshot: 'Capturing screenshot...',
      };
      addLog(stepLabels[stepId], 'info');
    },
    [updateStepStatus, addLog]
  );

  const completeStep = useCallback(
    (stepId: ImportStepId) => {
      updateStepStatus(stepId, 'completed');

      const completionMessages: Record<ImportStepId, string> = {
        parse: 'URL parsed successfully',
        metadata: 'File metadata retrieved',
        node: 'Node data fetched',
        screenshot: 'Screenshot captured',
      };
      addLog(completionMessages[stepId], 'success');
    },
    [updateStepStatus, addLog]
  );

  const setStepError = useCallback(
    (stepId: ImportStepId, errorMessage: string) => {
      updateStepStatus(stepId, 'error');
      setState((prev) => ({
        ...prev,
        isImporting: false,
        error: errorMessage,
      }));
      addLog(errorMessage, 'error');
    },
    [updateStepStatus, addLog]
  );

  const setError = useCallback(
    (error: string | null) => {
      setState((prev) => ({
        ...prev,
        error,
        isImporting: error ? false : prev.isImporting,
      }));
      if (error) {
        addLog(error, 'error');
      }
    },
    [addLog]
  );

  const cancelImport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isImporting: false,
      error: 'Import cancelled',
    }));
    addLog('Import cancelled by user', 'warning');
  }, [addLog]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      isImporting: false,
      currentStep: null,
      steps: initialSteps,
      logs: [],
      error: null,
    });
  }, []);

  return {
    ...state,
    startImport,
    advanceStep,
    completeStep,
    setStepError,
    addLog,
    setError,
    cancelImport,
    reset,
    abortController: abortControllerRef.current,
  };
}

export default useImportProgress;
