/**
 * Figma Variables Resolution Utility
 *
 * Handles loading, caching, and resolving Figma design tokens (variables)
 * to CSS custom properties.
 *
 * WP25 T181: Convert Figma variable references to CSS vars
 */

import { fetchVariables } from '../figma-client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Figma variable definition structure
 */
interface FigmaVariable {
  id: string;
  name: string; // e.g., "Colors/Extra/02"
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, any>;
}

/**
 * Cache of loaded variables per file
 */
const variablesCache = new Map<string, Record<string, FigmaVariable>>();

/**
 * Load Figma variables for a file (with caching)
 *
 * Attempts to:
 * 1. Load from cache (in-memory)
 * 2. Load from filesystem (figma-data/{nodeId}/variables.json)
 * 3. Fetch from Figma API and cache to filesystem
 *
 * @param fileKey - Figma file key
 * @param nodeId - Node ID (used for cache path)
 * @returns Map of variable ID → variable definition
 */
export async function loadVariables(
  fileKey: string,
  nodeId: string
): Promise<Record<string, FigmaVariable>> {
  // Check in-memory cache
  const cacheKey = `${fileKey}-${nodeId}`;
  if (variablesCache.has(cacheKey)) {
    return variablesCache.get(cacheKey)!;
  }

  // Try loading from filesystem
  const cachePath = path.join(
    process.cwd(),
    'figma-data',
    nodeId,
    'variables.json'
  );

  if (fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      variablesCache.set(cacheKey, cached);
      return cached;
    } catch (error) {
      console.warn('Failed to load cached variables, fetching from API:', error);
    }
  }

  // Fetch from Figma API
  try {
    const response = await fetchVariables(fileKey);
    const variables = normalizeVariablesResponse(response);

    // Cache to filesystem
    try {
      const dir = path.dirname(cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(cachePath, JSON.stringify(variables, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to cache variables to filesystem:', error);
    }

    // Cache in memory
    variablesCache.set(cacheKey, variables);
    return variables;
  } catch (error) {
    console.warn('Failed to fetch variables from Figma API:', error);
    return {};
  }
}

/**
 * Normalize Figma API variables response to our internal format
 *
 * @param response - Raw API response from fetchVariables()
 * @returns Normalized variables map
 */
function normalizeVariablesResponse(
  response: Record<string, unknown>
): Record<string, FigmaVariable> {
  const normalized: Record<string, FigmaVariable> = {};

  // Figma API structure: { meta: {...}, variableCollections: {...}, variables: {...} }
  const variablesData = (response as any).variables || {};

  for (const [id, variable] of Object.entries(variablesData)) {
    const v = variable as any;
    normalized[id] = {
      id,
      name: v.name || '',
      resolvedType: v.resolvedType || 'COLOR',
      valuesByMode: v.valuesByMode || {},
    };
  }

  return normalized;
}

/**
 * Convert Figma variable name to CSS custom property name
 *
 * Examples:
 * - "Colors/Extra/02" → "Colors-Extra-02"
 * - "Spacing/Small" → "Spacing-Small"
 * - "Typography/Heading/Large" → "Typography-Heading-Large"
 *
 * @param variableName - Figma variable name (with slashes)
 * @returns CSS-safe variable name (with dashes)
 */
export function variableNameToCSSName(variableName: string): string {
  return variableName.replace(/\//g, '-').replace(/\s+/g, '-');
}

/**
 * Resolve a Figma variable reference to a CSS custom property
 *
 * @param variableId - Figma variable ID (e.g., "VariableID:...")
 * @param variables - Loaded variables map
 * @param fallbackValue - Fallback value if variable not found
 * @returns CSS var() expression with fallback
 */
export function resolveVariableToCSSVar(
  variableId: string,
  variables: Record<string, FigmaVariable>,
  fallbackValue: string
): string {
  const variable = variables[variableId];

  if (!variable) {
    // Variable not found, return fallback value directly
    return fallbackValue;
  }

  const cssVarName = variableNameToCSSName(variable.name);

  // Return var() with fallback
  return `var(--${cssVarName}, ${fallbackValue})`;
}

/**
 * Extract CSS variable references from a Figma node's boundVariables
 *
 * @param boundVariables - node.boundVariables object
 * @param propertyType - Type of property (fills, strokes, fontSize, etc.)
 * @returns Array of variable IDs bound to this property
 */
export function extractBoundVariableIds(
  boundVariables: any,
  propertyType: string
): string[] {
  if (!boundVariables || !boundVariables[propertyType]) {
    return [];
  }

  const binding = boundVariables[propertyType];

  // Handle single binding
  if (binding.type === 'VARIABLE_ALIAS') {
    return [binding.id];
  }

  // Handle array of bindings
  if (Array.isArray(binding)) {
    return binding
      .filter((b: any) => b.type === 'VARIABLE_ALIAS')
      .map((b: any) => b.id);
  }

  return [];
}

/**
 * Get the actual color value from a variable (for fallback)
 *
 * @param variable - Variable definition
 * @returns RGBA string or hex string
 */
export function getVariableColorValue(variable: FigmaVariable): string {
  // Get first mode value
  const modeId = Object.keys(variable.valuesByMode)[0];
  if (!modeId) {
    return 'transparent';
  }

  const value = variable.valuesByMode[modeId];

  if (variable.resolvedType === 'COLOR') {
    // Color value structure: { r, g, b, a }
    if (value && typeof value === 'object' && 'r' in value) {
      const { r, g, b, a = 1 } = value;
      if (a === 1) {
        // Convert to hex for cleaner output
        const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      } else {
        // Include alpha in rgba
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      }
    }
  }

  // For non-color variables, return as-is
  return String(value);
}
