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
    // Skip properties with unresolved variables
    if (value.includes('$value') || value.includes('${')) {
      continue;
    }
    // Skip empty values
    if (!value || value.trim() === '') {
      continue;
    }
    cleaned[key] = value;
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
  const baseStyles: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.styles || {})) {
    baseStyles[key] = typeof value === 'number' ? String(value) : value;
  }

  const mergedProperties: Record<string, string> = {
    ...baseStyles,      // Base styles from Figma normalization
    ...properties,      // Rule overrides (higher priority)
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
