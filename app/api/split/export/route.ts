/**
 * Split Export API Route
 *
 * POST /api/split/export
 *
 * Generates a ZIP file containing multiple React components
 * from selected nodes within a parent Figma node.
 *
 * ZIP Structure (matching standard export):
 * - figma-data/: data.json, metadata.json, screenshot.png, variables.json, versions.json, history/
 * - assets/images/: PNG images
 * - assets/svg/: SVG files
 * - src/index.ts: Re-exports all components
 * - src/components/ComponentName.tsx: Individual component files
 *
 * Request body:
 * {
 *   nodeId: string,
 *   componentIds: string[],
 *   framework: 'react-tailwind' | 'react-tailwind-v4',
 *   language: 'typescript' | 'javascript'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { getNode } from '@/lib/utils/library-index';
import { loadNodeData, getNodeDirPath, loadVariables } from '@/lib/utils/file-storage';
import { transformToAltNode, resetNameCounters } from '@/lib/altnode-transform';
import { setCachedVariablesMap } from '@/lib/utils/variable-css';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateReactTailwindV4 } from '@/lib/code-generators/react-tailwind-v4';
import { getCodeFileExtension, sanitizeComponentName, toPascalCase, convertApiPathsToRelative, addViteProjectFiles } from '@/lib/utils/export-utils';
import { findNodeById, validateSelection } from '@/lib/split';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';
import type { FigmaNode } from '@/lib/types/figma';
import type { SplitFramework, ExportedFile } from '@/lib/types/split';

// ============================================================================
// Request Validation
// ============================================================================

const SplitExportSchema = z.object({
  nodeId: z.string().min(1, 'Node ID is required'),
  componentIds: z.array(z.string()).min(1, 'At least one component required').max(20, 'Maximum 20 components'),
  framework: z.enum(['react-tailwind', 'react-tailwind-v4']),
  language: z.enum(['typescript', 'javascript']).default('typescript'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert API image/SVG paths to relative paths for split export
 * Components are in src/components/, so paths need ../../assets/
 */
function convertApiPathsForSplit(code: string, nodeId: string): string {
  const escapedNodeId = nodeId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

  return code
    // /api/images/{nodeId}/{filename}.svg → ../../assets/svg/{filename}.svg
    .replace(
      new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+\\.svg)`, 'g'),
      '../../assets/svg/$1'
    )
    // /api/images/{nodeId}/{filename}.png/jpg/etc → ../../assets/images/{filename}
    .replace(
      new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../../assets/images/$1'
    )
    // /api/svg/{nodeId}/{filename} → ../../assets/svg/{filename}
    .replace(
      new RegExp(`/api/svg/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../../assets/svg/$1'
    )
    // Handle potential full URL paths
    .replace(
      new RegExp(`http[s]?://[^/]+/api/images/${escapedNodeId}/([^"'\\s]+\\.svg)`, 'g'),
      '../../assets/svg/$1'
    )
    .replace(
      new RegExp(`http[s]?://[^/]+/api/images/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../../assets/images/$1'
    )
    .replace(
      new RegExp(`http[s]?://[^/]+/api/svg/${escapedNodeId}/([^"'\\s]+)`, 'g'),
      '../../assets/svg/$1'
    );
}

/**
 * Load all rules from the rules directory
 */
async function loadRules(): Promise<MultiFrameworkRule[]> {
  try {
    const rulesPath = path.join(process.cwd(), 'figma-data', 'rules');
    const entries = await fs.readdir(rulesPath, { withFileTypes: true });
    const rules: MultiFrameworkRule[] = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const rulePath = path.join(rulesPath, entry.name);
          const content = await fs.readFile(rulePath, 'utf-8');
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            rules.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            rules.push(parsed);
          }
        } catch (e) {
          console.warn(`[Split Export] Failed to load rule ${entry.name}:`, e);
        }
      }
    }

    return rules;
  } catch {
    return [];
  }
}

/**
 * Generate code for a single component node
 */
async function generateComponentCode(
  nodeData: FigmaNode,
  variables: Record<string, unknown>,
  rules: MultiFrameworkRule[],
  framework: SplitFramework,
  rootNodeId: string,
  language: 'typescript' | 'javascript',
): Promise<{ code: string; componentName: string; googleFontsUrl?: string }> {
  resetNameCounters();

  const altNode = transformToAltNode(nodeData, 0, undefined, undefined, variables);
  if (!altNode) {
    throw new Error(`Failed to transform node: ${nodeData.name}`);
  }

  const { properties: resolvedProperties } = evaluateMultiFrameworkRules(
    altNode,
    rules,
    framework as FrameworkType
  );

  const generator = framework === 'react-tailwind' ? generateReactTailwind : generateReactTailwindV4;
  const result = await generator(
    altNode,
    resolvedProperties,
    rules,
    framework as FrameworkType,
    undefined,
    undefined,
    rootNodeId,
    { withProps: true, language }
  );

  // Use split-specific path conversion (../../assets/ instead of ../assets/)
  const processedCode = convertApiPathsForSplit(result.code, rootNodeId);
  const componentName = toPascalCase(sanitizeComponentName(nodeData.name));

  return {
    code: processedCode,
    componentName,
    googleFontsUrl: result.googleFontsUrl,
  };
}

/**
 * Generate wrapper component that assembles all split components
 * Uses stubNodes to replace detected components with <ComponentName /> references
 */
async function generateWrapperComponent(
  rootNode: FigmaNode,
  variables: Record<string, unknown>,
  rules: MultiFrameworkRule[],
  framework: SplitFramework,
  rootNodeId: string,
  pageName: string,
  stubNodes: Map<string, string>,
  language: 'typescript' | 'javascript',
): Promise<{ code: string; componentName: string; googleFontsUrl?: string }> {
  resetNameCounters();

  const altNode = transformToAltNode(rootNode, 0, undefined, undefined, variables);
  if (!altNode) {
    throw new Error(`Failed to transform root node for wrapper`);
  }

  const { properties: resolvedProperties } = evaluateMultiFrameworkRules(
    altNode,
    rules,
    framework as FrameworkType
  );

  const generator = framework === 'react-tailwind' ? generateReactTailwind : generateReactTailwindV4;
  const result = await generator(
    altNode,
    resolvedProperties,
    rules,
    framework as FrameworkType,
    undefined,
    undefined,
    rootNodeId,
    { withProps: true, stubNodes, language }
  );

  // Wrapper is in src/, so paths are ../assets/ (single level)
  const processedCode = convertApiPathsToRelative(result.code, rootNodeId);
  const componentName = toPascalCase(sanitizeComponentName(pageName));

  return {
    code: processedCode,
    componentName,
    googleFontsUrl: result.googleFontsUrl,
  };
}

/**
 * Helper to convert Buffer to Uint8Array for JSZip compatibility
 */
function toUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Add figma-data files to ZIP (same as standard export)
 */
async function addFigmaDataToZip(zip: JSZip, nodeDirPath: string): Promise<void> {
  // Core files
  const figmaDataFiles = ['data.json', 'metadata.json', 'screenshot.png', 'variables.json', 'versions.json'];
  for (const fileName of figmaDataFiles) {
    const filePath = path.join(nodeDirPath, fileName);
    try {
      const content = await fs.readFile(filePath);
      zip.file(`figma-data/${fileName}`, toUint8Array(content));
      console.log('[Split Export] Added:', `figma-data/${fileName}`);
    } catch {
      // File doesn't exist - skip
    }
  }

  // History directory
  const historyPath = path.join(nodeDirPath, 'history');
  try {
    const historyEntries = await fs.readdir(historyPath, { withFileTypes: true });
    for (const entry of historyEntries) {
      if (entry.isDirectory()) {
        const versionPath = path.join(historyPath, entry.name);
        const versionFiles = await fs.readdir(versionPath);
        for (const vFile of versionFiles) {
          const content = await fs.readFile(path.join(versionPath, vFile));
          zip.file(`figma-data/history/${entry.name}/${vFile}`, toUint8Array(content));
        }
      }
    }
    console.log('[Split Export] Added history directory');
  } catch {
    // No history directory
  }
}

/**
 * Add assets to ZIP (same structure as standard export)
 */
async function addAssetsToZip(zip: JSZip, nodeDirPath: string): Promise<void> {
  // Images from img/
  const imgPath = path.join(nodeDirPath, 'img');
  try {
    const imgEntries = await fs.readdir(imgPath);
    for (const file of imgEntries) {
      const filePath = path.join(imgPath, file);
      const content = await fs.readFile(filePath);
      const ext = path.extname(file).toLowerCase();
      if (ext === '.svg') {
        zip.file(`assets/svg/${file}`, toUint8Array(content));
      } else {
        zip.file(`assets/images/${file}`, toUint8Array(content));
      }
    }
    console.log('[Split Export] Added', imgEntries.length, 'images from img/');
  } catch {
    // No img directory
  }

  // SVGs from svg/
  const svgPath = path.join(nodeDirPath, 'svg');
  try {
    const svgEntries = await fs.readdir(svgPath);
    for (const file of svgEntries) {
      const filePath = path.join(svgPath, file);
      const content = await fs.readFile(filePath);
      zip.file(`assets/svg/${file}`, toUint8Array(content));
    }
    console.log('[Split Export] Added', svgEntries.length, 'SVGs from svg/');
  } catch {
    // No svg directory
  }
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parseResult = SplitExportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { nodeId, componentIds, framework, language } = parseResult.data;

    // Load metadata from library index
    const metadata = await getNode(nodeId);
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: 'Node not found in library' },
        { status: 404 }
      );
    }

    // Load full node data
    const rootNode = await loadNodeData(metadata.figmaNodeId) as FigmaNode | null;
    if (!rootNode) {
      return NextResponse.json(
        { success: false, error: 'Node data file not found' },
        { status: 404 }
      );
    }

    // Validate selection
    const validation = validateSelection(componentIds, rootNode);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid selection', details: validation.errors },
        { status: 400 }
      );
    }

    // Load variables
    const variables = await loadVariables(metadata.figmaNodeId);
    if (Object.keys(variables).length > 0) {
      setCachedVariablesMap({
        variables: variables as unknown as Record<string, import('@/lib/utils/variable-css').ExtractedVariable>,
        lastUpdated: new Date().toISOString(),
        version: 1,
      });
    }

    // Load rules
    const rules = await loadRules();

    // Create ZIP
    const zip = new JSZip();
    const extension = getCodeFileExtension(framework, language);
    const componentNames: string[] = [];
    const exportedFiles: ExportedFile[] = [];
    const stubNodes = new Map<string, string>(); // nodeId → componentName for wrapper

    // Generate code for each component
    for (const componentId of validation.cleanedSelection) {
      const componentNode = findNodeById(rootNode, componentId);
      if (!componentNode) {
        console.warn(`[Split Export] Component not found: ${componentId}`);
        continue;
      }

      try {
        const { code, componentName } = await generateComponentCode(
          componentNode,
          variables,
          rules,
          framework,
          nodeId,
          language,
        );

        // Ensure unique component names
        let finalName = componentName;
        let counter = 1;
        while (componentNames.includes(finalName)) {
          finalName = `${componentName}${counter}`;
          counter++;
        }

        const filename = `${finalName}.${extension}`;

        // Add to src/components/
        zip.file(`src/components/${filename}`, code);
        componentNames.push(finalName);
        stubNodes.set(componentId, finalName);
        exportedFiles.push({
          filename: `src/components/${filename}`,
          content: code,
          size: new Blob([code]).size,
        });

        console.log(`[Split Export] Generated: src/components/${filename}`);
      } catch (err) {
        console.error(`[Split Export] Failed to generate ${componentNode.name}:`, err);
      }
    }

    if (componentNames.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No components could be generated' },
        { status: 500 }
      );
    }

    // Generate wrapper component (Page.tsx/jsx) that assembles all components
    const wrapperResult = await generateWrapperComponent(
      rootNode,
      variables,
      rules,
      framework,
      nodeId,
      metadata.name,
      stubNodes,
      language,
    );
    zip.file(`src/${wrapperResult.componentName}.${extension}`, wrapperResult.code);
    console.log(`[Split Export] Generated wrapper: src/${wrapperResult.componentName}.${extension}`);

    // Add Vite project files for dev server (with Google Fonts from wrapper)
    addViteProjectFiles(zip, wrapperResult.componentName, extension, metadata.name, wrapperResult.googleFontsUrl);

    // Add figma-data/
    const nodeDirPath = getNodeDirPath(metadata.figmaNodeId);
    await addFigmaDataToZip(zip, nodeDirPath);

    // Add assets/
    await addAssetsToZip(zip, nodeDirPath);

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Return ZIP file
    const safeName = sanitizeComponentName(metadata.name) || 'components';
    return new Response(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}-components.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('[Split Export] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed', details: String(error) },
      { status: 500 }
    );
  }
}
