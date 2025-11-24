import type { SimpleAltNode } from '../altnode-transform';
import { toKebabCase } from './helpers';
import { GeneratedCodeOutput } from './react';

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
 * @returns GeneratedCodeOutput object with HTML and CSS strings
 */
export function generateHTMLCSS(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>
): GeneratedCodeOutput {
  const className = toKebabCase(altNode.name);
  const cssRules: Array<{ selector: string; properties: Record<string, string> }> = [];

  // Generate HTML and collect CSS rules
  const html = generateHTMLElement(altNode, resolvedProperties, cssRules, 0);

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
 * @returns HTML string
 */
function generateHTMLElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  cssRules: Array<{ selector: string; properties: Record<string, string> }>,
  depth: number
): string {
  const indent = '  '.repeat(depth);
  const htmlTag = mapNodeTypeToHTMLTag(node.type);
  const className = toKebabCase(node.name);

  // Collect CSS rule for this node
  if (Object.keys(properties).length > 0) {
    cssRules.push({
      selector: className,
      properties,
    });
  }

  const hasChildren = 'children' in node && node.children.length > 0;

  // Generate HTML
  let htmlString = '';

  if (hasChildren) {
    htmlString += `${indent}<${htmlTag} class="${className}">\n`;

    // Recursively generate children
    for (const child of (node as any).children) {
      htmlString += generateHTMLElement(child, {}, cssRules, depth + 1);
    }

    htmlString += `${indent}</${htmlTag}>`;
  } else {
    // Leaf node
    const content = node.type === 'TEXT' ? (node as any).characters || '' : '';
    if (content) {
      htmlString += `${indent}<${htmlTag} class="${className}">${content}</${htmlTag}>`;
    } else {
      htmlString += `${indent}<${htmlTag} class="${className}"></${htmlTag}>`;
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
