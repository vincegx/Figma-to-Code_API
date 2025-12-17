/**
 * Merge Split Export API Route
 *
 * POST /api/merges/[id]/split/export
 *
 * Generates a ZIP file containing multiple responsive React components
 * from selected nodes within a merge's unified tree.
 *
 * ZIP Structure:
 * - figma-data/: Combined data from all 3 sources
 * - assets/images/: PNG images from all sources
 * - assets/svg/: SVG files from all sources
 * - src/components/ComponentName.tsx: Individual component files
 * - src/PageName.tsx: Wrapper component
 * - package.json, vite.config.js, etc: Vite project files
 *
 * Request body:
 * {
 *   componentIds: string[],
 *   framework: 'react-tailwind' | 'react-tailwind-v4' | 'html-css',
 *   language: 'typescript' | 'javascript'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

import { getMerge } from '@/lib/store/merge-store';
import { generateCodeForMergeNode } from '@/lib/merge/merge-engine';
import { validateSelectionUnified, findUnifiedNodeById } from '@/lib/split';
import {
  getCodeFileExtension,
  sanitizeComponentName,
  toPascalCase,
  addViteProjectFiles,
  type CustomBreakpoints,
} from '@/lib/utils/export-utils';
import type { MergeSplitFramework, ExportedFile } from '@/lib/types/split';
import type { Merge } from '@/lib/types/merge';

// ============================================================================
// Request Validation
// ============================================================================

const MergeSplitExportSchema = z.object({
  componentIds: z.array(z.string()).min(1, 'At least one component required').max(20, 'Maximum 20 components'),
  // Note: html-css not supported for split export (creates React components with imports)
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
function convertApiPathsForMergeSplit(code: string, sourceNodeIds: string[]): string {
  let processedCode = code;

  for (const nodeId of sourceNodeIds) {
    if (!nodeId) continue;
    const escapedNodeId = nodeId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    processedCode = processedCode
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
      );
  }

  return processedCode;
}

/**
 * Convert API paths for wrapper component (one level up from components)
 */
function convertApiPathsForWrapper(code: string, sourceNodeIds: string[]): string {
  let processedCode = code;

  for (const nodeId of sourceNodeIds) {
    if (!nodeId) continue;
    const escapedNodeId = nodeId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    processedCode = processedCode
      .replace(
        new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+\\.svg)`, 'g'),
        '../assets/svg/$1'
      )
      .replace(
        new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+)`, 'g'),
        '../assets/images/$1'
      )
      .replace(
        new RegExp(`/api/svg/${escapedNodeId}/([^"'\\s]+)`, 'g'),
        '../assets/svg/$1'
      );
  }

  return processedCode;
}

/**
 * Helper to convert Buffer to Uint8Array for JSZip compatibility
 */
function toUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Get directory path for a library node ID
 */
function getNodeDirPath(nodeId: string): string {
  // Remove "lib-" prefix if present
  const dirName = nodeId.startsWith('lib-') ? nodeId.slice(4) : nodeId;
  return path.join(process.cwd(), 'figma-data', dirName);
}

/**
 * Add assets from a single source node to ZIP
 */
async function addSourceAssetsToZip(zip: JSZip, nodeId: string): Promise<void> {
  const nodeDirPath = getNodeDirPath(nodeId);

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
  } catch {
    // No img directory for this source
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
  } catch {
    // No svg directory for this source
  }
}

/**
 * Add figma-data from mobile source (primary reference)
 */
async function addFigmaDataToZip(zip: JSZip, mobileNodeId: string): Promise<void> {
  const nodeDirPath = getNodeDirPath(mobileNodeId);

  // Core files
  const figmaDataFiles = ['data.json', 'metadata.json', 'screenshot.png', 'variables.json', 'versions.json'];
  for (const fileName of figmaDataFiles) {
    const filePath = path.join(nodeDirPath, fileName);
    try {
      const content = await fs.readFile(filePath);
      zip.file(`figma-data/${fileName}`, toUint8Array(content));
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
  } catch {
    // No history directory
  }
}

/**
 * Add index.ts file that re-exports all components
 */
function addIndexFile(zip: JSZip, componentNames: string[], extension: string): void {
  const isTypeScript = extension === 'tsx' || extension === 'ts';
  const componentExt = isTypeScript ? '' : '.jsx';

  const exports = componentNames
    .map(name => `export { ${name} } from './components/${name}${componentExt}';`)
    .join('\n');

  zip.file(`src/index.${isTypeScript ? 'ts' : 'js'}`, exports);
}

// ============================================================================
// Route Handler
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: mergeId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const parseResult = MergeSplitExportSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const { componentIds, framework, language } = parseResult.data;

    // Load the merge
    const merge = await getMerge(mergeId);
    if (!merge) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    if (merge.status !== 'ready' || !merge.result) {
      return NextResponse.json(
        { success: false, error: 'Merge not ready' },
        { status: 400 }
      );
    }

    // Validate selection
    const validation = validateSelectionUnified(componentIds, merge.result.unifiedTree);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid selection', details: validation.errors },
        { status: 400 }
      );
    }

    // Get source node IDs for path conversion
    const sourceNodeIds = merge.sourceNodes.map(sn => sn.nodeId);

    // Create ZIP
    const zip = new JSZip();
    const extension = getCodeFileExtension(framework, language);
    const componentNames: string[] = [];
    const exportedFiles: ExportedFile[] = [];
    const stubNodes = new Map<string, string>(); // nodeId → componentName for wrapper
    let googleFontsUrl: string | undefined;

    // Generate code for each component using generateCodeForMergeNode
    for (const componentId of validation.cleanedSelection) {
      const unifiedNode = findUnifiedNodeById(merge.result.unifiedTree, componentId);
      if (!unifiedNode) {
        console.warn(`[Merge Split Export] Component not found: ${componentId}`);
        continue;
      }

      try {
        const result = await generateCodeForMergeNode(
          merge,
          componentId,
          framework as 'react-tailwind' | 'react-tailwind-v4' | 'html-css',
          { withProps: true, language }
        );

        if (!result.code) {
          console.warn(`[Merge Split Export] No code generated for: ${componentId}`);
          continue;
        }

        // Convert API paths to relative paths
        const processedCode = convertApiPathsForMergeSplit(result.code, sourceNodeIds);
        const componentName = toPascalCase(sanitizeComponentName(unifiedNode.name));

        // Ensure unique component names
        let finalName = componentName;
        let counter = 1;
        while (componentNames.includes(finalName)) {
          finalName = `${componentName}${counter}`;
          counter++;
        }

        // If name was changed, update the code to match
        let finalCode = processedCode;
        if (finalName !== componentName) {
          finalCode = processedCode
            .replace(new RegExp(`export function ${componentName}\\(`, 'g'), `export function ${finalName}(`)
            .replace(new RegExp(`${componentName}Props`, 'g'), `${finalName}Props`);
        }

        const filename = `${finalName}.${extension}`;

        // Add to src/components/
        zip.file(`src/components/${filename}`, finalCode);
        componentNames.push(finalName);
        stubNodes.set(componentId, finalName);
        exportedFiles.push({
          filename: `src/components/${filename}`,
          content: finalCode,
          size: new Blob([finalCode]).size,
        });

        console.log(`[Merge Split Export] Generated: src/components/${filename}`);
      } catch (err) {
        console.error(`[Merge Split Export] Failed to generate ${unifiedNode.name}:`, err);
      }
    }

    if (componentNames.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No components could be generated' },
        { status: 500 }
      );
    }

    // Generate wrapper component that references all split components
    // Use the first source node (mobile) as the base library ID
    const mobileSourceNodeId = merge.sourceNodes.find(sn => sn.breakpoint === 'mobile')?.nodeId;
    if (mobileSourceNodeId) {
      try {
        const wrapperResult = await generateCodeForMergeNode(
          merge,
          mobileSourceNodeId, // Using library ID gets the root node
          framework as 'react-tailwind' | 'react-tailwind-v4' | 'html-css',
          { withProps: true, stubNodes, language }
        );

        if (wrapperResult.code) {
          // Convert paths for wrapper (one level up)
          // Note: Component imports are already added by the generator via stubNodes
          const wrapperCode = convertApiPathsForWrapper(wrapperResult.code, sourceNodeIds);

          const wrapperName = toPascalCase(sanitizeComponentName(merge.name));
          zip.file(`src/${wrapperName}.${extension}`, wrapperCode);
          console.log(`[Merge Split Export] Generated wrapper: src/${wrapperName}.${extension}`);

          googleFontsUrl = merge.result.googleFontsUrl;

          // Extract custom breakpoints from merge source nodes
          // Same logic as useMergeData.ts and generate-tailwind-css API:
          // - mobileWidth: where tablet styles (md:) start
          // - tabletWidth: where desktop styles (lg:) start
          const mobileNode = merge.sourceNodes.find(sn => sn.breakpoint === 'mobile');
          const tabletNode = merge.sourceNodes.find(sn => sn.breakpoint === 'tablet');
          const customBreakpoints: CustomBreakpoints = {
            mobileWidth: mobileNode?.width,
            tabletWidth: tabletNode?.width,
          };

          // Add Vite project files with custom breakpoints and framework
          addViteProjectFiles(zip, wrapperName, extension, merge.name, googleFontsUrl, customBreakpoints, framework);
        }
      } catch (err) {
        console.error('[Merge Split Export] Failed to generate wrapper:', err);
        // Continue without wrapper - components are still valid
      }
    }

    // Add index.ts re-export file
    addIndexFile(zip, componentNames, extension);

    // Add assets from all 3 source nodes
    for (const sourceNode of merge.sourceNodes) {
      await addSourceAssetsToZip(zip, sourceNode.nodeId);
    }

    // Add figma-data from mobile source (primary reference)
    if (mobileSourceNodeId) {
      await addFigmaDataToZip(zip, mobileSourceNodeId);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Return ZIP file
    const safeName = sanitizeComponentName(merge.name) || 'components';
    return new Response(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}-components.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('[Merge Split Export] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed', details: String(error) },
      { status: 500 }
    );
  }
}
