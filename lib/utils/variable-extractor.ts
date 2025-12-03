/**
 * WP31: Variable Extractor
 *
 * Extracts boundVariables from Figma nodes and creates a mapping file.
 * Variables are saved with auto-generated names that can be updated later
 * when user provides real names from Figma plugin export.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const VARIABLES_FILE = path.join(process.cwd(), 'figma-data', 'rules', 'system-variables.json');

/**
 * Extracted variable structure
 */
export interface ExtractedVariable {
  name: string;           // Auto-generated CSS name (e.g., "var-125-11")
  realName: string | null; // Real Figma name after user update (e.g., "margin/r")
  type: VariableType;     // Inferred type
  value: string | number; // Resolved value
  usageCount: number;     // How many times used
}

export type VariableType = 'color' | 'spacing' | 'fontSize' | 'borderRadius' | 'size' | 'other';

export interface VariablesMap {
  variables: Record<string, ExtractedVariable>;
  lastUpdated: string;
  version: number;
}

/**
 * Infer variable type from property name
 */
function inferVariableType(propertyName: string): VariableType {
  const prop = propertyName.toLowerCase();

  if (prop.includes('color') || prop.includes('fill') || prop.includes('stroke')) {
    return 'color';
  }
  if (prop.includes('padding') || prop.includes('spacing') || prop.includes('gap') || prop.includes('margin')) {
    return 'spacing';
  }
  if (prop.includes('fontsize') || prop.includes('font')) {
    return 'fontSize';
  }
  if (prop.includes('corner') || prop.includes('radius')) {
    return 'borderRadius';
  }
  if (prop.includes('size') || prop.includes('width') || prop.includes('height')) {
    return 'size';
  }
  return 'other';
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
 * Generate CSS-safe variable name from ID and type
 * "125:11" + "spacing" → "var-125-11-spacing"
 */
function generateCssName(shortId: string, type: VariableType): string {
  return `var-${shortId.replace(/:/g, '-')}-${type}`;
}

/**
 * Convert color object to hex string
 */
function colorToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  if (color.a !== undefined && color.a < 1) {
    return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
  }
  return hex;
}

/**
 * Extract all boundVariables from a Figma node tree
 */
export function extractVariablesFromNode(node: any): Record<string, { type: VariableType; value: any; count: number }> {
  const variables: Record<string, { type: VariableType; value: any; count: number }> = {};

  function processNode(n: any) {
    // Process node-level boundVariables
    const boundVars = n.boundVariables || {};
    for (const [prop, ref] of Object.entries(boundVars)) {
      const resolvedValue = n[prop] ?? (prop === 'rectangleCornerRadii' ? n.cornerRadius : null);
      processVariableRef(prop, ref, resolvedValue, n);
    }

    // Process fills boundVariables
    for (const fill of n.fills || []) {
      if (fill.boundVariables?.color) {
        const colorValue = fill.color ? colorToHex(fill.color) : '#000000';
        processVariableRef('fills.color', fill.boundVariables.color, colorValue, n);
      }
    }

    // Process strokes boundVariables
    for (const stroke of n.strokes || []) {
      if (stroke.boundVariables?.color) {
        const colorValue = stroke.color ? colorToHex(stroke.color) : '#000000';
        processVariableRef('strokes.color', stroke.boundVariables.color, colorValue, n);
      }
    }

    // Recurse children
    for (const child of n.children || []) {
      processNode(child);
    }
  }

  function processVariableRef(prop: string, ref: any, resolvedValue: any, node: any) {
    // Handle arrays of refs
    const refs = Array.isArray(ref) ? ref : [ref];

    for (const r of refs) {
      // Handle nested refs first (like rectangleCornerRadii with individual corners)
      if (!r?.id && typeof r === 'object') {
        for (const [subProp, subRef] of Object.entries(r)) {
          if ((subRef as any)?.id) {
            processVariableRef(`${prop}.${subProp}`, subRef, resolvedValue, node);
          }
        }
        continue;
      }

      if (!r?.id) continue;

      const shortId = extractShortId(r.id);
      const type = inferVariableType(prop);

      // Get resolved value
      let value = resolvedValue;
      if (typeof value === 'object' && value !== null) {
        if ('r' in value && 'g' in value && 'b' in value) {
          value = colorToHex(value);
        } else if ('x' in value) {
          value = value.x; // size.x
        } else if (Array.isArray(value)) {
          value = value[0];
        }
      }

      if (variables[shortId]) {
        variables[shortId].count++;
      } else {
        variables[shortId] = {
          type,
          value: value ?? 0,
          count: 1
        };
      }
    }
  }

  processNode(node);
  return variables;
}

/**
 * Format extracted variables for per-node storage
 * Creates a structure that can be used by code generators
 */
export function formatExtractedVariablesForStorage(
  extracted: Record<string, { type: VariableType; value: any; count: number }>
): Record<string, ExtractedVariable> {
  const formatted: Record<string, ExtractedVariable> = {};

  for (const [shortId, data] of Object.entries(extracted)) {
    formatted[shortId] = {
      name: generateCssName(shortId, data.type),
      realName: null,
      type: data.type,
      value: data.value,
      usageCount: data.count
    };
  }

  return formatted;
}

/**
 * Load existing variables map
 */
export async function loadVariablesMap(): Promise<VariablesMap> {
  try {
    const content = await fs.readFile(VARIABLES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      variables: {},
      lastUpdated: new Date().toISOString(),
      version: 1
    };
  }
}

/**
 * Save variables map
 */
export async function saveVariablesMap(map: VariablesMap): Promise<void> {
  const dir = path.dirname(VARIABLES_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(VARIABLES_FILE, JSON.stringify(map, null, 2), 'utf-8');
}

/**
 * Merge extracted variables into existing map
 * Preserves realName if already set by user
 */
export async function mergeExtractedVariables(
  extracted: Record<string, { type: VariableType; value: any; count: number }>
): Promise<VariablesMap> {
  const existing = await loadVariablesMap();

  for (const [shortId, data] of Object.entries(extracted)) {
    if (existing.variables[shortId]) {
      // Update count and value, preserve realName
      existing.variables[shortId].usageCount = data.count;
      existing.variables[shortId].value = data.value;
      existing.variables[shortId].type = data.type;
    } else {
      // New variable
      existing.variables[shortId] = {
        name: generateCssName(shortId, data.type),
        realName: null,
        type: data.type,
        value: data.value,
        usageCount: data.count
      };
    }
  }

  existing.lastUpdated = new Date().toISOString();
  existing.version++;

  await saveVariablesMap(existing);
  console.log(`✅ Saved ${Object.keys(extracted).length} variables to system-variables.json`);

  return existing;
}

/**
 * Update variable names from user-provided mapping
 * Input format: { "125:11": "margin/r", "112:554": "colors/white" }
 */
export async function updateVariableNames(
  nameMapping: Record<string, string>
): Promise<VariablesMap> {
  const existing = await loadVariablesMap();

  for (const [shortId, realName] of Object.entries(nameMapping)) {
    if (existing.variables[shortId]) {
      existing.variables[shortId].realName = realName;
      // Generate CSS-safe name from real name
      existing.variables[shortId].name = realName
        .replace(/\//g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
    }
  }

  existing.lastUpdated = new Date().toISOString();
  existing.version++;

  await saveVariablesMap(existing);
  console.log(`✅ Updated ${Object.keys(nameMapping).length} variable names`);

  return existing;
}

/**
 * Get CSS variable name for a Figma variable ID
 * Returns the real name if available, otherwise auto-generated name
 */
export async function getVariableCssName(fullId: string): Promise<string | null> {
  const shortId = extractShortId(fullId);
  const map = await loadVariablesMap();

  const variable = map.variables[shortId];
  if (!variable) return null;

  return variable.name;
}

/**
 * Synchronous version using cached map (for use in transform)
 */
let cachedMap: VariablesMap | null = null;

export function setCachedVariablesMap(map: VariablesMap): void {
  cachedMap = map;
}

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
function formatValueForCss(type: VariableType, value: any): string {
  if (type === 'color') {
    // Color values are already stored as hex or rgba
    if (typeof value === 'string') {
      return value;
    }
    // Handle color object stored in value (from FillData)
    if (value && typeof value === 'object' && value.color) {
      const c = value.color;
      if (c.a !== undefined && c.a < 1) {
        return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a})`;
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
    if (value.value !== undefined) {
      return String(value.value);
    }
    // For complex objects like Device/Type variants, extract first value
    const keys = Object.keys(value);
    if (keys.length > 0 && value[keys[0]]?.value !== undefined) {
      return String(value[keys[0]].value);
    }
    // Skip complex objects that can't be converted to CSS
    return 'unset';
  }

  return String(value);
}
