'use client';

import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Download, Maximize2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule } from '@/lib/types/rules';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';

type FrameworkType = 'react-tailwind' | 'html-css' | 'react-inline' | 'swift-ui' | 'android-xml';

interface GeneratedCodeSectionProps {
  node: SimpleAltNode | null;
  framework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  resolvedProperties?: Record<string, string>;
  allRules?: MultiFrameworkRule[];
}

// Helper to determine syntax highlighting language
function getLanguage(framework: FrameworkType, isStyles: boolean): string {
  if (isStyles) {
    return framework === 'html-css' ? 'css' : 'css';
  }

  switch (framework) {
    case 'react-tailwind':
    case 'react-inline':
      return 'tsx';
    case 'html-css':
      return 'html';
    case 'swift-ui':
      return 'swift';
    case 'android-xml':
      return 'xml';
    default:
      return 'typescript';
  }
}

export function GeneratedCodeSection({
  node,
  framework,
  onFrameworkChange,
  resolvedProperties = {},
  allRules = [],
}: GeneratedCodeSectionProps) {
  const [activeTab, setActiveTab] = useState<'component' | 'styles'>('component');
  const [copiedComponent, setCopiedComponent] = useState(false);
  const [copiedStyles, setCopiedStyles] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));

      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }
  }, []);

  // Generate code using the appropriate generator
  const { componentCode, stylesCode } = useMemo(() => {
    if (!node) {
      return {
        componentCode: '// No node selected',
        stylesCode: '/* No node selected */',
      };
    }

    try {
      if (framework === 'react-tailwind') {
        // FIX: Pass allRules and framework for child evaluation
        const output = generateReactTailwind(node, resolvedProperties, allRules, framework);
        return {
          componentCode: output.code,
          stylesCode: '/* Tailwind classes are inline - no separate styles needed */',
        };
      } else if (framework === 'html-css') {
        // FIX: Pass allRules and framework for child evaluation
        const output = generateHTMLCSS(node, resolvedProperties, allRules, framework);
        return {
          componentCode: output.code,
          stylesCode: output.css || '/* No styles generated */',
        };
      } else {
        // Placeholder for other frameworks
        return {
          componentCode: `// ${framework} generator not yet implemented for ${node.name}`,
          stylesCode: `/* ${framework} styles not yet implemented */`,
        };
      }
    } catch (error) {
      console.error('Code generation error:', error);
      return {
        componentCode: `// Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stylesCode: '/* Error generating styles */',
      };
    }
  }, [node, framework, resolvedProperties, allRules]);

  const handleCopy = async (text: string, type: 'component' | 'styles') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'component') {
        setCopiedComponent(true);
        setTimeout(() => setCopiedComponent(false), 2000);
      } else {
        setCopiedStyles(true);
        setTimeout(() => setCopiedStyles(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${framework === 'html-css' ? 'html' : 'tsx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Generated Code
        </h3>
        <Select value={framework} onValueChange={(v: string) => onFrameworkChange(v as FrameworkType)}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="react-tailwind">React + Tailwind</SelectItem>
            <SelectItem value="html-css">HTML + CSS</SelectItem>
            <SelectItem value="react-inline">React Inline</SelectItem>
            <SelectItem value="swift-ui">SwiftUI</SelectItem>
            <SelectItem value="android-xml">Android XML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'component' | 'styles')}>
        <TabsList className="w-full">
          <TabsTrigger value="component" className="flex-1">Component</TabsTrigger>
          <TabsTrigger value="styles" className="flex-1">Styles</TabsTrigger>
        </TabsList>

        <TabsContent value="component" className="mt-3">
          <div className="relative">
            <div className="rounded-lg text-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
              <SyntaxHighlighter
                language={getLanguage(framework, false)}
                style={isDark ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  borderRadius: '0.5rem',
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {componentCode}
              </SyntaxHighlighter>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                    aria-label="View full code"
                  >
                    <Maximize2 size={14} className="text-gray-400" />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Component Code ({framework})</DialogTitle>
                  </DialogHeader>
                  <div className="rounded-lg overflow-auto text-sm border border-gray-200 dark:border-gray-700 max-h-[60vh]">
                    <SyntaxHighlighter
                      language={getLanguage(framework, false)}
                      style={isDark ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        borderRadius: '0.5rem',
                      }}
                      wrapLines={true}
                      wrapLongLines={true}
                    >
                      {componentCode}
                    </SyntaxHighlighter>
                  </div>
                </DialogContent>
              </Dialog>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCopy(componentCode, 'component')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopy(componentCode, 'component');
                  }
                }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                aria-label="Copy component code"
              >
                {copiedComponent ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleDownload(componentCode, 'component')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDownload(componentCode, 'component');
                  }
                }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                aria-label="Download component code"
              >
                <Download size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="styles" className="mt-3">
          <div className="relative">
            <div className="rounded-lg text-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
              <SyntaxHighlighter
                language={getLanguage(framework, true)}
                style={isDark ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  borderRadius: '0.5rem',
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {stylesCode}
              </SyntaxHighlighter>
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleCopy(stylesCode, 'styles')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopy(stylesCode, 'styles');
                  }
                }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                aria-label="Copy styles code"
              >
                {copiedStyles ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} className="text-gray-400" />
                )}
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleDownload(stylesCode, 'styles')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDownload(stylesCode, 'styles');
                  }
                }}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer"
                aria-label="Download styles code"
              >
                <Download size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
