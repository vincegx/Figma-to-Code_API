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
import type {
  Merge,
  MergeResult,
  MergeSourceNode,
  MergeStats,
  MergeWarning,
  UnifiedElement,
  CreateMergeRequest,
} from '../types/merge';
import { generateMergeId, saveMerge } from '../store/merge-store';
import { mergeSimpleAltNodes, toUnifiedElement } from './alt-nodes';
import { transformToAltNode, resetNameCounters, type SimpleAltNode } from '../altnode-transform';
import { setCachedVariablesMap } from '../utils/variable-css';
import { generateReactTailwind } from '../code-generators/react-tailwind';
import { generateHTMLTailwindCSS } from '../code-generators/html-tailwind-css';
import type { MultiFrameworkRule } from '../types/rules';
import type { AltNode } from '../types/altnode';

// ============================================================================
// Types
// ============================================================================

/**
 * Input for creating a new merge
 */
export interface MergeInput {
  readonly name: string;
  readonly sourceNodes: readonly [
    { readonly breakpoint: 'mobile'; readonly nodeId: string; readonly width?: number },
    { readonly breakpoint: 'tablet'; readonly nodeId: string; readonly width?: number },
    { readonly breakpoint: 'desktop'; readonly nodeId: string; readonly width?: number }
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
 * Loads nodes, merges them, generates unified tree and code.
 *
 * New simplified flow:
 * 1. Load SimpleAltNodes for each breakpoint
 * 2. Merge using mergeSimpleAltNodes (matching + style diff in one pass)
 * 3. Convert to UnifiedElement for stats/UI
 * 4. Generate code using generateReactTailwind
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

  // Require at least mobile node to proceed
  if (!mobileData?.simpleAltNode) {
    throw new Error('Mobile source node is required for merge');
  }

  // Merge the 3 SimpleAltNodes into one with responsive styles
  const sourceNodeIds = {
    mobile: mobileData?.id || '',
    tablet: tabletData?.id || '',
    desktop: desktopData?.id || '',
  };
  const { node: mergedNode, warnings: mergeWarnings } = mergeSimpleAltNodes(
    mobileData.simpleAltNode,
    tabletData?.simpleAltNode,
    desktopData?.simpleAltNode,
    sourceNodeIds
  );

  // Add merge warnings
  for (const w of mergeWarnings) {
    warnings.push({
      type: 'structure-mismatch',
      message: w,
    });
  }

  // Convert merged node to UnifiedElement for stats and UI
  const unifiedTree = toUnifiedElement(mergedNode);

  // Wrap in root element with merge metadata
  // Inherit layout properties from the merged tree root
  const rootElement: UnifiedElement = {
    id: 'root',
    name: input.name,
    type: unifiedTree.type || 'FRAME',
    layoutMode: unifiedTree.layoutMode,
    layoutWrap: unifiedTree.layoutWrap,
    primaryAxisAlignItems: unifiedTree.primaryAxisAlignItems,
    originalType: unifiedTree.originalType,
    presence: { mobile: true, tablet: true, desktop: true },
    visibilityClasses: '',
    styles: unifiedTree.styles || { base: '', combined: '' },
    mergedTailwindClasses: unifiedTree.mergedTailwindClasses || '',
    children: unifiedTree.children ? [...unifiedTree.children] : [unifiedTree],
    sources: {
      mobile: mobileData ? { nodeId: mobileData.id, name: mobileData.name } : undefined,
      tablet: tabletData ? { nodeId: tabletData.id, name: tabletData.name } : undefined,
      desktop: desktopData ? { nodeId: desktopData.id, name: desktopData.name } : undefined,
    },
  };

  // Generate code for all frameworks
  // Use first VISIBLE node for asset URL generation (matches merge base logic)
  const mobileVisible = mobileData?.simpleAltNode?.visible !== false;
  const tabletVisible = tabletData?.simpleAltNode?.visible !== false;
  const nodeIdPrefix = (mobileVisible && mobileData?.id)
    || (tabletVisible && tabletData?.id)
    || desktopData?.id
    || 'unknown';

  // Load rules for code generation (same rules as node viewer)
  const allRules = await loadRulesForMerge();

  // Generate code using the merged node
  const reactTailwindOutput = await generateReactTailwind(
    mergedNode,
    {}, // resolvedProperties (rules are evaluated internally)
    allRules,
    'react-tailwind',
    undefined, // figmaFileKey
    undefined, // figmaAccessToken
    nodeIdPrefix // nodeId for image URLs
  );

  const reactTailwindV4Output = await generateReactTailwind(
    mergedNode,
    {},
    allRules,
    'react-tailwind-v4',
    undefined,
    undefined,
    nodeIdPrefix
  );

  // Extract custom breakpoints from input widths (for HTML/CSS generation)
  const mobileWidth = mobileInput.width || 420;
  const tabletWidth = tabletInput.width || 960;
  const customBreakpoints = {
    mobileWidth,
    tabletWidth,
  };

  const htmlCssOutput = await generateHTMLTailwindCSS(
    mergedNode,
    {},
    allRules,
    'html-css',
    undefined,
    undefined,
    nodeIdPrefix,
    customBreakpoints
  );

  const generatedCode = {
    'react-tailwind': reactTailwindOutput.code,
    'react-tailwind-v4': reactTailwindV4Output.code,
    'html-css': htmlCssOutput.code + (htmlCssOutput.css ? '\n/* CSS */\n' + htmlCssOutput.css : ''),
  };

  const googleFontsUrl = reactTailwindOutput.googleFontsUrl;

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
 * Generate code for a specific node in a merge.
 * Re-executes merge to get the merged SimpleAltNode tree, finds the subtree, and generates code.
 */
export async function generateCodeForMergeNode(
  merge: Merge,
  nodeId: string,
  framework: 'react-tailwind' | 'react-tailwind-v4' | 'html-css' = 'react-tailwind',
  options?: { withProps?: boolean; stubNodes?: Map<string, string>; language?: 'typescript' | 'javascript' }
): Promise<{ altNode: SimpleAltNode | null; code: string; css?: string }> {
  // Re-execute merge to get mergedNode
  const sourceNodesInput = merge.sourceNodes.map((node) => ({
    breakpoint: node.breakpoint,
    nodeId: node.nodeId,
  })) as unknown as CreateMergeRequest['sourceNodes'];

  // Find source node assignments
  const mobileInput = sourceNodesInput.find((n) => n.breakpoint === 'mobile')!;
  const tabletInput = sourceNodesInput.find((n) => n.breakpoint === 'tablet')!;
  const desktopInput = sourceNodesInput.find((n) => n.breakpoint === 'desktop')!;

  // Load nodes from library
  const [mobileData, tabletData, desktopData] = await Promise.all([
    loadLibraryNode(mobileInput.nodeId),
    loadLibraryNode(tabletInput.nodeId),
    loadLibraryNode(desktopInput.nodeId),
  ]);

  if (!mobileData?.simpleAltNode) {
    return { altNode: null, code: '// Mobile source node not found' };
  }

  // Merge the 3 SimpleAltNodes
  const sourceNodeIds = {
    mobile: mobileData?.id || '',
    tablet: tabletData?.id || '',
    desktop: desktopData?.id || '',
  };
  const { node: mergedNode } = mergeSimpleAltNodes(
    mobileData.simpleAltNode,
    tabletData?.simpleAltNode,
    desktopData?.simpleAltNode,
    sourceNodeIds
  );

  // Find the subtree by nodeId (search by Figma node ID in the merged tree)
  function findNodeById(node: SimpleAltNode, targetId: string): SimpleAltNode | null {
    if (node.id === targetId) return node;
    for (const child of node.children || []) {
      const found = findNodeById(child, targetId);
      if (found) return found;
    }
    return null;
  }

  // If nodeId matches a library ID (lib-*), use the root mergedNode
  const isLibraryId = nodeId.startsWith('lib-');
  let targetNode = isLibraryId ? mergedNode : findNodeById(mergedNode, nodeId);

  if (!targetNode) {
    return { altNode: null, code: `// Node ${nodeId} not found in merged tree` };
  }

  // For root node (library ID), use the merge name instead of source node name
  if (isLibraryId) {
    targetNode = { ...targetNode, name: merge.name };
  }

  // Load rules and generate code
  const allRules = await loadRulesForMerge();
  const nodeIdPrefix = mobileData?.id || 'unknown';

  if (framework === 'html-css') {
    // Note: HTML-CSS generator doesn't support stubNodes yet
    const output = await generateHTMLTailwindCSS(
      targetNode,
      {},
      allRules,
      'html-css',
      undefined,
      undefined,
      nodeIdPrefix
    );
    return {
      altNode: targetNode,
      code: output.code,
      css: output.css,
    };
  }

  const output = await generateReactTailwind(
    targetNode,
    {},
    allRules,
    framework,
    undefined,
    undefined,
    nodeIdPrefix,
    { withProps: options?.withProps, stubNodes: options?.stubNodes, language: options?.language }
  );

  return {
    altNode: targetNode,
    code: output.code,
    css: output.css,
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
  // Include widths in source nodes input for proper breakpoint handling
  const sourceNodesInput = merge.sourceNodes.map((node) => ({
    breakpoint: node.breakpoint,
    nodeId: node.nodeId,
    width: node.width,
  })) as unknown as MergeInput['sourceNodes'];

  try {
    const result = await executeMerge({
      name: merge.name,
      sourceNodes: sourceNodesInput,
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
