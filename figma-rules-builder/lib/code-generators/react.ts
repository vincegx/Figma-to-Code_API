/**
 * React JSX Code Generator
 *
 * Generates React function components with inline styles from AltNode tree
 */

import type { AltNode } from '../types/altnode';
import type { RuleMatch } from '../types/rule';
import { toPascalCase, escapeString } from './helpers';

/**
 * Generate React JSX code from AltNode with resolved rule matches
 *
 * @param altNode - Normalized Figma node
 * @param ruleMatches - Array of matching rules (highest priority first)
 * @param indent - Current indentation level (for nested components)
 * @returns React JSX code string
 *
 * @example
 * const code = generateReactJSX(altNode, matches);
 * // Returns:
 * // export function PrimaryButton() {
 * //   return (
 * //     <button style={{ display: 'flex', gap: '8px' }}>
 * //       <span>Click me</span>
 * //     </button>
 * //   );
 * // }
 */
export function generateReactJSX(
  altNode: AltNode,
  ruleMatches: RuleMatch[],
  indentLevel: number = 0
): string {
  const componentName = toPascalCase(altNode.name);
  const htmlTag = extractHtmlTag(ruleMatches) || mapNodeTypeToTag(altNode.type);
  const styles = extractInlineStyles(altNode, ruleMatches);
  const attributes = extractAttributes(ruleMatches);
  const textContent = extractTextContent(altNode);

  // Generate child components
  const childrenCode = generateChildren(altNode, indentLevel + 2);

  // Generate style object
  const styleObject = Object.keys(styles).length > 0
    ? `style={${JSON.stringify(styles, null, 2).replace(/\n/g, '\n' + '  '.repeat(indentLevel + 1))}}`
    : '';

  // Generate attributes
  const attributesString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeString(String(value))}"`)
    .join(' ');

  const allAttributes = [styleObject, attributesString]
    .filter((attr) => attr.length > 0)
    .join(' ');

  // Generate JSX element
  const hasChildren = childrenCode.length > 0 || textContent.length > 0;

  let jsx = '';

  if (indentLevel === 0) {
    // Top-level component - export as function
    jsx += `export function ${componentName}() {\n`;
    jsx += `  return (\n`;

    // Always use open/close tags for consistency (not self-closing)
    jsx += `    <${htmlTag}${allAttributes ? ' ' + allAttributes : ''}>\n`;

    if (textContent) {
      jsx += `      {${JSON.stringify(textContent)}}\n`;
    }

    if (childrenCode) {
      jsx += childrenCode + '\n';
    }

    jsx += `    </${htmlTag}>\n`;

    jsx += `  );\n`;
    jsx += `}`;
  } else {
    // Nested component - inline JSX
    const indent = '  '.repeat(indentLevel);

    if (hasChildren) {
      jsx += `${indent}<${htmlTag}${allAttributes ? ' ' + allAttributes : ''}>\n`;

      if (textContent) {
        jsx += `${indent}  {${JSON.stringify(textContent)}}\n`;
      }

      if (childrenCode) {
        jsx += childrenCode + '\n';
      }

      jsx += `${indent}</${htmlTag}>`;
    } else {
      jsx += `${indent}<${htmlTag}${allAttributes ? ' ' + allAttributes : ''} />`;
    }
  }

  return jsx;
}

/**
 * Extract HTML tag from rule matches
 *
 * @param ruleMatches - Array of rule matches
 * @returns HTML tag name or undefined
 */
function extractHtmlTag(ruleMatches: RuleMatch[]): string | undefined {
  // Rules are already sorted by priority
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
 * Extract inline styles from AltNode and rule matches
 *
 * Combines AltNode CSS properties with rule-contributed styles
 *
 * @param altNode - AltNode with CSS styles
 * @param ruleMatches - Rule matches with additional styles
 * @returns CSS properties object
 */
function extractInlineStyles(
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
 * Generate JSX for child nodes
 *
 * @param altNode - Parent AltNode
 * @param indentLevel - Indentation level for children
 * @returns JSX code for children
 */
function generateChildren(
  altNode: AltNode,
  indentLevel: number
): string {
  if (!altNode.children || altNode.children.length === 0) {
    return '';
  }

  // For nested components, we need to generate inline JSX
  // We'll need access to rule matches for each child
  // For now, generate without rule matches (future enhancement)
  return altNode.children
    .map((child) => generateReactJSX(child, [], indentLevel))
    .join('\n');
}
