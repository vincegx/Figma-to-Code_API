'use client';

/**
 * MergeCodePanel Component
 *
 * Generated code display with Component/Styles tabs and copy/download actions.
 * VERBATIM from merge/[id]/page.tsx - Phase 3 refactoring
 */

import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { useUIStore } from '@/lib/store';
import { cn } from '@/lib/utils';

type MergeFrameworkType = 'react-tailwind' | 'react-tailwind-v4' | 'html-css';

interface MergeCodePanelProps {
  displayCode: string;
  displayCss: string;
  generatedCode: string;
  selectedNodeName: string | undefined;
  mergeName: string;
  previewFramework: MergeFrameworkType;
  withProps: boolean;
  isLoadingCode: boolean;
  onWithPropsChange: (checked: boolean) => void;
}

export function MergeCodePanel({
  displayCode,
  displayCss,
  generatedCode,
  selectedNodeName,
  mergeName,
  previewFramework,
  withProps,
  isLoadingCode,
  onWithPropsChange,
}: MergeCodePanelProps) {
  const [codeActiveTab, setCodeActiveTab] = useState<'component' | 'styles'>('component');
  const [copiedCode, setCopiedCode] = useState(false);

  // Theme-aware code highlighting
  const currentTheme = useUIStore((state) => state.theme);
  const codeTheme = currentTheme === 'light' ? themes.github : themes.nightOwl;

  const getCodeContent = () => {
    if (codeActiveTab === 'styles') {
      if (previewFramework === 'html-css') {
        return displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '/* No CSS */';
      } else {
        return '/* Tailwind classes are inline - no separate styles needed */';
      }
    }
    // Component tab
    if (previewFramework === 'html-css') {
      return displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode;
    }
    return displayCode || generatedCode;
  };

  const handleCopy = async () => {
    let contentToCopy: string;
    if (codeActiveTab === 'styles') {
      if (previewFramework === 'html-css') {
        contentToCopy = displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '';
      } else {
        contentToCopy = '/* Tailwind classes are inline - no separate styles needed */';
      }
    } else {
      if (previewFramework === 'html-css') {
        contentToCopy = displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode;
      } else {
        contentToCopy = displayCode || generatedCode;
      }
    }
    await navigator.clipboard.writeText(contentToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownload = () => {
    const isStylesHtmlCss = codeActiveTab === 'styles' && previewFramework === 'html-css';
    const ext = isStylesHtmlCss ? 'css' : (previewFramework === 'html-css' ? 'html' : 'tsx');
    let content: string;
    if (codeActiveTab === 'styles') {
      if (previewFramework === 'html-css') {
        content = displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '';
      } else {
        content = '/* Tailwind classes are inline - no separate styles needed */';
      }
    } else {
      if (previewFramework === 'html-css') {
        content = displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode;
      } else {
        content = displayCode || generatedCode;
      }
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNodeName || mergeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLineCount = () => {
    if (codeActiveTab === 'styles') {
      if (previewFramework === 'html-css') {
        return (displayCss || generatedCode.split('/* CSS */')[1]?.trim() || '').split('\n').length;
      }
      return 1; // "Tailwind classes are inline" message
    }
    if (previewFramework === 'html-css') {
      return (displayCode || generatedCode.split('/* CSS */')[0]?.trim() || generatedCode).split('\n').length;
    }
    return (displayCode || generatedCode).split('\n').length;
  };

  return (
    <div className="bg-bg-card rounded-xl border border-border-primary p-4 flex flex-col">
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
          {/* Props checkbox - only visible for React frameworks */}
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
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {isLoadingCode && (
          <div className="absolute inset-0 bg-bg-primary/50 flex items-center justify-center z-10">
            <div className="animate-spin h-5 w-5 border-2 border-accent-primary border-t-transparent rounded-full" />
          </div>
        )}
        <Highlight
          theme={codeTheme}
          code={getCodeContent()}
          language={codeActiveTab === 'styles' ? 'css' : (previewFramework === 'html-css' ? 'markup' : 'tsx')}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className="text-xs rounded-lg p-4 overflow-auto max-h-[490px] font-mono leading-5" style={{ ...style, background: 'transparent' }}>
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
      <div className="flex items-center gap-2 mt-3 text-xs text-text-muted flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>No errors</span>
        <span>•</span>
        <span>{getLineCount()} lines</span>
      </div>
    </div>
  );
}
