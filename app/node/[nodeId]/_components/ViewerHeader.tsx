'use client';

/**
 * ViewerHeader Component
 *
 * Header with title, breadcrumb, API badge, and action buttons.
 * VERBATIM from viewer/[nodeId]/page.tsx lines 511-650 - Phase 3 refactoring
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Settings,
  CloudDownload,
  Home,
  Copy,
  Package,
  Scissors,
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
import { QuotaIndicator } from '@/components/quota/quota-indicator';
import { VersionDropdown } from '@/components/version-dropdown';
import type { FrameworkType } from '@/lib/types/rules';
import type { SimpleAltNode } from '@/lib/altnode-transform';

interface ViewerHeaderProps {
  nodeId: string;
  nodeName: string;
  displayNodeName: string | undefined;
  selectedVersionFolder: string | null;
  iframeKey: number;
  previewFramework: FrameworkType;
  exportLanguage: 'typescript' | 'javascript';
  generatedCode: string;
  prevNode: { id: string } | null;
  nextNode: { id: string } | null;
  isRefetching: boolean;
  onVersionSelect: (folder: string | null) => Promise<void>;
  onRefetchClick: () => void;
  onRefreshPreview: () => void;
  onFrameworkChange: (framework: FrameworkType) => void;
  onSplitClick: () => void;
}

export function ViewerHeader({
  nodeId,
  nodeName,
  displayNodeName,
  selectedVersionFolder,
  iframeKey,
  previewFramework,
  exportLanguage,
  generatedCode,
  prevNode,
  nextNode,
  isRefetching,
  onVersionSelect,
  onRefetchClick,
  onRefreshPreview,
  onFrameworkChange,
  onSplitClick,
}: ViewerHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex-shrink-0 flex justify-between px-5 py-3">
      {/* BLOC GAUCHE: Titre + Date + Breadcrumb */}
      <div>
        <div className="flex items-center gap-4 mb-1">
          <h1 className="text-2xl font-semibold text-text-primary">{nodeName}</h1>
          <VersionDropdown
            nodeId={nodeId}
            selectedVersion={selectedVersionFolder}
            onVersionSelect={onVersionSelect}
            refreshKey={iframeKey}
          />
          {selectedVersionFolder && (
            <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded">
              Ancienne version
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="text-text-muted hover:text-text-primary"><Home className="w-4 h-4" /></Link>
          <ChevronRight className="w-4 h-4 text-text-muted" />
          <Link href="/nodes" className="text-text-muted hover:text-text-primary">Code render</Link>
          <ChevronRight className="w-4 h-4 text-text-muted" />
          <span className="text-text-primary">{displayNodeName || nodeName}</span>
        </div>
      </div>

      {/* BLOC DROIT: API Badge + Actions */}
      <div className="flex items-center gap-4">
        <QuotaIndicator />

        <div className="flex items-center gap-2">
          <button
            onClick={onRefetchClick}
            disabled={isRefetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            title="Re-fetch from Figma"
          >
            <CloudDownload className="w-4 h-4" />
          </button>
          <button
            onClick={onRefreshPreview}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
            title="Refresh preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors" title="Export">
                <Download className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-bg-card border border-border-primary">
              <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(generatedCode); }}>
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const ext = previewFramework === 'html-css' ? 'html' : (exportLanguage === 'typescript' ? 'tsx' : 'jsx');
                const blob = new Blob([generatedCode], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${nodeName}.${ext}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download Code File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                const params = new URLSearchParams({
                  framework: previewFramework,
                  language: exportLanguage,
                });
                try {
                  const response = await fetch(`/api/export/${nodeId}?${params}`);
                  if (!response.ok) {
                    console.error('Export failed:', await response.text());
                    return;
                  }
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${nodeName}-export.zip`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch (error) {
                  console.error('Export error:', error);
                }
              }}>
                <Package className="h-4 w-4 mr-2" />
                Download ZIP Package
              </DropdownMenuItem>
              {previewFramework !== 'html-css' && (
                <DropdownMenuItem onClick={onSplitClick}>
                  <Scissors className="h-4 w-4 mr-2" />
                  Split into Components...
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => prevNode && router.push(`/node/${prevNode.id}`)}
            disabled={!prevNode}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
            title="Previous node"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => nextNode && router.push(`/node/${nextNode.id}`)}
            disabled={!nextNode}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-secondary hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
            title="Next node"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Select value={previewFramework} onValueChange={(v) => onFrameworkChange(v as FrameworkType)}>
            <SelectTrigger className="h-8 w-[160px] bg-bg-secondary border-border-primary text-xs text-text-muted hover:bg-bg-hover">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border border-border-primary">
              <SelectItem value="react-tailwind" className="text-xs">React + Tailwind</SelectItem>
              <SelectItem value="react-tailwind-v4" className="text-xs">React + Tailwind v4</SelectItem>
              <SelectItem value="html-css" className="text-xs">HTML + CSS</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => router.push(`/rules?nodeId=${nodeId}`)}
            className="h-8 px-4 flex items-center gap-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Settings className="w-4 h-4" />
            Edit Rules
          </button>
        </div>
      </div>
    </header>
  );
}
