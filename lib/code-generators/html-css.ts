import type { SimpleAltNode, FillData } from '../altnode-transform';
import { toKebabCase, toPascalCase, extractTextContent, extractComponentDataAttributes, scaleModeToObjectFit } from './helpers';
import { GeneratedCodeOutput, GeneratedAsset } from './react';
import type { MultiFrameworkRule, FrameworkType } from '../types/rules';
import { evaluateMultiFrameworkRules } from '../rule-engine';
import { vectorToDataURL } from '../utils/svg-converter';
import { fetchFigmaImages, extractImageNodes, extractSvgContainers, fetchNodesAsSVG, generateSvgFilename } from '../utils/image-fetcher';
import { generateCssVariableDefinitions } from '../utils/variable-css';

/**
 * WP32: SVG export info for generating assets
 */
interface SvgExportInfo {
  nodeId: string;
  varName: string;
  filename: string;
  path: string;
  svgContent: string;
}

/**
 * WP32: Generate unique variable name from node name
 */
function generateSvgVarName(nodeName: string, usedNames: Set<string>): string {
  let baseName = nodeName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  if (!baseName) baseName = 'vector';

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
 * WP32: Convert FillData gradient to CSS gradient string
 * Applies fill opacity to gradient stop colors (like MCP does)
 */
function fillDataToGradientCSS(fill: FillData): string {
  if (!fill.gradientStops) return '';

  // WP32: Apply fill opacity to each stop's alpha
  const fillOpacity = fill.opacity ?? 1;

  const stops = fill.gradientStops
    .map(stop => {
      const { r, g, b, a = 1 } = stop.color;
      // Multiply color alpha by fill opacity
      const finalAlpha = a * fillOpacity;
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha}) ${Math.round(stop.position * 100)}%`;
    })
    .join(', ');

  // Calculate angle from gradient handles if available
  let angle = 180; // Default: top to bottom
  if (fill.gradientHandlePositions && fill.gradientHandlePositions.length >= 2) {
    const [start, end] = fill.gradientHandlePositions;
    angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90);
  }

  if (fill.type === 'GRADIENT_RADIAL') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * WP32: Convert FillData solid color to CSS rgba string
 * Applies fill opacity to color alpha (like MCP does)
 */
function fillDataToColorCSS(fill: FillData): string {
  if (!fill.color) return '';
  const { r, g, b, a = 1 } = fill.color;
  // WP32: Multiply color alpha by fill opacity
  const fillOpacity = fill.opacity ?? 1;
  const finalAlpha = a * fillOpacity;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha})`;
}

/**
 * Filter out properties with unresolved variables or empty values
 * @param props - Raw resolved properties from rule evaluation
 * @returns Cleaned properties without $value placeholders
 */
function cleanResolvedProperties(props: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    // Ensure value is a string
    const stringValue = String(value);

    // Skip properties with unresolved variables
    if (stringValue.includes('$value') || stringValue.includes('${')) {
      continue;
    }
    // Skip empty values
    if (!stringValue || stringValue.trim() === '') {
      continue;
    }
    cleaned[key] = stringValue;
  }

  return cleaned;
}

/**
 * Generate HTML with separate CSS file
 *
 * Output format:
 *   HTML file:
 *     <div class="button-component">
 *       <span class="button-text">Click me</span>
 *     </div>
 *
 *   CSS file:
 *     .button-component {
 *       display: flex;
 *       padding: 16px;
 *       background-color: #FF0000;
 *       border-radius: 8px;
 *     }
 *
 * @param altNode - The AltNode tree to generate code from
 * @param resolvedProperties - CSS properties from rule evaluation
 * @param allRules - All available rules for child evaluation
 * @param framework - Target framework for code generation
 * @returns GeneratedCodeOutput object with HTML and CSS strings
 */
export async function generateHTMLCSS(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'html-css',
  figmaFileKey?: string,
  figmaAccessToken?: string,
  nodeId?: string
): Promise<GeneratedCodeOutput> {
  const className = toKebabCase(altNode.name);
  const cssRules: Array<{ selector: string; properties: Record<string, string> }> = [];

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
    console.log(`✅ Using ${Object.keys(imageUrls).length} local image paths`);
  } else if (figmaFileKey && figmaAccessToken) {
    // Export mode: fetch from Figma API
    const imageNodes = extractImageNodes(altNode);
    const imageRefs = imageNodes.map(n => n.imageRef);
    if (imageRefs.length > 0) {
      imageUrls = await fetchFigmaImages(figmaFileKey, imageRefs, figmaAccessToken);
      console.log(`✅ Fetched ${Object.keys(imageUrls).length} image URLs from Figma API`);
    }
  }

  // WP32: Build SVG exports
  // Viewer mode (nodeId present) → use pre-downloaded SVGs from local API (NO API CALLS!)
  // Export mode (no nodeId) → use file paths (./img/vector.svg)
  const isViewerMode = !!nodeId;
  const svgExports: SvgExportInfo[] = [];
  const svgDataUrls: Record<string, string> = {}; // nodeId → data URL or file path
  const usedVarNames = new Set<string>();

  // WP32: SVG containers - used in BOTH modes now
  // In viewer mode: use pre-downloaded SVGs from /api/images/{nodeId}/{filename}.svg
  // In export mode: download whole container as single SVG
  // WP32: Simple SVG map - nodeId → bounds
  const svgBoundsMap: Map<string, { width: number; height: number }> = new Map();

  // WP32: Extract all nodes to export as SVG (VECTORs + multi-VECTOR containers)
  const svgContainers = extractSvgContainers(altNode);

  // Build bounds map
  for (const container of svgContainers) {
    svgBoundsMap.set(container.nodeId, container.bounds);
  }

  if (isViewerMode && svgContainers.length > 0) {
    // WP32: Viewer mode - use pre-downloaded SVGs from local API (NO API CALLS!)
    for (const container of svgContainers) {
      // Generate unique filename same way as import route (name + nodeId)
      const filename = generateSvgFilename(container.name, container.nodeId);
      // Use local API route to serve pre-downloaded SVG
      svgDataUrls[container.nodeId] = `/api/images/${nodeId}/${filename}`;
    }
    console.log(`✅ Using ${Object.keys(svgDataUrls).length} local SVG paths for viewer`);
  } else if (!isViewerMode && svgContainers.length > 0) {
    // WP32: Export mode - fetch from Figma API (only at export time)
    let containerSvgContent: Record<string, string> = {};
    if (figmaFileKey && figmaAccessToken) {
      const containerIds = svgContainers.map(c => c.nodeId);
      containerSvgContent = await fetchNodesAsSVG(figmaFileKey, containerIds, figmaAccessToken);
      console.log(`✅ Fetched ${Object.keys(containerSvgContent).length} SVG containers from Figma API`);
    }

    // Process SVG containers for export
    for (const container of svgContainers) {
      const varName = generateSvgVarName(container.name || 'svg', usedVarNames);
      const filename = `${varName}.svg`;
      const path = `./img/${filename}`;
      const svgContent = containerSvgContent[container.nodeId] || `<svg xmlns="http://www.w3.org/2000/svg"><text y="20">Missing SVG</text></svg>`;

      svgExports.push({ nodeId: container.nodeId, varName, filename, path, svgContent });
      svgDataUrls[container.nodeId] = path;
    }
  }

  // Generate assets for export (export mode only)
  const assets: GeneratedAsset[] = svgExports.map(svg => ({
    filename: svg.filename,
    path: svg.path,
    content: svg.svgContent,
    type: 'svg' as const,
  }));

  // Generate HTML and collect CSS rules
  const html = generateHTMLElement(altNode, cleanedProps, cssRules, 0, allRules, framework, imageUrls, svgDataUrls, svgBoundsMap);

  // WP31: Generate CSS variable definitions from system-variables.json
  console.log('[HTML-CSS] Calling generateCssVariableDefinitions...');
  const cssVariables = generateCssVariableDefinitions();
  console.log('[HTML-CSS] cssVariables result length:', cssVariables.length);

  // Generate CSS from collected rules
  const componentCss = cssRules
    .map(rule => {
      const properties = Object.entries(rule.properties)
        .map(([key, value]) => `  ${toKebabCase(key)}: ${value.toLowerCase()};`)
        .join('\n');
      return `.${rule.selector} {\n${properties}\n}`;
    })
    .join('\n\n');

  // WP31: Combine variable definitions with component CSS
  const css = cssVariables ? `${cssVariables}\n\n${componentCss}` : componentCss;

  const code = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`;

  return {
    code,
    format: 'html-css',
    language: 'html',
    assets: assets.length > 0 ? assets : undefined,
    metadata: {
      componentName: className,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
    css, // Include separate CSS string
  };
}

/**
 * Recursively generate HTML element and collect CSS rules
 *
 * @param node - Current AltNode
 * @param properties - Resolved CSS properties for this node
 * @param cssRules - Array to collect CSS rules (mutated)
 * @param depth - Indentation depth
 * @param allRules - All available rules for child evaluation
 * @param framework - Target framework for code generation
 * @param imageUrls - Map of imageRef → URL
 * @param svgDataUrls - Map of nodeId → data URL or file path
 * @param svgBoundsMap - WP32: Map of nodeId → { width, height } for SVG nodes
 * @returns HTML string
 */
function generateHTMLElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  cssRules: Array<{ selector: string; properties: Record<string, string> }>,
  depth: number,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'html-css',
  imageUrls: Record<string, string> = {},
  svgDataUrls: Record<string, string> = {},
  svgBoundsMap: Map<string, { width: number; height: number }> = new Map()
): string {
  // WP32: Skip hidden nodes - they should not be rendered in generated code
  if (node.visible === false) {
    return '';
  }

  const indent = '  '.repeat(depth);

  // WP32: Handle SVG nodes (VECTORs or multi-VECTOR containers)
  const svgBounds = svgBoundsMap.get(node.id);
  if (svgBounds) {
    const svgValue = svgDataUrls[node.id];
    const altText = node.name || 'svg';

    // Build data attributes
    const componentAttrs = extractComponentDataAttributes(node);
    const allDataAttrs = {
      'data-layer': node.name,
      'data-node-id': node.id,
      ...componentAttrs
    };
    const dataAttrString = Object.entries(allDataAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    // Simple: img with SVG dimensions from Figma API
    const { width, height } = svgBounds;
    const sizeStyle = width > 0 && height > 0
      ? `width: ${Math.round(width)}px; height: ${Math.round(height)}px;`
      : '';

    if (svgValue) {
      return `${indent}<img ${dataAttrString} style="display: block; max-width: none; ${sizeStyle}" alt="${altText}" src="${svgValue}" />\n`;
    }
    return `${indent}<div ${dataAttrString} style="display: block; ${sizeStyle}"></div>\n`;
  }

  const htmlTag = mapNodeTypeToHTMLTag(node.originalType); // T177: Use originalType for tag mapping
  const className = toPascalCase(node.name); // T179: Use PascalCase instead of kebab-case

  // T178: Add data-layer attribute
  // T180: Extract component properties as data-* attributes
  // WP31: Add data-node-id for node-by-node comparison with MCP reference
  const componentAttrs = extractComponentDataAttributes(node);
  const allDataAttrs = {
    'data-layer': node.name, // T178: Original Figma name
    'data-node-id': node.id, // WP31: Figma node ID for comparison
    ...componentAttrs // T180: Component properties
  };

  const dataAttrString = Object.entries(allDataAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  // WP32: Handle VECTOR nodes BEFORE CSS collection - they use inline styles only
  // VECTORs are rendered as <img> with SVG data, no CSS rules needed
  if (node.originalType === 'VECTOR' && node.svgData) {
    const svgDataUrl = svgDataUrls[node.id] || vectorToDataURL(node.svgData);
    const altText = node.name || 'vector';
    // Extract width/height from node.styles for proper sizing
    const width = node.styles?.width || '';
    const height = node.styles?.height || '';
    const sizeStyle = (width && height) ? `width: ${width}; height: ${height};` : '';
    // Use inline styles with dimensions, no CSS class to avoid inherited background/rotation
    return `${indent}<img ${dataAttrString} style="display: block; max-width: none; ${sizeStyle}" alt="${altText}" src="${svgDataUrl}" />\n`;
  }

  // CRITICAL FIX: Merge base styles from AltNode with rule overrides
  // Rules take precedence over computed styles
  // WP28 T211: Fallback architecture - baseStyles provide CSS guarantee, properties optimize
  const baseStyles: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.styles || {})) {
    baseStyles[key] = typeof value === 'number' ? String(value) : value;
  }

  const mergedProperties: Record<string, string> = {
    ...baseStyles,      // WP28: Fallback styles from altNode.styles (universal extraction)
    ...properties,      // WP28: Rule overrides (higher priority) - semantic classes win
  };

  // Collect CSS rule for this node
  if (Object.keys(mergedProperties).length > 0) {
    cssRules.push({
      selector: className,
      properties: mergedProperties,
    });
  }

  // Generate HTML
  let htmlString = '';

  // T177 CRITICAL FIX: TEXT nodes MUST use text content, not children
  // TEXT nodes in Figma can have children (for styling spans) but we want the raw text
  if (node.originalType === 'TEXT') {
    // T185: Use extractTextContent to preserve line breaks
    const content = extractTextContent(node);
    if (content) {
      htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}">${content}</${htmlTag}>`;
    } else {
      htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}"></${htmlTag}>`;
    }
  } else if (node.fillsData && node.fillsData.length > 0) {
    // WP32: Multi-fill rendering - render ALL fills as stacked layers like MCP
    const hasChildren = 'children' in node && node.children.length > 0;
    const hasMultipleFills = node.fillsData.length > 1;
    const hasImageFill = node.fillsData.some((f: FillData) => f.type === 'IMAGE');

    // If multiple fills OR has image fill with children, use layered rendering
    if (hasMultipleFills || (hasImageFill && hasChildren)) {
      htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}">\n`;

      // Render all fills as stacked layers (decorative, hidden from screen readers)
      htmlString += `${indent}  <div aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none;">\n`;

      for (const fill of node.fillsData) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          const imageUrl = imageUrls[fill.imageRef] || 'https://placehold.co/300x200';
          // WP32: Use scaleMode for object-fit (FILL → cover, FIT → contain)
          const objectFit = scaleModeToObjectFit(fill.scaleMode);
          htmlString += `${indent}    <img alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: ${objectFit};" src="${imageUrl}" />\n`;
        } else if (fill.type === 'SOLID') {
          const colorCSS = fillDataToColorCSS(fill);
          htmlString += `${indent}    <div style="position: absolute; inset: 0; background-color: ${colorCSS};"></div>\n`;
        } else if (fill.type.startsWith('GRADIENT')) {
          const gradientCSS = fillDataToGradientCSS(fill);
          htmlString += `${indent}    <div style="position: absolute; inset: 0; background-image: ${gradientCSS};"></div>\n`;
        }
      }

      htmlString += `${indent}  </div>\n`;

      // Render children (position:relative comes from altnode-transform)
      if (hasChildren) {
        for (const child of (node as any).children) {
          const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
          const childProps = cleanResolvedProperties(childResult.properties);
          htmlString += generateHTMLElement(child, childProps, cssRules, depth + 1, allRules, framework, imageUrls, svgDataUrls, svgBoundsMap);
        }
      }

      htmlString += `${indent}</${htmlTag}>`;
    } else if (hasImageFill && !hasChildren) {
      // Single image fill without children - simple img tag
      // WP32: Add object-fit based on scaleMode (FILL → cover, FIT → contain)
      const imageFill = node.fillsData.find((f: FillData) => f.type === 'IMAGE');
      const imageUrl = imageUrls[imageFill?.imageRef || ''] || 'https://placehold.co/300x200';
      const altText = node.name || 'image';
      const width = (node.originalNode as any)?.absoluteBoundingBox?.width || 300;
      const height = (node.originalNode as any)?.absoluteBoundingBox?.height || 200;
      const objectFit = scaleModeToObjectFit(imageFill?.scaleMode);
      // WP32 FIX: Include opacity and border-radius if present in node styles
      const opacity = node.styles?.opacity;
      const borderRadius = node.styles?.['border-radius'];
      let imgStyle = `width: ${width}px; height: ${height}px; object-fit: ${objectFit};`;
      if (opacity && opacity !== '1') {
        imgStyle += ` opacity: ${opacity};`;
      }
      if (borderRadius) {
        imgStyle += ` border-radius: ${borderRadius};`;
      }
      htmlString += `${indent}<img ${dataAttrString} class="${className}" alt="${altText}" src="${imageUrl}" style="${imgStyle}" />`;
    } else {
      // Single non-image fill (solid/gradient) - render as div with background
      const fill = node.fillsData[0];
      let bgStyle = '';
      if (fill.type === 'SOLID') {
        bgStyle = `background-color: ${fillDataToColorCSS(fill)};`;
      } else if (fill.type.startsWith('GRADIENT')) {
        bgStyle = `background-image: ${fillDataToGradientCSS(fill)};`;
      }

      if (hasChildren) {
        htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}" style="${bgStyle}">\n`;
        for (const child of (node as any).children) {
          const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
          const childProps = cleanResolvedProperties(childResult.properties);
          htmlString += generateHTMLElement(child, childProps, cssRules, depth + 1, allRules, framework, imageUrls, svgDataUrls, svgBoundsMap);
        }
        htmlString += `${indent}</${htmlTag}>`;
      } else {
        htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}" style="${bgStyle}"></${htmlTag}>`;
      }
    }
  } else if (shouldRenderAsImgTag(node)) {
    // WP32: Fallback for backward compatibility - single image without fillsData
    const imageUrl = imageUrls[node.imageData?.imageRef || ''] || extractImageUrl(node) || 'https://placehold.co/300x200';
    const altText = node.name || 'image';
    const width = (node.originalNode as any)?.absoluteBoundingBox?.width || 300;
    const height = (node.originalNode as any)?.absoluteBoundingBox?.height || 200;
    const objectFit = scaleModeToObjectFit(node.imageData?.scaleMode);
    // WP32 FIX: Include opacity and border-radius if present in node styles
    const opacity = node.styles?.opacity;
    const borderRadius = node.styles?.['border-radius'];
    let imgStyle = `width: ${width}px; height: ${height}px; object-fit: ${objectFit};`;
    if (opacity && opacity !== '1') {
      imgStyle += ` opacity: ${opacity};`;
    }
    if (borderRadius) {
      imgStyle += ` border-radius: ${borderRadius};`;
    }
    htmlString += `${indent}<img ${dataAttrString} class="${className}" alt="${altText}" src="${imageUrl}" style="${imgStyle}" />`;
  } else {
    // Non-TEXT, Non-VECTOR, Non-IMAGE nodes: check for children
    const hasChildren = 'children' in node && node.children.length > 0;

    if (hasChildren) {
      htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}">\n`;

      // FIX: Recursively generate children with their own rule evaluation
      for (const child of (node as any).children) {
        // Evaluate rules for this child
        const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
        const childProps = cleanResolvedProperties(childResult.properties);

        htmlString += generateHTMLElement(child, childProps, cssRules, depth + 1, allRules, framework, imageUrls, svgDataUrls, svgBoundsMap);
      }

      htmlString += `${indent}</${htmlTag}>`;
    } else {
      // Empty leaf node
      htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}"></${htmlTag}>`;
    }
  }

  return htmlString + '\n';
}

/**
 * Map Figma node type to HTML tag
 */
function mapNodeTypeToHTMLTag(nodeType: string): string {
  const mapping: Record<string, string> = {
    FRAME: 'div',
    RECTANGLE: 'div',
    TEXT: 'span',
    GROUP: 'div',
    COMPONENT: 'div',
    INSTANCE: 'div',
    VECTOR: 'svg',
    ELLIPSE: 'div',
  };

  return mapping[nodeType] || 'div';
}

/**
 * WP25 T183: Determine if a node should render as <img> tag vs background-image
 *
 * WP32 FIX: Use imageData as primary criteria (set by altnode-transform)
 * Use <img> if:
 * - Node has imageData with imageRef (from altnode-transform)
 * - OR node has image fill AND no children
 */
function shouldRenderAsImgTag(node: SimpleAltNode): boolean {
  // WP32: Primary check - imageData is set by altnode-transform for image fills
  if (node.imageData?.imageRef) {
    return true;
  }

  // Fallback: Check originalNode fills (for backward compatibility)
  const hasImageFill = (node.originalNode as any)?.fills?.some(
    (fill: any) => fill.type === 'IMAGE'
  );
  const hasNoChildren = !node.children || node.children.length === 0;

  return hasImageFill && hasNoChildren;
}

/**
 * WP25 T183: Extract image URL from node
 *
 * Returns imageRef from fills or null
 */
function extractImageUrl(node: SimpleAltNode): string | null {
  const fills = (node.originalNode as any)?.fills || [];
  const imageFill = fills.find((fill: any) => fill.type === 'IMAGE');

  if (imageFill && imageFill.imageRef) {
    return imageFill.imageRef;
  }

  return null;
}
