'use client';

/**
 * useCodeGeneration Hook
 *
 * Handles code generation for the Viewer page:
 * - Generates code for LivePreview (always root node)
 * - Generates code for display panel (selected node)
 * - Manages code/CSS state for both tabs
 *
 * VERBATIM from viewer/[nodeId]/page.tsx - Phase 3 refactoring
 */

import { useEffect, useState, useMemo } from 'react';
import type { SimpleAltNode } from '@/lib/altnode-transform';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateReactTailwindV4 } from '@/lib/code-generators/react-tailwind-v4';
import { generateHTMLTailwindCSS } from '@/lib/code-generators/html-tailwind-css';

interface UseCodeGenerationOptions {
  nodeId: string;
  altNode: SimpleAltNode | null;
  selectedNode: SimpleAltNode | null;
  multiFrameworkRules: MultiFrameworkRule[];
  previewFramework: FrameworkType;
  rootResolvedProperties: Record<string, string>;
  iframeKey: number;
  withProps: boolean;
  /** Version folder to trigger regeneration when version changes */
  selectedVersionFolder: string | null;
}

export function useCodeGeneration({
  nodeId,
  altNode,
  selectedNode,
  multiFrameworkRules,
  previewFramework,
  rootResolvedProperties,
  iframeKey,
  withProps,
  selectedVersionFolder,
}: UseCodeGenerationOptions) {
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [displayCode, setDisplayCode] = useState<string>('');
  const [displayCss, setDisplayCss] = useState<string>('');
  const [googleFontsUrl, setGoogleFontsUrl] = useState<string | undefined>(undefined);

  // Generate code for LivePreview (always root node)
  // WP35: Always use altNode (root) for code generation - selection only affects highlight
  useEffect(() => {
    if (!altNode || multiFrameworkRules.length === 0) {
      return;
    }

    const rootNode = altNode;

    async function generateCode() {
      try {
        if (previewFramework === 'react-tailwind') {
          const output = await generateReactTailwind(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          setGeneratedCode(output.code);
          setGoogleFontsUrl(output.googleFontsUrl);
        } else if (previewFramework === 'react-tailwind-v4') {
          const output = await generateReactTailwindV4(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          setGeneratedCode(output.code);
          setGoogleFontsUrl(output.googleFontsUrl);
        } else if (previewFramework === 'html-css') {
          const output = await generateHTMLTailwindCSS(rootNode, rootResolvedProperties, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          const combinedCode = `<!-- HTML -->\n${output.code}\n\n/* CSS */\n${output.css || ''}`;
          setGeneratedCode(combinedCode);
          setGoogleFontsUrl(output.googleFontsUrl);
        }
      } catch (error) {
        console.error('Code generation error:', error);
      }
    }

    generateCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [altNode?.id, multiFrameworkRules.length, previewFramework, nodeId, rootResolvedProperties, iframeKey, selectedVersionFolder]);

  // Generate code for selected node (or root if none selected) - for Generated Code block
  useEffect(() => {
    const targetNode = selectedNode || altNode;
    if (!targetNode || multiFrameworkRules.length === 0) {
      setDisplayCode('');
      setDisplayCss('');
      return;
    }

    async function generateDisplayCode() {
      try {
        const targetProps = evaluateMultiFrameworkRules(targetNode!, multiFrameworkRules, previewFramework).properties;

        if (previewFramework === 'react-tailwind') {
          const output = await generateReactTailwind(targetNode!, targetProps, multiFrameworkRules, previewFramework, undefined, undefined, nodeId, { withProps });
          setDisplayCode(output.code);
          setDisplayCss('/* Tailwind classes are inline - no separate styles needed */');
        } else if (previewFramework === 'react-tailwind-v4') {
          const output = await generateReactTailwindV4(targetNode!, targetProps, multiFrameworkRules, previewFramework, undefined, undefined, nodeId, { withProps });
          setDisplayCode(output.code);
          setDisplayCss('/* Tailwind v4 classes are inline - no separate styles needed */');
        } else if (previewFramework === 'html-css') {
          const output = await generateHTMLTailwindCSS(targetNode!, targetProps, multiFrameworkRules, previewFramework, undefined, undefined, nodeId);
          setDisplayCode(output.code);
          setDisplayCss(output.css || '/* No styles generated */');
        }
      } catch (error) {
        console.error('Display code generation error:', error);
      }
    }

    generateDisplayCode();
  }, [selectedNode, altNode, multiFrameworkRules, previewFramework, nodeId, withProps]);

  // Extract Tailwind/CSS classes from generated code for selected node
  const nodeClasses = useMemo(() => {
    if (!displayCode) return '';
    const reactMatch = displayCode.match(/className="([^"]+)"/);
    if (reactMatch) return reactMatch[1];
    const htmlMatch = displayCode.match(/class="([^"]+)"/);
    if (htmlMatch) return htmlMatch[1];
    return '';
  }, [displayCode]);

  return {
    generatedCode,
    displayCode,
    displayCss,
    googleFontsUrl,
    nodeClasses,
  };
}
