import type { SimpleAltNode } from '../altnode-transform';
import { toPascalCase, cssPropToTailwind } from './helpers';
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
export function generateReactTailwind(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind'
): GeneratedCodeOutput {
  const componentName = toPascalCase(altNode.name);

  // FIX: Clean properties to remove $value placeholders
  const cleanedProps = cleanResolvedProperties(resolvedProperties);

  const jsx = generateTailwindJSXElement(altNode, cleanedProps, 0, allRules, framework);

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
 * @param allRules - All available rules for child evaluation
 * @param framework - Target framework for code generation
 * @returns JSX string with Tailwind classes
 */
function generateTailwindJSXElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  depth: number,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind'
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

    // FIX: Recursively generate children with their own rule evaluation
    for (const child of (node as any).children) {
      // Evaluate rules for this child
      const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
      const childProps = cleanResolvedProperties(childResult.properties);

      jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework);
    }

    jsxString += `${indent}</${htmlTag}>`;
  } else {
    // Leaf node - FIX: Access text via originalNode.characters
    const content = node.type === 'TEXT'
      ? (node.originalNode as any)?.characters || ''
      : '';
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
