/**
 * React-Tailwind Code Generator
 *
 * Main orchestration module for generating React components with Tailwind CSS.
 * VERBATIM from react-tailwind.ts
 */

import type { SimpleAltNode, FillData } from '../../altnode-transform';
import { toPascalCase, uniquePropName } from '../helpers';
import { GeneratedCodeOutput, GeneratedAsset } from '../react';
import type { MultiFrameworkRule, FrameworkType } from '../../types/rules';
import type { CollectedProp, GenerateOptions } from '../../types/code-generator';
import { fetchFigmaImages, extractImageNodes, extractSvgContainers, fetchNodesAsSVG, generateSvgFilename } from '../../utils/image-fetcher';
import { generateCssVariableDefinitions } from '../../utils/variable-css';
import { generateTailwindJSXElement, cleanResolvedProperties } from './jsx-generator';

// Re-export for external use
export { smartSplitTailwindClasses, deduplicateTailwindClasses } from './class-processing';
export { generateTailwindJSXElement, cleanResolvedProperties } from './jsx-generator';

/**
 * WP47: Collect all text and image props from the node tree
 * Traverses the AltNode tree and collects TEXT nodes and IMAGE fills
 *
 * @param node - Root AltNode to traverse
 * @param imageUrls - Map of imageRef → URL for images
 * @param propNames - Set to track used prop names (for uniqueness)
 * @param stubNodeIds - Optional set of node IDs to skip (for split export wrapper)
 * @returns Array of collected props
 */
function collectProps(
  node: SimpleAltNode,
  imageUrls: Record<string, string>,
  propNames: Set<string>,
  stubNodeIds?: Set<string>
): CollectedProp[] {
  const props: CollectedProp[] = [];

  function traverse(n: SimpleAltNode) {
    // Skip hidden nodes
    if (n.visible === false) return;

    // Skip stubbed nodes entirely (for split export wrapper)
    if (stubNodeIds?.has(n.id)) return;

    // Collect TEXT nodes (skip very short texts like initials "D", "C", "T")
    if (n.originalType === 'TEXT') {
      const textContent = (n.originalNode as any)?.characters || '';
      const trimmed = textContent.trim();
      if (trimmed && trimmed.length > 2) {
        const propName = uniquePropName(n.name, propNames);
        props.push({
          name: propName,
          type: 'text',
          defaultValue: textContent,
          layerName: n.name,
          nodeId: n.id,
        });
      }
    }

    // Collect IMAGE fills - only simple images (no children, single fill)
    // Skip backgrounds/layered images which are rendered differently
    const hasChildren = 'children' in n && n.children && n.children.length > 0;
    if (!hasChildren) {
      if (n.fillsData && n.fillsData.length === 1) {
        const imageFill = n.fillsData.find((f: FillData) => f.type === 'IMAGE');
        if (imageFill && imageFill.imageRef) {
          const imageUrl = imageUrls[imageFill.imageRef] || '';
          if (imageUrl) {
            const propName = uniquePropName(n.name, propNames);
            props.push({
              name: propName,
              type: 'image',
              defaultValue: imageUrl,
              layerName: n.name,
              nodeId: n.id,
            });
          }
        }
      }
      // Also check imageData for backward compatibility (only if no multi-fills)
      else if (n.imageData?.imageRef && (!n.fillsData || n.fillsData.length <= 1)) {
        const imageUrl = imageUrls[n.imageData.imageRef] || '';
        if (imageUrl) {
          const propName = uniquePropName(n.name, propNames);
          props.push({
            name: propName,
            type: 'image',
            defaultValue: imageUrl,
            layerName: n.name,
            nodeId: n.id,
          });
        }
      }
    }

    // Recursively traverse children
    if ('children' in n && n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return props;
}

/**
 * WP47: Generate TypeScript Props interface
 * Groups props by type (text, then images) for better readability
 *
 * @param componentName - PascalCase component name
 * @param props - Array of collected props
 * @returns TypeScript interface string
 */
function generatePropsInterface(componentName: string, props: CollectedProp[]): string {
  if (props.length === 0) return '';

  const textProps = props.filter(p => p.type === 'text');
  const imageProps = props.filter(p => p.type === 'image');

  const lines: string[] = [];

  if (textProps.length > 0) {
    lines.push('  // Text content');
    textProps.forEach(p => lines.push(`  ${p.name}?: string;`));
  }

  if (imageProps.length > 0) {
    if (textProps.length > 0) lines.push('');
    lines.push('  // Images');
    imageProps.forEach(p => lines.push(`  ${p.name}?: string;`));
  }

  return `interface ${componentName}Props {\n${lines.join('\n')}\n}\n\n`;
}

/**
 * WP47: Generate props destructuring with default values
 * Groups props by type (text, then images) for consistency with interface
 *
 * @param componentName - PascalCase component name
 * @param props - Array of collected props
 * @returns Destructuring string for function parameters
 */
function generatePropsDestructuring(componentName: string, props: CollectedProp[], isTypeScript = true): string {
  if (props.length === 0) return '';

  const escapeValue = (value: string) => value
    .replace(/\u2028/g, '\n')   // Line Separator → real newline
    .replace(/\u2029/g, '\n')   // Paragraph Separator → real newline
    .replace(/\\/g, '\\\\')     // Escape backslashes
    .replace(/"/g, '\\"')       // Escape quotes
    .replace(/\r\n/g, '\\n')    // CRLF → \n
    .replace(/\r/g, '\\n')      // CR → \n
    .replace(/\n/g, '\\n');     // LF → \n

  const textProps = props.filter(p => p.type === 'text');
  const imageProps = props.filter(p => p.type === 'image');

  const lines: string[] = [];

  if (textProps.length > 0) {
    lines.push('  // Text content');
    textProps.forEach(p => lines.push(`  ${p.name} = "${escapeValue(p.defaultValue)}",`));
  }

  if (imageProps.length > 0) {
    if (textProps.length > 0) lines.push('');
    lines.push('  // Images');
    imageProps.forEach(p => lines.push(`  ${p.name} = "${escapeValue(p.defaultValue)}",`));
  }

  // TypeScript: add type annotation, JavaScript: omit it
  const typeAnnotation = isTypeScript ? `: ${componentName}Props` : '';
  return `{\n${lines.join('\n')}\n}${typeAnnotation}`;
}

/**
 * WP47: Create a map for JSX generation using nodeId as key (unique)
 * This allows generateTailwindJSXElement to look up if a node should use a prop
 *
 * @param props - Array of collected props
 * @returns Map of nodeId → { propName, type }
 */
function createPropLookup(props: CollectedProp[]): Map<string, { propName: string; type: 'text' | 'image' }> {
  const lookup = new Map<string, { propName: string; type: 'text' | 'image' }>();
  for (const p of props) {
    lookup.set(p.nodeId, { propName: p.name, type: p.type });
  }
  return lookup;
}

/**
 * WP31: Extract font families and their weights from node tree
 */
function extractFonts(node: SimpleAltNode): Map<string, Set<number>> {
  const fonts = new Map<string, Set<number>>();

  function traverse(n: SimpleAltNode) {
    if (n.styles?.['font-family']) {
      const fontFamily = String(n.styles['font-family']).replace(/['"]/g, '').split(',')[0].trim();
      if (fontFamily) {
        if (!fonts.has(fontFamily)) {
          fonts.set(fontFamily, new Set<number>());
        }
        const weight = parseInt(String(n.styles['font-weight'] || '400'), 10);
        fonts.get(fontFamily)!.add(weight);
      }
    }
    n.children?.forEach(traverse);
  }

  traverse(node);
  return fonts;
}

/**
 * WP31: Generate Google Fonts URL from font map with specific weights
 */
function generateGoogleFontsUrl(fonts: Map<string, Set<number>>): string | undefined {
  if (fonts.size === 0) return undefined;

  const families = Array.from(fonts.entries())
    .map(([font, weights]) => {
      const sortedWeights = Array.from(weights).sort((a, b) => a - b).join(';');
      return `family=${encodeURIComponent(font)}:wght@${sortedWeights}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * WP32: SVG export info for generating imports and assets
 */
interface SvgExportInfo {
  nodeId: string;
  varName: string;      // vector, vector2, etc.
  filename: string;     // vector.svg
  path: string;         // ./img/vector.svg
  svgContent: string;   // SVG string content
  isComplex: boolean;
}

/**
 * WP32: Generate unique variable name from node name
 * Converts "My Icon" → "myIcon", handles duplicates with suffix
 */
function generateSvgVarName(nodeName: string, usedNames: Set<string>): string {
  // Convert to camelCase: "My Icon" → "myIcon", "Vector" → "vector"
  let baseName = nodeName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Default to "vector" if empty
  if (!baseName) baseName = 'vector';

  // Find unique name with suffix if needed
  let varName = baseName;
  let counter = 2;
  while (usedNames.has(varName)) {
    varName = `${baseName}${counter}`;
    counter++;
  }

  usedNames.add(varName);
  return varName;
}

/**
 * Generate React JSX component with Tailwind CSS classes
 *
 * Output format:
 *   export function ButtonComponent() {
 *     return (
 *       <div className="flex p-4 bg-red-500 rounded-lg">
 *         <span className="text-white font-semibold">Button Text</span>
 *       </div>
 *     );
 *   }
 *
 * FigmaToCode enhancements:
 * - Arbitrary values for non-standard sizes: gap-[13px]
 * - Rotation classes: rotate-45, rotate-[47deg]
 * - Opacity conversion: 0-1 → opacity-0, opacity-25, opacity-50, opacity-75, opacity-100
 *
 * @param altNode - The AltNode tree to generate code from
 * @param resolvedProperties - CSS properties from rule evaluation
 * @param allRules - All available rules for child evaluation
 * @param framework - Target framework for code generation
 * @returns GeneratedCodeOutput object with Tailwind JSX string
 */
export async function generateReactTailwind(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind',
  figmaFileKey?: string,
  figmaAccessToken?: string,
  nodeId?: string,
  options?: GenerateOptions
): Promise<GeneratedCodeOutput> {
  const componentName = toPascalCase(altNode.name);

  // WP31: Extract fonts and generate Google Fonts URL
  const fonts = extractFonts(altNode);
  const googleFontsUrl = generateGoogleFontsUrl(fonts);

  // FIX: Clean properties to remove $value placeholders
  const cleanedProps = cleanResolvedProperties(resolvedProperties);

  // WP32: Build image URLs map
  // - For local viewer: use /api/images/{nodeId}/{filename}
  // - For export: use Figma API URLs
  let imageUrls: Record<string, string> = {};

  if (nodeId) {
    // Local viewer mode: use local API route
    // WP32: Extract real nodeId from lib-{nodeId} format
    const realNodeId = nodeId.startsWith('lib-') ? nodeId.replace('lib-', '') : nodeId;

    const imageNodes = extractImageNodes(altNode);
    for (const imgNode of imageNodes) {
      const filename = `${realNodeId}_${imgNode.imageRef.substring(0, 8)}.png`;
      imageUrls[imgNode.imageRef] = `/api/images/${nodeId}/${filename}`;
    }
  } else if (figmaFileKey && figmaAccessToken) {
    // Export mode: fetch from Figma API
    const imageNodes = extractImageNodes(altNode);
    const imageRefs = imageNodes.map(n => n.imageRef);
    if (imageRefs.length > 0) {
      imageUrls = await fetchFigmaImages(figmaFileKey, imageRefs, figmaAccessToken);
    }
  }

  // WP32: Build SVG exports with variable names for clean imports
  // Viewer mode (nodeId present) → use pre-downloaded SVGs from local API
  // Export mode (no nodeId) → use imports + separate files
  const isViewerMode = !!nodeId;
  const svgExports: SvgExportInfo[] = [];
  const svgVarNames: Record<string, string> = {}; // nodeId → varName (for export mode)
  const svgDataUrls: Record<string, string> = {}; // nodeId → data URL or local API URL (for viewer mode)
  const usedVarNames = new Set<string>();

  // WP32: SVG containers - used in BOTH modes now
  // In viewer mode: use pre-downloaded SVGs from /api/images/{nodeId}/{filename}.svg
  // In export mode: download whole container as single SVG
  // WP32: Simple SVG map - nodeId → bounds (from Figma API export)
  const svgBoundsMap: Map<string, { width: number; height: number }> = new Map();

  // WP32: Extract all nodes to export as SVG (VECTORs + multi-VECTOR containers)
  const svgNodes = extractSvgContainers(altNode);

  // Build bounds map
  for (const svgNode of svgNodes) {
    svgBoundsMap.set(svgNode.nodeId, svgNode.bounds);
  }

  if (isViewerMode && svgNodes.length > 0) {
    // WP32: Viewer mode - use pre-downloaded SVGs from local API
    for (const svgNode of svgNodes) {
      const filename = generateSvgFilename(svgNode.name, svgNode.nodeId);
      svgDataUrls[svgNode.nodeId] = `/api/images/${nodeId}/${filename}`;
    }
  } else if (!isViewerMode && svgNodes.length > 0) {
    // WP32: Export mode - fetch from Figma API
    let svgContent: Record<string, string> = {};
    if (figmaFileKey && figmaAccessToken) {
      const nodeIds = svgNodes.map(n => n.nodeId);
      svgContent = await fetchNodesAsSVG(figmaFileKey, nodeIds, figmaAccessToken);
    }

    for (const svgNode of svgNodes) {
      const varName = generateSvgVarName(svgNode.name || 'svg', usedVarNames);
      const filename = `${varName}.svg`;
      const path = `./img/${filename}`;
      const content = svgContent[svgNode.nodeId] || `<svg xmlns="http://www.w3.org/2000/svg"><text y="20">Missing SVG</text></svg>`;

      svgExports.push({
        nodeId: svgNode.nodeId,
        varName,
        filename,
        path,
        svgContent: content,
        isComplex: true,
      });
      svgVarNames[svgNode.nodeId] = varName;
    }
  }

  // Generate SVG imports (export mode only)
  const svgImports = !isViewerMode && svgExports.length > 0
    ? svgExports.map(svg => `import ${svg.varName} from "${svg.path}";`).join('\n')
    : '';

  // Generate assets for export (export mode only)
  const assets: GeneratedAsset[] = !isViewerMode
    ? svgExports.map(svg => ({
        filename: svg.filename,
        path: svg.path,
        content: svg.svgContent,
        type: 'svg' as const,
      }))
    : [];

  // WP32: Pass appropriate map based on mode
  const svgMap = isViewerMode ? svgDataUrls : svgVarNames;

  // Split export: extract stubNodes from options
  const stubNodes = options?.stubNodes || new Map<string, string>();
  const stubNodeIds = stubNodes.size > 0 ? new Set(stubNodes.keys()) : undefined;

  // WP47: Collect props if withProps is enabled (skip stubbed nodes)
  const propNames = new Set<string>();
  const collectedProps = options?.withProps
    ? collectProps(altNode, imageUrls, propNames, stubNodeIds)
    : [];
  const propLookup = options?.withProps
    ? createPropLookup(collectedProps)
    : new Map();

  // Generate JSX (with prop lookup for withProps mode, and stubs for split export)
  const jsx = generateTailwindJSXElement(
    altNode,
    cleanedProps,
    0,
    allRules,
    framework,
    imageUrls,
    svgMap,
    isViewerMode,
    svgBoundsMap,
    undefined,
    false,
    propLookup,
    stubNodes
  );

  // WP31: Generate CSS variable definitions for React-Tailwind
  const cssVariables = generateCssVariableDefinitions();

  // Build style tag with CSS variables (if any)
  const styleTag = cssVariables
    ? `      <style dangerouslySetInnerHTML={{ __html: \`${cssVariables}\` }} />\n`
    : '';

  // Split export: Generate imports for stubbed components
  const stubImports = stubNodes.size > 0
    ? Array.from(stubNodes.values())
        .map(compName => `import { ${compName} } from './components/${compName}';`)
        .join('\n')
    : '';

  // WP47: Build code with props interface if enabled
  const allImports = [svgImports, stubImports].filter(Boolean).join('\n');
  const importSection = allImports ? `${allImports}\n\n` : '';

  let code: string;
  const isTypeScript = options?.language !== 'javascript';
  if (options?.withProps && collectedProps.length > 0) {
    const propsInterface = isTypeScript ? generatePropsInterface(componentName, collectedProps) : '';
    const propsDestructuring = generatePropsDestructuring(componentName, collectedProps, isTypeScript);
    code = `${importSection}${propsInterface}export function ${componentName}(${propsDestructuring}) {
  return (
    <>
${styleTag}${jsx}    </>
  );
}`;
  } else {
    code = `${importSection}export function ${componentName}() {
  return (
    <>
${styleTag}${jsx}    </>
  );
}`;
  }

  return {
    code,
    format: 'react-tailwind',
    language: 'tsx',
    metadata: {
      componentName,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
    assets: assets.length > 0 ? assets : undefined,
    googleFontsUrl,
  };
}
