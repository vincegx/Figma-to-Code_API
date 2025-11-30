'use client';

/**
 * CommandCenter - Hero Section Component
 *
 * Main import area for the homepage with:
 * - Prominent URL input
 * - Import button with loading state
 * - Progress display during import
 * - Helpful tip for new users
 */

import { useState, useCallback } from 'react';
import { useFigmaProgress } from '@/hooks/use-figma-progress';
import { ImportProgress } from '@/components/import-progress';
import { ImportLogs } from '@/components/import-logs';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CommandCenter() {
  const [url, setUrl] = useState('');
  const { isRunning, steps, logs, error, result, startImport, cancel, reset } = useFigmaProgress();

  const handleImport = useCallback(async () => {
    if (url.trim() && !isRunning) {
      await startImport(url);
    }
  }, [url, startImport, isRunning]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isRunning && url.trim()) {
        handleImport();
      }
    },
    [handleImport, isRunning, url]
  );

  const handleReset = useCallback(() => {
    reset();
    setUrl('');
  }, [reset]);

  const hasStarted = logs.length > 0;
  const isSuccess = result !== null && !error;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-primary/10 via-bg-card to-bg-card border border-border-primary shadow-lg">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

      {/* Gradient overlay */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent-primary/5 to-transparent pointer-events-none" />

      <div className="relative p-8 md:p-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            Import a Figma design
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Transform your designs into production-ready code with semantic Tailwind classes
          </p>
        </div>

        {/* Input Area */}
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.figma.com/file/..."
                disabled={isRunning}
                className={cn(
                  'w-full px-4 py-2 text-sm border-2 rounded-xl bg-bg-card text-text-primary placeholder:text-text-muted',
                  'focus:outline-none focus:border-accent-primary focus:ring-4 focus:ring-accent-primary/20',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isRunning ? 'border-accent-primary' : 'border-border-primary'
                )}
              />
              {url && !isRunning && (
                <button
                  onClick={() => setUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isRunning ? (
              <Button
                onClick={cancel}
                variant="destructive"
                size="lg"
                className="px-6 min-w-[120px]"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            ) : isSuccess ? (
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="px-6 min-w-[120px]"
              >
                Import Another
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={!url.trim()}
                size="lg"
                className="px-6 min-w-[120px] bg-accent-primary hover:bg-accent-primary/90"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importing
                  </>
                ) : (
                  <>
                    Import
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Progress Section */}
          {hasStarted && (
            <div className="mt-6 p-4 bg-bg-secondary/50 backdrop-blur-sm rounded-xl border border-border-primary">
              <ImportProgress
                steps={steps.map((s) => ({
                  id: s.id,
                  label: s.label,
                  status: s.status === 'skipped' ? 'skipped' : s.status,
                  message: s.message,
                }))}
              />
              <div className="mt-4 max-h-32 overflow-y-auto">
                <ImportLogs logs={logs} />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !isRunning && (
            <div className="mt-4 p-4 bg-status-error-bg text-status-error-text rounded-xl border border-status-error-border">
              <p className="font-medium">Import failed</p>
              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="mt-4 p-4 bg-status-success-bg text-status-success-text rounded-xl border border-status-success-border">
              <p className="font-medium">Import successful!</p>
              <p className="text-sm mt-1 opacity-90">
                Your design has been imported. View it in the library or start generating code.
              </p>
            </div>
          )}
        </div>

        {/* Tip */}
        {!hasStarted && (
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-text-muted">
            <Lightbulb className="w-4 h-4 text-status-warning-text flex-shrink-0" />
            <span>
              Tip: In Figma, right-click any element → <strong>Copy link to clipboard</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
