'use client';

/**
 * Export Progress and Results Display
 *
 * Shows export progress during generation and final results
 * with download button when complete.
 */

import { Loader2, Check, FileCode, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ExportedFile } from '@/lib/types/split';

interface ExportProgressProps {
  isExporting: boolean;
  files: ExportedFile[];
  totalSize: number;
  error: string | null;
  onDone: () => void;
}

/**
 * Format file size for display
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ExportProgress({
  isExporting,
  files,
  totalSize,
  error,
  onDone,
}: ExportProgressProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-medium text-text-primary mb-1">Export Failed</h3>
          <p className="text-xs text-text-muted max-w-[300px]">{error}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onDone}>
          Close
        </Button>
      </div>
    );
  }

  if (isExporting) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
        <div className="text-center">
          <h3 className="text-sm font-medium text-text-primary mb-1">Generating components...</h3>
          <p className="text-xs text-text-muted">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Success Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-primary">Export Complete</h3>
          <p className="text-xs text-text-muted">{files.length} files generated</p>
        </div>
      </div>

      {/* File List */}
      <div className="border border-border-primary rounded-lg overflow-hidden bg-bg-secondary">
        <ul className="divide-y divide-border-primary max-h-[200px] overflow-y-auto">
          {files.map((file, index) => (
            <li key={index} className="flex items-center gap-2 px-3 py-2">
              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <FileCode className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
              <span className="flex-1 text-sm text-text-primary truncate">{file.filename}</span>
              <span className="text-xs text-text-muted tabular-nums">{formatSize(file.size)}</span>
            </li>
          ))}
          {/* Index file */}
          <li className="flex items-center gap-2 px-3 py-2">
            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <FileCode className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="flex-1 text-sm text-text-primary truncate">index.ts</span>
          </li>
          {/* Shared folder indicator */}
          <li className="flex items-center gap-2 px-3 py-2">
            <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            <FileCode className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="flex-1 text-sm text-text-primary truncate">shared/</span>
          </li>
        </ul>
      </div>

      {/* Total Size */}
      <div className="flex items-center justify-between px-1 text-xs text-text-muted">
        <span>Total package size</span>
        <span className="text-text-primary font-medium">{formatSize(totalSize)}</span>
      </div>

      {/* Done Button */}
      <Button onClick={onDone} className="w-full">
        Done
      </Button>
    </div>
  );
}
