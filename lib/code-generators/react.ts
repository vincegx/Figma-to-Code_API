import { AltNode } from '../types/altnode';
import { toPascalCase } from './helpers';

/**
 * Simple generated code structure for WP06 MVP
 */
export interface GeneratedCodeOutput {
  readonly code: string;
  readonly format: 'react-jsx' | 'react-tailwind' | 'html-css';
  readonly language: 'tsx' | 'html';
  readonly metadata: {
    readonly componentName: string;
    readonly nodeId: string;
    readonly generatedAt: string;
  };
  readonly css?: string; // Optional CSS string for HTML/CSS format
}

/**
 * Generate React JSX component with inline styles
 *
 * Output format:
 *   export function ButtonComponent() {
 *     const styles: React.CSSProperties = {
 *       display: 'flex',
 *       padding: '16px',
 *       backgroundColor: '#FF0000',
 *     };
 *
 *     return (
 *       <div style={styles}>
 *         <span>Button Text</span>
 *       </div>
 *     );
 *   }
 *
 * @param altNode - The AltNode tree to generate code from
 * @param resolvedProperties - CSS properties from rule evaluation
 * @returns GeneratedCodeOutput object with JSX string
 */
export function generateReactJSX(
  altNode: AltNode,
  resolvedProperties: Record<string, string>
): GeneratedCodeOutput {
  const componentName = toPascalCase(altNode.name);
  const jsx = generateJSXElement(altNode, resolvedProperties, 0);

  const code = `export function ${componentName}() {
  return (
${jsx}  );
}`;

  return {
    code,
    format: 'react-jsx',
    language: 'tsx',
    metadata: {
      componentName,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Recursively generate JSX element with children
 *
 * @param node - Current AltNode
 * @param properties - Resolved CSS properties for this node
 * @param depth - Indentation depth
 * @returns JSX string
 */
function generateJSXElement(
  node: AltNode,
  properties: Record<string, string>,
  depth: number
): string {
  const indent = '  '.repeat(depth + 1);
  const htmlTag = mapNodeTypeToHTMLTag(node.type);

  // Build style object
  const styleLines = Object.entries(properties)
    .map(([key, value]) => `${indent}  ${key}: '${value}',`)
    .join('\n');

  const hasStyles = styleLines.length > 0;
  const hasChildren = 'children' in node && node.children.length > 0;

  // Generate style declaration
  let jsxString = '';
  if (hasStyles) {
    jsxString += `${indent}const styles: React.CSSProperties = {\n`;
    jsxString += styleLines + '\n';
    jsxString += `${indent}};\n\n`;
  }

  // Generate JSX
  if (hasChildren) {
    jsxString += `${indent}<${htmlTag}${hasStyles ? ' style={styles}' : ''}>\n`;

    // Recursively generate children
    for (const child of (node as any).children) {
      jsxString += generateJSXElement(child, {}, depth + 1);
    }

    jsxString += `${indent}</${htmlTag}>`;
  } else {
    // Self-closing tag for leaf nodes
    const content = node.type === 'TEXT' ? (node as any).characters || '' : '';
    if (content) {
      jsxString += `${indent}<${htmlTag}${hasStyles ? ' style={styles}' : ''}>${content}</${htmlTag}>`;
    } else {
      jsxString += `${indent}<${htmlTag}${hasStyles ? ' style={styles}' : ''} />`;
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
