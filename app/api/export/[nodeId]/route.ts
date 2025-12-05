/**
 * ZIP Export API Route
 * WP46: Generate ZIP package with Figma data, assets, and generated code
 *
 * GET /api/export/[nodeId]?framework=react-tailwind&language=typescript
 *
 * Returns a ZIP file containing:
 * - figma-data/: data.json, metadata.json, screenshot.png, variables.json, versions.json, history/
 * - assets/images/: PNG images
 * - assets/svg/: SVG files
 * - src/: ComponentName.tsx (or .jsx/.html) + ComponentName.css (if HTML/CSS)
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { promises as fs } from 'fs';
import path from 'path';

import { getNode } from '@/lib/utils/library-index';
import { loadNodeData, getNodeDirPath, loadVariables } from '@/lib/utils/file-storage';
import { transformToAltNode, resetNameCounters } from '@/lib/altnode-transform';
import { setCachedVariablesMap } from '@/lib/utils/variable-css';
import { evaluateMultiFrameworkRules } from '@/lib/rule-engine';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateReactTailwindV4 } from '@/lib/code-generators/react-tailwind-v4';
import { generateHTMLTailwindCSS } from '@/lib/code-generators/html-tailwind-css';
import { convertApiPathsToRelative, getCodeFileExtension, sanitizeComponentName, toPascalCase } from '@/lib/utils/export-utils';
import type { MultiFrameworkRule, FrameworkType } from '@/lib/types/rules';

interface RouteParams {
  params: {
    nodeId: string;
  };
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
          // Each file can contain an array of rules or a single rule
          if (Array.isArray(parsed)) {
            rules.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            rules.push(parsed);
          }
        } catch (e) {
          console.warn(`Failed to load rule ${entry.name}:`, e);
        }
      }
    }

    return rules;
  } catch (error) {
    console.error('Failed to load rules:', error);
    return [];
  }
}

/**
 * GET /api/export/[nodeId]
 * Generate and return a ZIP package
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { nodeId } = params;

    if (!nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing node ID' },
        { status: 400 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const framework = (searchParams.get('framework') || 'react-tailwind') as FrameworkType;
    const language = (searchParams.get('language') || 'typescript') as 'typescript' | 'javascript';

    // Validate framework
    if (!['react-tailwind', 'react-tailwind-v4', 'html-css'].includes(framework)) {
      return NextResponse.json(
        { success: false, error: 'Invalid framework' },
        { status: 400 }
      );
    }

    // Load metadata from library index
    const metadata = await getNode(nodeId);
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    // Load full node data
    const nodeData = await loadNodeData(metadata.figmaNodeId);
    if (!nodeData) {
      return NextResponse.json(
        { success: false, error: 'Node data file not found' },
        { status: 404 }
      );
    }

    // Load variables
    const variables = await loadVariables(metadata.figmaNodeId);
    if (Object.keys(variables).length > 0) {
      setCachedVariablesMap({
        // Variables from storage can have any structure - matching existing API pattern
        variables: variables as unknown as Record<string, import('@/lib/utils/variable-css').ExtractedVariable>,
        lastUpdated: new Date().toISOString(),
        version: 1
      });
    }

    // Transform to AltNode
    resetNameCounters();
    const altNode = transformToAltNode(nodeData, 0, undefined, undefined, variables);

    if (!altNode) {
      return NextResponse.json(
        { success: false, error: 'Failed to transform node' },
        { status: 500 }
      );
    }

    // Load rules and evaluate
    const rules = await loadRules();
    const { properties: resolvedProperties } = evaluateMultiFrameworkRules(altNode, rules, framework);

    // Generate code
    let codeOutput;
    if (framework === 'react-tailwind') {
      codeOutput = await generateReactTailwind(altNode, resolvedProperties, rules, framework, undefined, undefined, nodeId);
    } else if (framework === 'react-tailwind-v4') {
      codeOutput = await generateReactTailwindV4(altNode, resolvedProperties, rules, framework, undefined, undefined, nodeId);
    } else {
      codeOutput = await generateHTMLTailwindCSS(altNode, resolvedProperties, rules, framework, undefined, undefined, nodeId);
    }

    // Convert API paths to relative paths
    const processedCode = convertApiPathsToRelative(codeOutput.code, nodeId);
    const processedCss = codeOutput.css ? convertApiPathsToRelative(codeOutput.css, nodeId) : undefined;

    // Create ZIP
    const zip = new JSZip();

    // Get node directory path (use figmaNodeId from metadata, not route nodeId)
    const nodeDirPath = getNodeDirPath(metadata.figmaNodeId);
    console.log('[Export] Node dir path:', nodeDirPath);

    // Helper to convert Buffer to Uint8Array for JSZip compatibility
    const toUint8Array = (buffer: Buffer): Uint8Array => new Uint8Array(buffer);

    // Add figma-data/ files individually (data.json, metadata.json, screenshot.png, etc.)
    const figmaDataFiles = ['data.json', 'metadata.json', 'screenshot.png', 'variables.json', 'versions.json'];
    for (const fileName of figmaDataFiles) {
      const filePath = path.join(nodeDirPath, fileName);
      try {
        const content = await fs.readFile(filePath);
        zip.file(`figma-data/${fileName}`, toUint8Array(content));
        console.log('[Export] Added:', `figma-data/${fileName}`);
      } catch {
        // File doesn't exist - skip
        console.log('[Export] Skipped (not found):', filePath);
      }
    }

    // Add history/ directory if exists
    const historyPath = path.join(nodeDirPath, 'history');
    try {
      const historyEntries = await fs.readdir(historyPath, { withFileTypes: true });
      for (const entry of historyEntries) {
        if (entry.isDirectory()) {
          // Each version folder
          const versionPath = path.join(historyPath, entry.name);
          const versionFiles = await fs.readdir(versionPath);
          for (const vFile of versionFiles) {
            const content = await fs.readFile(path.join(versionPath, vFile));
            zip.file(`figma-data/history/${entry.name}/${vFile}`, toUint8Array(content));
          }
        }
      }
      console.log('[Export] Added history directory');
    } catch {
      console.log('[Export] No history directory');
    }

    // Add assets/images/ from img/
    const imgPath = path.join(nodeDirPath, 'img');
    try {
      const imgEntries = await fs.readdir(imgPath);
      for (const file of imgEntries) {
        const filePath = path.join(imgPath, file);
        const content = await fs.readFile(filePath);
        zip.file(`assets/images/${file}`, toUint8Array(content));
      }
      console.log('[Export] Added', imgEntries.length, 'images');
    } catch {
      console.log('[Export] No img directory');
    }

    // Add assets/svg/ from svg/
    const svgPath = path.join(nodeDirPath, 'svg');
    try {
      const svgEntries = await fs.readdir(svgPath);
      for (const file of svgEntries) {
        const filePath = path.join(svgPath, file);
        const content = await fs.readFile(filePath);
        zip.file(`assets/svg/${file}`, toUint8Array(content));
      }
      console.log('[Export] Added', svgEntries.length, 'SVGs');
    } catch {
      console.log('[Export] No svg directory');
    }

    // Determine component name and file extension
    const componentName = toPascalCase(sanitizeComponentName(metadata.name));
    const extension = getCodeFileExtension(framework, language);

    // Add src/ with generated code
    if (framework === 'html-css') {
      // For HTML/CSS, create a complete HTML document
      const googleFontsLink = codeOutput.googleFontsUrl
        ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="${codeOutput.googleFontsUrl}" rel="stylesheet">`
        : '';

      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.name}</title>
    ${googleFontsLink}
    <link rel="stylesheet" href="./${componentName}.css">
</head>
<body>
${processedCode}
</body>
</html>`;

      zip.file(`src/${componentName}.html`, fullHtml);

      // Add CSS file with base styles (matching LivePreview)
      const baseStyles = `/* Base styles */
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Responsive: root stretches to viewport (matches LivePreview) */
body > *:first-child {
  width: 100% !important;
  box-sizing: border-box;
}

`;
      const fullCss = baseStyles + (processedCss || '');
      zip.file(`src/${componentName}.css`, fullCss);
    } else {
      // React frameworks - just the component code
      zip.file(`src/${componentName}.${extension}`, processedCode);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Return ZIP file
    const safeName = sanitizeComponentName(metadata.name) || 'export';
    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeName}-export.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed', details: String(error) },
      { status: 500 }
    );
  }
}
