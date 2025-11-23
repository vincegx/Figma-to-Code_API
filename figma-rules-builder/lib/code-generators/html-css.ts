/**
 * HTML + CSS Code Generator
 *
 * Generates static HTML with external CSS stylesheet
 */

import type { AltNode } from '../types/altnode';
import type { RuleMatch } from '../types/rule';
import { toKebabCase, escapeString } from './helpers';

/**
 * Generated HTML and CSS code
 */
export interface GeneratedHtmlCss {
  html: string;
  css: string;
}

/**
 * Generate HTML + CSS from AltNode tree
 *
 * @param altNode - Normalized Figma node
 * @param ruleMatches - Array of matching rules (highest priority first)
 * @param indentLevel - Current indentation level
 * @returns Object with HTML and CSS strings
 *
 * @example
 * const { html, css } = generateHtmlCss(altNode, matches);
 * // html: <button class="primary-button">...</button>
 * // css: .primary-button { display: flex; gap: 8px; }
 */
export function generateHtmlCss(
  altNode: AltNode,
  ruleMatches: RuleMatch[],
  indentLevel: number = 0
): GeneratedHtmlCss {
  const cssRules = new Map<string, Record<string, string | number>>();

  // Generate HTML and collect CSS
  const html = generateHtml(altNode, ruleMatches, cssRules, indentLevel);

  // Generate CSS from collected rules
  const css = generateCss(cssRules);

  return { html, css };
}

/**
 * Generate HTML for AltNode
 *
 * @param altNode - AltNode
 * @param ruleMatches - Rule matches
 * @param cssRules - Map to collect CSS rules
 * @param indentLevel - Indentation level
 * @returns HTML string
 */
function generateHtml(
  altNode: AltNode,
  ruleMatches: RuleMatch[],
  cssRules: Map<string, Record<string, string | number>>,
  indentLevel: number
): string {
  const htmlTag = extractHtmlTag(ruleMatches) || mapNodeTypeToTag(altNode.type);
  const className = generateClassName(altNode);
  const attributes = extractAttributes(ruleMatches);
  const textContent = extractTextContent(altNode);

  // Collect CSS for this element
  const styles = extractStyles(altNode, ruleMatches);
  if (Object.keys(styles).length > 0) {
    cssRules.set(`.${className}`, styles);
  }

  // Generate HTML attributes
  const classAttr = `class="${className}"`;
  const attributesString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeString(String(value))}"`)
    .join(' ');

  const allAttributes = [classAttr, attributesString]
    .filter((attr) => attr.length > 0)
    .join(' ');

  // Generate children HTML
  const childrenHtml = generateChildrenHtml(
    altNode,
    cssRules,
    indentLevel + 1
  );

  const indent = '  '.repeat(indentLevel);

  // Always use open/close tags for HTML (self-closing only for void elements like img, br, hr)
  const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link'];
  const isVoid = voidElements.includes(htmlTag);

  if (isVoid) {
    return `${indent}<${htmlTag} ${allAttributes} />`;
  }

  let html = `${indent}<${htmlTag} ${allAttributes}>\n`;

  if (textContent) {
    html += `${indent}  ${escapeHtml(textContent)}\n`;
  }

  if (childrenHtml) {
    html += childrenHtml;
  }

  html += `${indent}</${htmlTag}>`;
  return html;
}

/**
 * Generate CSS from collected rules
 *
 * @param cssRules - Map of selector to styles
 * @returns CSS string
 */
function generateCss(
  cssRules: Map<string, Record<string, string | number>>
): string {
  const css: string[] = [];

  for (const [selector, styles] of cssRules.entries()) {
    css.push(`${selector} {`);

    for (const [key, value] of Object.entries(styles)) {
      const cssKey = toKebabCase(key);
      css.push(`  ${cssKey}: ${value};`);
    }

    css.push(`}\n`);
  }

  return css.join('\n');
}

/**
 * Extract HTML tag from rule matches
 *
 * @param ruleMatches - Array of rule matches
 * @returns HTML tag name or undefined
 */
function extractHtmlTag(ruleMatches: RuleMatch[]): string | undefined {
  for (const match of ruleMatches) {
    if (match.contributedProperties.htmlTag) {
      return match.contributedProperties.htmlTag;
    }
  }
  return undefined;
}

/**
 * Map AltNode type to default HTML tag
 *
 * @param nodeType - AltNode type
 * @returns Default HTML tag
 */
function mapNodeTypeToTag(nodeType: AltNode['type']): string {
  switch (nodeType) {
    case 'text':
      return 'span';
    case 'image':
      return 'img';
    case 'group':
    case 'container':
    default:
      return 'div';
  }
}

/**
 * Generate CSS class name from AltNode name
 *
 * @param altNode - AltNode
 * @returns CSS class name (kebab-case)
 */
function generateClassName(altNode: AltNode): string {
  return toKebabCase(altNode.name) + `-${altNode.id.replace(':', '-')}`;
}

/**
 * Extract styles from AltNode and rule matches
 *
 * @param altNode - AltNode with CSS styles
 * @param ruleMatches - Rule matches with additional styles
 * @returns CSS properties object
 */
function extractStyles(
  altNode: AltNode,
  ruleMatches: RuleMatch[]
): Record<string, string | number> {
  const styles: Record<string, string | number> = {};

  // Start with AltNode styles
  for (const [key, value] of Object.entries(altNode.styles)) {
    if (value !== undefined) {
      styles[key] = value;
    }
  }

  // Apply rule-contributed styles (highest priority first)
  for (const match of ruleMatches) {
    for (const [key, value] of Object.entries(match.contributedProperties)) {
      // Skip non-style properties
      if (key === 'htmlTag' || key === 'cssClasses' || key === 'attributes') {
        continue;
      }

      // Only set if not already defined (respect priority)
      if (styles[key] === undefined) {
        styles[key] = value;
      }
    }
  }

  return styles;
}

/**
 * Extract HTML attributes from rule matches
 *
 * @param ruleMatches - Rule matches
 * @returns HTML attributes object
 */
function extractAttributes(
  ruleMatches: RuleMatch[]
): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of ruleMatches) {
    if (match.contributedProperties.attributes) {
      try {
        const attrs = JSON.parse(match.contributedProperties.attributes);
        Object.assign(attributes, attrs);
      } catch {
        // Skip invalid JSON
      }
    }
  }

  return attributes;
}

/**
 * Extract text content from text nodes
 *
 * @param altNode - AltNode
 * @returns Text content or empty string
 */
function extractTextContent(altNode: AltNode): string {
  if (altNode.type === 'text' && altNode.figmaProperties) {
    const characters = altNode.figmaProperties.characters;
    if (typeof characters === 'string') {
      return characters;
    }
  }
  return '';
}

/**
 * Generate HTML for child nodes
 *
 * @param altNode - Parent AltNode
 * @param cssRules - Map to collect CSS rules
 * @param indentLevel - Indentation level for children
 * @returns HTML code for children
 */
function generateChildrenHtml(
  altNode: AltNode,
  cssRules: Map<string, Record<string, string | number>>,
  indentLevel: number
): string {
  if (!altNode.children || altNode.children.length === 0) {
    return '';
  }

  return altNode.children
    .map((child) => generateHtml(child, [], cssRules, indentLevel))
    .join('\n') + '\n';
}

/**
 * Escape HTML special characters
 *
 * @param text - Text to escape
 * @returns Escaped HTML text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
