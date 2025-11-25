'use client';

import { useState, useMemo } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';

type FrameworkType = 'react-tailwind' | 'html-css' | 'react-inline' | 'swift-ui' | 'android-xml';

interface GeneratedCodeSectionProps {
  node: SimpleAltNode | null;
  framework: FrameworkType;
  onFrameworkChange: (framework: FrameworkType) => void;
  resolvedProperties?: Record<string, string>;
}

export function GeneratedCodeSection({
  node,
  framework,
  onFrameworkChange,
  resolvedProperties = {},
}: GeneratedCodeSectionProps) {
  const [activeTab, setActiveTab] = useState<'component' | 'styles'>('component');
  const [copiedComponent, setCopiedComponent] = useState(false);
  const [copiedStyles, setCopiedStyles] = useState(false);

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
        const output = generateReactTailwind(node, resolvedProperties);
        return {
          componentCode: output.code,
          stylesCode: '/* Tailwind classes are inline - no separate styles needed */',
        };
      } else if (framework === 'html-css') {
        const output = generateHTMLCSS(node, resolvedProperties);
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
  }, [node, framework, resolvedProperties]);

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
        <select
          value={framework}
          onChange={(e) => onFrameworkChange(e.target.value as FrameworkType)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <option value="react-tailwind">React + Tailwind</option>
          <option value="html-css">HTML + CSS</option>
          <option value="react-inline">React Inline</option>
          <option value="swift-ui">SwiftUI</option>
          <option value="android-xml">Android XML</option>
        </select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'component' | 'styles')}>
        <TabsList className="w-full">
          <TabsTrigger value="component" className="flex-1">Component</TabsTrigger>
          <TabsTrigger value="styles" className="flex-1">Styles</TabsTrigger>
        </TabsList>

        <TabsContent value="component" className="mt-3">
          <div className="relative">
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700">
              <code className="text-gray-900 dark:text-gray-100">{componentCode}</code>
            </pre>
            <div className="absolute top-2 right-2 flex gap-2">
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
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs border border-gray-200 dark:border-gray-700">
              <code className="text-gray-900 dark:text-gray-100">{stylesCode}</code>
            </pre>
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
