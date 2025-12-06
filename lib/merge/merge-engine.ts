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
  ResponsiveAssets,
  BreakpointAssets,
  Breakpoint,
  CreateMergeRequest,
  FrameworkType,
} from '../types/merge';
import { generateMergeId, saveMerge } from '../store/merge-store';
import { matchElements, matchChildren, type MatchedElement } from './element-matcher';
import { getVisibilityClasses, createPresence, hasPartialVisibility } from './visibility-mapper';
import { generateResponsiveClasses, type StyleSet, createEmptyStyleSet } from './tailwind-responsive';
import { generateMergedReactTailwind, generateMergedHTMLCSS } from './merged-code-generator';
import { transformToAltNode, resetNameCounters, type SimpleAltNode } from '../altnode-transform';
import { setCachedVariablesMap } from '../utils/variable-css';
import { cssPropToTailwind } from '../code-generators/helpers';
import { mergeSimpleAltNodes } from './merge-simple-alt-nodes';
import { generateReactTailwind } from '../code-generators/react-tailwind';
import type { MultiFrameworkRule } from '../types/rules';

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
 * Contains both raw AltNode (for matching) and SimpleAltNode (for style extraction)
 */
interface LibraryNodeData {
  readonly id: string;
  readonly name: string;
  readonly altNode: AltNode;
  readonly simpleAltNode: SimpleAltNode;
  readonly thumbnail?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const FIGMA_DATA_DIR = path.join(process.cwd(), 'figma-data');
const MAX_RECURSION_DEPTH = 10;

// WP08: Paths to rules files
const OFFICIAL_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/official-figma-rules.json');
const COMMUNITY_RULES_PATH = path.join(process.cwd(), 'figma-data/rules/community-rules.json');

/**
 * WP08: Load rules from filesystem for merge code generation
 * This ensures the merge viewer has access to the same rules as the node viewer
 */
async function loadRulesForMerge(): Promise<MultiFrameworkRule[]> {
  const allRules: MultiFrameworkRule[] = [];

  try {
    const officialContent = await fs.readFile(OFFICIAL_RULES_PATH, 'utf-8');
    const officialRules = JSON.parse(officialContent) as MultiFrameworkRule[];
    allRules.push(...officialRules);
  } catch (error) {
    console.warn('Official rules not found, continuing without them');
  }

  try {
    const communityContent = await fs.readFile(COMMUNITY_RULES_PATH, 'utf-8');
    const communityRules = JSON.parse(communityContent) as MultiFrameworkRule[];
    allRules.push(...communityRules);
  } catch (error) {
    console.warn('Community rules not found, continuing without them');
  }

  return allRules;
}

/**
 * WP08 FIX: Split Tailwind class string while preserving arbitrary values with spaces.
 * e.g., "flex bg-[var(--var, rgba(38, 38, 38, 1))]" should split to:
 * ["flex", "bg-[var(--var, rgba(38, 38, 38, 1))]"]
 */
function smartSplitTailwindClasses(classString: string): string[] {
  const trimmed = classString.trim();
  if (!trimmed) return [];

  // If no brackets, use simple split
  if (!trimmed.includes('[')) {
    return trimmed.split(/\s+/).filter((c) => c.length > 0);
  }

  // Handle arbitrary values with spaces inside brackets
  const classes: string[] = [];
  let current = '';
  let bracketDepth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (char === '[') {
      bracketDepth++;
      current += char;
    } else if (char === ']') {
      bracketDepth--;
      current += char;
    } else if (/\s/.test(char) && bracketDepth === 0) {
      // Space outside brackets - end of class
      if (current.length > 0) {
        classes.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Don't forget the last class
  if (current.length > 0) {
    classes.push(current);
  }

  return classes;
}

// ============================================================================
// Library Node Loading
// ============================================================================

/**
 * Load a LibraryNode's data from the filesystem and transform to SimpleAltNode.
 * Returns null if the node doesn't exist.
 *
 * Note: Library node IDs have format "lib-XXX-YYY" but directories are "XXX-YYY"
 *
 * WP08 FIX: Uses transformToAltNode to get SimpleAltNode with ALL styles extracted,
 * matching the behavior of /api/figma/node/[id] which produces correct renders.
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

    // WP08 FIX: Load variables for CSS variable resolution
    let variables: Record<string, unknown> | undefined;
    try {
      const variablesPath = path.join(FIGMA_DATA_DIR, dirName, 'variables.json');
      const variablesContent = await fs.readFile(variablesPath, 'utf-8');
      variables = JSON.parse(variablesContent);
    } catch {
      // variables.json is optional
    }

    // WP08 FIX: Set cached variables map BEFORE transformation
    // This allows getVariableCssNameSync to resolve variable names during transform
    if (variables && Object.keys(variables).length > 0) {
      setCachedVariablesMap({
        variables: variables as Record<string, any>,
        lastUpdated: new Date().toISOString(),
        version: 1,
      });
    }

    // Get raw AltNode for element matching
    const rawAltNode = data.altNode || data;

    // WP08 FIX: Transform raw AltNode to SimpleAltNode with full style extraction
    // This is the same transformation used by /api/figma/node/[id] which produces correct renders
    // IMPORTANT: Pass variables for correct CSS variable fallback generation
    resetNameCounters(); // Reset for each node to avoid name collisions
    const simpleAltNode = transformToAltNode(rawAltNode, 0, undefined, undefined, variables);

    // SimpleAltNode can be null if transformation fails
    if (!simpleAltNode) {
      console.warn(`Failed to transform node ${nodeId} to SimpleAltNode`);
      return null;
    }

    return {
      id: nodeId,
      name,
      altNode: rawAltNode as AltNode,
      simpleAltNode,
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
 * Build a map from AltNode ID to SimpleAltNode for style extraction.
 * Recursively traverses the SimpleAltNode tree to map all nodes by their original ID.
 */
function buildSimpleAltNodeMap(simpleNode: SimpleAltNode, map: Map<string, SimpleAltNode> = new Map()): Map<string, SimpleAltNode> {
  // Map by the node's ID (which matches the original AltNode ID)
  map.set(simpleNode.id, simpleNode);

  // Also try to map by originalNode.id if different
  if (simpleNode.originalNode?.id && simpleNode.originalNode.id !== simpleNode.id) {
    map.set(simpleNode.originalNode.id, simpleNode);
  }

  // Recursively map children
  if (simpleNode.children) {
    for (const child of simpleNode.children) {
      buildSimpleAltNodeMap(child, map);
    }
  }

  return map;
}

// Global map for current merge operation (set in executeMerge)
let currentSimpleNodeMap: Map<string, SimpleAltNode> = new Map();

/**
 * Extract Tailwind classes from an AltNode using the corresponding SimpleAltNode's styles.
 *
 * WP08 FIX: Uses SimpleAltNode.styles (extracted by altnode-transform.ts) which contains
 * ALL CSS properties, then converts them to Tailwind using cssPropToTailwind.
 * This replaces the old simplified extraction that only handled layout properties.
 */
function extractTailwindClasses(node: AltNode | undefined): string {
  if (!node) return '';

  const classes: string[] = [];

  // Try to find the corresponding SimpleAltNode with full styles
  const simpleNode = currentSimpleNodeMap.get(node.id);

  if (simpleNode && simpleNode.styles) {
    // WP08 FIX: Use the full styles from SimpleAltNode
    for (const [cssProp, cssValue] of Object.entries(simpleNode.styles)) {
      if (cssValue === undefined || cssValue === null || cssValue === '') continue;

      const tailwindClass = cssPropToTailwind(cssProp, String(cssValue));
      if (tailwindClass) {
        // WP08 FIX: Use smart split to preserve arbitrary values with spaces
        // e.g., "bg-[var(--var, rgba(38, 38, 38, 1))]" should not be split
        classes.push(...smartSplitTailwindClasses(tailwindClass));
      }
    }
  } else {
    // Fallback to basic extraction if no SimpleAltNode found
    // This shouldn't happen in normal operation but provides safety
    if (node.type === 'FRAME' && 'layout' in node) {
      const layout = (node as any).layout;
      if (layout?.layoutMode === 'HORIZONTAL') {
        classes.push('flex', 'flex-row');
      } else if (layout?.layoutMode === 'VERTICAL') {
        classes.push('flex', 'flex-col');
      }
    }

    if (node.absoluteBoundingBox) {
      const { width, height } = node.absoluteBoundingBox;
      if (width > 0) classes.push(`w-[${Math.round(width)}px]`);
      if (height > 0) classes.push(`h-[${Math.round(height)}px]`);
    }
  }

  // Deduplicate classes
  return [...new Set(classes)].join(' ');
}

/**
 * Extract assets (fills, images, SVG) from an AltNode using the corresponding SimpleAltNode.
 */
function extractBreakpointAssets(node: AltNode | undefined): BreakpointAssets | undefined {
  if (!node) return undefined;

  const simpleNode = currentSimpleNodeMap.get(node.id);
  if (!simpleNode) {
    console.log(`[DEBUG] extractBreakpointAssets: No SimpleAltNode found for AltNode id="${node.id}" name="${node.name}"`);
    console.log(`[DEBUG] Map has ${currentSimpleNodeMap.size} entries. Sample keys: ${[...currentSimpleNodeMap.keys()].slice(0, 5).join(', ')}`);
    return undefined;
  }

  // Build assets object directly with optional properties
  const fillsData = simpleNode.fillsData && simpleNode.fillsData.length > 0
    ? simpleNode.fillsData
    : undefined;

  const imageData = simpleNode.imageData
    ? {
        imageRef: simpleNode.imageData.imageRef,
        nodeId: simpleNode.imageData.nodeId,
        scaleMode: simpleNode.imageData.scaleMode || 'FILL',
      }
    : undefined;

  const svgData = simpleNode.svgData
    ? {
        fillGeometry: simpleNode.svgData.fillGeometry,
        strokeGeometry: simpleNode.svgData.strokeGeometry,
        fills: simpleNode.svgData.fills,
        strokes: simpleNode.svgData.strokes,
        strokeWeight: simpleNode.svgData.strokeWeight,
        bounds: simpleNode.svgData.bounds,
      }
    : undefined;

  // Return undefined if no assets found
  if (!fillsData && !imageData && !svgData) {
    return undefined;
  }

  return { fillsData, imageData, svgData };
}

/**
 * Build ResponsiveAssets from three breakpoints.
 * Determines if assets are uniform or differ between breakpoints.
 */
function buildResponsiveAssets(
  mobileAssets: BreakpointAssets | undefined,
  tabletAssets: BreakpointAssets | undefined,
  desktopAssets: BreakpointAssets | undefined
): ResponsiveAssets | undefined {
  // If no assets at all, return undefined
  if (!mobileAssets && !tabletAssets && !desktopAssets) {
    return undefined;
  }

  // Check if assets are uniform (same imageRef across all present breakpoints)
  const imageRefs: string[] = [];
  if (mobileAssets?.imageData?.imageRef) imageRefs.push(mobileAssets.imageData.imageRef);
  if (tabletAssets?.imageData?.imageRef) imageRefs.push(tabletAssets.imageData.imageRef);
  if (desktopAssets?.imageData?.imageRef) imageRefs.push(desktopAssets.imageData.imageRef);

  const uniqueImageRefs = new Set(imageRefs);
  const isUniform = uniqueImageRefs.size <= 1;

  return {
    mobile: mobileAssets,
    tablet: tabletAssets,
    desktop: desktopAssets,
    isUniform,
  };
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

  // Extract assets from each breakpoint
  const mobileAssets = extractBreakpointAssets(matched.mobile);
  const tabletAssets = extractBreakpointAssets(matched.tablet);
  const desktopAssets = extractBreakpointAssets(matched.desktop);
  const assets = buildResponsiveAssets(mobileAssets, tabletAssets, desktopAssets);

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
    mergedTailwindClasses: styles.combined,
    assets,
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

  // WP08 FIX: Build SimpleAltNode map for style extraction
  // This allows extractTailwindClasses to find the full styles for each AltNode
  currentSimpleNodeMap = new Map();
  if (mobileData?.simpleAltNode) {
    buildSimpleAltNodeMap(mobileData.simpleAltNode, currentSimpleNodeMap);
  }
  if (tabletData?.simpleAltNode) {
    buildSimpleAltNodeMap(tabletData.simpleAltNode, currentSimpleNodeMap);
  }
  if (desktopData?.simpleAltNode) {
    buildSimpleAltNodeMap(desktopData.simpleAltNode, currentSimpleNodeMap);
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
    mergedTailwindClasses: '',
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
  // Use the first available node ID for asset URL generation
  const nodeIdPrefix = mobileData?.id || tabletData?.id || desktopData?.id || 'unknown';

  // WP08: Load rules for code generation (same rules as node viewer)
  const allRules = await loadRulesForMerge();

  // WP08: Use mergeSimpleAltNodes + generateReactTailwind for consistent output
  // This ensures merge viewer produces identical structure to node viewer
  let generatedCode: {
    'react-tailwind': string;
    'react-tailwind-v4': string;
    'html-css': string;
  };
  let googleFontsUrl: string | undefined; // WP08: Google Fonts URL for fonts used in the design

  if (mobileData?.simpleAltNode) {
    // New approach: merge SimpleAltNodes and use the standard generator
    const { node: mergedNode } = mergeSimpleAltNodes(
      mobileData.simpleAltNode,
      tabletData?.simpleAltNode,
      desktopData?.simpleAltNode
    );

    // Generate code using the same generator as node viewer
    // WP08: Pass allRules so the generator can apply rule-based transformations
    const reactTailwindOutput = await generateReactTailwind(
      mergedNode,
      {}, // resolvedProperties (rules are evaluated internally)
      allRules, // WP08: Pass rules for proper className generation
      'react-tailwind',
      undefined, // figmaFileKey
      undefined, // figmaAccessToken
      nodeIdPrefix // nodeId for image URLs
    );

    const reactTailwindV4Output = await generateReactTailwind(
      mergedNode,
      {},
      allRules, // WP08: Pass rules for proper className generation
      'react-tailwind-v4',
      undefined,
      undefined,
      nodeIdPrefix
    );

    generatedCode = {
      'react-tailwind': reactTailwindOutput.code,
      'react-tailwind-v4': reactTailwindV4Output.code,
      'html-css': generateMergedHTMLCSS(rootElement, nodeIdPrefix).code, // Keep old for now
    };
    // WP08: Extract Google Fonts URL for MergeResult
    googleFontsUrl = reactTailwindOutput.googleFontsUrl;
  } else {
    // Fallback to old approach if no mobile SimpleAltNode
    generatedCode = {
      'react-tailwind': generateMergedReactTailwind(rootElement, nodeIdPrefix, 'react-tailwind').code,
      'react-tailwind-v4': generateMergedReactTailwind(rootElement, nodeIdPrefix, 'react-tailwind-v4').code,
      'html-css': generateMergedHTMLCSS(rootElement, nodeIdPrefix).code,
    };
  }

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
    googleFontsUrl, // WP08: Include Google Fonts URL
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
  const sourceNodesArray = await Promise.all(
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
      } as MergeSourceNode;
    })
  );
  const sourceNodes = sourceNodesArray as unknown as Merge['sourceNodes'];

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
  const sourceNodesInput = merge.sourceNodes.map((node) => ({
    breakpoint: node.breakpoint,
    nodeId: node.nodeId,
  })) as unknown as CreateMergeRequest['sourceNodes'];

  const request: CreateMergeRequest = {
    name: merge.name,
    sourceNodes: sourceNodesInput,
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
