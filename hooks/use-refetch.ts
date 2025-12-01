'use client';

/**
 * useRefetch Hook
 *
 * WP40 T348: Hook for refetching Figma nodes with versioning support.
 * Provides progress tracking, diff results, and version history.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RefetchResult, DiffSummary, NodeDiff } from '@/lib/types/versioning';
import type { StepStatus } from '@/hooks/use-figma-progress';

interface SSEMessage {
  step: string;
  status: 'start' | 'complete' | 'error' | 'skip';
  message?: string;
  data?: {
    status?: 'up_to_date' | 'updated';
    diff?: NodeDiff[];
    summary?: DiffSummary;
    newVersion?: {
      figmaLastModified: string;
      fetchedAt: string;
    };
  };
  progress?: { current: number; total: number };
}

interface RefetchProgress {
  currentStep: number;
  totalSteps: number;
  stepId?: string;
  stepStatus?: StepStatus;
  message?: string;
}

interface UseRefetchReturn {
  /** Start the refetch operation */
  refetch: () => Promise<RefetchResult | null>;
  /** Whether refetch is in progress */
  isRefetching: boolean;
  /** Progress information */
  progress: RefetchProgress;
  /** Result of the last refetch */
  result: RefetchResult | null;
  /** Error message if refetch failed */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

export function useRefetch(nodeId: string): UseRefetchReturn {
  const [isRefetching, setIsRefetching] = useState(false);
  const [progress, setProgress] = useState<RefetchProgress>({
    currentStep: 0,
    totalSteps: 0,
  });
  const [result, setResult] = useState<RefetchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setIsRefetching(false);
    setProgress({ currentStep: 0, totalSteps: 0 });
    setResult(null);
    setError(null);
  }, []);

  const refetch = useCallback(async (): Promise<RefetchResult | null> => {
    // Abort any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Reset state
    setIsRefetching(true);
    setProgress({ currentStep: 0, totalSteps: 9 }); // WP40: 9 steps in refetch
    setResult(null);
    setError(null);

    let finalResult: RefetchResult | null = null;

    try {
      const response = await fetch('/api/figma/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'refetch', nodeId }),
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

              // Update progress
              if (data.progress) {
                setProgress(prev => ({
                  ...prev,
                  currentStep: data.progress!.current,
                  totalSteps: data.progress!.total,
                  stepId: data.step,
                  stepStatus: mapSSEStatus(data.status),
                  message: data.message,
                }));
              }

              // Handle done
              if (data.step === 'done') {
                // Determine final status from saved data
                if (finalResult) {
                  setResult(finalResult);
                } else {
                  setResult({ status: 'updated' });
                }
                continue;
              }

              // Handle error
              if (data.step === 'error') {
                setError(data.message || 'Unknown error');
                setResult({ status: 'error', error: data.message });
                continue;
              }

              // Check for up_to_date early termination (version_check step)
              if (data.step === 'version_check' && data.data?.status === 'up_to_date') {
                finalResult = { status: 'up_to_date' };
              }

              // Capture diff info from diff step or save step
              if ((data.step === 'diff' || data.step === 'save') && data.data) {
                if (data.data.diff || data.data.summary) {
                  finalResult = {
                    status: data.data.status || 'updated',
                    diff: data.data.diff,
                    summary: data.data.summary,
                    newVersion: data.data.newVersion,
                  };
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE message:', message);
            }
          }
        }
      }

      setIsRefetching(false);
      return finalResult;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Operation cancelled');
        setIsRefetching(false);
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setResult({ status: 'error', error: errorMessage });
      setIsRefetching(false);
      return null;
    }
  }, [nodeId]);

  return {
    refetch,
    isRefetching,
    progress,
    result,
    error,
    reset,
  };
}

function mapSSEStatus(status: string): StepStatus {
  switch (status) {
    case 'start':
      return 'in-progress';
    case 'complete':
      return 'completed';
    case 'error':
      return 'error';
    case 'skip':
      return 'skipped';
    default:
      return 'pending';
  }
}

export default useRefetch;
