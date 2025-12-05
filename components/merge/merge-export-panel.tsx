'use client';

/**
 * Merge Export Panel Component
 *
 * Displays generated code with framework tabs and export options.
 * Supports copy to clipboard and file download.
 */

import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { MergeResult, FrameworkType } from '@/lib/types/merge';

// ============================================================================
// Types
// ============================================================================

interface MergeExportPanelProps {
  result: MergeResult;
  mergeName: string;
  currentFramework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFilename(name: string, framework: FrameworkType): string {
  const base = name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  switch (framework) {
    case 'react-tailwind':
    case 'react-tailwind-v4':
      return `${base}.tsx`;
    case 'html-css':
      return `${base}.html`;
    default:
      return `${base}.txt`;
  }
}

// ============================================================================
// Component
// ============================================================================

export function MergeExportPanel({
  result,
  mergeName,
  currentFramework,
  onFrameworkChange,
}: MergeExportPanelProps) {
  const [copied, setCopied] = useState(false);

  const code = result.generatedCode[currentFramework];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const filename = getFilename(mergeName, currentFramework);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with tabs and actions */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <Tabs
          value={currentFramework}
          onValueChange={(value) => onFrameworkChange(value as FrameworkType)}
        >
          <TabsList className="h-8">
            <TabsTrigger value="react-tailwind" className="px-2 py-1 text-xs">
              React v3
            </TabsTrigger>
            <TabsTrigger value="react-tailwind-v4" className="px-2 py-1 text-xs">
              React v4
            </TabsTrigger>
            <TabsTrigger value="html-css" className="px-2 py-1 text-xs">
              HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5 text-green-500" />
                <span className="text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy className="mr-1 h-3.5 w-3.5" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 px-2"
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            <span className="text-xs">Download</span>
          </Button>
        </div>
      </div>

      {/* Code display */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <pre className="text-sm">
          <code className="font-mono whitespace-pre-wrap break-all">
            {code}
          </code>
        </pre>
      </div>

      {/* Stats footer */}
      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
        <span>{result.stats.totalElements} elements</span>
        <span className="mx-2">•</span>
        <span>{result.stats.commonElements} common</span>
        <span className="mx-2">•</span>
        <span>{result.stats.processingTimeMs}ms</span>
      </div>
    </div>
  );
}
