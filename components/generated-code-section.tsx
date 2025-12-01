'use client';

import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Download, Maximize2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLTailwindCSS } from '@/lib/code-generators/html-tailwind-css';

// Custom theme based on oneDark/oneLight but with transparent background
function getCustomTheme(isDark: boolean) {
  const baseTheme = isDark ? oneDark : oneLight;
  return {
    ...baseTheme,
    'pre[class*="language-"]': {
      ...baseTheme['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: 0,
    },
    'code[class*="language-"]': {
      ...baseTheme['code[class*="language-"]'],
      background: 'transparent',
    },
  };
}

interface GeneratedCodeSectionProps {
  node: SimpleAltNode | null;
  framework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  resolvedProperties?: Record<string, string>;
  allRules?: MultiFrameworkRule[];
  nodeId?: string;
  onCodeChange?: (code: string) => void;
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
  nodeId,
  onCodeChange,
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

  // WP32: State for generated code (async generators)
  const [generatedCode, setGeneratedCode] = useState<{ componentCode: string; stylesCode: string }>({
    componentCode: '// Loading...',
    stylesCode: '/* Loading... */',
  });

  // WP32: Generate code using async generators
  useEffect(() => {
    // WP32 FIX: Don't generate if node missing OR rules not loaded (prevents multiple generations)
    if (!node || allRules.length === 0) {
      setGeneratedCode({
        componentCode: '// Loading...',
        stylesCode: '/* Loading... */',
      });
      return;
    }

    // Capture node in closure to satisfy TypeScript
    const currentNode = node;

    async function generateAsync() {
      try {
        // WP32 FIX: NEVER pass credentials in viewer mode (nodeId exists)
        // Credentials are ONLY for initial export/download, NOT for viewer
        // This prevents calling Figma API on every page load
        const figmaFileKey = nodeId ? undefined : (process.env.NEXT_PUBLIC_FIGMA_FILE_KEY || '');
        const figmaAccessToken = nodeId ? undefined : (process.env.NEXT_PUBLIC_FIGMA_ACCESS_TOKEN || '');

        if (framework === 'react-tailwind') {
          // WP32: nodeId triggers local image paths, no API calls
          const output = await generateReactTailwind(currentNode, resolvedProperties, allRules, framework, figmaFileKey, figmaAccessToken, nodeId);

          setGeneratedCode({
            componentCode: output.code,
            stylesCode: '/* Tailwind classes are inline - no separate styles needed */',
          });
          // Pass code to parent viewer for LivePreview
          onCodeChange?.(output.code);
        } else if (framework === 'html-css') {
          // WP39: Use Tailwind v4 compiler for pure CSS output
          const output = await generateHTMLTailwindCSS(currentNode, resolvedProperties, allRules, framework, figmaFileKey, figmaAccessToken, nodeId);

          setGeneratedCode({
            componentCode: output.code,
            stylesCode: output.css || '/* No styles generated */',
          });
          // Pass code to parent viewer for LivePreview
          onCodeChange?.(output.code);
        } else {
          // Placeholder for other frameworks
          const placeholderCode = `// ${framework} generator not yet implemented for ${currentNode.name}`;
          setGeneratedCode({
            componentCode: placeholderCode,
            stylesCode: `/* ${framework} styles not yet implemented */`,
          });
          onCodeChange?.(placeholderCode);
        }
      } catch (error) {
        console.error('Code generation error:', error);
        setGeneratedCode({
          componentCode: `// Error generating code: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stylesCode: '/* Error generating styles */',
        });
      }
    }

    generateAsync();
    // WP32 PERF: Use primitives to avoid re-generation when references change
    // resolvedProperties is derived from node + allRules, no need to include it
  }, [node?.id, framework, allRules.length]);

  const { componentCode, stylesCode} = generatedCode;

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
    <div className="mt-3 bg-gray-100 dark:bg-gray-800/40 rounded-md border border-gray-200 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-gray-200 dark:border-gray-700/50">
        <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Generated Code
        </span>
        <Select value={framework} onValueChange={(v: string) => onFrameworkChange(v as FrameworkType)}>
          <SelectTrigger className="w-32 h-6 text-[10px] bg-gray-200 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="react-tailwind">React + Tailwind v3</SelectItem>
            <SelectItem value="react-tailwind-v4">React + Tailwind v4</SelectItem>
            <SelectItem value="html-css">HTML + CSS</SelectItem>
            <SelectItem value="react-inline">React Inline</SelectItem>
            <SelectItem value="swift-ui">SwiftUI</SelectItem>
            <SelectItem value="android-xml">Android XML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'component' | 'styles')}>
        <TabsList className="w-full justify-start border-b border-gray-200 dark:border-gray-700/50 rounded-none bg-transparent h-auto p-0">
          <TabsTrigger value="component" className="flex-1 text-[13px] text-gray-500 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-200 data-[state=active]:bg-gray-200/50 dark:data-[state=active]:bg-gray-700/30 rounded-none bg-transparent px-3 py-1.5">Component</TabsTrigger>
          <TabsTrigger value="styles" className="flex-1 text-[13px] text-gray-500 dark:text-gray-400 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-200 data-[state=active]:bg-gray-200/50 dark:data-[state=active]:bg-gray-700/30 rounded-none bg-transparent px-3 py-1.5">Styles</TabsTrigger>
        </TabsList>

        <TabsContent value="component" className="mt-0 p-2">
          <div className="relative">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded text-xs overflow-auto max-h-80">
              <SyntaxHighlighter
                language={getLanguage(framework, false)}
                style={getCustomTheme(isDark)}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
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
                    <DialogDescription className="sr-only">
                      Full-screen view of the generated component code
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto text-sm border border-gray-200 dark:border-gray-700 max-h-[60vh]">
                    <SyntaxHighlighter
                      language={getLanguage(framework, false)}
                      style={getCustomTheme(isDark)}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        borderRadius: '0.5rem',
                        background: 'transparent',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
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

        <TabsContent value="styles" className="mt-0 p-2">
          <div className="relative">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded text-xs overflow-auto max-h-80">
              <SyntaxHighlighter
                language={getLanguage(framework, true)}
                style={getCustomTheme(isDark)}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
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
