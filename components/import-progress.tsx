'use client';

import { Check, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ImportStepStatus = 'pending' | 'in-progress' | 'completed' | 'error';

export interface ImportStep {
  id: string;
  label: string;
  status: ImportStepStatus;
}

export const DEFAULT_IMPORT_STEPS: ImportStep[] = [
  { id: 'parse', label: 'URL Parsing', status: 'pending' },
  { id: 'metadata', label: 'File Metadata', status: 'pending' },
  { id: 'node', label: 'Node Data', status: 'pending' },
  { id: 'screenshot', label: 'Screenshot', status: 'pending' },
];

interface ImportProgressProps {
  steps: ImportStep[];
  className?: string;
}

function StepIcon({ status }: { status: ImportStepStatus }) {
  switch (status) {
    case 'completed':
      return (
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
      );
    case 'in-progress':
      return (
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <Loader2 size={14} className="text-white animate-spin" />
        </div>
      );
    case 'error':
      return (
        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <AlertCircle size={14} className="text-white" />
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <Circle size={8} className="text-gray-300 dark:text-gray-600" />
        </div>
      );
  }
}

export function ImportProgress({ steps, className }: ImportProgressProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      role="progressbar"
      aria-label="Import progress"
      aria-valuemin={0}
      aria-valuemax={steps.length}
      aria-valuenow={steps.filter((s) => s.status === 'completed').length}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex items-start gap-3">
            {/* Icon and connector line */}
            <div className="flex flex-col items-center">
              <StepIcon status={step.status} />
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 h-6 mt-1',
                    step.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 pt-0.5">
              <span
                className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' && 'text-green-600 dark:text-green-400',
                  step.status === 'in-progress' && 'text-blue-600 dark:text-blue-400',
                  step.status === 'error' && 'text-red-600 dark:text-red-400',
                  step.status === 'pending' && 'text-gray-500 dark:text-gray-400'
                )}
                aria-current={step.status === 'in-progress' ? 'step' : undefined}
              >
                {step.label}
              </span>
              {step.status === 'in-progress' && (
                <span className="sr-only">In progress</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ImportProgress;
