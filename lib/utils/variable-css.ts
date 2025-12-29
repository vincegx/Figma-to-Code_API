/**
 * WP31: CSS Variable Utilities (Client-safe)
 *
 * This module contains functions for working with CSS variables that can be
 * safely imported in client-side code (no fs/node dependencies).
 */

export type VariableType = 'color' | 'spacing' | 'fontSize' | 'borderRadius' | 'size' | 'other';

export interface ExtractedVariable {
  name: string;           // Auto-generated CSS name (e.g., "var-125-11")
  realName: string | null; // Real Figma name after user update (e.g., "margin/r")
  type: VariableType;     // Inferred type
  value: string | number | object; // Resolved value
  usageCount: number;     // How many times used
}

export interface VariablesMap {
  variables: Record<string, ExtractedVariable>;
  lastUpdated: string;
  version: number;
}

/**
 * Cache for variables map (set by server-side code before code generation)
 */
let cachedMap: VariablesMap | null = null;

/**
 * Set the cached variables map (call from server-side before generating code)
 */
export function setCachedVariablesMap(map: VariablesMap): void {
  cachedMap = map;
}

/**
 * Get the cached variables map
 */
export function getCachedVariablesMap(): VariablesMap | null {
  return cachedMap;
}

/**
 * Extract short ID from full variable ID
 * "VariableID:710641395bac9f5822c4c329c8e7d6bb6fc986f8/125:11" → "125:11"
 */
function extractShortId(fullId: string): string {
  const match = fullId.match(/(\d+:\d+)$/);
  return match ? match[1] : fullId;
}

/**
 * Get CSS variable name for a Figma variable ID (sync version using cache)
 */
export function getVariableCssNameSync(fullId: string): string | null {
  if (!cachedMap) return null;

  const shortId = extractShortId(fullId);
  const variable = cachedMap.variables[shortId];

  return variable?.name || null;
}

/**
 * Generate CSS :root block with all variable definitions
 * Used by code generators to include variable definitions in output
 */
export function generateCssVariableDefinitions(): string {
  if (!cachedMap || Object.keys(cachedMap.variables).length === 0) {
    return '';
  }

  const lines: string[] = [];
  lines.push(':root {');

  for (const [_shortId, variable] of Object.entries(cachedMap.variables)) {
    const cssValue = formatValueForCss(variable.type, variable.value);
    lines.push(`  --${variable.name}: ${cssValue};`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Format a variable value for CSS output
 */
function formatValueForCss(type: VariableType, value: string | number | object): string {
  if (type === 'color') {
    // Color values are already stored as hex or rgba
    if (typeof value === 'string') {
      return value;
    }
    // Handle color object stored in value (from FillData)
    if (value && typeof value === 'object' && 'color' in value) {
      const v = value as { color: { r: number; g: number; b: number; a?: number }; opacity?: number };
      const c = v.color;
      // Multiply color alpha by fill/stroke opacity (both can affect transparency)
      const colorAlpha = c.a ?? 1;
      const fillOpacity = v.opacity ?? 1;
      const finalAlpha = colorAlpha * fillOpacity;
      if (finalAlpha < 1) {
        return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${finalAlpha})`;
      }
      const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
      return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
    }
  }

  if (type === 'spacing' || type === 'fontSize' || type === 'borderRadius' || type === 'size') {
    // Numeric values need px unit
    if (typeof value === 'number') {
      return `${value}px`;
    }
  }

  // Handle variant/component variables (complex objects)
  if (type === 'other' && typeof value === 'object' && value !== null) {
    // Try to extract a meaningful value from variant objects
    if ('value' in value) {
      return String((value as { value: unknown }).value);
    }
    // For complex objects like Device/Type variants, extract first value
    const keys = Object.keys(value);
    if (keys.length > 0) {
      const first = (value as Record<string, { value?: unknown }>)[keys[0]];
      if (first?.value !== undefined) {
        return String(first.value);
      }
    }
    // Skip complex objects that can't be converted to CSS
    return 'unset';
  }

  return String(value);
}
