/**
 * WP39 T320: Tailwind Core Utilities
 *
 * Centralized utilities for Tailwind class generation.
 * Used by react-tailwind.ts, react-tailwind-v4.ts, and html-unocss.ts
 *
 * IMPORTANT: This file extracts SHARED utilities.
 * The original react-tailwind.ts is NOT modified to preserve stability.
 * New generators (v4, UnoCSS) will import from here.
 */

import type { SimpleAltNode, FillData } from '../altnode-transform';
import { cssPropToTailwind } from './helpers';
import { deduplicateTailwindClasses, type TailwindVersion, type ClassMapper } from './class-mapper';

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { cssPropToTailwind } from './helpers';
export { deduplicateTailwindClasses, type TailwindVersion, type ClassMapper } from './class-mapper';
export type { SimpleAltNode, FillData } from '../altnode-transform';

// ============================================================================
// Tailwind Spacing Scale
// ============================================================================

/**
 * Standard Tailwind spacing scale (px → class suffix)
 * Complete scale from 0 to 384px (96)
 */
export const TAILWIND_SPACING_SCALE: Record<number, string> = {
  0: '0',
  1: 'px',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  56: '14',
  64: '16',
  72: '18',
  80: '20',
  96: '24',
  112: '28',
  128: '32',
  144: '36',
  160: '40',
  176: '44',
  192: '48',
  208: '52',
  224: '56',
  240: '60',
  256: '64',
  288: '72',
  320: '80',
  384: '96',
};

// ============================================================================
// Font Extraction Utilities
// ============================================================================

/**
 * Extract font families and their weights from node tree
 * @param node - Root SimpleAltNode
 * @returns Map of font family to set of weights used
 */
export function extractFonts(node: SimpleAltNode): Map<string, Set<number>> {
  const fonts = new Map<string, Set<number>>();

  function traverse(n: SimpleAltNode) {
    if (n.styles?.['font-family']) {
      const fontFamily = String(n.styles['font-family']).replace(/['"]/g, '').split(',')[0].trim();
      if (fontFamily) {
        if (!fonts.has(fontFamily)) {
          fonts.set(fontFamily, new Set<number>());
        }
        const weight = parseInt(String(n.styles['font-weight'] || '400'), 10);
        fonts.get(fontFamily)!.add(weight);
      }
    }
    n.children?.forEach(traverse);
  }

  traverse(node);
  return fonts;
}

/**
 * Generate Google Fonts URL from font map with specific weights
 * @param fonts - Map of font family to weights
 * @returns Google Fonts URL or undefined if no fonts
 */
export function generateGoogleFontsUrl(fonts: Map<string, Set<number>>): string | undefined {
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
// Gradient and Color Utilities
// ============================================================================

/**
 * Convert FillData gradient to CSS gradient string
 * Applies fill opacity to gradient stop colors
 */
export function fillDataToGradientCSS(fill: FillData): string {
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
 * Convert FillData solid color to CSS rgba string
 * Applies fill opacity to color alpha
 */
export function fillDataToColorCSS(fill: FillData): string {
  if (!fill.color) return '';
  const { r, g, b, a = 1 } = fill.color;
  const fillOpacity = fill.opacity ?? 1;
  const finalAlpha = a * fillOpacity;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha})`;
}

// ============================================================================
// Property Cleaning Utilities
// ============================================================================

/**
 * Filter out properties with unresolved variables or empty values
 * @param props - Raw resolved properties from rule evaluation
 * @returns Cleaned properties without $value placeholders
 */
export function cleanResolvedProperties(props: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    const stringValue = String(value);

    // Skip properties with unresolved variables
    if (stringValue.includes('$value') || stringValue.includes('${')) {
      continue;
    }
    // Skip empty values
    if (!stringValue || stringValue.trim() === '') {
      continue;
    }
    cleaned[key] = stringValue;
  }

  return cleaned;
}

// ============================================================================
// Class Normalization Utilities
// ============================================================================

/**
 * Normalize arbitrary value classes to standard Tailwind classes when possible
 * Examples:
 * - gap-[10px] → gap-2.5
 * - gap-[24px] → gap-6
 * - w-[16px] → w-4 (for spacing)
 */
export function normalizeArbitraryValues(classes: string[]): string[] {
  return classes.map(cls => {
    // Match arbitrary px values: gap-[10px], w-[48px], pl-[16px], etc.
    const match = cls.match(/^(gap-|gap-x-|gap-y-|p-|pt-|pb-|pl-|pr-|px-|py-|m-|mt-|mb-|ml-|mr-|mx-|my-)\[(\d+)px\]$/);

    if (match) {
      const prefix = match[1];
      const px = parseInt(match[2], 10);

      // If exact match in standard scale, use it
      if (TAILWIND_SPACING_SCALE[px]) {
        return `${prefix}${TAILWIND_SPACING_SCALE[px]}`;
      }

      // Find nearest standard value (within 5% tolerance) for spacing
      let nearestPx: number | null = null;
      let smallestDiff = Infinity;

      for (const [standardPx] of Object.entries(TAILWIND_SPACING_SCALE)) {
        const stdPx = parseInt(standardPx, 10);
        const diff = Math.abs(px - stdPx);
        const percentDiff = px > 0 ? diff / px : diff;

        if (percentDiff <= 0.05 && diff < smallestDiff) {
          nearestPx = stdPx;
          smallestDiff = diff;
        }
      }

      if (nearestPx !== null) {
        return `${prefix}${TAILWIND_SPACING_SCALE[nearestPx]}`;
      }
    }

    return cls;
  });
}

/**
 * Remove default flex properties that don't need to be specified
 * - flex-nowrap (default)
 * - self-auto (default)
 * - grow-0 (default)
 */
export function removeDefaultFlexProperties(classes: string[]): string[] {
  const defaults = new Set([
    'flex-nowrap',
    'self-auto',
    'grow-0',
    'shrink',
  ]);

  const filtered = classes.filter(cls => !defaults.has(cls));

  // Add explicit defaults for flex containers
  const hasFlex = filtered.some(cls => cls === 'flex' || cls === 'inline-flex');

  if (hasFlex) {
    if (!filtered.some(cls => cls.startsWith('justify-'))) {
      filtered.push('justify-start');
    }
    if (!filtered.some(cls => cls.startsWith('items-'))) {
      filtered.push('items-start');
    }
  }

  return filtered;
}

// ============================================================================
// SVG Utilities
// ============================================================================

/**
 * Generate unique variable name from node name for SVG imports
 * Converts "My Icon" → "myIcon", handles duplicates with suffix
 */
export function generateSvgVarName(nodeName: string, usedNames: Set<string>): string {
  let baseName = nodeName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  if (!baseName) baseName = 'vector';

  let varName = baseName;
  let counter = 2;
  while (usedNames.has(varName)) {
    varName = `${baseName}${counter}`;
    counter++;
  }

  usedNames.add(varName);
  return varName;
}

// ============================================================================
// Text Utilities
// ============================================================================

/**
 * Extract text content with line breaks preserved
 * Converts newlines to <br/> tags for HTML/JSX rendering
 */
export function extractTextContentWithBreaks(node: SimpleAltNode): string {
  const rawText = (node as any).originalNode?.characters || '';
  return rawText
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ============================================================================
// Class Generation Pipeline
// ============================================================================

/**
 * Generate Tailwind classes from CSS properties
 * @param styles - CSS properties object
 * @param version - Target Tailwind version (v3 or v4)
 * @returns Array of Tailwind class strings
 */
export function generateClassesFromStyles(
  styles: Record<string, string>,
  version: TailwindVersion = 'v3'
): string[] {
  const classes: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    const cls = cssPropToTailwind(property, value);
    if (cls) {
      // Handle multiple classes (e.g., "py-3 px-5" from padding)
      classes.push(...cls.split(' ').filter(Boolean));
    }
  }

  return deduplicateTailwindClasses(classes);
}

/**
 * Full class generation pipeline with all post-processing
 */
export function processClasses(classes: string[], version: TailwindVersion = 'v3'): string[] {
  // 1. Deduplicate
  let result = deduplicateTailwindClasses(classes);

  // 2. Normalize arbitrary values to standard classes
  result = normalizeArbitraryValues(result);

  // 3. Remove negative gap classes (invalid CSS)
  result = result.filter(cls => !cls.match(/^gap(-[xy])?\[-\d/));

  // 4. Remove default flex properties
  result = removeDefaultFlexProperties(result);

  return result;
}
