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
 */

import type { SimpleAltNode, FillData } from '../altnode-transform';
import type { UnifiedElement, ResponsiveStyles } from '../types/merge';
import type { FigmaNodeType } from '../types/figma';
import { getVisibilityClasses } from './visibility-mapper';

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
 * Compute style differences between two style objects.
 * Returns only the properties that are different in 'compare' vs 'base'.
 *
 * WP08: Also handles properties that exist in 'base' but not in 'compare'.
 * For these, we generate reset values (e.g., width: 100% in base, absent in compare → width: auto)
 */
function computeStyleDiff(
  base: Record<string, string | number>,
  compare: Record<string, string | number>
): Record<string, string | number> {
  const diff: Record<string, string | number> = {};

  // Check properties in compare that differ from base
  for (const [key, value] of Object.entries(compare)) {
    const baseValue = base[key];
    // Only include if different (stringify for deep comparison)
    if (JSON.stringify(baseValue) !== JSON.stringify(value)) {
      diff[key] = value;
    }
  }

  // WP08: Check properties in base that don't exist in compare (need reset)
  // This handles cases like: mobile has width:100%, desktop has flex-grow:1 (no width)
  for (const [key, baseValue] of Object.entries(base)) {
    if (!(key in compare) && baseValue !== undefined && baseValue !== '') {
      // Generate reset value based on property type
      const resetValue = getResetValue(key, baseValue);
      if (resetValue !== null) {
        diff[key] = resetValue;
      }
    }
  }

  return diff;
}

/**
 * WP08: Get the CSS reset value for a property that should be "unset" at a breakpoint.
 * Returns null if no reset is needed.
 */
function getResetValue(property: string, _baseValue: string | number): string | number | null {
  const prop = property.toLowerCase();

  // Width/height: reset to auto
  if (prop === 'width' || prop === 'height') {
    return 'auto';
  }

  // Flex properties
  if (prop === 'flex-grow' || prop === 'flexgrow') {
    return '0'; // Reset to default
  }

  // Min/max dimensions: reset to 0 or none
  if (prop.startsWith('min-width') || prop.startsWith('minwidth')) {
    return '0';
  }
  if (prop.startsWith('min-height') || prop.startsWith('minheight')) {
    return '0';
  }

  // Align-self: reset to auto
  if (prop === 'align-self' || prop === 'alignself') {
    return 'auto';
  }

  // For most other properties, don't generate reset
  // They either don't need reset or have complex defaults
  return null;
}

/**
 * Build a map of children by name for matching.
 * Handles duplicate names with index suffix.
 */
function buildChildrenMap(children: SimpleAltNode[]): Map<string, SimpleAltNode> {
  const byName = new Map<string, SimpleAltNode>();
  const nameCounts = new Map<string, number>();

  for (const child of children) {
    const count = (nameCounts.get(child.name) ?? 0) + 1;
    nameCounts.set(child.name, count);
    const key = count === 1 ? child.name : `${child.name}_${count}`;
    byName.set(key, child);
  }

  return byName;
}

/**
 * Match children across 3 breakpoints by layer name.
 * Returns matched triplets in mobile order first, then unmatched.
 */
function matchChildrenByName(
  mobileChildren: SimpleAltNode[],
  tabletChildren: SimpleAltNode[],
  desktopChildren: SimpleAltNode[]
): Array<{
  name: string;
  mobile?: SimpleAltNode;
  tablet?: SimpleAltNode;
  desktop?: SimpleAltNode;
}> {
  const mobileByName = buildChildrenMap(mobileChildren);
  const tabletByName = buildChildrenMap(tabletChildren);
  const desktopByName = buildChildrenMap(desktopChildren);

  const allNames = new Set([
    ...mobileByName.keys(),
    ...tabletByName.keys(),
    ...desktopByName.keys(),
  ]);

  const result: Array<{
    name: string;
    mobile?: SimpleAltNode;
    tablet?: SimpleAltNode;
    desktop?: SimpleAltNode;
  }> = [];

  const processedNames = new Set<string>();

  // Process mobile order first
  for (const [name] of mobileByName) {
    if (!processedNames.has(name)) {
      processedNames.add(name);
      result.push({
        name,
        mobile: mobileByName.get(name),
        tablet: tabletByName.get(name),
        desktop: desktopByName.get(name),
      });
    }
  }

  // Add remaining from tablet/desktop
  for (const name of allNames) {
    if (!processedNames.has(name)) {
      processedNames.add(name);
      result.push({
        name,
        mobile: mobileByName.get(name),
        tablet: tabletByName.get(name),
        desktop: desktopByName.get(name),
      });
    }
  }

  return result;
}

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
// SimpleAltNode → UnifiedElement Conversion
// ============================================================================

/**
 * Generate a unique element ID from a name
 */
function generateElementId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Convert SimpleAltNode styles to Tailwind class string.
 * This is a simplified version - the full conversion happens in the code generator.
 */
function stylesToTailwindClasses(styles: Record<string, string | number>): string {
  // For stats/UI purposes, we just need a rough approximation
  // The actual code generation uses the full react-tailwind.ts pipeline
  const classes: string[] = [];

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined || value === '') continue;
    // Just collect the CSS property names for now
    // The real conversion is handled by the code generator
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
    tablet ? tablet.split(' ').map(c => `md:${c}`).join(' ') : '',
    desktop ? desktop.split(' ').map(c => `lg:${c}`).join(' ') : '',
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

  return {
    id: generateElementId(node.name),
    name: node.name,
    type: node.type as FigmaNodeType,
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
