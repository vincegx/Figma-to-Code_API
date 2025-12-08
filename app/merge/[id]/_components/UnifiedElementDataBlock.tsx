'use client';

/**
 * UnifiedElementDataBlock Component
 *
 * JSON viewer for unified element data with copy/download and load more.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { useState, useEffect } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Highlight, type PrismTheme } from 'prism-react-renderer';
import type { UnifiedElement } from '@/lib/types/merge';

interface UnifiedElementDataBlockProps {
  displayNode: UnifiedElement | null;
  codeTheme: PrismTheme;
  selectedNodeId: string | null;
}

export function UnifiedElementDataBlock({
  displayNode,
  codeTheme,
  selectedNodeId,
}: UnifiedElementDataBlockProps) {
  const [copiedRawData, setCopiedRawData] = useState(false);
  const [rawDataLimit, setRawDataLimit] = useState(2000);

  // Reset raw data limit when selected node changes
  useEffect(() => {
    setRawDataLimit(2000);
  }, [selectedNodeId]);

  const jsonString = JSON.stringify(displayNode, null, 2) || '{}';
  const jsonLength = jsonString.length;
  const jsonLines = jsonString.split('\n').length;
  const hasMore = jsonLength > rawDataLimit;

  // Get truncated JSON
  const getDisplayJson = () => {
    if (rawDataLimit >= jsonLength) return jsonString;
    const sliced = jsonString.slice(0, rawDataLimit);
    const lastNewline = sliced.lastIndexOf('\n');
    return lastNewline > 0 ? sliced.slice(0, lastNewline) + '\n  // ... more data' : sliced;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopiedRawData(true);
    setTimeout(() => setCopiedRawData(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayNode?.name || 'unified-element'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-sm font-medium text-text-primary">Unified Element Data</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Copy to clipboard"
          >
            {copiedRawData ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Download JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <Highlight
          theme={codeTheme}
          code={getDisplayJson()}
          language="json"
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className="text-xs rounded-lg p-3 overflow-auto h-64 font-mono leading-5" style={{ ...style, background: 'transparent' }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
      <div className="flex items-center justify-between mt-2 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-graph-2" />
          <span>No errors</span>
          <span>•</span>
          <span>{jsonLines} lines</span>
        </div>
        {hasMore && (
          <button
            onClick={() => setRawDataLimit(prev => prev + 10000)}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            + more ({Math.round((rawDataLimit / jsonLength) * 100)}%)
          </button>
        )}
      </div>
    </div>
  );
}
