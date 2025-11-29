'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LogEntry, LogLevel } from '@/components/import-logs';

// Step definitions matching the API
export const IMPORT_STEPS = [
  { id: 'parse', label: 'URL Parsing' },
  { id: 'metadata', label: 'File Metadata' },
  { id: 'node', label: 'Node Data' },
  { id: 'screenshot', label: 'Screenshot' },
  { id: 'variables', label: 'Variables' },
  { id: 'svg', label: 'SVG Assets' },
  { id: 'images', label: 'Images' },
  { id: 'save', label: 'Save to Library' },
] as const;

export const REFETCH_STEPS = [
  { id: 'node', label: 'Node Data' },
  { id: 'screenshot', label: 'Screenshot' },
  { id: 'variables', label: 'Variables' },
  { id: 'svg', label: 'SVG Assets' },
  { id: 'images', label: 'Images' },
  { id: 'save', label: 'Save to Library' },
] as const;

export type OperationType = 'import' | 'refetch';
export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'error' | 'skipped';

export interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
  message?: string;
}

interface SSEMessage {
  step: string;
  status: 'start' | 'complete' | 'error' | 'skip';
  message?: string;
  data?: unknown;
  progress?: { current: number; total: number };
}

interface UseFigmaProgressState {
  isRunning: boolean;
  operationType: OperationType | null;
  steps: ProgressStep[];
  logs: LogEntry[];
  error: string | null;
  currentStep: number;
  totalSteps: number;
  result: unknown | null;
}

interface UseFigmaProgressReturn extends UseFigmaProgressState {
  startImport: (url: string) => Promise<void>;
  startRefetch: (nodeId: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

let logIdCounter = 0;

function createInitialSteps(type: OperationType): ProgressStep[] {
  const stepDefs = type === 'import' ? IMPORT_STEPS : REFETCH_STEPS;
  return stepDefs.map(s => ({ ...s, status: 'pending' as StepStatus }));
}

export function useFigmaProgress(): UseFigmaProgressReturn {
  const [state, setState] = useState<UseFigmaProgressState>({
    isRunning: false,
    operationType: null,
    steps: [],
    logs: [],
    error: null,
    currentStep: 0,
    totalSteps: 0,
    result: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const addLog = useCallback((message: string, level: LogLevel = 'info') => {
    const entry: LogEntry = {
      id: `log-${++logIdCounter}`,
      timestamp: new Date(),
      message,
      level,
    };
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, entry],
    }));
  }, []);

  const updateStepStatus = useCallback((stepId: string, status: StepStatus, message?: string) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, status, message } : step
      ),
    }));
  }, []);

  const handleSSEMessage = useCallback((msg: SSEMessage) => {
    const { step, status, message, data, progress } = msg;

    // Update progress
    if (progress) {
      setState(prev => ({
        ...prev,
        currentStep: progress.current,
        totalSteps: progress.total,
      }));
    }

    // Handle completion
    if (step === 'done') {
      setState(prev => ({
        ...prev,
        isRunning: false,
        result: data,
      }));
      addLog('Operation completed successfully', 'success');
      return;
    }

    // Handle error
    if (step === 'error') {
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: message || 'Unknown error',
      }));
      addLog(message || 'Unknown error', 'error');
      return;
    }

    // Map SSE status to our step status
    let stepStatus: StepStatus;
    let logLevel: LogLevel = 'info';

    switch (status) {
      case 'start':
        stepStatus = 'in-progress';
        addLog(message || `${step} started...`, 'info');
        break;
      case 'complete':
        stepStatus = 'completed';
        logLevel = 'success';
        addLog(message || `${step} completed`, 'success');
        break;
      case 'error':
        stepStatus = 'error';
        logLevel = 'error';
        addLog(message || `${step} failed`, 'error');
        break;
      case 'skip':
        stepStatus = 'skipped';
        logLevel = 'warning';
        addLog(message || `${step} skipped`, 'warning');
        break;
      default:
        stepStatus = 'pending';
    }

    updateStepStatus(step, stepStatus, message);

    // Store result data if provided
    if (data && step === 'save' && status === 'complete') {
      setState(prev => ({ ...prev, result: data }));
    }
  }, [addLog, updateStepStatus]);

  const startOperation = useCallback(async (
    type: OperationType,
    payload: { url?: string; nodeId?: string }
  ) => {
    // Abort any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Initialize state
    const steps = createInitialSteps(type);
    setState({
      isRunning: true,
      operationType: type,
      steps,
      logs: [],
      error: null,
      currentStep: 0,
      totalSteps: steps.length,
      result: null,
    });

    addLog(`Starting ${type}...`, 'info');

    try {
      const response = await fetch('/api/figma/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...payload }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE messages (data: {...}\n\n)
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.startsWith('data: ')) {
            try {
              const data = JSON.parse(message.slice(6)) as SSEMessage;
              handleSSEMessage(data);
            } catch (e) {
              console.error('Failed to parse SSE message:', message);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addLog('Operation cancelled', 'warning');
        setState(prev => ({
          ...prev,
          isRunning: false,
          error: 'Operation cancelled',
        }));
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(errorMessage, 'error');
      setState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage,
      }));
    }
  }, [addLog, handleSSEMessage]);

  const startImport = useCallback(async (url: string) => {
    await startOperation('import', { url });
  }, [startOperation]);

  const startRefetch = useCallback(async (nodeId: string) => {
    await startOperation('refetch', { nodeId });
  }, [startOperation]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isRunning: false,
      error: 'Cancelled by user',
    }));
    addLog('Operation cancelled by user', 'warning');
  }, [addLog]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({
      isRunning: false,
      operationType: null,
      steps: [],
      logs: [],
      error: null,
      currentStep: 0,
      totalSteps: 0,
      result: null,
    });
  }, []);

  return {
    ...state,
    startImport,
    startRefetch,
    cancel,
    reset,
  };
}

export default useFigmaProgress;
