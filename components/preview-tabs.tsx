'use client';

import { useState, useMemo, useEffect } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { generateReactJSX } from '@/lib/code-generators/react';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';
import CodePreview from './code-preview';
import LivePreview from './live-preview';

interface PreviewTabsProps {
  altNode: SimpleAltNode | null;
  multiFrameworkRules: MultiFrameworkRule[];
  selectedFramework: FrameworkType;
  resolvedProperties: Record<string, string>;
  onCodeChange?: (code: string) => void;
  scopedNode?: SimpleAltNode | null;
  nodeId?: string;
}

export default function PreviewTabs({
  altNode,
  multiFrameworkRules,
  selectedFramework,
  resolvedProperties,
  onCodeChange,
  scopedNode,
  nodeId,
}: PreviewTabsProps) {
  // T154: Use scoped node if provided, otherwise use full altNode
  const targetNode = scopedNode || altNode;

  // WP32: State for generated code (async generators)
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // WP32: Generate code using async generators
  useEffect(() => {
    if (!targetNode) {
      setGeneratedCode('');
      return;
    }

    // Capture in closure for TypeScript
    const currentNode = targetNode;

    async function generateAsync() {
      const startTime = performance.now();
      let codeOutput = '';

      try {
        // WP32 FIX: NEVER pass credentials in viewer mode
        // Credentials ONLY for export, NOT for viewer
        const figmaFileKey = nodeId ? undefined : (process.env.NEXT_PUBLIC_FIGMA_FILE_KEY || '');
        const figmaAccessToken = nodeId ? undefined : (process.env.NEXT_PUBLIC_FIGMA_ACCESS_TOKEN || '');

        let result;
        switch (selectedFramework) {
          case 'react-tailwind':
            result = await generateReactTailwind(currentNode, resolvedProperties, [], 'react-tailwind', figmaFileKey, figmaAccessToken, nodeId);
            codeOutput = result.code;
            break;
          case 'html-css':
            result = await generateHTMLCSS(currentNode, resolvedProperties, [], 'html-css', figmaFileKey, figmaAccessToken, nodeId);
            codeOutput = result.code;
            if (result.css) {
              codeOutput += '\n\n/* CSS */\n' + result.css;
            }
            break;
        case 'react-inline':
          result = generateReactJSX(currentNode, resolvedProperties);
          codeOutput = result.code;
          break;
        case 'swift-ui':
          codeOutput = '// SwiftUI generator coming soon';
          break;
        case 'android-xml':
          codeOutput = '// Android XML generator coming soon';
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
      console.log(`Code generation (${selectedFramework}): ${duration.toFixed(2)}ms`);

      setGeneratedCode(codeOutput);
    }

    generateAsync();
  }, [targetNode, selectedFramework, resolvedProperties]);

  // Notify parent of code change via useEffect (not during render)
  // This fixes: "Cannot update a component while rendering a different component"
  useEffect(() => {
    if (onCodeChange && generatedCode) {
      onCodeChange(generatedCode);
    }
  }, [generatedCode, onCodeChange]);

  // Get language for syntax highlighting
  const language: 'tsx' | 'html' | 'jsx' | 'typescript' | 'css' = useMemo(() => {
    switch (selectedFramework) {
      case 'react-tailwind':
      case 'react-inline':
        return 'tsx';
      case 'html-css':
        return 'html';
      case 'swift-ui':
        return 'typescript'; // Use TypeScript syntax for Swift until we have proper Swift support
      case 'android-xml':
        return 'html'; // Use HTML syntax for XML
      default:
        return 'tsx';
    }
  }, [selectedFramework]);

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

  const showLivePreview =
    selectedFramework === 'html-css' ||
    selectedFramework === 'react-tailwind' ||
    selectedFramework === 'react-inline';

  return (
    <div className="h-full flex flex-col">
      {/* Code stats and scope indicator */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Framework: <span className="font-medium">{selectedFramework}</span>
          </div>
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

      {/* Live Preview - Top 50% (for supported frameworks) */}
      {showLivePreview && (
        <div className="flex-1 border-b border-gray-200 dark:border-gray-700">
          <LivePreview
            code={generatedCode}
            framework={selectedFramework}
            language={language}
          />
        </div>
      )}

      {/* Code Preview - Bottom 50% (or full height if no live preview) */}
      <div className={showLivePreview ? 'flex-1 overflow-auto' : 'flex-1 overflow-auto'}>
        <CodePreview code={generatedCode} language={language} />
      </div>
    </div>
  );
}
