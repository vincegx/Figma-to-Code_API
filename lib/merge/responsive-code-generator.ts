/**
 * Responsive Code Generator
 *
 * Generates framework-specific code from a unified element tree.
 * Supports React with Tailwind (v3 and v4) and HTML with CSS.
 *
 * Output formats:
 * - react-tailwind: JSX with className containing responsive Tailwind classes
 * - react-tailwind-v4: Same as v3 but may include v4-specific patterns
 * - html-css: HTML with class attributes, could extend to include CSS @media queries
 */

import type { UnifiedElement, FrameworkType } from '../types/merge';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert a name to PascalCase for React component names.
 */
function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Convert a name to camelCase for variable names.
 */
function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Escape special characters in JSX text content.
 */
function escapeJsxText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/**
 * Escape special characters in HTML text content.
 */
function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Get the HTML tag for a Figma node type.
 */
function getHtmlTag(type: string, hasChildren: boolean): string {
  switch (type) {
    case 'TEXT':
      return 'span';
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      return 'div';
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'VECTOR':
      return 'div';
    default:
      return 'div';
  }
}

/**
 * Combine all classes for an element.
 */
function getAllClasses(element: UnifiedElement): string {
  const classes: string[] = [];

  // Add visibility classes first
  if (element.visibilityClasses) {
    classes.push(element.visibilityClasses);
  }

  // Add responsive style classes
  if (element.styles.combined) {
    classes.push(element.styles.combined);
  }

  return classes.join(' ').trim();
}

// ============================================================================
// React Tailwind Generator
// ============================================================================

/**
 * Generate JSX element for React with Tailwind.
 */
function generateReactElement(element: UnifiedElement, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  const childSpaces = ' '.repeat(indent + 2);
  const classes = getAllClasses(element);
  const tag = getHtmlTag(element.type, Boolean(element.children?.length));

  // Text node
  if (element.type === 'TEXT' && element.textContent) {
    if (classes) {
      return `${spaces}<${tag} className="${classes}">${escapeJsxText(element.textContent)}</${tag}>`;
    }
    return `${spaces}<${tag}>${escapeJsxText(element.textContent)}</${tag}>`;
  }

  // Container node
  const openTag = classes
    ? `<${tag} className="${classes}">`
    : `<${tag}>`;

  if (!element.children || element.children.length === 0) {
    // Self-closing for empty containers
    return classes
      ? `${spaces}<${tag} className="${classes}" />`
      : `${spaces}<${tag} />`;
  }

  // With children
  const childrenJsx = element.children
    .map((child) => generateReactElement(child, indent + 2))
    .join('\n');

  return `${spaces}${openTag}\n${childrenJsx}\n${spaces}</${tag}>`;
}

/**
 * Generate a full React component.
 */
function generateReactComponent(
  tree: UnifiedElement,
  componentName: string,
  isV4: boolean = false
): string {
  const lines: string[] = [];

  // Import statement (optional for v4)
  if (isV4) {
    lines.push("import React from 'react';");
    lines.push('');
  }

  // Component declaration
  lines.push(`export function ${componentName}() {`);
  lines.push('  return (');

  // Root element
  const rootClasses = getAllClasses(tree);
  if (tree.children && tree.children.length > 0) {
    if (rootClasses) {
      lines.push(`    <div className="${rootClasses}">`);
    } else {
      lines.push('    <>');
    }

    for (const child of tree.children) {
      lines.push(generateReactElement(child, 6));
    }

    if (rootClasses) {
      lines.push('    </div>');
    } else {
      lines.push('    </>');
    }
  } else {
    // Empty component
    lines.push('    <div />');
  }

  lines.push('  );');
  lines.push('}');

  return lines.join('\n');
}

// ============================================================================
// HTML/CSS Generator
// ============================================================================

/**
 * Generate HTML element.
 */
function generateHtmlElement(element: UnifiedElement, indent: number = 2): string {
  const spaces = ' '.repeat(indent);
  const classes = getAllClasses(element);
  const tag = getHtmlTag(element.type, Boolean(element.children?.length));

  // Text node
  if (element.type === 'TEXT' && element.textContent) {
    if (classes) {
      return `${spaces}<${tag} class="${classes}">${escapeHtmlText(element.textContent)}</${tag}>`;
    }
    return `${spaces}<${tag}>${escapeHtmlText(element.textContent)}</${tag}>`;
  }

  // Container node
  if (!element.children || element.children.length === 0) {
    // Self-closing (using HTML5 style)
    return classes
      ? `${spaces}<${tag} class="${classes}"></${tag}>`
      : `${spaces}<${tag}></${tag}>`;
  }

  // With children
  const openTag = classes
    ? `<${tag} class="${classes}">`
    : `<${tag}>`;

  const childrenHtml = element.children
    .map((child) => generateHtmlElement(child, indent + 2))
    .join('\n');

  return `${spaces}${openTag}\n${childrenHtml}\n${spaces}</${tag}>`;
}

/**
 * Generate full HTML document/snippet.
 */
function generateHtmlDocument(tree: UnifiedElement): string {
  const lines: string[] = [];

  // Add a comment about Tailwind requirement
  lines.push('<!-- This HTML requires Tailwind CSS for styling -->');
  lines.push('');

  // Root container
  const rootClasses = getAllClasses(tree);
  if (tree.children && tree.children.length > 0) {
    if (rootClasses) {
      lines.push(`<div class="${rootClasses}">`);
    } else {
      lines.push('<div>');
    }

    for (const child of tree.children) {
      lines.push(generateHtmlElement(child, 2));
    }

    lines.push('</div>');
  } else {
    lines.push('<div></div>');
  }

  return lines.join('\n');
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate code for a unified element tree in the specified framework.
 *
 * @param unifiedTree - The unified element tree from merge
 * @param framework - Target framework (react-tailwind, react-tailwind-v4, html-css)
 * @returns Generated code string
 */
export function generateResponsiveCode(
  unifiedTree: UnifiedElement,
  framework: FrameworkType
): string {
  const componentName = toPascalCase(unifiedTree.name || 'ResponsiveComponent');

  switch (framework) {
    case 'react-tailwind':
      return generateReactComponent(unifiedTree, componentName, false);

    case 'react-tailwind-v4':
      return generateReactComponent(unifiedTree, componentName, true);

    case 'html-css':
      return generateHtmlDocument(unifiedTree);

    default:
      // Type-safe exhaustive check
      const _exhaustive: never = framework;
      throw new Error(`Unknown framework: ${_exhaustive}`);
  }
}

/**
 * Generate code for a specific element (not full component).
 * Useful for previews or partial exports.
 */
export function generateElementCode(
  element: UnifiedElement,
  framework: FrameworkType
): string {
  switch (framework) {
    case 'react-tailwind':
    case 'react-tailwind-v4':
      return generateReactElement(element, 0);

    case 'html-css':
      return generateHtmlElement(element, 0);

    default:
      const _exhaustive: never = framework;
      throw new Error(`Unknown framework: ${_exhaustive}`);
  }
}
