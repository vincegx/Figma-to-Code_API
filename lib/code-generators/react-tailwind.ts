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

  // Merge base styles from AltNode with rule overrides
  // Rules take precedence over computed styles
  // Convert node.styles values to strings if needed
  const baseStyles: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.styles || {})) {
    baseStyles[key] = typeof value === 'number' ? String(value) : value;
  }

  const mergedStyles: Record<string, string> = {
    ...baseStyles,
    ...properties,
  };

  // Convert CSS properties to Tailwind classes
  const tailwindClasses = Object.entries(mergedStyles)
    .map(([cssProperty, cssValue]) => cssPropToTailwind(cssProperty, cssValue))
    .filter(Boolean)
    .join(' ');

  const hasClasses = tailwindClasses.length > 0;
  const hasChildren = 'children' in node && node.children.length > 0;

  // Generate JSX
  let jsxString = '';

  if (hasChildren) {
    jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

    // Recursively generate children with their own styles
    for (const child of (node as any).children) {
      // Children inherit no properties from parent - each node uses its own styles
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
