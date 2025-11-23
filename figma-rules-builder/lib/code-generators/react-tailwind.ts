/**
 * React + Tailwind CSS Code Generator
 *
 * Generates React function components with Tailwind utility classes
 */

import type { AltNode } from '../types/altnode';
import type { RuleMatch } from '../types/rule';
import { toPascalCase, convertToTailwindClasses, escapeString } from './helpers';

/**
 * Generate React JSX code with Tailwind classes from AltNode
 *
 * @param altNode - Normalized Figma node
 * @param ruleMatches - Array of matching rules (highest priority first)
 * @param indentLevel - Current indentation level (for nested components)
 * @returns React JSX code with Tailwind classes
 *
 * @example
 * const code = generateReactTailwind(altNode, matches);
 * // Returns:
 * // export function PrimaryButton() {
 * //   return (
 * //     <button className="flex gap-2 px-4 py-2 rounded bg-blue-600">
 * //       <span className="text-white">Click me</span>
 * //     </button>
 * //   );
 * // }
 */
export function generateReactTailwind(
  altNode: AltNode,
  ruleMatches: RuleMatch[],
  indentLevel: number = 0
): string {
  const componentName = toPascalCase(altNode.name);
  const htmlTag = extractHtmlTag(ruleMatches) || mapNodeTypeToTag(altNode.type);
  const className = generateClassName(altNode, ruleMatches);
  const attributes = extractAttributes(ruleMatches);
  const textContent = extractTextContent(altNode);

  // Generate child components
  const childrenCode = generateChildren(altNode, indentLevel + 2);

  // Generate attributes
  const classNameAttr = className.length > 0 ? `className="${className}"` : '';
  const attributesString = Object.entries(attributes)
    .map(([key, value]) => `${key}="${escapeString(String(value))}"`)
    .join(' ');

  const allAttributes = [classNameAttr, attributesString]
    .filter((attr) => attr.length > 0)
    .join(' ');

  // Generate JSX element
  const hasChildren = childrenCode.length > 0 || textContent.length > 0;

  let jsx = '';

  if (indentLevel === 0) {
    // Top-level component - export as function
    jsx += `export function ${componentName}() {\n`;
    jsx += `  return (\n`;

    if (hasChildren) {
      jsx += `    <${htmlTag}${allAttributes ? ' ' + allAttributes : ''}>\n`;

      if (textContent) {
        jsx += `      {${JSON.stringify(textContent)}}\n`;
      }

      if (childrenCode) {
        jsx += childrenCode + '\n';
      }

      jsx += `    </${htmlTag}>\n`;
    } else {
      jsx += `    <${htmlTag}${allAttributes ? ' ' + allAttributes : ''} />\n`;
    }

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
 * Generate className string from AltNode styles and rule matches
 *
 * Combines Tailwind classes from CSS conversion and rule-contributed classes
 *
 * @param altNode - AltNode with CSS styles
 * @param ruleMatches - Rule matches with CSS classes
 * @returns className string
 */
function generateClassName(
  altNode: AltNode,
  ruleMatches: RuleMatch[]
): string {
  const classes = new Set<string>();

  // Convert AltNode styles to Tailwind classes
  const tailwindClasses = convertToTailwindClasses(altNode.styles);
  tailwindClasses.forEach((cls) => classes.add(cls));

  // Add rule-contributed CSS classes (highest priority first)
  for (const match of ruleMatches) {
    if (match.contributedProperties.cssClasses) {
      const ruleClasses = match.contributedProperties.cssClasses.split(' ');
      ruleClasses.forEach((cls) => {
        if (cls.trim().length > 0) {
          classes.add(cls.trim());
        }
      });
    }
  }

  // Convert rule-contributed inline styles to Tailwind
  for (const match of ruleMatches) {
    const inlineStyles: Record<string, string> = {};

    for (const [key, value] of Object.entries(match.contributedProperties)) {
      // Skip non-style properties
      if (key === 'htmlTag' || key === 'cssClasses' || key === 'attributes') {
        continue;
      }

      inlineStyles[key] = value;
    }

    if (Object.keys(inlineStyles).length > 0) {
      const additionalClasses = convertToTailwindClasses(inlineStyles);
      additionalClasses.forEach((cls) => classes.add(cls));
    }
  }

  return Array.from(classes).join(' ');
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

  return altNode.children
    .map((child) => generateReactTailwind(child, [], indentLevel))
    .join('\n');
}
