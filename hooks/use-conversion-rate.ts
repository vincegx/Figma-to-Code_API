/**
 * Hook: useConversionRate
 *
 * Calculates the conversion rate by analyzing styles in nodes.
 * Distinguishes between semantic Tailwind classes vs arbitrary values.
 *
 * Semantic: text-sm, flex-col, rounded-lg
 * Arbitrary: text-[14px], w-[200px], rounded-[8px]
 */

import { useMemo } from 'react';
import { useNodesStore } from '@/lib/store';

export interface ConversionRateResult {
  /** Conversion rate as percentage (0-100) */
  rate: number;
  /** Count of semantic (non-arbitrary) class values */
  semantic: number;
  /** Count of arbitrary values (containing brackets) */
  arbitrary: number;
  /** Total style values analyzed */
  total: number;
  /** Breakdown by category */
  breakdown: {
    layout: { semantic: number; arbitrary: number };
    typography: { semantic: number; arbitrary: number };
    colors: { semantic: number; arbitrary: number };
    spacing: { semantic: number; arbitrary: number };
    other: { semantic: number; arbitrary: number };
  };
}

// Regex to detect arbitrary values: [value] pattern
const ARBITRARY_REGEX = /\[.+?\]/;

// Categories for style properties
const LAYOUT_PROPS = ['display', 'flexDirection', 'alignItems', 'justifyContent', 'gap', 'gridTemplateColumns'];
const TYPOGRAPHY_PROPS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign'];
const COLOR_PROPS = ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'];
const SPACING_PROPS = ['padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];

function categorizeProperty(key: string): keyof ConversionRateResult['breakdown'] {
  if (LAYOUT_PROPS.some(p => key.toLowerCase().includes(p.toLowerCase()))) return 'layout';
  if (TYPOGRAPHY_PROPS.some(p => key.toLowerCase().includes(p.toLowerCase()))) return 'typography';
  if (COLOR_PROPS.some(p => key.toLowerCase().includes(p.toLowerCase()))) return 'colors';
  if (SPACING_PROPS.some(p => key.toLowerCase().includes(p.toLowerCase()))) return 'spacing';
  return 'other';
}

export function useConversionRate(): ConversionRateResult {
  const nodes = useNodesStore((s) => s.nodes);

  return useMemo(() => {
    const breakdown = {
      layout: { semantic: 0, arbitrary: 0 },
      typography: { semantic: 0, arbitrary: 0 },
      colors: { semantic: 0, arbitrary: 0 },
      spacing: { semantic: 0, arbitrary: 0 },
      other: { semantic: 0, arbitrary: 0 },
    };

    let semanticCount = 0;
    let arbitraryCount = 0;

    // Helper to recursively analyze node styles
    const analyzeNode = (node: { styles?: Record<string, unknown> }): void => {
      if (!node.styles) return;

      Object.entries(node.styles).forEach(([key, value]) => {
        if (typeof value !== 'string' || !value.trim()) return;

        const category = categorizeProperty(key);
        const isArbitrary = ARBITRARY_REGEX.test(value);

        if (isArbitrary) {
          arbitraryCount++;
          breakdown[category].arbitrary++;
        } else {
          semanticCount++;
          breakdown[category].semantic++;
        }
      });
    };

    // Analyze all nodes
    nodes.forEach((libraryNode) => {
      if (libraryNode.altNode) {
        analyzeNode(libraryNode.altNode as { styles?: Record<string, unknown> });

        // Recursively analyze children
        const analyzeChildren = (children: unknown[]): void => {
          if (!Array.isArray(children)) return;
          children.forEach((child) => {
            if (typeof child === 'object' && child !== null) {
              analyzeNode(child as { styles?: Record<string, unknown> });
              const childWithChildren = child as { children?: unknown[] };
              if (childWithChildren.children) {
                analyzeChildren(childWithChildren.children);
              }
            }
          });
        };

        const altNodeWithChildren = libraryNode.altNode as { children?: unknown[] };
        if (altNodeWithChildren.children) {
          analyzeChildren(altNodeWithChildren.children);
        }
      }
    });

    const total = semanticCount + arbitraryCount;
    const rate = total > 0 ? Math.round((semanticCount / total) * 100) : 0;

    return {
      rate,
      semantic: semanticCount,
      arbitrary: arbitraryCount,
      total,
      breakdown,
    };
  }, [nodes]);
}
