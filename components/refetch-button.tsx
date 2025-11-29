'use client';

import { useState, useEffect } from 'react';
import { CloudDownload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFigmaProgress } from '@/hooks/use-figma-progress';
import { cn } from '@/lib/utils';

interface RefetchButtonProps {
  nodeId: string;
  onRefetchComplete?: (result: unknown) => void;
  onRefetchError?: (error: string) => void;
  className?: string;
}

export function RefetchButton({
  nodeId,
  onRefetchComplete,
  onRefetchError,
  className,
}: RefetchButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    isRunning,
    currentStep,
    totalSteps,
    error,
    result,
    startRefetch,
    cancel,
    reset,
  } = useFigmaProgress();

  // Handle completion
  useEffect(() => {
    if (!isRunning && result && !error) {
      onRefetchComplete?.(result);
      // Auto-reset after a short delay to show completion
      const timeout = setTimeout(() => {
        reset();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isRunning, result, error, onRefetchComplete, reset]);

  // Handle error
  useEffect(() => {
    if (!isRunning && error) {
      onRefetchError?.(error);
    }
  }, [isRunning, error, onRefetchError]);

  const handleConfirm = async () => {
    setIsDialogOpen(false);
    await startRefetch(nodeId);
  };

  const handleCancel = () => {
    if (isRunning) {
      cancel();
    }
    setIsDialogOpen(false);
  };

  const progressPercent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <button
            disabled={isRunning}
            title="Re-fetch from Figma"
            className={cn(
              'p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
              isRunning && 'opacity-50 cursor-not-allowed'
            )}
          >
            <CloudDownload
              size={20}
              className={cn(isRunning && 'animate-pulse')}
            />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-fetch from Figma?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the node data from Figma. The process may take a
              few seconds depending on the complexity of the design and the
              number of assets to download.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Inline progress indicator (visible during refetch) */}
      {isRunning ? (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          <Progress value={progressPercent} className="w-16 h-2" />
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {currentStep}/{totalSteps}
          </span>
        </div>
      ) : null}

      {/* Completion indicator */}
      {!isRunning && result && !error ? (
        <span className="text-xs text-green-600 dark:text-green-400 animate-in fade-in duration-200">
          Updated
        </span>
      ) : null}

      {/* Error indicator */}
      {!isRunning && error ? (
        <span className="text-xs text-red-600 dark:text-red-400 animate-in fade-in duration-200 max-w-24 truncate" title={error}>
          Failed
        </span>
      ) : null}
    </div>
  );
}

export default RefetchButton;
