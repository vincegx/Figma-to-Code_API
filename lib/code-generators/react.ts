import type { SimpleAltNode } from '../altnode-transform';
import { toPascalCase, extractTextContent, extractComponentDataAttributes } from './helpers';

/**
 * Asset file generated during export (SVG, images, etc.)
 */
export interface GeneratedAsset {
  readonly filename: string;  // e.g., "vector.svg", "vector2.svg"
  readonly path: string;      // e.g., "./img/vector.svg"
  readonly content: string;   // File content (SVG string)
  readonly type: 'svg' | 'image';
}

/**
 * Simple generated code structure for WP06 MVP
 * WP39: Added 'react-tailwind-v4' format for Tailwind v4 syntax
 */
export interface GeneratedCodeOutput {
  readonly code: string;
  readonly format: 'react-jsx' | 'react-tailwind' | 'react-tailwind-v4' | 'html-css';
  readonly language: 'tsx' | 'html';
  readonly metadata: {
    readonly componentName: string;
    readonly nodeId: string;
    readonly generatedAt: string;
  };
  readonly css?: string; // Optional CSS string for HTML/CSS format
  readonly assets?: GeneratedAsset[]; // SVG and image files to export
  readonly googleFontsUrl?: string; // WP31: Google Fonts URL for fonts used in design
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
  altNode: SimpleAltNode,
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
  node: SimpleAltNode,
  properties: Record<string, string>,
  depth: number
): string {
  const indent = '  '.repeat(depth + 1);
  const htmlTag = mapNodeTypeToHTMLTag(node.originalType); // T177: Use originalType for tag mapping

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

  // Build style object
  const styleLines = Object.entries(properties)
    .map(([key, value]) => `${indent}  ${key}: '${value}',`)
    .join('\n');

  const hasStyles = styleLines.length > 0;

  // Generate style declaration
  let jsxString = '';
  if (hasStyles) {
    jsxString += `${indent}const styles: React.CSSProperties = {\n`;
    jsxString += styleLines + '\n';
    jsxString += `${indent}};\n\n`;
  }

  // T177 CRITICAL FIX: TEXT nodes MUST use text content, not children
  // TEXT nodes in Figma can have children (for styling spans) but we want the raw text
  if (node.originalType === 'TEXT') {
    // T185: Use extractTextContent to preserve line breaks
    const content = extractTextContent(node);
    if (content) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasStyles ? ' style={styles}' : ''}>${content}</${htmlTag}>`;
    } else {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasStyles ? ' style={styles}' : ''}></${htmlTag}>`;
    }
  } else {
    // Non-TEXT nodes: check for children
    const hasChildren = 'children' in node && node.children.length > 0;

    if (hasChildren) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasStyles ? ' style={styles}' : ''}>\n`;

      // Recursively generate children
      for (const child of (node as any).children) {
        jsxString += generateJSXElement(child, {}, depth + 1);
      }

      jsxString += `${indent}</${htmlTag}>`;
    } else {
      // Empty leaf node
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasStyles ? ' style={styles}' : ''} />`;
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
