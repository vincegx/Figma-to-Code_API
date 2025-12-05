/**
 * Loading State for Merge Viewer
 *
 * Shows a loading spinner while the merge page is loading.
 */

import { Loader2 } from 'lucide-react';

export default function MergeViewerLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
