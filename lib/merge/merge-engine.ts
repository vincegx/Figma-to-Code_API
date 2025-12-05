/**
 * Merge Engine
 *
 * Orchestrates the full merge process from input nodes to unified result.
 * Combines 3 Figma nodes (mobile, tablet, desktop) into a single responsive component.
 *
 * Process:
 * 1. Load AltNode data for each source node from library
 * 2. Match elements across breakpoints by layer name
 * 3. Generate visibility and responsive classes for each element
 * 4. Build unified element tree
 * 5. Generate code for all frameworks
 * 6. Collect warnings and compute stats
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { AltNode, AltNodeWithChildren, AltTextNode } from '../types/altnode';
import type {
  Merge,
  MergeResult,
  MergeSourceNode,
  MergeStats,
  MergeWarning,
  UnifiedElement,
  ElementSource,
  ResponsiveStyles,
  Breakpoint,
  CreateMergeRequest,
  FrameworkType,
} from '../types/merge';
import { generateMergeId, saveMerge } from '../store/merge-store';
import { matchElements, matchChildren, type MatchedElement } from './element-matcher';
import { getVisibilityClasses, createPresence, hasPartialVisibility } from './visibility-mapper';
import { generateResponsiveClasses, type StyleSet, createEmptyStyleSet } from './tailwind-responsive';
import { generateResponsiveCode } from './responsive-code-generator';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for creating a new merge
 */
export interface MergeInput {
  readonly name: string;
  readonly sourceNodes: readonly [
    { readonly breakpoint: 'mobile'; readonly nodeId: string },
    { readonly breakpoint: 'tablet'; readonly nodeId: string },
    { readonly breakpoint: 'desktop'; readonly nodeId: string }
  ];
}

/**
 * Library node data loaded from filesystem
 */
interface LibraryNodeData {
  readonly id: string;
  readonly name: string;
  readonly altNode: AltNode;
  readonly thumbnail?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');
const MAX_RECURSION_DEPTH = 10;

// ============================================================================
// Library Node Loading
// ============================================================================

/**
 * Load a LibraryNode's AltNode data from the filesystem.
 * Returns null if the node doesn't exist.
 *
 * Note: Library node IDs have format "lib-XXX-YYY" but directories are "XXX-YYY"
 */
async function loadLibraryNode(nodeId: string): Promise<LibraryNodeData | null> {
  try {
    // Remove "lib-" prefix if present to get the directory name
    const dirName = nodeId.startsWith('lib-') ? nodeId.slice(4) : nodeId;
    const nodePath = path.join(FIGMA_DATA_DIR, dirName, 'data.json');
    const content = await fs.readFile(nodePath, 'utf-8');
    const data = JSON.parse(content);

    // Also try to load metadata for the name
    let name = data.name || nodeId;
    try {
      const metadataPath = path.join(FIGMA_DATA_DIR, dirName, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      if (metadata.name) {
        name = metadata.name;
      }
    } catch {
      // metadata.json is optional
    }

    return {
      id: nodeId,
      name,
      altNode: data.altNode || data,
      thumbnail: `/api/images/${dirName}/screenshot.png`,
    };
  } catch (error) {
    console.warn(`Failed to load node ${nodeId}:`, error);
    return null;
  }
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
 * Check if an AltNode is a text node
 */
function isTextNode(node: AltNode): node is AltTextNode {
  return node.type === 'TEXT';
}

/**
 * Generate a unique element ID from a name
 */
function generateElementId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract basic Tailwind classes from an AltNode.
 * This is a simplified version - the real implementation would use
 * the existing code generators for full class extraction.
 */
function extractTailwindClasses(node: AltNode | undefined): string {
  if (!node) return '';

  const classes: string[] = [];

  // Add basic layout classes based on node type
  if (node.type === 'FRAME' && 'layout' in node) {
    const layout = node.layout;
    if (layout.layoutMode === 'HORIZONTAL') {
      classes.push('flex', 'flex-row');
    } else if (layout.layoutMode === 'VERTICAL') {
      classes.push('flex', 'flex-col');
    }

    // Gap/spacing
    if (layout.itemSpacing > 0) {
      classes.push(`gap-${Math.round(layout.itemSpacing / 4)}`);
    }

    // Padding
    if (layout.paddingTop > 0 || layout.paddingBottom > 0 ||
        layout.paddingLeft > 0 || layout.paddingRight > 0) {
      const pt = Math.round(layout.paddingTop / 4);
      const pb = Math.round(layout.paddingBottom / 4);
      const pl = Math.round(layout.paddingLeft / 4);
      const pr = Math.round(layout.paddingRight / 4);

      if (pt === pb && pl === pr && pt === pl) {
        classes.push(`p-${pt}`);
      } else {
        if (pt === pb) classes.push(`py-${pt}`);
        else {
          if (pt > 0) classes.push(`pt-${pt}`);
          if (pb > 0) classes.push(`pb-${pb}`);
        }
        if (pl === pr) classes.push(`px-${pl}`);
        else {
          if (pl > 0) classes.push(`pl-${pl}`);
          if (pr > 0) classes.push(`pr-${pr}`);
        }
      }
    }
  }

  // Add dimension classes
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    if (width > 0) classes.push(`w-[${Math.round(width)}px]`);
    if (height > 0) classes.push(`h-[${Math.round(height)}px]`);
  }

  return classes.join(' ');
}

// ============================================================================
// Unified Element Building
// ============================================================================

/**
 * Build a UnifiedElement from a matched element.
 */
function buildUnifiedElement(
  matched: MatchedElement,
  warnings: MergeWarning[],
  depth: number = 0
): UnifiedElement {
  // Determine presence
  const presence = createPresence(
    matched.mobile !== undefined,
    matched.tablet !== undefined,
    matched.desktop !== undefined
  );

  // Get visibility classes
  const visibilityClasses = getVisibilityClasses(presence);

  // Get the primary node (prefer mobile, then tablet, then desktop)
  const primaryNode = matched.mobile ?? matched.tablet ?? matched.desktop;
  if (!primaryNode) {
    throw new Error(`No node found for element ${matched.name}`);
  }

  // Extract styles from each breakpoint
  const styleSet: StyleSet = {
    mobile: extractTailwindClasses(matched.mobile),
    tablet: extractTailwindClasses(matched.tablet),
    desktop: extractTailwindClasses(matched.desktop),
  };

  // Generate responsive classes
  const styles = generateResponsiveClasses(styleSet);

  // Check for text content mismatches
  let textContent: string | undefined;
  if (isTextNode(primaryNode)) {
    const mobileText = matched.mobile && isTextNode(matched.mobile) ? matched.mobile.characters : undefined;
    const tabletText = matched.tablet && isTextNode(matched.tablet) ? matched.tablet.characters : undefined;
    const desktopText = matched.desktop && isTextNode(matched.desktop) ? matched.desktop.characters : undefined;

    // Use mobile text as base
    textContent = mobileText ?? tabletText ?? desktopText;

    // Check for mismatches
    const texts = [mobileText, tabletText, desktopText].filter((t) => t !== undefined);
    const uniqueTexts = new Set(texts);

    if (uniqueTexts.size > 1) {
      warnings.push({
        type: 'text-content-mismatch',
        message: `Text content differs across breakpoints for "${matched.name}"`,
        elementName: matched.name,
        breakpoints: ['mobile', 'tablet', 'desktop'].filter((bp) => {
          if (bp === 'mobile') return mobileText !== undefined;
          if (bp === 'tablet') return tabletText !== undefined;
          return desktopText !== undefined;
        }) as Breakpoint[],
      });
    }
  }

  // Build source references
  const sources: UnifiedElement['sources'] = {
    mobile: matched.mobile ? { nodeId: matched.mobile.id, name: matched.mobile.name } : undefined,
    tablet: matched.tablet ? { nodeId: matched.tablet.id, name: matched.tablet.name } : undefined,
    desktop: matched.desktop ? { nodeId: matched.desktop.id, name: matched.desktop.name } : undefined,
  };

  // Build children recursively (if within depth limit)
  let children: UnifiedElement[] | undefined;

  if (depth < MAX_RECURSION_DEPTH) {
    const hasAnyChildren =
      (matched.mobile && hasChildren(matched.mobile)) ||
      (matched.tablet && hasChildren(matched.tablet)) ||
      (matched.desktop && hasChildren(matched.desktop));

    if (hasAnyChildren) {
      const childMatch = matchChildren(matched.mobile, matched.tablet, matched.desktop);
      warnings.push(...childMatch.warnings);

      children = childMatch.elements.map((childMatched) =>
        buildUnifiedElement(childMatched, warnings, depth + 1)
      );
    }
  } else {
    // Depth limit reached
    warnings.push({
      type: 'structure-mismatch',
      message: `Maximum recursion depth (${MAX_RECURSION_DEPTH}) reached for "${matched.name}"`,
      elementName: matched.name,
    });
  }

  return {
    id: generateElementId(matched.name),
    name: matched.name,
    type: primaryNode.type,
    presence,
    visibilityClasses,
    styles,
    textContent,
    children,
    sources,
  };
}

// ============================================================================
// Statistics Computation
// ============================================================================

/**
 * Count total elements in a unified tree
 */
function countElements(element: UnifiedElement): number {
  let count = 1;
  if (element.children) {
    for (const child of element.children) {
      count += countElements(child);
    }
  }
  return count;
}

/**
 * Count common elements (present in all 3 breakpoints)
 */
function countCommonElements(element: UnifiedElement): number {
  let count = 0;
  if (element.presence.mobile && element.presence.tablet && element.presence.desktop) {
    count = 1;
  }
  if (element.children) {
    for (const child of element.children) {
      count += countCommonElements(child);
    }
  }
  return count;
}

/**
 * Count unique elements per breakpoint
 */
function countUniqueElements(element: UnifiedElement): { mobile: number; tablet: number; desktop: number } {
  const counts = { mobile: 0, tablet: 0, desktop: 0 };

  // Mobile only
  if (element.presence.mobile && !element.presence.tablet && !element.presence.desktop) {
    counts.mobile++;
  }
  // Tablet only
  if (!element.presence.mobile && element.presence.tablet && !element.presence.desktop) {
    counts.tablet++;
  }
  // Desktop only
  if (!element.presence.mobile && !element.presence.tablet && element.presence.desktop) {
    counts.desktop++;
  }

  if (element.children) {
    for (const child of element.children) {
      const childCounts = countUniqueElements(child);
      counts.mobile += childCounts.mobile;
      counts.tablet += childCounts.tablet;
      counts.desktop += childCounts.desktop;
    }
  }

  return counts;
}

/**
 * Count style overrides (elements with responsive class differences)
 */
function countStyleOverrides(element: UnifiedElement): { tablet: number; desktop: number } {
  const counts = { tablet: 0, desktop: 0 };

  if (element.styles.tablet) counts.tablet++;
  if (element.styles.desktop) counts.desktop++;

  if (element.children) {
    for (const child of element.children) {
      const childCounts = countStyleOverrides(child);
      counts.tablet += childCounts.tablet;
      counts.desktop += childCounts.desktop;
    }
  }

  return counts;
}

// ============================================================================
// Main Merge Functions
// ============================================================================

/**
 * Execute a merge operation.
 * Loads nodes, matches elements, generates unified tree and code.
 */
export async function executeMerge(input: MergeInput): Promise<MergeResult> {
  const startTime = performance.now();
  const warnings: MergeWarning[] = [];

  // Find source node assignments
  const mobileInput = input.sourceNodes.find((n) => n.breakpoint === 'mobile')!;
  const tabletInput = input.sourceNodes.find((n) => n.breakpoint === 'tablet')!;
  const desktopInput = input.sourceNodes.find((n) => n.breakpoint === 'desktop')!;

  // Load nodes from library
  const [mobileData, tabletData, desktopData] = await Promise.all([
    loadLibraryNode(mobileInput.nodeId),
    loadLibraryNode(tabletInput.nodeId),
    loadLibraryNode(desktopInput.nodeId),
  ]);

  // Check for missing nodes
  if (!mobileData) {
    warnings.push({
      type: 'source-node-deleted',
      message: `Mobile source node "${mobileInput.nodeId}" not found in library`,
      breakpoints: ['mobile'],
    });
  }
  if (!tabletData) {
    warnings.push({
      type: 'source-node-deleted',
      message: `Tablet source node "${tabletInput.nodeId}" not found in library`,
      breakpoints: ['tablet'],
    });
  }
  if (!desktopData) {
    warnings.push({
      type: 'source-node-deleted',
      message: `Desktop source node "${desktopInput.nodeId}" not found in library`,
      breakpoints: ['desktop'],
    });
  }

  // Require at least one node to proceed
  const anyNode = mobileData?.altNode ?? tabletData?.altNode ?? desktopData?.altNode;
  if (!anyNode) {
    throw new Error('No source nodes could be loaded');
  }

  // Match elements across breakpoints
  const matchResult = matchElements(
    mobileData?.altNode ?? anyNode,
    tabletData?.altNode ?? anyNode,
    desktopData?.altNode ?? anyNode
  );
  warnings.push(...matchResult.warnings);

  // Build unified tree from root element
  // The root is a synthetic element containing all matched children
  const rootElement: UnifiedElement = {
    id: 'root',
    name: input.name,
    type: 'FRAME',
    presence: { mobile: true, tablet: true, desktop: true },
    visibilityClasses: '',
    styles: { base: '', combined: '' },
    children: matchResult.elements.map((matched) =>
      buildUnifiedElement(matched, warnings)
    ),
    sources: {
      mobile: mobileData ? { nodeId: mobileData.id, name: mobileData.name } : undefined,
      tablet: tabletData ? { nodeId: tabletData.id, name: tabletData.name } : undefined,
      desktop: desktopData ? { nodeId: desktopData.id, name: desktopData.name } : undefined,
    },
  };

  // Generate code for all frameworks
  const generatedCode = {
    'react-tailwind': generateResponsiveCode(rootElement, 'react-tailwind'),
    'react-tailwind-v4': generateResponsiveCode(rootElement, 'react-tailwind-v4'),
    'html-css': generateResponsiveCode(rootElement, 'html-css'),
  };

  // Compute statistics
  const endTime = performance.now();
  const stats: MergeStats = {
    totalElements: countElements(rootElement),
    commonElements: countCommonElements(rootElement),
    uniqueElements: countUniqueElements(rootElement),
    styleOverrides: countStyleOverrides(rootElement),
    warningCount: warnings.length,
    processingTimeMs: Math.round(endTime - startTime),
  };

  return {
    unifiedTree: rootElement,
    generatedCode,
    warnings,
    stats,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Create a new merge from request data.
 * Generates ID, executes merge, and saves to storage.
 */
export async function createMerge(request: CreateMergeRequest): Promise<Merge> {
  const now = new Date().toISOString();
  const id = generateMergeId();

  // Build source nodes with snapshots
  const sourceNodes: Merge['sourceNodes'] = await Promise.all(
    request.sourceNodes.map(async (input) => {
      const nodeData = await loadLibraryNode(input.nodeId);
      // Use provided width or default based on breakpoint
      const defaultWidths = { mobile: 375, tablet: 768, desktop: 1280 };
      return {
        breakpoint: input.breakpoint,
        nodeId: input.nodeId,
        nodeName: nodeData?.name ?? input.nodeId,
        thumbnail: nodeData?.thumbnail,
        width: input.width ?? defaultWidths[input.breakpoint],
        snapshotAt: now,
      };
    })
  ) as Merge['sourceNodes'];

  // Create initial merge in processing state
  let merge: Merge = {
    id,
    name: request.name,
    status: 'processing',
    sourceNodes,
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Execute the merge
    const result = await executeMerge({
      name: request.name,
      sourceNodes: request.sourceNodes,
    });

    // Update to ready state with result
    merge = {
      ...merge,
      status: 'ready',
      result,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Update to error state
    merge = {
      ...merge,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: new Date().toISOString(),
    };
  }

  // Save the merge
  await saveMerge(merge);

  return merge;
}

/**
 * Re-execute a merge (regenerate result from same sources).
 */
export async function reexecuteMerge(merge: Merge): Promise<Merge> {
  const request: CreateMergeRequest = {
    name: merge.name,
    sourceNodes: merge.sourceNodes.map((node) => ({
      breakpoint: node.breakpoint,
      nodeId: node.nodeId,
    })) as CreateMergeRequest['sourceNodes'],
  };

  try {
    const result = await executeMerge({
      name: request.name,
      sourceNodes: request.sourceNodes,
    });

    const updatedMerge: Merge = {
      ...merge,
      status: 'ready',
      result,
      error: undefined,
      updatedAt: new Date().toISOString(),
    };

    await saveMerge(updatedMerge);
    return updatedMerge;
  } catch (error) {
    const errorMerge: Merge = {
      ...merge,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: new Date().toISOString(),
    };

    await saveMerge(errorMerge);
    return errorMerge;
  }
}
