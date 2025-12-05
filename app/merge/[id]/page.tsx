'use client';

/**
 * Merge Viewer Page
 *
 * Displays a single merge result with:
 * - Responsive preview with breakpoint toggle
 * - Code export panel with framework tabs
 * - Warnings section
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BreakpointToggle } from '@/components/merge/breakpoint-toggle';
import { MergePreview } from '@/components/merge/merge-preview';
import { MergeExportPanel } from '@/components/merge/merge-export-panel';
import type { Merge, Breakpoint, FrameworkType } from '@/lib/types/merge';

// ============================================================================
// Page Props
// ============================================================================

interface PageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================

function ErrorState({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-xl font-semibold">Failed to load merge</h2>
      <p className="mb-6 text-muted-foreground">{message}</p>
      <Button onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function MergeViewerPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [merge, setMerge] = useState<Merge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [framework, setFramework] = useState<FrameworkType>('react-tailwind');

  useEffect(() => {
    const fetchMerge = async () => {
      try {
        const response = await fetch(`/api/merges/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Merge not found');
          }
          throw new Error('Failed to load merge');
        }
        const data = await response.json();
        setMerge(data.merge);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMerge();
  }, [id]);

  const handleBack = () => {
    router.push('/merges');
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onBack={handleBack} />;
  }

  if (!merge) {
    return <ErrorState message="Merge data not available" onBack={handleBack} />;
  }

  // Handle non-ready merges
  if (merge.status === 'error') {
    return (
      <ErrorState
        message={merge.error || 'Merge processing failed'}
        onBack={handleBack}
      />
    );
  }

  if (merge.status === 'processing' || !merge.result) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin" />
        <h2 className="mb-2 text-xl font-semibold">Processing merge...</h2>
        <p className="text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  const code = merge.result.generatedCode[framework];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">{merge.name}</h1>
        </div>
        <BreakpointToggle value={breakpoint} onChange={setBreakpoint} />
      </header>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Preview panel */}
        <div className="flex-1 overflow-auto border-b lg:border-b-0 lg:border-r">
          <MergePreview
            code={code}
            framework={framework}
            breakpoint={breakpoint}
            sourceNodes={merge.sourceNodes}
          />
        </div>

        {/* Export panel */}
        <div className="flex h-[400px] flex-col lg:h-auto lg:w-[400px]">
          <MergeExportPanel
            result={merge.result}
            mergeName={merge.name}
            currentFramework={framework}
            onFrameworkChange={setFramework}
          />

          {/* Warnings section */}
          {merge.result.warnings.length > 0 && (
            <div className="border-t p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                Warnings ({merge.result.warnings.length})
              </h3>
              <ul className="max-h-32 space-y-1 overflow-auto text-sm">
                {merge.result.warnings.map((warning, index) => (
                  <li key={index} className="text-muted-foreground">
                    <span className="font-medium">{warning.type}:</span>{' '}
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
