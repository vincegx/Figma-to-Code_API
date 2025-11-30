'use client';

import { useState } from 'react';
import { ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RawDataSectionProps {
  node: any; // Will be typed properly with FigmaNode
}

export function RawDataSection({ node }: RawDataSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonData = JSON.stringify(node, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  return (
    <div className="mt-3 bg-gray-100 dark:bg-gray-800/40 rounded-md border border-gray-200 dark:border-gray-700/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-1.5 py-2 px-2.5 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 transition-colors text-left"
      >
        <ChevronRight
          className={cn(
            "w-3 h-3 transition-transform text-gray-400 dark:text-gray-500",
            isExpanded && "rotate-90"
          )}
        />
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Raw Figma Data
        </span>
      </button>

      {isExpanded && (
        <div className="relative px-2.5 pb-2.5">
          <pre className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded overflow-x-auto text-[10px] max-h-60 overflow-y-auto">
            <code className="text-gray-700 dark:text-gray-300">{jsonData}</code>
          </pre>
          <div
            role="button"
            tabIndex={0}
            onClick={handleCopy}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCopy();
              }
            }}
            className="absolute top-2 right-4 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
            aria-label="Copy JSON data"
          >
            {copied ? (
              <Check size={12} className="text-green-500" />
            ) : (
              <Copy size={12} className="text-gray-400" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
