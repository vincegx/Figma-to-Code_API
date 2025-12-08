/**
 * Style Difference Computation
 *
 * Functions for normalizing, cleaning, and comparing CSS styles across breakpoints.
 * VERBATIM from merge-simple-alt-nodes.ts
 */

import {
  FIGMA_SPECIFIC_PROPS,
  CSS_DEFAULT_VALUES,
  CAMEL_TO_KEBAB,
  ZERO_IS_MEANINGFUL,
  SHORTHAND_LONGHANDS,
} from '../../constants';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize property name to kebab-case
 */
export function normalizePropertyName(prop: string): string {
  return CAMEL_TO_KEBAB[prop] || prop;
}

/**
 * Check if a property should be excluded (Figma-specific)
 */
function isFigmaSpecificProp(prop: string): boolean {
  const normalized = normalizePropertyName(prop).toLowerCase();
  return FIGMA_SPECIFIC_PROPS.has(normalized) || FIGMA_SPECIFIC_PROPS.has(prop);
}

/**
 * Figma-specific values that should be excluded
 */
const FIGMA_SPECIFIC_VALUES = new Set([
  'PASS_THROUGH',  // Figma's mix-blend-mode default
]);

/**
 * Check if a value is Figma-specific and should be excluded
 */
function isFigmaSpecificValue(value: string | number): boolean {
  return FIGMA_SPECIFIC_VALUES.has(String(value));
}

/**
 * Check if a value contains serialization bug ([object Object])
 */
function hasSerializationBug(value: string | number): boolean {
  return String(value).includes('[object Object]');
}

/**
 * Check if a property has its CSS default value
 */
function isDefaultValue(prop: string, value: string | number): boolean {
  const normalized = normalizePropertyName(prop).toLowerCase();
  const defaultVal = CSS_DEFAULT_VALUES[normalized];
  return defaultVal !== undefined && String(value) === defaultVal;
}

/**
 * Extract numeric value from a CSS value string (e.g., "10.5px" → 10.5)
 * Handles scientific notation (e.g., "1.5e-7px" → 0.00000015)
 */
function extractNumericValue(value: string | number): number | null {
  const str = String(value);
  // Match numbers including scientific notation
  const match = str.match(/^([-\d.]+(?:e[-+]?\d+)?)/i);
  if (match) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Round a numeric CSS value to 2 decimal places
 * e.g., "133.3333282470703px" → "133.33px"
 */
function roundCssValue(value: string | number): string {
  const str = String(value);
  const num = extractNumericValue(value);

  if (num === null) return str;

  // Extract the unit
  const unit = str.replace(/^[-\d.]+(?:e[-+]?\d+)?/i, '');

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  // If the value is essentially 0 (< 0.01), return "0" + unit
  if (Math.abs(rounded) < 0.01) {
    return `0${unit}`;
  }

  // Format without unnecessary decimals
  const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(2).replace(/\.?0+$/, '');

  return `${formatted}${unit}`;
}

/**
 * Check if a value is essentially zero (including scientific notation)
 */
function isEssentiallyZero(value: string | number): boolean {
  const num = extractNumericValue(value);
  return num !== null && Math.abs(num) < 0.01;
}

/**
 * Check if two values are equivalent within a tolerance (for floating point noise)
 * Returns true if they should be considered the same (no diff needed)
 */
export function areValuesEquivalent(
  baseValue: string | number | undefined,
  compareValue: string | number,
  tolerance: number = 0.5
): boolean {
  // If base is undefined, they're not equivalent
  if (baseValue === undefined) return false;

  const baseStr = String(baseValue);
  const compareStr = String(compareValue);

  // Exact string match
  if (baseStr === compareStr) return true;

  // Try numeric comparison with tolerance
  const baseNum = extractNumericValue(baseValue);
  const compareNum = extractNumericValue(compareValue);

  if (baseNum !== null && compareNum !== null) {
    // Both are numeric - compare with tolerance
    const diff = Math.abs(baseNum - compareNum);
    if (diff < tolerance) {
      // Also check the unit is the same
      const baseUnit = baseStr.replace(/^[-\d.]+/, '');
      const compareUnit = compareStr.replace(/^[-\d.]+/, '');
      return baseUnit === compareUnit;
    }
  }

  return false;
}

/**
 * Parse a CSS shorthand value into individual values for each side.
 * CSS shorthand rules:
 * - 1 value: all sides same (10px → [10px, 10px, 10px, 10px])
 * - 2 values: top/bottom, left/right (10px 20px → [10px, 20px, 10px, 20px])
 * - 3 values: top, left/right, bottom (10px 20px 30px → [10px, 20px, 30px, 20px])
 * - 4 values: top, right, bottom, left
 *
 * For gap: 1 value = both, 2 values = [row, column]
 */
function parseShorthandValue(value: string | number, property: string): string[] {
  const str = String(value).trim();
  const parts = str.split(/\s+/);

  // Gap is special: only 2 values [row, column]
  if (property === 'gap') {
    if (parts.length === 1) {
      return [parts[0], parts[0]];
    }
    return [parts[0], parts[1]];
  }

  // Box model properties: 4 values [top, right, bottom, left]
  switch (parts.length) {
    case 1:
      return [parts[0], parts[0], parts[0], parts[0]];
    case 2:
      return [parts[0], parts[1], parts[0], parts[1]];
    case 3:
      return [parts[0], parts[1], parts[2], parts[1]];
    case 4:
      return [parts[0], parts[1], parts[2], parts[3]];
    default:
      return parts;
  }
}

/**
 * Remove redundant longhand properties when shorthand covers them.
 * Parses CSS shorthand values to compare individual sides.
 *
 * Example:
 *   padding: 14px 0px (→ top=14px, right=0px, bottom=14px, left=0px)
 *   padding-top: 14px ✓ matches expanded[0], remove
 *   padding-bottom: 14px ✓ matches expanded[2], remove
 */
function removeRedundantLonghands(styles: Record<string, string | number>): Record<string, string | number> {
  const result = { ...styles };

  for (const [shorthand, longhands] of Object.entries(SHORTHAND_LONGHANDS)) {
    const shorthandValue = result[shorthand];
    if (shorthandValue === undefined) continue;

    // Parse shorthand into individual values
    const expandedValues = parseShorthandValue(shorthandValue, shorthand);

    // Check each longhand individually
    for (let i = 0; i < longhands.length; i++) {
      const longhand = longhands[i];
      const longhandValue = result[longhand];

      if (longhandValue === undefined) continue;

      // Compare longhand with corresponding expanded shorthand value
      const expectedValue = expandedValues[i];
      if (expectedValue && areValuesEquivalent(expectedValue, longhandValue, 0.1)) {
        // Longhand matches shorthand - it's redundant, remove it
        delete result[longhand];
      }
    }
  }

  return result;
}

/**
 * Clean and normalize a styles object:
 * - Remove Figma-specific properties
 * - Remove values with serialization bugs
 * - Normalize property names to kebab-case
 * - Round numeric values to 2 decimal places
 * - Filter out essentially-zero position values (noise)
 * - Optionally remove CSS default values
 */
export function cleanStyles(
  styles: Record<string, string | number>,
  removeDefaults: boolean = false
): Record<string, string | number> {
  const cleaned: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(styles)) {
    // Skip undefined/empty values
    if (value === undefined || value === '') continue;

    // Skip Figma-specific properties
    if (isFigmaSpecificProp(key)) continue;

    // Skip Figma-specific values
    if (isFigmaSpecificValue(value)) continue;

    // Skip values with serialization bug
    if (hasSerializationBug(value)) continue;

    // Normalize property name
    const normalizedKey = normalizePropertyName(key);

    // Skip if we already have this property (avoid duplicates from camelCase/kebab-case)
    if (normalizedKey !== key && normalizedKey in cleaned) continue;

    // Round numeric values
    const roundedValue = roundCssValue(value);

    // Skip essentially-zero position values (noise from Figma)
    // But keep 0 for properties where it's meaningful (like min-width, gap, etc.)
    if (isEssentiallyZero(value) && !ZERO_IS_MEANINGFUL.has(normalizedKey)) {
      // For position properties (left, right, top, bottom), skip ~0 values
      if (['left', 'right', 'top', 'bottom'].includes(normalizedKey)) {
        continue;
      }
    }

    // Optionally skip default values
    if (removeDefaults && isDefaultValue(normalizedKey, roundedValue)) continue;

    cleaned[normalizedKey] = roundedValue;
  }

  // Remove redundant longhands when shorthand covers them
  return removeRedundantLonghands(cleaned);
}

/**
 * Get the CSS reset value for a property that should be "unset" at a breakpoint.
 * Returns null if no reset is needed.
 * @param compareStyles - The styles of the compare breakpoint (to check for flex-grow context)
 */
export function getResetValue(
  property: string,
  baseValue: string | number,
  compareStyles?: Record<string, string | number>
): string | number | null {
  const prop = normalizePropertyName(property).toLowerCase();

  // Width/height: reset to auto, BUT not if base is 100% (FILL) AND compare doesn't have flex-grow
  // When base is 100% and compare has flex-grow, we need w-auto for flex-grow to work properly
  if (prop === 'width' || prop === 'height') {
    // Check if compare has flex-grow (which needs w-auto to work)
    const compareHasFlexGrow = compareStyles && (
      compareStyles['flex-grow'] === '1' ||
      compareStyles['flex-grow'] === 1 ||
      compareStyles['flexGrow'] === '1' ||
      compareStyles['flexGrow'] === 1
    );

    // Don't reset if base value is 100% (FILL) AND compare doesn't have flex-grow
    if (baseValue === '100%' && !compareHasFlexGrow) {
      return null;
    }
    return 'auto';
  }

  // Flex properties
  if (prop === 'flex-grow') {
    return '0';
  }
  if (prop === 'flex-shrink') {
    return '1';
  }

  // Min/max dimensions
  if (prop === 'min-width' || prop === 'min-height') {
    return '0';
  }
  if (prop === 'max-width' || prop === 'max-height') {
    return 'none';
  }

  // Align-self: reset to auto
  if (prop === 'align-self') {
    return 'auto';
  }

  // Gap: reset to 0
  if (prop === 'gap' || prop === 'row-gap' || prop === 'column-gap') {
    return '0';
  }

  // For most other properties, don't generate reset
  return null;
}

/**
 * Compute style differences between two style objects.
 * Returns only the properties that are meaningfully different in 'compare' vs 'base'.
 *
 * Improvements:
 * - Filters out Figma-specific properties
 * - Ignores floating-point noise (< 0.5px differences)
 * - Normalizes property names (camelCase → kebab-case)
 * - Handles reset values for missing properties
 */
export function computeStyleDiff(
  base: Record<string, string | number>,
  compare: Record<string, string | number>
): Record<string, string | number> {
  const diff: Record<string, string | number> = {};

  // Clean both style objects
  const cleanedBase = cleanStyles(base, false);
  const cleanedCompare = cleanStyles(compare, false);

  // Check properties in compare that differ from base
  for (const [key, value] of Object.entries(cleanedCompare)) {
    const baseValue = cleanedBase[key];

    // Skip if values are equivalent (handles floating point noise)
    if (areValuesEquivalent(baseValue, value)) continue;

    // Include in diff if different
    diff[key] = value;
  }

  // Check properties in base that don't exist in compare (need reset)
  for (const [key, baseValue] of Object.entries(cleanedBase)) {
    if (!(key in cleanedCompare)) {
      const resetValue = getResetValue(key, baseValue, cleanedCompare);
      if (resetValue !== null) {
        diff[key] = resetValue;
      }
    }
  }

  return diff;
}
