/**
 * Element Matcher
 *
 * Matches elements across 3 breakpoints (mobile, tablet, desktop) by Figma layer name.
 * Handles duplicate names with index suffixes and tracks unmatched elements.
 *
 * Algorithm:
 * 1. Build an index of elements by name for each breakpoint
 * 2. Disambiguate duplicate names with suffix (_2, _3, etc.)
 * 3. Match elements across breakpoints using the unified name set
 * 4. Preserve element order from mobile as the base
 */

import type { AltNode, AltNodeWithChildren } from '../types/altnode';
import type { Breakpoint, MergeWarning } from '../types/merge';

// ============================================================================
// Types
// ============================================================================

/**
 * Index of elements by name for a single breakpoint
 */
export interface ElementIndex {
  /** Map from original name to list of nodes with that name */
  readonly byName: Map<string, AltNode[]>;
  /** Set of names that appear more than once */
  readonly duplicateNames: Set<string>;
  /** Map from disambiguated name to node */
  readonly disambiguated: Map<string, AltNode>;
  /** All nodes in traversal order */
  readonly orderedNodes: AltNode[];
}

/**
 * A matched element with references to each breakpoint's node
 */
export interface MatchedElement {
  /** Disambiguated element name */
  readonly name: string;
  /** Original Figma layer name (before disambiguation) */
  readonly originalName: string;
  /** Node from mobile breakpoint (if present) */
  readonly mobile?: AltNode;
  /** Node from tablet breakpoint (if present) */
  readonly tablet?: AltNode;
  /** Node from desktop breakpoint (if present) */
  readonly desktop?: AltNode;
  /** Whether name was disambiguated (had duplicates) */
  readonly wasDisambiguated: boolean;
}

/**
 * Result of matching elements across breakpoints
 */
export interface MatchResult {
  /** All matched elements in order */
  readonly elements: MatchedElement[];
  /** Warnings generated during matching */
  readonly warnings: MergeWarning[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an AltNode has children
 */
function hasChildren(node: AltNode): node is AltNodeWithChildren {
  return 'children' in node && Array.isArray(node.children);
}

/**
 * Flatten a node tree into an ordered list (depth-first traversal)
 */
function flattenTree(root: AltNode, maxDepth: number = 10): AltNode[] {
  const result: AltNode[] = [];

  function traverse(node: AltNode, depth: number): void {
    result.push(node);

    if (depth < maxDepth && hasChildren(node)) {
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }

  traverse(root, 0);
  return result;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Build an index of elements by name for a single breakpoint.
 * Handles duplicate names by tracking them separately.
 */
export function buildElementIndex(root: AltNode, maxDepth: number = 10): ElementIndex {
  const byName = new Map<string, AltNode[]>();
  const duplicateNames = new Set<string>();
  const orderedNodes = flattenTree(root, maxDepth);

  // Group nodes by name
  for (const node of orderedNodes) {
    const name = node.name;
    const existing = byName.get(name);

    if (existing) {
      existing.push(node);
      duplicateNames.add(name);
    } else {
      byName.set(name, [node]);
    }
  }

  // Create disambiguated map
  const disambiguated = new Map<string, AltNode>();

  for (const [name, nodes] of byName.entries()) {
    if (nodes.length === 1) {
      // No disambiguation needed
      disambiguated.set(name, nodes[0]);
    } else {
      // Add index suffix for duplicates
      nodes.forEach((node, index) => {
        const disambiguatedName = index === 0 ? name : `${name}_${index + 1}`;
        disambiguated.set(disambiguatedName, node);
      });
    }
  }

  return {
    byName,
    duplicateNames,
    disambiguated,
    orderedNodes,
  };
}

/**
 * Get all unique disambiguated names from an index
 */
export function getDisambiguatedNames(index: ElementIndex): Set<string> {
  return new Set(index.disambiguated.keys());
}

/**
 * Match elements across 3 breakpoints by layer name.
 * Returns matched elements in mobile's order (as base), with unmatched elements appended.
 */
export function matchElements(
  mobile: AltNode,
  tablet: AltNode,
  desktop: AltNode,
  maxDepth: number = 10
): MatchResult {
  const mobileIndex = buildElementIndex(mobile, maxDepth);
  const tabletIndex = buildElementIndex(tablet, maxDepth);
  const desktopIndex = buildElementIndex(desktop, maxDepth);

  const warnings: MergeWarning[] = [];
  const elements: MatchedElement[] = [];
  const processedNames = new Set<string>();

  // Collect all disambiguation warnings
  const allDuplicateNames = new Set([
    ...mobileIndex.duplicateNames,
    ...tabletIndex.duplicateNames,
    ...desktopIndex.duplicateNames,
  ]);

  for (const name of allDuplicateNames) {
    const breakpoints: Breakpoint[] = [];
    if (mobileIndex.duplicateNames.has(name)) breakpoints.push('mobile');
    if (tabletIndex.duplicateNames.has(name)) breakpoints.push('tablet');
    if (desktopIndex.duplicateNames.has(name)) breakpoints.push('desktop');

    warnings.push({
      type: 'duplicate-layer-name',
      message: `Layer name "${name}" appears multiple times and was disambiguated`,
      elementName: name,
      breakpoints,
    });
  }

  // Get all unique names across all breakpoints
  const allNames = new Set([
    ...getDisambiguatedNames(mobileIndex),
    ...getDisambiguatedNames(tabletIndex),
    ...getDisambiguatedNames(desktopIndex),
  ]);

  // First, process elements in mobile order
  for (const node of mobileIndex.orderedNodes) {
    // Find this node's disambiguated name
    for (const [name, indexedNode] of mobileIndex.disambiguated.entries()) {
      if (indexedNode === node && !processedNames.has(name)) {
        processedNames.add(name);

        const mobileNode = mobileIndex.disambiguated.get(name);
        const tabletNode = tabletIndex.disambiguated.get(name);
        const desktopNode = desktopIndex.disambiguated.get(name);

        // Determine original name (before disambiguation suffix)
        const originalName = name.replace(/_\d+$/, '');
        const wasDisambiguated = name !== originalName || allDuplicateNames.has(name);

        elements.push({
          name,
          originalName,
          mobile: mobileNode,
          tablet: tabletNode,
          desktop: desktopNode,
          wasDisambiguated,
        });

        // Generate warning for unmatched elements
        const presence: Breakpoint[] = [];
        if (mobileNode) presence.push('mobile');
        if (tabletNode) presence.push('tablet');
        if (desktopNode) presence.push('desktop');

        if (presence.length < 3) {
          const missing = (['mobile', 'tablet', 'desktop'] as Breakpoint[])
            .filter((bp) => !presence.includes(bp));

          warnings.push({
            type: 'unmatched-element',
            message: `Element "${name}" only exists in ${presence.join(', ')} breakpoint${presence.length > 1 ? 's' : ''}, missing from ${missing.join(', ')}`,
            elementName: name,
            breakpoints: presence,
          });
        }
        break;
      }
    }
  }

  // Then, add elements that exist only in tablet or desktop
  for (const name of allNames) {
    if (!processedNames.has(name)) {
      processedNames.add(name);

      const mobileNode = mobileIndex.disambiguated.get(name);
      const tabletNode = tabletIndex.disambiguated.get(name);
      const desktopNode = desktopIndex.disambiguated.get(name);

      const originalName = name.replace(/_\d+$/, '');
      const wasDisambiguated = name !== originalName || allDuplicateNames.has(name);

      elements.push({
        name,
        originalName,
        mobile: mobileNode,
        tablet: tabletNode,
        desktop: desktopNode,
        wasDisambiguated,
      });

      // Generate warning for elements not in mobile (partial presence)
      const presence: Breakpoint[] = [];
      if (mobileNode) presence.push('mobile');
      if (tabletNode) presence.push('tablet');
      if (desktopNode) presence.push('desktop');

      if (presence.length < 3) {
        const missing = (['mobile', 'tablet', 'desktop'] as Breakpoint[])
          .filter((bp) => !presence.includes(bp));

        warnings.push({
          type: 'unmatched-element',
          message: `Element "${name}" only exists in ${presence.join(', ')} breakpoint${presence.length > 1 ? 's' : ''}, missing from ${missing.join(', ')}`,
          elementName: name,
          breakpoints: presence,
        });
      }
    }
  }

  return { elements, warnings };
}

/**
 * Match children of corresponding parent elements across breakpoints.
 * Used for recursive tree building.
 */
export function matchChildren(
  mobileParent: AltNode | undefined,
  tabletParent: AltNode | undefined,
  desktopParent: AltNode | undefined,
  maxDepth: number = 10
): MatchResult {
  const mobileChildren = mobileParent && hasChildren(mobileParent)
    ? mobileParent.children
    : [];
  const tabletChildren = tabletParent && hasChildren(tabletParent)
    ? tabletParent.children
    : [];
  const desktopChildren = desktopParent && hasChildren(desktopParent)
    ? desktopParent.children
    : [];

  const warnings: MergeWarning[] = [];
  const elements: MatchedElement[] = [];
  const processedNames = new Set<string>();

  // Build name maps for each breakpoint's children
  const mobileByName = new Map<string, AltNode>();
  const tabletByName = new Map<string, AltNode>();
  const desktopByName = new Map<string, AltNode>();

  // Track duplicates with index suffix
  const mobileNameCounts = new Map<string, number>();
  const tabletNameCounts = new Map<string, number>();
  const desktopNameCounts = new Map<string, number>();

  for (const child of mobileChildren) {
    const count = (mobileNameCounts.get(child.name) ?? 0) + 1;
    mobileNameCounts.set(child.name, count);
    const key = count === 1 ? child.name : `${child.name}_${count}`;
    mobileByName.set(key, child);
  }

  for (const child of tabletChildren) {
    const count = (tabletNameCounts.get(child.name) ?? 0) + 1;
    tabletNameCounts.set(child.name, count);
    const key = count === 1 ? child.name : `${child.name}_${count}`;
    tabletByName.set(key, child);
  }

  for (const child of desktopChildren) {
    const count = (desktopNameCounts.get(child.name) ?? 0) + 1;
    desktopNameCounts.set(child.name, count);
    const key = count === 1 ? child.name : `${child.name}_${count}`;
    desktopByName.set(key, child);
  }

  // All unique names
  const allNames = new Set([
    ...mobileByName.keys(),
    ...tabletByName.keys(),
    ...desktopByName.keys(),
  ]);

  // Process in mobile order first
  for (const [name, node] of mobileByName.entries()) {
    if (!processedNames.has(name)) {
      processedNames.add(name);

      const originalName = name.replace(/_\d+$/, '');
      const wasDisambiguated = name !== originalName;

      elements.push({
        name,
        originalName,
        mobile: node,
        tablet: tabletByName.get(name),
        desktop: desktopByName.get(name),
        wasDisambiguated,
      });
    }
  }

  // Add remaining elements from tablet and desktop
  for (const name of allNames) {
    if (!processedNames.has(name)) {
      processedNames.add(name);

      const originalName = name.replace(/_\d+$/, '');
      const wasDisambiguated = name !== originalName;

      elements.push({
        name,
        originalName,
        mobile: mobileByName.get(name),
        tablet: tabletByName.get(name),
        desktop: desktopByName.get(name),
        wasDisambiguated,
      });
    }
  }

  return { elements, warnings };
}
