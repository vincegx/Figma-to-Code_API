/**
 * Merge SimpleAltNodes
 *
 * Merges 3 SimpleAltNodes (mobile, tablet, desktop) into a single SimpleAltNode
 * with responsiveStyles for tablet (md:) and desktop (lg:) overrides.
 *
 * Algorithm:
 * 1. Use mobile as base (mobile-first approach)
 * 2. Match children by layer name across breakpoints
 * 3. Compute style diffs: tablet vs mobile → md, desktop vs tablet → lg
 * 4. Recursively merge children
 * 5. Return merged SimpleAltNode with responsiveStyles
 *
 * VERBATIM from merge-simple-alt-nodes.ts
 */

import type { SimpleAltNode } from '../../altnode-transform';
import type { UnifiedElement, ResponsiveStyles } from '../../types/merge';
import type { FigmaNodeType } from '../../types/figma';
import { getVisibilityClasses } from '../visibility-mapper';
import { computeStyleDiff, cleanStyles } from './style-diff';
import { matchChildrenByName } from './matching';

// Re-export for external use
export { computeStyleDiff, cleanStyles, areValuesEquivalent, getResetValue } from './style-diff';
export { matchChildrenByName, findBestMatch } from './matching';

// ============================================================================
// Types
// ============================================================================

interface MergedNodeResult {
  node: SimpleAltNode;
  warnings: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Deep clone a SimpleAltNode (without children, we'll rebuild those)
 */
function cloneNodeWithoutChildren(
  node: SimpleAltNode,
  presence?: { mobile: boolean; tablet: boolean; desktop: boolean }
): SimpleAltNode {
  return {
    id: node.id,
    name: node.name,
    uniqueName: node.uniqueName,
    type: node.type,
    originalType: node.originalType,
    styles: { ...node.styles },
    children: [], // Will be filled by recursive merge
    originalNode: node.originalNode,
    visible: node.visible,
    canBeFlattened: node.canBeFlattened,
    cumulativeRotation: node.cumulativeRotation,
    isIcon: node.isIcon,
    svgData: node.svgData,
    imageData: node.imageData,
    fillsData: node.fillsData ? [...node.fillsData] : undefined,
    negativeItemSpacing: node.negativeItemSpacing,
    layoutDirection: node.layoutDirection,
    maskImageRef: node.maskImageRef,
    presence,
  };
}

// ============================================================================
// Main Merge Function
// ============================================================================

/**
 * Merge a single element from 3 breakpoints into one SimpleAltNode with responsiveStyles.
 */
function mergeElement(
  mobile: SimpleAltNode | undefined,
  tablet: SimpleAltNode | undefined,
  desktop: SimpleAltNode | undefined,
  warnings: string[]
): SimpleAltNode | null {
  // Use mobile as base, fallback to tablet, then desktop
  const base = mobile || tablet || desktop;
  if (!base) return null;

  // Track which breakpoints contain this element
  const presence = {
    mobile: mobile !== undefined,
    tablet: tablet !== undefined,
    desktop: desktop !== undefined,
  };

  // Clone the base node with presence info
  const merged = cloneNodeWithoutChildren(base, presence);

  // Get styles from each breakpoint
  const mobileStyles = mobile?.styles || {};
  const tabletStyles = tablet?.styles || {};
  const desktopStyles = desktop?.styles || {};

  // Use mobile styles as base
  merged.styles = { ...mobileStyles };

  // FIX: Add width: 100% when flex-grow is present but width is missing
  // This ensures responsive overrides (md:w-[Xpx]) work correctly
  // Without this, elements with flex-grow lose their fill behavior when tablet overrides kick in
  const hasFlexGrow = merged.styles['flex-grow'] === '1' || merged.styles['flexGrow'] === '1';
  const hasNoWidth = !merged.styles.width && !merged.styles['width'];
  if (hasFlexGrow && hasNoWidth) {
    merged.styles.width = '100%';
  }

  // Compute responsive overrides
  const mdDiff = computeStyleDiff(mobileStyles, tabletStyles);
  const lgDiff = computeStyleDiff(tabletStyles, desktopStyles);

  // Only add responsiveStyles if there are differences
  if (Object.keys(mdDiff).length > 0 || Object.keys(lgDiff).length > 0) {
    merged.responsiveStyles = {};
    if (Object.keys(mdDiff).length > 0) {
      merged.responsiveStyles.md = mdDiff;
    }
    if (Object.keys(lgDiff).length > 0) {
      merged.responsiveStyles.lg = lgDiff;
    }
  }

  // Merge imageData: prefer mobile, but track if different across breakpoints
  // For now, just use the base's imageData
  // TODO: Handle different images per breakpoint if needed

  // Recursively merge children
  const mobileChildren = mobile?.children || [];
  const tabletChildren = tablet?.children || [];
  const desktopChildren = desktop?.children || [];

  const matchedChildren = matchChildrenByName(mobileChildren, tabletChildren, desktopChildren);

  for (const match of matchedChildren) {
    const mergedChild = mergeElement(match.mobile, match.tablet, match.desktop, warnings);
    if (mergedChild) {
      merged.children.push(mergedChild);
    }
  }

  return merged;
}

/**
 * Merge 3 SimpleAltNodes (mobile, tablet, desktop) into a single responsive SimpleAltNode.
 *
 * @param mobile - Mobile breakpoint node (base, required)
 * @param tablet - Tablet breakpoint node (optional)
 * @param desktop - Desktop breakpoint node (optional)
 * @returns Merged SimpleAltNode with responsiveStyles
 */
export function mergeSimpleAltNodes(
  mobile: SimpleAltNode,
  tablet?: SimpleAltNode,
  desktop?: SimpleAltNode
): MergedNodeResult {
  const warnings: string[] = [];

  const mergedNode = mergeElement(mobile, tablet, desktop, warnings);

  if (!mergedNode) {
    throw new Error('Failed to merge nodes: no valid base node');
  }

  return {
    node: mergedNode,
    warnings,
  };
}

/**
 * Get source node ID for image URL generation.
 * Uses mobile node ID as the canonical source.
 */
export function getSourceNodeId(
  mobile?: SimpleAltNode,
  tablet?: SimpleAltNode,
  desktop?: SimpleAltNode
): string {
  return mobile?.id || tablet?.id || desktop?.id || 'unknown';
}

// ============================================================================
// Tailwind Class Utilities
// ============================================================================

/**
 * Smart split for Tailwind classes that preserves arbitrary values with spaces.
 * e.g., "[background:var(--color, rgba(0, 0, 0, 1))]" stays intact.
 *
 * Standard split(' ') would break:
 *   "[bg:var(--c," "rgba(0," "0," "0))]" ❌
 *
 * Smart split keeps brackets together:
 *   "[background:var(--color, rgba(0, 0, 0, 1))]" ✓
 */
function smartSplitClasses(classString: string): string[] {
  const trimmed = classString.trim();
  if (!trimmed) return [];

  // Fast path: no brackets, use simple split
  if (!trimmed.includes('[')) {
    return trimmed.split(/\s+/).filter(c => c.length > 0);
  }

  // Slow path: track bracket depth
  const classes: string[] = [];
  let current = '';
  let bracketDepth = 0;

  for (const char of trimmed) {
    if (char === '[') {
      bracketDepth++;
      current += char;
    } else if (char === ']') {
      bracketDepth--;
      current += char;
    } else if (/\s/.test(char) && bracketDepth === 0) {
      // Space outside brackets = class boundary
      if (current) {
        classes.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Don't forget last class
  if (current) {
    classes.push(current);
  }

  return classes;
}

// ============================================================================
// SimpleAltNode → UnifiedElement Conversion
// ============================================================================

/**
 * Convert SimpleAltNode styles to Tailwind class string.
 * This is a simplified version - the full conversion happens in the code generator.
 *
 * Uses cleanStyles to filter out Figma-specific props, serialization bugs,
 * and normalize property names.
 */
function stylesToTailwindClasses(styles: Record<string, string | number>): string {
  // Clean styles: remove Figma-specific props, normalize names, remove defaults in base
  const cleaned = cleanStyles(styles, true);

  const classes: string[] = [];
  for (const [key, value] of Object.entries(cleaned)) {
    classes.push(`[${key}:${value}]`);
  }

  return classes.join(' ');
}

/**
 * Build ResponsiveStyles from SimpleAltNode styles and responsiveStyles
 */
function buildResponsiveStyles(node: SimpleAltNode): ResponsiveStyles {
  const base = stylesToTailwindClasses(node.styles);
  const tablet = node.responsiveStyles?.md
    ? stylesToTailwindClasses(node.responsiveStyles.md)
    : undefined;
  const desktop = node.responsiveStyles?.lg
    ? stylesToTailwindClasses(node.responsiveStyles.lg)
    : undefined;

  const combined = [
    base,
    tablet ? smartSplitClasses(tablet).map(c => `md:${c}`).join(' ') : '',
    desktop ? smartSplitClasses(desktop).map(c => `lg:${c}`).join(' ') : '',
  ].filter(Boolean).join(' ');

  return { base, tablet, desktop, combined };
}

/**
 * Convert a merged SimpleAltNode to UnifiedElement.
 * Used for stats calculation and UI tree view.
 */
export function toUnifiedElement(node: SimpleAltNode): UnifiedElement {
  // Get presence (default to all true if not set - non-merged node)
  const presence = node.presence ?? { mobile: true, tablet: true, desktop: true };

  // Get visibility classes based on presence
  const visibilityClasses = getVisibilityClasses(presence);

  // Build responsive styles
  const styles = buildResponsiveStyles(node);

  // Recursively convert children
  const children = node.children.length > 0
    ? node.children.map(child => toUnifiedElement(child))
    : undefined;

  // Extract layout properties from originalNode (mobile-first)
  const originalNode = node.originalNode as any;
  const layoutMode = originalNode?.layoutMode as 'HORIZONTAL' | 'VERTICAL' | 'NONE' | undefined;
  const layoutWrap = originalNode?.layoutWrap as 'WRAP' | 'NO_WRAP' | undefined;
  const primaryAxisAlignItems = originalNode?.primaryAxisAlignItems as 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' | undefined;

  return {
    id: node.id, // Use Figma node ID for unique identification (matches data-node-id in generated code)
    name: node.name,
    // Use originalType (Figma type like FRAME, TEXT) for icons, not node.type (HTML tag like div, span)
    type: (node.originalType || node.type) as FigmaNodeType,
    layoutMode,
    layoutWrap,
    primaryAxisAlignItems,
    originalType: node.originalType, // For INSTANCE detection
    presence,
    visibilityClasses,
    styles,
    mergedTailwindClasses: styles.combined,
    textContent: node.originalType === 'TEXT'
      ? (node.originalNode as any)?.characters
      : undefined,
    children,
    sources: {
      mobile: presence.mobile ? { nodeId: node.id, name: node.name } : undefined,
      tablet: presence.tablet ? { nodeId: node.id, name: node.name } : undefined,
      desktop: presence.desktop ? { nodeId: node.id, name: node.name } : undefined,
    },
  };
}
