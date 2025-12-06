/**
 * Merged Code Generator
 *
 * Generates React/Tailwind code from a UnifiedElement tree with pre-merged Tailwind classes.
 * Unlike the standard generator (react-tailwind.ts), this one:
 * - Takes pre-merged Tailwind classes (no CSS→Tailwind conversion needed)
 * - Handles assets per breakpoint with visibility classes
 * - Produces responsive code with mobile-first approach
 *
 * This generator is specifically for the merge feature (002-responsive-merge-manager).
 */

import type { UnifiedElement, ResponsiveAssets, BreakpointAssets, FrameworkType } from '../types/merge';
import type { FillData } from '../altnode-transform';
import {
  toPascalCase,
  extractTextContent,
  scaleModeToTailwind,
  truncateLayerName,
} from '../code-generators/helpers';

// ============================================================================
// Types
// ============================================================================

/**
 * Output from the merged code generator
 */
export interface MergedCodeOutput {
  /** Generated JSX/HTML code */
  code: string;
  /** Google Fonts URL if fonts detected */
  googleFontsUrl?: string;
  /** Import statements needed */
  imports: string[];
}

/**
 * Context passed through recursive generation
 */
interface GenerationContext {
  /** Current indentation depth */
  depth: number;
  /** Node ID prefix for API routes (e.g., "lib-123-456") */
  nodeIdPrefix: string;
  /** Framework target */
  framework: FrameworkType;
  /** Collected font families with weights */
  fonts: Map<string, Set<number>>;
}

// ============================================================================
// Visibility Classes
// ============================================================================

const VISIBILITY_CLASSES = {
  mobileOnly: 'block md:hidden',
  tabletOnly: 'hidden md:block lg:hidden',
  desktopOnly: 'hidden lg:block',
  mobileTablet: 'lg:hidden',
  tabletDesktop: 'hidden md:block',
  mobileDesktop: 'md:hidden lg:block',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

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
    ELLIPSE: 'div',
    LINE: 'div',
    VECTOR: 'div',
    BOOLEAN_OPERATION: 'div',
  };
  return mapping[nodeType] || 'div';
}

/**
 * Convert FillData solid color to CSS rgba string
 */
function fillDataToColorCSS(fill: FillData): string {
  if (!fill.color) return '';
  const { r, g, b, a = 1 } = fill.color;
  const fillOpacity = fill.opacity ?? 1;
  const finalAlpha = a * fillOpacity;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha})`;
}

/**
 * Convert FillData gradient to CSS gradient string
 */
function fillDataToGradientCSS(fill: FillData): string {
  if (!fill.gradientStops) return '';

  const fillOpacity = fill.opacity ?? 1;
  const stops = fill.gradientStops
    .map(stop => {
      const { r, g, b, a = 1 } = stop.color;
      const finalAlpha = a * fillOpacity;
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha}) ${Math.round(stop.position * 100)}%`;
    })
    .join(', ');

  let angle = 180;
  if (fill.gradientHandlePositions && fill.gradientHandlePositions.length >= 2) {
    const [start, end] = fill.gradientHandlePositions;
    angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90);
  }

  if (fill.type === 'GRADIENT_RADIAL') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * Build image URL from imageRef and nodeIdPrefix
 */
function buildImageUrl(imageRef: string, nodeIdPrefix: string): string {
  const realNodeId = nodeIdPrefix.startsWith('lib-') ? nodeIdPrefix.replace('lib-', '') : nodeIdPrefix;
  const filename = `${realNodeId}_${imageRef.substring(0, 8)}.png`;
  return `/api/images/${nodeIdPrefix}/${filename}`;
}

/**
 * Check if assets are identical across all present breakpoints
 */
function areAssetsIdentical(assets: ResponsiveAssets): boolean {
  if (assets.isUniform) return true;

  const presentAssets: BreakpointAssets[] = [];
  if (assets.mobile) presentAssets.push(assets.mobile);
  if (assets.tablet) presentAssets.push(assets.tablet);
  if (assets.desktop) presentAssets.push(assets.desktop);

  if (presentAssets.length <= 1) return true;

  // Compare imageRefs
  const imageRefs = presentAssets.map(a => a.imageData?.imageRef).filter(Boolean);
  if (imageRefs.length > 0) {
    const uniqueRefs = new Set(imageRefs);
    if (uniqueRefs.size > 1) return false;
  }

  return true;
}

// ============================================================================
// Asset Rendering
// ============================================================================

/**
 * Render image assets with visibility classes for different breakpoints
 */
function renderResponsiveImages(
  assets: ResponsiveAssets,
  nodeIdPrefix: string,
  indent: string,
  altText: string
): string {
  const lines: string[] = [];

  // If assets are identical, render single image
  if (areAssetsIdentical(assets)) {
    const asset = assets.mobile || assets.tablet || assets.desktop;
    if (asset?.imageData) {
      const imageUrl = buildImageUrl(asset.imageData.imageRef, nodeIdPrefix);
      const objectFitClass = scaleModeToTailwind(asset.imageData.scaleMode);
      lines.push(`${indent}<img className="absolute inset-0 w-full h-full ${objectFitClass}" alt="${altText}" src="${imageUrl}" />`);
    }
    return lines.join('\n');
  }

  // Different images per breakpoint - render all with visibility classes
  if (assets.mobile?.imageData) {
    const imageUrl = buildImageUrl(assets.mobile.imageData.imageRef, nodeIdPrefix);
    const objectFitClass = scaleModeToTailwind(assets.mobile.imageData.scaleMode);
    lines.push(`${indent}<img className="absolute inset-0 w-full h-full ${objectFitClass} ${VISIBILITY_CLASSES.mobileOnly}" alt="${altText}" src="${imageUrl}" />`);
  }

  if (assets.tablet?.imageData) {
    const imageUrl = buildImageUrl(assets.tablet.imageData.imageRef, nodeIdPrefix);
    const objectFitClass = scaleModeToTailwind(assets.tablet.imageData.scaleMode);
    lines.push(`${indent}<img className="absolute inset-0 w-full h-full ${objectFitClass} ${VISIBILITY_CLASSES.tabletOnly}" alt="${altText}" src="${imageUrl}" />`);
  }

  if (assets.desktop?.imageData) {
    const imageUrl = buildImageUrl(assets.desktop.imageData.imageRef, nodeIdPrefix);
    const objectFitClass = scaleModeToTailwind(assets.desktop.imageData.scaleMode);
    lines.push(`${indent}<img className="absolute inset-0 w-full h-full ${objectFitClass} ${VISIBILITY_CLASSES.desktopOnly}" alt="${altText}" src="${imageUrl}" />`);
  }

  return lines.join('\n');
}

/**
 * Render fill layers (solid colors, gradients)
 */
function renderFillLayers(
  fillsData: readonly FillData[] | undefined,
  indent: string
): string {
  if (!fillsData || fillsData.length === 0) return '';

  const lines: string[] = [];

  for (const fill of fillsData) {
    if (fill.type === 'SOLID') {
      const colorCSS = fillDataToColorCSS(fill);
      lines.push(`${indent}<div className="absolute inset-0" style={{ backgroundColor: "${colorCSS}" }} />`);
    } else if (fill.type.startsWith('GRADIENT')) {
      const gradientCSS = fillDataToGradientCSS(fill);
      lines.push(`${indent}<div className="absolute inset-0" style={{ backgroundImage: "${gradientCSS}" }} />`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Generate JSX element from UnifiedElement
 */
function generateMergedJSXElement(
  element: UnifiedElement,
  context: GenerationContext
): string {
  const indent = '  '.repeat(context.depth + 1);
  const htmlTag = mapNodeTypeToHTMLTag(element.type);

  // Data attributes for debugging
  const dataAttrs = `data-layer="${truncateLayerName(element.name)}" data-element-id="${element.id}"`;

  // Combined classes: visibility + merged Tailwind
  const allClasses = [
    element.visibilityClasses,
    element.mergedTailwindClasses,
  ].filter(Boolean).join(' ');

  const hasClasses = allClasses.length > 0;
  const classAttr = hasClasses ? ` className="${allClasses}"` : '';

  // Check for assets and children
  const hasAssets = element.assets && !element.assets.isUniform;
  const hasImageAssets = element.assets && (
    element.assets.mobile?.imageData ||
    element.assets.tablet?.imageData ||
    element.assets.desktop?.imageData
  );
  const hasFillAssets = element.assets && (
    element.assets.mobile?.fillsData?.length ||
    element.assets.tablet?.fillsData?.length ||
    element.assets.desktop?.fillsData?.length
  );
  const hasChildren = element.children && element.children.length > 0;

  // WP08 FIX: Add 'relative' to elements with absolute-positioned assets
  // Without 'relative', the 'absolute inset-0' children escape their container
  const needsRelative = (hasImageAssets || hasFillAssets) && !allClasses.includes('relative') && !allClasses.includes('absolute');
  const finalClasses = needsRelative ? `relative ${allClasses}`.trim() : allClasses;
  const finalClassAttr = finalClasses.length > 0 ? ` className="${finalClasses}"` : '';

  let jsxString = '';

  // TEXT nodes
  if (element.type === 'TEXT') {
    const content = element.textContent || '';
    jsxString = `${indent}<${htmlTag} ${dataAttrs}${classAttr}>${content}</${htmlTag}>\n`;
    return jsxString;
  }

  // Elements with responsive assets (images/fills)
  if (hasImageAssets || hasFillAssets) {
    jsxString += `${indent}<${htmlTag} ${dataAttrs}${finalClassAttr}>\n`;

    // Render asset layers
    jsxString += `${indent}  <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">\n`;

    // Render fills first (background colors/gradients)
    if (hasFillAssets) {
      const fillsData = element.assets?.mobile?.fillsData ||
                        element.assets?.tablet?.fillsData ||
                        element.assets?.desktop?.fillsData;
      jsxString += renderFillLayers(fillsData, `${indent}    `) + '\n';
    }

    // Render images
    if (hasImageAssets && element.assets) {
      jsxString += renderResponsiveImages(element.assets, context.nodeIdPrefix, `${indent}    `, element.name) + '\n';
    }

    jsxString += `${indent}  </div>\n`;

    // Render children
    if (hasChildren) {
      for (const child of element.children!) {
        jsxString += generateMergedJSXElement(child, {
          ...context,
          depth: context.depth + 1,
        });
      }
    }

    jsxString += `${indent}</${htmlTag}>\n`;
  } else if (hasChildren) {
    // Container with children, no special assets
    jsxString += `${indent}<${htmlTag} ${dataAttrs}${classAttr}>\n`;

    for (const child of element.children!) {
      jsxString += generateMergedJSXElement(child, {
        ...context,
        depth: context.depth + 1,
      });
    }

    jsxString += `${indent}</${htmlTag}>\n`;
  } else {
    // Leaf node
    jsxString = `${indent}<${htmlTag} ${dataAttrs}${classAttr} />\n`;
  }

  return jsxString;
}

/**
 * Extract fonts from UnifiedElement tree
 */
function extractFontsFromTree(element: UnifiedElement, fonts: Map<string, Set<number>>): void {
  // Parse font-family from merged classes (e.g., "font-['Inter']")
  const fontMatch = element.mergedTailwindClasses.match(/font-\['([^']+)'\]/);
  if (fontMatch) {
    const fontFamily = fontMatch[1];
    if (!fonts.has(fontFamily)) {
      fonts.set(fontFamily, new Set([400])); // Default weight
    }
  }

  // Recurse children
  if (element.children) {
    for (const child of element.children) {
      extractFontsFromTree(child, fonts);
    }
  }
}

/**
 * Generate Google Fonts URL from font map
 */
function generateGoogleFontsUrl(fonts: Map<string, Set<number>>): string | undefined {
  if (fonts.size === 0) return undefined;

  const families = Array.from(fonts.entries())
    .map(([font, weights]) => {
      const sortedWeights = Array.from(weights).sort((a, b) => a - b).join(';');
      return `family=${encodeURIComponent(font)}:wght@${sortedWeights}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate React/Tailwind code from a UnifiedElement tree.
 *
 * @param rootElement - The root UnifiedElement with merged Tailwind classes
 * @param nodeIdPrefix - Node ID prefix for building asset URLs
 * @param framework - Target framework (react-tailwind, react-tailwind-v4, html-css)
 * @returns Generated code with imports and font URL
 */
export function generateMergedReactTailwind(
  rootElement: UnifiedElement,
  nodeIdPrefix: string,
  framework: FrameworkType = 'react-tailwind'
): MergedCodeOutput {
  const componentName = toPascalCase(rootElement.name);
  const fonts = new Map<string, Set<number>>();

  // Create generation context
  const context: GenerationContext = {
    depth: 0,
    nodeIdPrefix,
    framework,
    fonts,
  };

  // Extract fonts from tree
  extractFontsFromTree(rootElement, fonts);

  // Generate JSX body
  const jsxBody = generateMergedJSXElement(rootElement, context);

  // Build complete component
  const code = `export function ${componentName}() {
  return (
${jsxBody}  );
}
`;

  return {
    code,
    googleFontsUrl: generateGoogleFontsUrl(fonts),
    imports: [],
  };
}

/**
 * Generate HTML/CSS code from a UnifiedElement tree.
 * Uses the same logic as React but outputs plain HTML.
 *
 * @param rootElement - The root UnifiedElement with merged Tailwind classes
 * @param nodeIdPrefix - Node ID prefix for building asset URLs
 * @returns Generated HTML code
 */
export function generateMergedHTMLCSS(
  rootElement: UnifiedElement,
  nodeIdPrefix: string
): MergedCodeOutput {
  // For HTML-CSS, we generate the same structure but without React wrapper
  const context: GenerationContext = {
    depth: -1, // Start at -1 so first element is at indent 0
    nodeIdPrefix,
    framework: 'html-css',
    fonts: new Map(),
  };

  const htmlBody = generateMergedJSXElement(rootElement, context);

  return {
    code: htmlBody,
    googleFontsUrl: undefined,
    imports: [],
  };
}
