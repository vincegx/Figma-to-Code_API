import type { SimpleAltNode } from '../altnode-transform';
import { toKebabCase, toPascalCase, extractTextContent, extractComponentDataAttributes } from './helpers';
import { GeneratedCodeOutput } from './react';
import type { MultiFrameworkRule, FrameworkType } from '../types/rules';
import { evaluateMultiFrameworkRules } from '../rule-engine';

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
export function generateHTMLCSS(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'html-css'
): GeneratedCodeOutput {
  const className = toKebabCase(altNode.name);
  const cssRules: Array<{ selector: string; properties: Record<string, string> }> = [];

  // FIX: Clean properties to remove $value placeholders
  const cleanedProps = cleanResolvedProperties(resolvedProperties);

  // Generate HTML and collect CSS rules
  const html = generateHTMLElement(altNode, cleanedProps, cssRules, 0, allRules, framework);

  // Generate CSS from collected rules
  const css = cssRules
    .map(rule => {
      const properties = Object.entries(rule.properties)
        .map(([key, value]) => `  ${toKebabCase(key)}: ${value.toLowerCase()};`)
        .join('\n');
      return `.${rule.selector} {\n${properties}\n}`;
    })
    .join('\n\n');

  const code = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`;

  return {
    code,
    format: 'html-css',
    language: 'html',
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
 * @returns HTML string
 */
function generateHTMLElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  cssRules: Array<{ selector: string; properties: Record<string, string> }>,
  depth: number,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'html-css'
): string {
  const indent = '  '.repeat(depth);
  const htmlTag = mapNodeTypeToHTMLTag(node.originalType); // T177: Use originalType for tag mapping
  const className = toPascalCase(node.name); // T179: Use PascalCase instead of kebab-case

  // T178: Add data-layer attribute
  // T180: Extract component properties as data-* attributes
  const componentAttrs = extractComponentDataAttributes(node);
  const allDataAttrs = {
    'data-layer': node.name, // T178: Original Figma name
    ...componentAttrs // T180: Component properties
  };

  const dataAttrString = Object.entries(allDataAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

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
  } else if (node.originalType === 'VECTOR') {
    // WP25 T182: VECTOR nodes should render as SVG with wrapper
    // Extract component name for data-name attribute (e.g., "surfboard#4" → "surfboard")
    const componentName = node.name.includes('#') ? node.name.split('#')[0] : node.name;
    const svgDataAttr = `data-svg-wrapper data-name="${componentName}" ${dataAttrString}`;

    // Generate SVG wrapper div with placeholder for actual SVG content
    htmlString += `${indent}<div ${svgDataAttr} class="${className}" style="position: relative">\n`;
    htmlString += `${indent}  <!-- TODO: Insert SVG content for ${node.name} here -->\n`;
    htmlString += `${indent}  <!-- Fetch SVG via Figma API: GET /v1/images/{fileKey}?ids=${(node.originalNode as any)?.id || ''}&format=svg -->\n`;
    htmlString += `${indent}</div>`;
  } else if (shouldRenderAsImgTag(node)) {
    // WP25 T183: Nodes with image fills that should be <img> tags
    const imageUrl = extractImageUrl(node) || 'https://placehold.co/300x200';
    const width = (node.originalNode as any)?.absoluteBoundingBox?.width || 300;
    const height = (node.originalNode as any)?.absoluteBoundingBox?.height || 200;

    // Extract inline styles from mergedProperties
    const styleStr = Object.entries(mergedProperties)
      .filter(([key]) => key !== 'background-image' && key !== 'background-size') // Exclude background props
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    htmlString += `${indent}<img ${dataAttrString} class="${className}" src="${imageUrl}" style="width: ${width}px; height: ${height}px${styleStr ? '; ' + styleStr : ''}" />`;
  } else {
    // Non-TEXT nodes: check for children
    const hasChildren = 'children' in node && node.children.length > 0;

    if (hasChildren) {
      htmlString += `${indent}<${htmlTag} ${dataAttrString} class="${className}">\n`;

      // FIX: Recursively generate children with their own rule evaluation
      for (const child of (node as any).children) {
        // Evaluate rules for this child
        const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
        const childProps = cleanResolvedProperties(childResult.properties);

        htmlString += generateHTMLElement(child, childProps, cssRules, depth + 1, allRules, framework);
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
 * Use <img> if:
 * - Node name contains "image", "img", "photo", "picture" (case-insensitive)
 * - Node has no children (leaf node)
 * - Node has an image fill
 */
function shouldRenderAsImgTag(node: SimpleAltNode): boolean {
  // Check if node has image fill
  const hasImageFill = (node.originalNode as any)?.fills?.some(
    (fill: any) => fill.type === 'IMAGE'
  );
  if (!hasImageFill) {
    return false;
  }

  // Check if node name suggests it's an image
  const isImageNamed = /image|img|photo|picture/i.test(node.name);

  // Check if node has no children (leaf node)
  const hasNoChildren = !node.children || node.children.length === 0;

  return isImageNamed && hasNoChildren;
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
