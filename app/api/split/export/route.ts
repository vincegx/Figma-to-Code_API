/**
 * Split Export API Route
 *
 * POST /api/split/export
 *
 * Generates a ZIP file containing multiple React components
 * from selected nodes within a parent Figma node.
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
import { convertApiPathsToRelative, getCodeFileExtension, sanitizeComponentName, toPascalCase } from '@/lib/utils/export-utils';
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
): Promise<{ code: string; componentName: string }> {
  // Reset name counters for consistent output
  resetNameCounters();

  // Transform to AltNode
  const altNode = transformToAltNode(nodeData, 0, undefined, undefined, variables);
  if (!altNode) {
    throw new Error(`Failed to transform node: ${nodeData.name}`);
  }

  // Evaluate rules
  const { properties: resolvedProperties } = evaluateMultiFrameworkRules(
    altNode,
    rules,
    framework as FrameworkType
  );

  // Generate code
  const generator = framework === 'react-tailwind' ? generateReactTailwind : generateReactTailwindV4;
  const result = await generator(
    altNode,
    resolvedProperties,
    rules,
    framework as FrameworkType,
    undefined,
    undefined,
    rootNodeId,
    { withProps: true }
  );

  // Convert API paths to relative
  const processedCode = convertApiPathsToRelative(result.code, rootNodeId);

  const componentName = toPascalCase(sanitizeComponentName(nodeData.name));

  return {
    code: processedCode,
    componentName,
  };
}

/**
 * Collect assets (images/SVGs) from node directory
 */
async function collectAssets(nodeDirPath: string): Promise<Map<string, Buffer>> {
  const assets = new Map<string, Buffer>();

  // Get img directory
  const imgPath = path.join(nodeDirPath, 'img');
  try {
    const imgFiles = await fs.readdir(imgPath);
    for (const file of imgFiles) {
      const filePath = path.join(imgPath, file);
      const content = await fs.readFile(filePath);
      const ext = path.extname(file).toLowerCase();
      if (ext === '.svg') {
        assets.set(`shared/svg/${file}`, content);
      } else {
        assets.set(`shared/images/${file}`, content);
      }
    }
  } catch {
    // No img directory - ignore
  }

  // Get svg directory
  const svgPath = path.join(nodeDirPath, 'svg');
  try {
    const svgFiles = await fs.readdir(svgPath);
    for (const file of svgFiles) {
      const filePath = path.join(svgPath, file);
      const content = await fs.readFile(filePath);
      assets.set(`shared/svg/${file}`, content);
    }
  } catch {
    // No svg directory - ignore
  }

  return assets;
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
        );

        // Ensure unique component names
        let finalName = componentName;
        let counter = 1;
        while (componentNames.includes(finalName)) {
          finalName = `${componentName}${counter}`;
          counter++;
        }

        const filename = `${finalName}.${extension}`;

        // Add to ZIP
        zip.file(filename, code);
        componentNames.push(finalName);
        exportedFiles.push({
          filename,
          content: code,
          size: new Blob([code]).size,
        });

        console.log(`[Split Export] Generated: ${filename}`);
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

    // Generate index.ts
    const indexContent = componentNames
      .map(name => `export { ${name} } from './${name}';`)
      .join('\n') + '\n';
    zip.file('index.ts', indexContent);

    // Collect and add assets
    const nodeDirPath = getNodeDirPath(metadata.figmaNodeId);
    const assets = await collectAssets(nodeDirPath);
    for (const [assetPath, content] of assets) {
      zip.file(assetPath, content);
    }

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // Return ZIP file
    const safeName = sanitizeComponentName(metadata.name) || 'components';
    return new Response(zipBuffer, {
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
