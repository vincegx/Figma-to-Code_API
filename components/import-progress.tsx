'use client';

import { Check, Circle, Loader2, AlertCircle, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImportStepStatus = 'pending' | 'in-progress' | 'completed' | 'error' | 'skipped';

export interface ImportStep {
  id: string;
  label: string;
  status: ImportStepStatus;
  message?: string;
}

// Legacy 4-step definition (kept for backward compatibility)
export const DEFAULT_IMPORT_STEPS: ImportStep[] = [
  { id: 'parse', label: 'URL Parsing', status: 'pending' },
  { id: 'metadata', label: 'File Metadata', status: 'pending' },
  { id: 'node', label: 'Node Data', status: 'pending' },
  { id: 'screenshot', label: 'Screenshot', status: 'pending' },
];

// New 8-step definition for SSE-based import
export const FULL_IMPORT_STEPS: ImportStep[] = [
  { id: 'parse', label: 'URL', status: 'pending' },
  { id: 'metadata', label: 'Metadata', status: 'pending' },
  { id: 'node', label: 'Node', status: 'pending' },
  { id: 'screenshot', label: 'Screenshot', status: 'pending' },
  { id: 'variables', label: 'Variables', status: 'pending' },
  { id: 'svg', label: 'SVGs', status: 'pending' },
  { id: 'images', label: 'Images', status: 'pending' },
  { id: 'save', label: 'Save', status: 'pending' },
];

interface ImportProgressProps {
  steps: ImportStep[];
  className?: string;
  compact?: boolean; // Use smaller icons and text for 8-step layout
}

function StepIcon({ status, compact = false }: { status: ImportStepStatus; compact?: boolean }) {
  const size = compact ? 6 : 8;
  const iconSize = compact ? 12 : 16;
  const baseClass = `w-${size} h-${size} rounded-full flex items-center justify-center`;

  switch (status) {
    case 'completed':
      return (
        <div className={cn(baseClass, 'bg-green-500', compact ? 'w-6 h-6' : 'w-8 h-8')}>
          <Check size={iconSize} className="text-white" />
        </div>
      );
    case 'in-progress':
      return (
        <div className={cn(baseClass, 'bg-blue-500', compact ? 'w-6 h-6' : 'w-8 h-8')}>
          <Loader2 size={iconSize} className="text-white animate-spin" />
        </div>
      );
    case 'error':
      return (
        <div className={cn(baseClass, 'bg-red-500', compact ? 'w-6 h-6' : 'w-8 h-8')}>
          <AlertCircle size={iconSize} className="text-white" />
        </div>
      );
    case 'skipped':
      return (
        <div className={cn(baseClass, 'bg-amber-500', compact ? 'w-6 h-6' : 'w-8 h-8')}>
          <SkipForward size={iconSize} className="text-white" />
        </div>
      );
    default:
      return (
        <div className={cn(baseClass, 'border-2 border-gray-300 dark:border-gray-600', compact ? 'w-6 h-6' : 'w-8 h-8')}>
          <Circle size={compact ? 6 : 10} className="text-gray-300 dark:text-gray-600" />
        </div>
      );
  }
}

export function ImportProgress({ steps, className, compact = false }: ImportProgressProps) {
  // Auto-detect compact mode for 8+ steps
  const useCompact = compact || steps.length > 4;

  return (
    <div
      className={cn('flex items-center justify-between', className)}
      role="progressbar"
      aria-label="Import progress"
      aria-valuemin={0}
      aria-valuemax={steps.length}
      aria-valuenow={steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step with icon and label */}
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} compact={useCompact} />
              <span
                className={cn(
                  'mt-1 text-center whitespace-nowrap',
                  useCompact ? 'text-[10px]' : 'text-xs mt-2',
                  step.status === 'completed' && 'text-green-600 dark:text-green-400 font-medium',
                  step.status === 'in-progress' && 'text-blue-600 dark:text-blue-400 font-medium',
                  step.status === 'error' && 'text-red-600 dark:text-red-400 font-medium',
                  step.status === 'skipped' && 'text-amber-600 dark:text-amber-400',
                  step.status === 'pending' && 'text-gray-500 dark:text-gray-400'
                )}
                aria-current={step.status === 'in-progress' ? 'step' : undefined}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1',
                  useCompact ? 'mt-[-16px]' : 'mt-[-20px]',
                  step.status === 'completed' && 'bg-green-500',
                  step.status === 'skipped' && 'bg-amber-500',
                  step.status !== 'completed' && step.status !== 'skipped' && 'bg-gray-200 dark:bg-gray-700'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ImportProgress;
