'use client';

import { useState, useMemo, useEffect } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import { SimpleMappingRule } from '@/lib/types/rules';
import { generateReactJSX } from '@/lib/code-generators/react';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';
import CodePreview from './code-preview';

interface PreviewTabsProps {
  altNode: SimpleAltNode | null;
  rules: SimpleMappingRule[];
  onCodeChange?: (code: string) => void;
  scopedNode?: SimpleAltNode | null; // T154: Generate code for selected subtree only
}

type CodeFormat = 'react-jsx' | 'react-tailwind' | 'html-css';

export default function PreviewTabs({
  altNode,
  rules,
  onCodeChange,
  scopedNode,
}: PreviewTabsProps) {
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('react-jsx');

  // T154: Use scoped node if provided, otherwise use full altNode
  const targetNode = scopedNode || altNode;

  // Generate code for selected format
  const generatedCode = useMemo(() => {
    if (!targetNode) return '';

    const startTime = performance.now();
    let codeOutput = '';

    try {
      // For MVP, use empty resolved properties (rule engine integration in T095)
      // In full implementation, this would come from evaluateRules()
      const resolvedProperties: Record<string, string> = {};

      let result;
      switch (selectedFormat) {
        case 'react-jsx':
          result = generateReactJSX(targetNode, resolvedProperties);
          codeOutput = result.code;
          break;
        case 'react-tailwind':
          result = generateReactTailwind(targetNode, resolvedProperties);
          codeOutput = result.code;
          break;
        case 'html-css':
          result = generateHTMLCSS(targetNode, resolvedProperties);
          // For HTML/CSS, combine HTML and CSS
          codeOutput = result.code;
          if (result.css) {
            codeOutput += '\n\n/* CSS */\n' + result.css;
          }
          break;
      }
    } catch (error) {
      console.error('Code generation error:', error);
      codeOutput = `// Error generating code: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`Code generation (${selectedFormat}): ${duration.toFixed(2)}ms`);

    return codeOutput;
  }, [targetNode, selectedFormat]);

  // Notify parent of code change via useEffect (not during render)
  // This fixes: "Cannot update a component while rendering a different component"
  useEffect(() => {
    if (onCodeChange && generatedCode) {
      onCodeChange(generatedCode);
    }
  }, [generatedCode, onCodeChange]);

  // Get language for syntax highlighting
  const language = useMemo(() => {
    switch (selectedFormat) {
      case 'react-jsx':
      case 'react-tailwind':
        return 'tsx';
      case 'html-css':
        return 'html';
      default:
        return 'tsx';
    }
  }, [selectedFormat]);

  if (!targetNode) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No node data available
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Load a node to see the generated code preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Format Selector */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Format:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFormat('react-jsx')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFormat === 'react-jsx'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                React JSX
              </button>
              <button
                onClick={() => setSelectedFormat('react-tailwind')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFormat === 'react-tailwind'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                React + Tailwind
              </button>
              <button
                onClick={() => setSelectedFormat('html-css')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFormat === 'html-css'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                HTML/CSS
              </button>
            </div>
          </div>

          {/* Code stats and scope indicator */}
          <div className="flex items-center gap-4">
            {scopedNode && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Generating for: <span className="font-medium">{scopedNode.name}</span>
              </div>
            )}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {generatedCode.split('\n').length} lines •{' '}
              {generatedCode.length} characters
            </div>
          </div>
        </div>
      </div>

      {/* Code Preview */}
      <div className="flex-1 overflow-auto">
        <CodePreview code={generatedCode} language={language} />
      </div>
    </div>
  );
}
