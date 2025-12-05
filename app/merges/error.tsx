'use client';

/**
 * Error Boundary for Merges Page
 *
 * Catches runtime errors and displays a friendly error state.
 */

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MergesError({ error, reset }: ErrorProps) {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center py-8">
      <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
      <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
      <p className="mb-6 max-w-md text-center text-muted-foreground">
        {error.message || 'An unexpected error occurred while loading merges.'}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
    </div>
  );
}
