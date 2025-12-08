'use client';

/**
 * CodePanel Component
 *
 * Generated code display with Component/Styles tabs and copy/download actions.
 * VERBATIM from viewer/[nodeId]/page.tsx lines 830-930 - Phase 3 refactoring
 */

import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { FrameworkType } from '@/lib/types/rules';

interface CodePanelProps {
  displayCode: string;
  displayCss: string;
  displayNodeName: string | undefined;
  nodeName: string;
  previewFramework: FrameworkType;
  withProps: boolean;
  onWithPropsChange: (checked: boolean) => void;
}

export function CodePanel({
  displayCode,
  displayCss,
  displayNodeName,
  nodeName,
  previewFramework,
  withProps,
  onWithPropsChange,
}: CodePanelProps) {
  const [codeActiveTab, setCodeActiveTab] = useState<'component' | 'styles'>('component');
  const [copiedCode, setCopiedCode] = useState(false);

  // Theme-aware code highlighting
  const currentTheme = useUIStore((state) => state.theme);
  const codeTheme = currentTheme === 'light' ? themes.github : themes.nightOwl;

  const handleCopy = async () => {
    const textToCopy = codeActiveTab === 'component' ? displayCode : displayCss;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = codeActiveTab === 'component' ? displayCode : displayCss;
    const extension = codeActiveTab === 'component'
      ? (previewFramework === 'html-css' ? 'html' : 'tsx')
      : 'css';
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayNodeName || nodeName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Generated Code</span>
          <button
            onClick={() => setCodeActiveTab('component')}
            className={cn(
              'px-2 py-0.5 text-xs rounded transition-colors',
              codeActiveTab === 'component' ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover'
            )}
          >
            Component
          </button>
          <button
            onClick={() => setCodeActiveTab('styles')}
            className={cn(
              'px-2 py-0.5 text-xs rounded transition-colors',
              codeActiveTab === 'styles' ? 'bg-toggle-active-bg text-toggle-active-text' : 'text-text-muted hover:bg-bg-hover'
            )}
          >
            Styles
          </button>
          {/* WP47: Props checkbox - only visible for React frameworks */}
          {(previewFramework === 'react-tailwind' || previewFramework === 'react-tailwind-v4') && (
            <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={withProps}
                onChange={(e) => onWithPropsChange(e.target.checked)}
                className="h-3 w-3 rounded border-gray-600 accent-accent"
              />
              Props
            </label>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Copy to clipboard"
          >
            {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:bg-bg-hover"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Code area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Highlight
          theme={codeTheme}
          code={codeActiveTab === 'component' ? displayCode : displayCss}
          language={codeActiveTab === 'styles' ? 'css' : (previewFramework === 'html-css' ? 'markup' : 'tsx')}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className="text-xs rounded-lg p-4 overflow-auto max-h-[510px] font-mono leading-5" style={{ ...style, background: 'transparent' }}>
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
      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 text-xs text-text-muted flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>No errors</span>
        <span>•</span>
        <span>{(codeActiveTab === 'component' ? displayCode : displayCss).split('\n').length} lines</span>
      </div>
    </div>
  );
}
