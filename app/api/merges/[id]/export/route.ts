/**
 * Merge Export API Route
 *
 * GET /api/merges/[id]/export?framework=react-tailwind&format=json
 * Returns generated code for the specified framework.
 *
 * GET /api/merges/[id]/export?framework=react-tailwind&format=zip&language=typescript
 * Returns a ZIP package with code, assets, and project files.
 *
 * Query parameters:
 * - framework: Required. One of: react-tailwind, react-tailwind-v4, html-css
 * - format: Optional. 'json' (default) or 'zip'
 * - language: Optional. 'typescript' (default) or 'javascript' (for React ZIP exports)
 *
 * JSON Response:
 * {
 *   "success": true,
 *   "code": "export function Component() { ... }",
 *   "framework": "react-tailwind",
 *   "filename": "hero-section.tsx"
 * }
 *
 * ZIP Response:
 * - figma-data/: Combined data from mobile source
 * - assets/images/: PNG images from all sources
 * - assets/svg/: SVG files from all sources
 * - src/ComponentName.tsx: Component code (React) or ComponentName.html + ComponentName.css (HTML)
 * - package.json, vite.config.js, etc: Vite project files (React only)
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';
import { getMerge } from '@/lib/store/merge-store';
import { generateCodeForMergeNode } from '@/lib/merge/merge-engine';
import {
  convertApiPathsToRelative,
  getCodeFileExtension,
  sanitizeComponentName,
  toPascalCase,
  addViteProjectFiles,
  extractExportedComponentName,
  type CustomBreakpoints,
} from '@/lib/utils/export-utils';
import type { FrameworkType, Merge } from '@/lib/types/merge';

// ============================================================================
// Helper Functions for ZIP Export
// ============================================================================

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
 * Convert API image/SVG paths to relative paths for all source nodes
 * Assets are in ../assets/, so paths are relative to src/
 */
function convertApiPathsForAllSources(code: string, sourceNodeIds: string[]): string {
  let processedCode = code;

  for (const nodeId of sourceNodeIds) {
    if (!nodeId) continue;
    const escapedNodeId = nodeId.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

    processedCode = processedCode
      // /api/images/{nodeId}/{filename}.svg → ../assets/svg/{filename}.svg
      .replace(
        new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+\\.svg)`, 'g'),
        '../assets/svg/$1'
      )
      // /api/images/{nodeId}/{filename}.png/jpg/etc → ../assets/images/{filename}
      .replace(
        new RegExp(`/api/images/${escapedNodeId}/([^"'\\s]+)`, 'g'),
        '../assets/images/$1'
      )
      // /api/svg/{nodeId}/{filename} → ../assets/svg/{filename}
      .replace(
        new RegExp(`/api/svg/${escapedNodeId}/([^"'\\s]+)`, 'g'),
        '../assets/svg/$1'
      );
  }

  return processedCode;
}

// ============================================================================
// Route Types and Constants
// ============================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_FRAMEWORKS: FrameworkType[] = ['react-tailwind', 'react-tailwind-v4', 'html-css'];

/**
 * Generate filename from merge name and framework
 */
function getFilename(name: string, framework: FrameworkType): string {
  // Convert to kebab-case
  const baseName = name
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();

  switch (framework) {
    case 'react-tailwind':
    case 'react-tailwind-v4':
      return `${baseName}.tsx`;
    case 'html-css':
      return `${baseName}.html`;
    default:
      return `${baseName}.txt`;
  }
}

/**
 * Get MIME type for framework
 */
function getMimeType(framework: FrameworkType): string {
  switch (framework) {
    case 'react-tailwind':
    case 'react-tailwind-v4':
      return 'text/typescript';
    case 'html-css':
      return 'text/html';
    default:
      return 'text/plain';
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const framework = searchParams.get('framework') as FrameworkType | null;

    // Validate framework parameter
    if (!framework) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing framework parameter. Use: react-tailwind, react-tailwind-v4, or html-css',
        },
        { status: 400 }
      );
    }

    if (!VALID_FRAMEWORKS.includes(framework)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid framework "${framework}". Valid options: ${VALID_FRAMEWORKS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Fetch merge
    const merge = await getMerge(id);

    if (!merge) {
      return NextResponse.json(
        { success: false, error: 'Merge not found' },
        { status: 404 }
      );
    }

    // Check merge is ready
    if (merge.status !== 'ready') {
      return NextResponse.json(
        {
          success: false,
          error: `Merge is not ready for export (status: ${merge.status})`,
        },
        { status: 400 }
      );
    }

    if (!merge.result) {
      return NextResponse.json(
        { success: false, error: 'Merge result not available' },
        { status: 400 }
      );
    }

    // Get format parameter (json or zip)
    const format = searchParams.get('format') || 'json';
    const language = (searchParams.get('language') || 'typescript') as 'typescript' | 'javascript';

    // Get generated code
    const code = merge.result.generatedCode[framework];
    const filename = getFilename(merge.name, framework);
    const mimeType = getMimeType(framework);

    // Handle ZIP format
    if (format === 'zip') {
      const zip = new JSZip();
      const sourceNodeIds = merge.sourceNodes.map(sn => sn.nodeId);
      const componentName = toPascalCase(sanitizeComponentName(merge.name));
      const extension = getCodeFileExtension(framework, language);

      // Convert API paths to relative paths for all source nodes
      const processedCode = convertApiPathsForAllSources(code, sourceNodeIds);

      // Get custom breakpoints from merge source nodes
      const mobileNode = merge.sourceNodes.find(sn => sn.breakpoint === 'mobile');
      const tabletNode = merge.sourceNodes.find(sn => sn.breakpoint === 'tablet');
      const customBreakpoints: CustomBreakpoints = {
        mobileWidth: mobileNode?.width,
        tabletWidth: tabletNode?.width,
      };

      // Framework-specific handling
      if (framework === 'html-css') {
        // For HTML/CSS: Regenerate code to get CSS output
        const mobileSourceNodeId = merge.sourceNodes.find(sn => sn.breakpoint === 'mobile')?.nodeId;
        if (!mobileSourceNodeId) {
          return NextResponse.json(
            { success: false, error: 'Mobile source node not found' },
            { status: 400 }
          );
        }

        // Generate fresh code with CSS
        const htmlCssResult = await generateCodeForMergeNode(
          merge,
          mobileSourceNodeId,
          'html-css'
        );

        // Convert API paths to relative
        const htmlCode = convertApiPathsForAllSources(htmlCssResult.code, sourceNodeIds);
        const cssCode = htmlCssResult.css ? convertApiPathsForAllSources(htmlCssResult.css, sourceNodeIds) : '';

        // Google Fonts link
        const googleFontsLink = merge.result.googleFontsUrl
          ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="${merge.result.googleFontsUrl}" rel="stylesheet">`
          : '';

        // Create complete HTML document (no Tailwind CDN - CSS is compiled)
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${merge.name}</title>
    ${googleFontsLink}
    <link rel="stylesheet" href="./${componentName}.css">
</head>
<body>
${htmlCode}
</body>
</html>`;

        zip.file(`src/${componentName}.html`, fullHtml);

        // Add CSS file with base styles + generated CSS
        const baseStyles = `/* Base styles */
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Responsive: root stretches to viewport */
body > *:first-child {
  width: 100% !important;
  box-sizing: border-box;
}

`;
        const fullCss = baseStyles + cssCode;
        zip.file(`src/${componentName}.css`, fullCss);
      } else {
        // React frameworks - component code + Vite project
        zip.file(`src/${componentName}.${extension}`, processedCode);

        // Extract the actual exported component name from the generated code
        const exportedName = extractExportedComponentName(processedCode);

        // Add Vite project files with custom breakpoints and framework
        addViteProjectFiles(
          zip,
          componentName,
          extension,
          merge.name,
          merge.result.googleFontsUrl,
          customBreakpoints,
          framework as 'react-tailwind' | 'react-tailwind-v4',
          exportedName || undefined
        );
      }

      // Add assets from all source nodes
      for (const sourceNode of merge.sourceNodes) {
        await addSourceAssetsToZip(zip, sourceNode.nodeId);
      }

      // Add figma-data from mobile source (primary reference)
      const mobileSourceNodeId = merge.sourceNodes.find(sn => sn.breakpoint === 'mobile')?.nodeId;
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
      const safeName = sanitizeComponentName(merge.name) || 'merge-export';
      return new Response(zipBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${safeName}-export.zip"`,
          'Content-Length': zipBuffer.length.toString(),
        },
      });
    }

    // Check if download is requested (for JSON format)
    const download = searchParams.get('download') === 'true';

    if (download) {
      // Return as file download
      return new NextResponse(code, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Return as JSON
    return NextResponse.json({
      success: true,
      code,
      framework,
      filename,
      mimeType,
    });
  } catch (error) {
    console.error('Export error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export merge',
      },
      { status: 500 }
    );
  }
}
