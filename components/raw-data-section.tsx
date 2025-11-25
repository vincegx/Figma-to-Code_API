'use client';

import { useState } from 'react';
import { ChevronDown, Copy, Check } from 'lucide-react';
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
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-semibold mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <span className="text-gray-900 dark:text-white">Raw Figma Data</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform text-gray-500",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="relative">
          <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            <code className="text-gray-900 dark:text-gray-100">{jsonData}</code>
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
            className="absolute top-2 right-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
            aria-label="Copy JSON data"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-gray-400" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
