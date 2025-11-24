import type { SimpleAltNode } from '../altnode-transform';
import { toPascalCase, cssPropToTailwind } from './helpers';
import { GeneratedCodeOutput } from './react';

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
 * @returns GeneratedCodeOutput object with Tailwind JSX string
 */
export function generateReactTailwind(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>
): GeneratedCodeOutput {
  const componentName = toPascalCase(altNode.name);
  const jsx = generateTailwindJSXElement(altNode, resolvedProperties, 0);

  const code = `export function ${componentName}() {
  return (
${jsx}  );
}`;

  return {
    code,
    format: 'react-tailwind',
    language: 'tsx',
    metadata: {
      componentName,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Recursively generate JSX element with Tailwind classes
 *
 * @param node - Current AltNode
 * @param properties - Resolved CSS properties for this node
 * @param depth - Indentation depth
 * @returns JSX string with Tailwind classes
 */
function generateTailwindJSXElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  depth: number
): string {
  const indent = '  '.repeat(depth + 1);
  const htmlTag = mapNodeTypeToHTMLTag(node.type);

  // Convert CSS properties to Tailwind classes
  const tailwindClasses = Object.entries(properties)
    .map(([cssProperty, cssValue]) => cssPropToTailwind(cssProperty, cssValue))
    .filter(Boolean)
    .join(' ');

  const hasClasses = tailwindClasses.length > 0;
  const hasChildren = 'children' in node && node.children.length > 0;

  // Generate JSX
  let jsxString = '';

  if (hasChildren) {
    jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

    // Recursively generate children
    for (const child of (node as any).children) {
      jsxString += generateTailwindJSXElement(child, {}, depth + 1);
    }

    jsxString += `${indent}</${htmlTag}>`;
  } else {
    // Leaf node
    const content = node.type === 'TEXT' ? (node as any).characters || '' : '';
    if (content) {
      jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''}>${content}</${htmlTag}>`;
    } else {
      jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''} />`;
    }
  }

  return jsxString + '\n';
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
