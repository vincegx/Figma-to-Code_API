/**
 * Merge SimpleAltNodes
 *
 * Merges 3 SimpleAltNodes (mobile, tablet, desktop) into a single SimpleAltNode
 * with responsiveStyles for tablet (md:) and desktop (lg:) overrides.
 *
 * Algorithm:
 * 1. Use mobile as base (mobile-first approach)
 * 2. Match children by layer name across breakpoints
 * 3. Compute style diffs: tablet vs mobile → md, desktop vs tablet → lg
 * 4. Recursively merge children
 * 5. Return merged SimpleAltNode with responsiveStyles
 */

import type { SimpleAltNode, FillData } from '../altnode-transform';
import type { UnifiedElement, ResponsiveStyles } from '../types/merge';
import type { FigmaNodeType } from '../types/figma';
import { getVisibilityClasses } from './visibility-mapper';

// ============================================================================
// Types
// ============================================================================

interface MergedNodeResult {
  node: SimpleAltNode;
  warnings: string[];
}

// ============================================================================
// Style Normalization Constants
// ============================================================================

/**
 * Properties that are Figma-specific and should be excluded from CSS output.
 * These don't translate to valid CSS and create noise in the style diff.
 */
const FIGMA_SPECIFIC_PROPS = new Set([
  'fills',
  'strokes',
  'mix-blend-mode',
  'mixBlendMode',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-linecap (SVG)',
  'stroke-linejoin (SVG)',
]);

/**
 * CSS default values that are implicit and don't need to be specified.
 * Key: property name (kebab-case), Value: default value
 */
const CSS_DEFAULT_VALUES: Record<string, string> = {
  'flex-grow': '0',
  'flex-shrink': '1',
  'flex-wrap': 'nowrap',
  'overflow': 'visible',
  'align-self': 'auto',
  'order': '0',
  'opacity': '1',
  'z-index': 'auto',
};

/**
 * Figma-specific values that should be excluded
 */
const FIGMA_SPECIFIC_VALUES = new Set([
  'PASS_THROUGH',  // Figma's mix-blend-mode default
]);

/**
 * Mapping from camelCase to kebab-case for normalization
 */
const CAMEL_TO_KEBAB: Record<string, string> = {
  'flexDirection': 'flex-direction',
  'flexGrow': 'flex-grow',
  'flexShrink': 'flex-shrink',
  'flexWrap': 'flex-wrap',
  'alignItems': 'align-items',
  'alignSelf': 'align-self',
  'justifyContent': 'justify-content',
  'borderRadius': 'border-radius',
  'paddingTop': 'padding-top',
  'paddingBottom': 'padding-bottom',
  'paddingLeft': 'padding-left',
  'paddingRight': 'padding-right',
  'marginTop': 'margin-top',
  'marginBottom': 'margin-bottom',
  'marginLeft': 'margin-left',
  'marginRight': 'margin-right',
  'borderWidth': 'border-width',
  'borderRightWidth': 'border-right-width',
  'borderLeftWidth': 'border-left-width',
  'borderTopWidth': 'border-top-width',
  'borderBottomWidth': 'border-bottom-width',
  'mixBlendMode': 'mix-blend-mode',
  'backgroundImage': 'background-image',
  'backgroundColor': 'background-color',
  'backgroundSize': 'background-size',
  'lineHeight': 'line-height',
  'fontFamily': 'font-family',
  'fontSize': 'font-size',
  'fontWeight': 'font-weight',
  'textAlign': 'text-align',
  'verticalAlign': 'vertical-align',
  'maxWidth': 'max-width',
  'maxHeight': 'max-height',
  'minWidth': 'min-width',
  'minHeight': 'min-height',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize property name to kebab-case
 */
function normalizePropertyName(prop: string): string {
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
function areValuesEquivalent(
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
 * Properties where 0 is a meaningful reset value (not noise)
 */
const ZERO_IS_MEANINGFUL = new Set([
  'min-width', 'min-height', 'max-width', 'max-height',
  'gap', 'row-gap', 'column-gap',
  'padding', 'margin', 'border-width', 'border-radius',
]);

/**
 * Shorthand to longhand property mappings.
 * Order matters: [top, right, bottom, left] for box model properties
 */
const SHORTHAND_LONGHANDS: Record<string, string[]> = {
  'padding': ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  'margin': ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  'gap': ['row-gap', 'column-gap'],
};

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
function cleanStyles(
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
 * Compute style differences between two style objects.
 * Returns only the properties that are meaningfully different in 'compare' vs 'base'.
 *
 * Improvements:
 * - Filters out Figma-specific properties
 * - Ignores floating-point noise (< 0.5px differences)
 * - Normalizes property names (camelCase → kebab-case)
 * - Handles reset values for missing properties
 */
function computeStyleDiff(
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

/**
 * Get the CSS reset value for a property that should be "unset" at a breakpoint.
 * Returns null if no reset is needed.
 * @param compareStyles - The styles of the compare breakpoint (to check for flex-grow context)
 */
function getResetValue(
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

// ============================================================================
// Layer Name Matching
// ============================================================================

/**
 * Normalize a layer name for matching:
 * - Lowercase
 * - Trim whitespace
 * - Normalize multiple spaces to single space
 * - Remove trailing numbers that might be auto-generated (e.g., "Frame 123" → "frame")
 */
function normalizeLayerName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Remove trailing auto-generated numbers (e.g., "Frame 1234" → "frame")
    .replace(/\s+\d+$/, '');
}

/**
 * Create a matching key that includes occurrence count for duplicate handling.
 * Format: "normalizedName::occurrence" for duplicates, "normalizedName" for first occurrence
 */
function createMatchKey(name: string, duplicateIndex: number): string {
  const normalized = normalizeLayerName(name);
  // If this is a duplicate (duplicateIndex > 0), include occurrence count
  return duplicateIndex > 0 ? `${normalized}::${duplicateIndex}` : normalized;
}

/**
 * Build a matching index for a list of children.
 * Returns a map of matchKey → { node, index, originalName }
 */
interface ChildMatch {
  node: SimpleAltNode;
  index: number;
  originalName: string;
  normalizedName: string;
}

function buildChildrenIndex(children: SimpleAltNode[]): Map<string, ChildMatch> {
  const byKey = new Map<string, ChildMatch>();
  const nameOccurrences = new Map<string, number>();

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const normalized = normalizeLayerName(child.name);

    // Track occurrences for duplicate handling
    const occurrence = (nameOccurrences.get(normalized) ?? 0);
    nameOccurrences.set(normalized, occurrence + 1);

    const matchKey = createMatchKey(child.name, occurrence);

    byKey.set(matchKey, {
      node: child,
      index: i,
      originalName: child.name,
      normalizedName: normalized,
    });
  }

  return byKey;
}

/**
 * Find the best match for a node in another breakpoint's children.
 * Priority:
 * 1. Exact normalized name match (with same duplicate index if applicable)
 * 2. Same type + similar position (within 2 positions)
 * 3. Same type + same relative position (percentage)
 */
function findBestMatch(
  target: ChildMatch,
  candidates: Map<string, ChildMatch>,
  usedKeys: Set<string>,
  totalTargetChildren: number,
  totalCandidateChildren: number
): { key: string; match: ChildMatch } | null {
  // 1. Try exact key match first (normalized name without occurrence suffix)
  if (candidates.has(target.normalizedName) && !usedKeys.has(target.normalizedName)) {
    return { key: target.normalizedName, match: candidates.get(target.normalizedName)! };
  }

  // 2. Try any key with matching normalized name (handles case differences and duplicates)
  for (const [key, candidate] of candidates) {
    if (usedKeys.has(key)) continue;

    // Check normalized name match (handles case differences)
    if (candidate.normalizedName === target.normalizedName) {
      return { key, match: candidate };
    }
  }

  // 3. Fallback: same type + similar position
  const targetType = target.node.type;
  const targetRelativePos = totalTargetChildren > 1
    ? target.index / (totalTargetChildren - 1)
    : 0;

  let bestFallback: { key: string; match: ChildMatch; score: number } | null = null;

  for (const [key, candidate] of candidates) {
    if (usedKeys.has(key)) continue;

    // Must be same type for fallback matching
    if (candidate.node.type !== targetType) continue;

    // Calculate position similarity score
    const candidateRelativePos = totalCandidateChildren > 1
      ? candidate.index / (totalCandidateChildren - 1)
      : 0;

    const positionDiff = Math.abs(target.index - candidate.index);
    const relativePosDiff = Math.abs(targetRelativePos - candidateRelativePos);

    // Score: lower is better
    // Prefer exact position match, then nearby positions, then relative position
    let score = positionDiff * 10 + relativePosDiff * 100;

    // Bonus for similar names (partial match)
    if (candidate.normalizedName.includes(target.normalizedName) ||
        target.normalizedName.includes(candidate.normalizedName)) {
      score -= 50;
    }

    // Only accept if within reasonable bounds (position diff <= 3 or relative diff <= 0.2)
    if (positionDiff <= 3 || relativePosDiff <= 0.2) {
      if (!bestFallback || score < bestFallback.score) {
        bestFallback = { key, match: candidate, score };
      }
    }
  }

  return bestFallback ? { key: bestFallback.key, match: bestFallback.match } : null;
}

/**
 * Match children across 3 breakpoints using improved matching algorithm.
 *
 * Algorithm:
 * 1. Build normalized name index for each breakpoint
 * 2. Match by normalized name (case-insensitive)
 * 3. For unmatched nodes, try type + position fallback
 * 4. Return matched triplets in mobile order, then unmatched
 */
function matchChildrenByName(
  mobileChildren: SimpleAltNode[],
  tabletChildren: SimpleAltNode[],
  desktopChildren: SimpleAltNode[]
): Array<{
  name: string;
  mobile?: SimpleAltNode;
  tablet?: SimpleAltNode;
  desktop?: SimpleAltNode;
}> {
  // Build indexes
  const mobileIndex = buildChildrenIndex(mobileChildren);
  const tabletIndex = buildChildrenIndex(tabletChildren);
  const desktopIndex = buildChildrenIndex(desktopChildren);

  const result: Array<{
    name: string;
    mobile?: SimpleAltNode;
    tablet?: SimpleAltNode;
    desktop?: SimpleAltNode;
  }> = [];

  const usedMobile = new Set<string>();
  const usedTablet = new Set<string>();
  const usedDesktop = new Set<string>();

  // Process mobile children first (mobile-first approach)
  for (const [mobileKey, mobileMatch] of mobileIndex) {
    usedMobile.add(mobileKey);

    // Find tablet match
    const tabletResult = findBestMatch(
      mobileMatch, tabletIndex, usedTablet,
      mobileChildren.length, tabletChildren.length
    );
    if (tabletResult) {
      usedTablet.add(tabletResult.key);
    }

    // Find desktop match
    const desktopResult = findBestMatch(
      mobileMatch, desktopIndex, usedDesktop,
      mobileChildren.length, desktopChildren.length
    );
    if (desktopResult) {
      usedDesktop.add(desktopResult.key);
    }

    result.push({
      name: mobileMatch.originalName,
      mobile: mobileMatch.node,
      tablet: tabletResult?.match.node,
      desktop: desktopResult?.match.node,
    });
  }

  // Process remaining tablet children (not matched to mobile)
  for (const [tabletKey, tabletMatch] of tabletIndex) {
    if (usedTablet.has(tabletKey)) continue;
    usedTablet.add(tabletKey);

    // Try to find desktop match for this tablet-only element
    const desktopResult = findBestMatch(
      tabletMatch, desktopIndex, usedDesktop,
      tabletChildren.length, desktopChildren.length
    );
    if (desktopResult) {
      usedDesktop.add(desktopResult.key);
    }

    result.push({
      name: tabletMatch.originalName,
      mobile: undefined,
      tablet: tabletMatch.node,
      desktop: desktopResult?.match.node,
    });
  }

  // Process remaining desktop children (not matched to mobile or tablet)
  for (const [desktopKey, desktopMatch] of desktopIndex) {
    if (usedDesktop.has(desktopKey)) continue;
    usedDesktop.add(desktopKey);

    result.push({
      name: desktopMatch.originalName,
      mobile: undefined,
      tablet: undefined,
      desktop: desktopMatch.node,
    });
  }

  return result;
}

/**
 * Deep clone a SimpleAltNode (without children, we'll rebuild those)
 */
function cloneNodeWithoutChildren(
  node: SimpleAltNode,
  presence?: { mobile: boolean; tablet: boolean; desktop: boolean }
): SimpleAltNode {
  return {
    id: node.id,
    name: node.name,
    uniqueName: node.uniqueName,
    type: node.type,
    originalType: node.originalType,
    styles: { ...node.styles },
    children: [], // Will be filled by recursive merge
    originalNode: node.originalNode,
    visible: node.visible,
    canBeFlattened: node.canBeFlattened,
    cumulativeRotation: node.cumulativeRotation,
    isIcon: node.isIcon,
    svgData: node.svgData,
    imageData: node.imageData,
    fillsData: node.fillsData ? [...node.fillsData] : undefined,
    negativeItemSpacing: node.negativeItemSpacing,
    layoutDirection: node.layoutDirection,
    maskImageRef: node.maskImageRef,
    presence,
  };
}

// ============================================================================
// Main Merge Function
// ============================================================================

/**
 * Merge a single element from 3 breakpoints into one SimpleAltNode with responsiveStyles.
 */
function mergeElement(
  mobile: SimpleAltNode | undefined,
  tablet: SimpleAltNode | undefined,
  desktop: SimpleAltNode | undefined,
  warnings: string[]
): SimpleAltNode | null {
  // Use mobile as base, fallback to tablet, then desktop
  const base = mobile || tablet || desktop;
  if (!base) return null;

  // Track which breakpoints contain this element
  const presence = {
    mobile: mobile !== undefined,
    tablet: tablet !== undefined,
    desktop: desktop !== undefined,
  };

  // Clone the base node with presence info
  const merged = cloneNodeWithoutChildren(base, presence);

  // Get styles from each breakpoint
  const mobileStyles = mobile?.styles || {};
  const tabletStyles = tablet?.styles || {};
  const desktopStyles = desktop?.styles || {};

  // Use mobile styles as base
  merged.styles = { ...mobileStyles };

  // FIX: Add width: 100% when flex-grow is present but width is missing
  // This ensures responsive overrides (md:w-[Xpx]) work correctly
  // Without this, elements with flex-grow lose their fill behavior when tablet overrides kick in
  const hasFlexGrow = merged.styles['flex-grow'] === '1' || merged.styles['flexGrow'] === '1';
  const hasNoWidth = !merged.styles.width && !merged.styles['width'];
  if (hasFlexGrow && hasNoWidth) {
    merged.styles.width = '100%';
  }

  // Compute responsive overrides
  const mdDiff = computeStyleDiff(mobileStyles, tabletStyles);
  const lgDiff = computeStyleDiff(tabletStyles, desktopStyles);

  // Only add responsiveStyles if there are differences
  if (Object.keys(mdDiff).length > 0 || Object.keys(lgDiff).length > 0) {
    merged.responsiveStyles = {};
    if (Object.keys(mdDiff).length > 0) {
      merged.responsiveStyles.md = mdDiff;
    }
    if (Object.keys(lgDiff).length > 0) {
      merged.responsiveStyles.lg = lgDiff;
    }
  }

  // Merge imageData: prefer mobile, but track if different across breakpoints
  // For now, just use the base's imageData
  // TODO: Handle different images per breakpoint if needed

  // Recursively merge children
  const mobileChildren = mobile?.children || [];
  const tabletChildren = tablet?.children || [];
  const desktopChildren = desktop?.children || [];

  const matchedChildren = matchChildrenByName(mobileChildren, tabletChildren, desktopChildren);

  for (const match of matchedChildren) {
    const mergedChild = mergeElement(match.mobile, match.tablet, match.desktop, warnings);
    if (mergedChild) {
      merged.children.push(mergedChild);
    }
  }

  return merged;
}

/**
 * Merge 3 SimpleAltNodes (mobile, tablet, desktop) into a single responsive SimpleAltNode.
 *
 * @param mobile - Mobile breakpoint node (base, required)
 * @param tablet - Tablet breakpoint node (optional)
 * @param desktop - Desktop breakpoint node (optional)
 * @returns Merged SimpleAltNode with responsiveStyles
 */
export function mergeSimpleAltNodes(
  mobile: SimpleAltNode,
  tablet?: SimpleAltNode,
  desktop?: SimpleAltNode
): MergedNodeResult {
  const warnings: string[] = [];

  const mergedNode = mergeElement(mobile, tablet, desktop, warnings);

  if (!mergedNode) {
    throw new Error('Failed to merge nodes: no valid base node');
  }

  return {
    node: mergedNode,
    warnings,
  };
}

/**
 * Get source node ID for image URL generation.
 * Uses mobile node ID as the canonical source.
 */
export function getSourceNodeId(
  mobile?: SimpleAltNode,
  tablet?: SimpleAltNode,
  desktop?: SimpleAltNode
): string {
  return mobile?.id || tablet?.id || desktop?.id || 'unknown';
}

// ============================================================================
// Tailwind Class Utilities
// ============================================================================

/**
 * Smart split for Tailwind classes that preserves arbitrary values with spaces.
 * e.g., "[background:var(--color, rgba(0, 0, 0, 1))]" stays intact.
 *
 * Standard split(' ') would break:
 *   "[bg:var(--c," "rgba(0," "0," "0))]" ❌
 *
 * Smart split keeps brackets together:
 *   "[background:var(--color, rgba(0, 0, 0, 1))]" ✓
 */
function smartSplitClasses(classString: string): string[] {
  const trimmed = classString.trim();
  if (!trimmed) return [];

  // Fast path: no brackets, use simple split
  if (!trimmed.includes('[')) {
    return trimmed.split(/\s+/).filter(c => c.length > 0);
  }

  // Slow path: track bracket depth
  const classes: string[] = [];
  let current = '';
  let bracketDepth = 0;

  for (const char of trimmed) {
    if (char === '[') {
      bracketDepth++;
      current += char;
    } else if (char === ']') {
      bracketDepth--;
      current += char;
    } else if (/\s/.test(char) && bracketDepth === 0) {
      // Space outside brackets = class boundary
      if (current) {
        classes.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Don't forget last class
  if (current) {
    classes.push(current);
  }

  return classes;
}

// ============================================================================
// SimpleAltNode → UnifiedElement Conversion
// ============================================================================

/**
 * Generate a unique element ID from a name
 */
function generateElementId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Convert SimpleAltNode styles to Tailwind class string.
 * This is a simplified version - the full conversion happens in the code generator.
 *
 * Uses cleanStyles to filter out Figma-specific props, serialization bugs,
 * and normalize property names.
 */
function stylesToTailwindClasses(styles: Record<string, string | number>): string {
  // Clean styles: remove Figma-specific props, normalize names, remove defaults in base
  const cleaned = cleanStyles(styles, true);

  const classes: string[] = [];
  for (const [key, value] of Object.entries(cleaned)) {
    classes.push(`[${key}:${value}]`);
  }

  return classes.join(' ');
}

/**
 * Build ResponsiveStyles from SimpleAltNode styles and responsiveStyles
 */
function buildResponsiveStyles(node: SimpleAltNode): ResponsiveStyles {
  const base = stylesToTailwindClasses(node.styles);
  const tablet = node.responsiveStyles?.md
    ? stylesToTailwindClasses(node.responsiveStyles.md)
    : undefined;
  const desktop = node.responsiveStyles?.lg
    ? stylesToTailwindClasses(node.responsiveStyles.lg)
    : undefined;

  const combined = [
    base,
    tablet ? smartSplitClasses(tablet).map(c => `md:${c}`).join(' ') : '',
    desktop ? smartSplitClasses(desktop).map(c => `lg:${c}`).join(' ') : '',
  ].filter(Boolean).join(' ');

  return { base, tablet, desktop, combined };
}

/**
 * Convert a merged SimpleAltNode to UnifiedElement.
 * Used for stats calculation and UI tree view.
 */
export function toUnifiedElement(node: SimpleAltNode): UnifiedElement {
  // Get presence (default to all true if not set - non-merged node)
  const presence = node.presence ?? { mobile: true, tablet: true, desktop: true };

  // Get visibility classes based on presence
  const visibilityClasses = getVisibilityClasses(presence);

  // Build responsive styles
  const styles = buildResponsiveStyles(node);

  // Recursively convert children
  const children = node.children.length > 0
    ? node.children.map(child => toUnifiedElement(child))
    : undefined;

  // Extract layout properties from originalNode (mobile-first)
  const originalNode = node.originalNode as any;
  const layoutMode = originalNode?.layoutMode as 'HORIZONTAL' | 'VERTICAL' | 'NONE' | undefined;
  const layoutWrap = originalNode?.layoutWrap as 'WRAP' | 'NO_WRAP' | undefined;
  const primaryAxisAlignItems = originalNode?.primaryAxisAlignItems as 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' | undefined;

  return {
    id: generateElementId(node.name),
    name: node.name,
    // Use originalType (Figma type like FRAME, TEXT) for icons, not node.type (HTML tag like div, span)
    type: (node.originalType || node.type) as FigmaNodeType,
    layoutMode,
    layoutWrap,
    primaryAxisAlignItems,
    originalType: node.originalType, // For INSTANCE detection
    presence,
    visibilityClasses,
    styles,
    mergedTailwindClasses: styles.combined,
    textContent: node.originalType === 'TEXT'
      ? (node.originalNode as any)?.characters
      : undefined,
    children,
    sources: {
      mobile: presence.mobile ? { nodeId: node.id, name: node.name } : undefined,
      tablet: presence.tablet ? { nodeId: node.id, name: node.name } : undefined,
      desktop: presence.desktop ? { nodeId: node.id, name: node.name } : undefined,
    },
  };
}
