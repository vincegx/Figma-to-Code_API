'use client';

/**
 * MergeHeader Component
 *
 * Header with title, status badge, breadcrumb, and action buttons.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  RotateCcw,
  Download,
  Copy,
  Home,
  Scissors,
  Package,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Merge } from '@/lib/types/merge';

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

interface MergeHeaderProps {
  merge: Merge;
  mergeId: string;
  displayNodeName: string | undefined;
  previewFramework: MergeFrameworkType;
  generatedCode: string;
  hasPrev: boolean;
  hasNext: boolean;
  onFrameworkChange: (framework: MergeFrameworkType) => void;
  onRefreshPreview: () => void;
  goToPrevMerge: () => void;
  goToNextMerge: () => void;
  onSplitClick?: () => void;
}

export function MergeHeader({
  merge,
  mergeId,
  displayNodeName,
  previewFramework,
  generatedCode,
  hasPrev,
  hasNext,
  onFrameworkChange,
  onRefreshPreview,
  goToPrevMerge,
  goToNextMerge,
  onSplitClick,
}: MergeHeaderProps) {
  return (
    <header className="flex-shrink-0 flex justify-between px-5 py-3">
      {/* Left: Title + Breadcrumb */}
      <div>
        <div className="flex items-center gap-4 mb-1">
          <h1 className="text-2xl font-semibold text-text-primary">{merge.name}</h1>
          <span className={cn(
            'px-2 py-0.5 text-xs rounded',
            merge.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
            merge.status === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-amber-500/20 text-amber-400'
          )}>
            {merge.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-text-muted hover:text-text-primary"><Home className="w-4 h-4" /></Link>
          <ChevronRight className="w-4 h-4 text-text-muted" />
          <Link href="/merges" className="text-text-muted hover:text-text-primary">Merges</Link>
          <ChevronRight className="w-4 h-4 text-text-muted" />
          <span className="text-text-primary">{displayNodeName || merge.name}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/merges/${mergeId}`, { method: 'PATCH' });
                if (response.ok) {
                  window.location.reload();
                }
              } catch (error) {
                console.error('Regenerate failed:', error);
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Regenerate merge"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRefreshPreview}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary border border-border-primary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors" title="Export">
                <Download className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-bg-card border border-border-primary">
              <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(generatedCode); }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const ext = previewFramework === 'html-css' ? 'html' : 'tsx';
                const blob = new Blob([generatedCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${merge.name}.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download Code File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                // Download ZIP package with code, assets, and project files
                const url = `/api/merges/${mergeId}/export?framework=${previewFramework}&format=zip`;
                const a = document.createElement('a');
                a.href = url;
                a.download = `${merge.name}-export.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}>
                <Package className="h-4 w-4 mr-2" />
                Download ZIP Package
              </DropdownMenuItem>
              {onSplitClick && (
                <DropdownMenuItem onClick={onSplitClick}>
                  <Scissors className="h-4 w-4 mr-2" />
                  Split into Components...
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Prev/Next navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMerge}
              disabled={!hasPrev}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg border border-border-primary transition-colors",
                hasPrev
                  ? "bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary"
                  : "bg-bg-secondary/50 text-text-muted/30 cursor-not-allowed"
              )}
              title={hasPrev ? "Previous merge" : "No previous merge"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNextMerge}
              disabled={!hasNext}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg border border-border-primary transition-colors",
                hasNext
                  ? "bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary"
                  : "bg-bg-secondary/50 text-text-muted/30 cursor-not-allowed"
              )}
              title={hasNext ? "Next merge" : "No next merge"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Select value={previewFramework} onValueChange={(v) => onFrameworkChange(v as MergeFrameworkType)}>
            <SelectTrigger className="h-8 w-[160px] bg-bg-secondary border-border-primary text-xs text-text-muted hover:bg-bg-hover">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border border-border-primary">
              <SelectItem value="react-tailwind" className="text-xs">React + Tailwind</SelectItem>
              <SelectItem value="react-tailwind-v4" className="text-xs">React + Tailwind v4</SelectItem>
              <SelectItem value="html-css" className="text-xs">HTML + CSS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
