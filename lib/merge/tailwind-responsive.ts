/**
 * Tailwind Responsive Generator
 *
 * Generates mobile-first Tailwind classes with responsive prefixes.
 * Compares styles across breakpoints and emits only the differences.
 *
 * Mobile-first approach:
 * - Base styles (mobile): no prefix
 * - Tablet overrides: md: prefix
 * - Desktop overrides: lg: prefix
 *
 * Optimization:
 * - Identical values across breakpoints emit only at base level
 * - Only differences get breakpoint prefixes
 */

import type { ResponsiveStyles } from '../types/merge';

// ============================================================================
// Types
// ============================================================================

/**
 * Raw Tailwind classes for each breakpoint
 */
export interface StyleSet {
  /** Tailwind classes for mobile breakpoint */
  readonly mobile: string;
  /** Tailwind classes for tablet breakpoint */
  readonly tablet: string;
  /** Tailwind classes for desktop breakpoint */
  readonly desktop: string;
}

/**
 * Parsed Tailwind class with property and value
 */
interface ParsedClass {
  /** The full class name (e.g., "p-4", "text-sm") */
  readonly className: string;
  /** The property prefix (e.g., "p", "text", "bg") */
  readonly property: string;
  /** The value part (e.g., "4", "sm", "white") */
  readonly value: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse a class name into property and value parts.
 * Handles common Tailwind patterns.
 */
function parseClassName(className: string): ParsedClass {
  // Handle negative values (e.g., "-mt-4")
  const isNegative = className.startsWith('-');
  const normalized = isNegative ? className.slice(1) : className;

  // Split on the last hyphen to get property-value pairs
  // e.g., "text-sm" -> ["text", "sm"], "bg-red-500" -> ["bg-red", "500"]
  const lastHyphen = normalized.lastIndexOf('-');

  if (lastHyphen === -1) {
    // Single word class (e.g., "flex", "hidden")
    return {
      className,
      property: normalized,
      value: '',
    };
  }

  // Special handling for color classes (e.g., "bg-red-500", "text-gray-100")
  const colorPattern = /^(bg|text|border|ring|fill|stroke)-([a-z]+)-(\d+)$/;
  const colorMatch = normalized.match(colorPattern);

  if (colorMatch) {
    return {
      className,
      property: colorMatch[1],
      value: `${colorMatch[2]}-${colorMatch[3]}`,
    };
  }

  const property = normalized.slice(0, lastHyphen);
  const value = normalized.slice(lastHyphen + 1);

  return {
    className,
    property: (isNegative ? '-' : '') + property,
    value,
  };
}

/**
 * Split a class string into individual classes.
 * Handles multiple spaces and trims whitespace.
 *
 * WP08 FIX: Handles Tailwind arbitrary values with spaces inside brackets.
 * e.g., "bg-[var(--var, rgba(38, 38, 38, 1))]" should NOT be split.
 */
function splitClasses(classString: string): string[] {
  const trimmed = classString.trim();
  if (!trimmed) return [];

  // If no brackets, use simple split
  if (!trimmed.includes('[')) {
    return trimmed.split(/\s+/).filter((c) => c.length > 0);
  }

  // Handle arbitrary values with spaces inside brackets
  const classes: string[] = [];
  let current = '';
  let bracketDepth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (char === '[') {
      bracketDepth++;
      current += char;
    } else if (char === ']') {
      bracketDepth--;
      current += char;
    } else if (/\s/.test(char) && bracketDepth === 0) {
      // Space outside brackets - end of class
      if (current.length > 0) {
        classes.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Don't forget the last class
  if (current.length > 0) {
    classes.push(current);
  }

  return classes;
}

/**
 * Join classes back into a single string.
 */
function joinClasses(classes: string[]): string {
  return classes.join(' ');
}

/**
 * Remove any existing responsive prefixes from a class.
 */
function stripResponsivePrefix(className: string): string {
  // Remove sm:, md:, lg:, xl:, 2xl: prefixes
  return className.replace(/^(sm:|md:|lg:|xl:|2xl:)/, '');
}

/**
 * Build a property map from a list of classes.
 * Key is the property, value is the full class name.
 */
function buildPropertyMap(classes: string[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const className of classes) {
    const parsed = parseClassName(className);
    map.set(parsed.property, className);
  }

  return map;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Extract style differences between a base and an override.
 * Returns only the classes from override that differ from base.
 *
 * @param base - Base class string
 * @param override - Override class string
 * @returns Classes that are different in override
 */
export function extractStyleDifferences(base: string, override: string): string {
  const baseClasses = splitClasses(base);
  const overrideClasses = splitClasses(override);

  // Build sets for quick lookup
  const baseSet = new Set(baseClasses);
  const basePropertyMap = buildPropertyMap(baseClasses);

  const differences: string[] = [];

  for (const overrideClass of overrideClasses) {
    // If the exact class is in base, skip it
    if (baseSet.has(overrideClass)) {
      continue;
    }

    // Check if this overrides a property from base
    const parsed = parseClassName(overrideClass);
    const baseValue = basePropertyMap.get(parsed.property);

    if (baseValue) {
      // Same property, different value - this is an override
      differences.push(overrideClass);
    } else {
      // New property not in base - also include
      differences.push(overrideClass);
    }
  }

  return joinClasses(differences);
}

/**
 * Add a responsive prefix to each class in a string.
 *
 * @param classString - Space-separated class string
 * @param prefix - Prefix to add (e.g., "md:", "lg:")
 * @returns Classes with prefix added
 */
export function addResponsivePrefix(classString: string, prefix: string): string {
  const classes = splitClasses(classString);
  return classes.map((c) => `${prefix}${c}`).join(' ');
}

/**
 * Generate responsive Tailwind classes from styles at each breakpoint.
 * Implements mobile-first approach with difference extraction.
 *
 * @param styles - Styles for each breakpoint
 * @returns ResponsiveStyles with base, tablet, desktop, and combined classes
 */
export function generateResponsiveClasses(styles: StyleSet): ResponsiveStyles {
  // Base is always mobile (no prefix)
  const base = styles.mobile;

  // Extract what's different in tablet compared to mobile
  const tabletDiff = extractStyleDifferences(styles.mobile, styles.tablet);
  const tablet = tabletDiff ? addResponsivePrefix(tabletDiff, 'md:') : undefined;

  // Extract what's different in desktop compared to tablet
  // (since tablet already includes mobile overrides)
  const desktopDiff = extractStyleDifferences(styles.tablet, styles.desktop);
  const desktop = desktopDiff ? addResponsivePrefix(desktopDiff, 'lg:') : undefined;

  // Combine all classes
  const combined = [base, tablet, desktop]
    .filter((s): s is string => Boolean(s))
    .join(' ')
    .trim();

  return {
    base,
    tablet,
    desktop,
    combined,
  };
}

/**
 * Merge multiple style sets, combining classes from each.
 * Useful when combining layout, typography, and color styles.
 *
 * @param styleSets - Array of StyleSet objects
 * @returns Merged StyleSet
 */
export function mergeStyleSets(...styleSets: StyleSet[]): StyleSet {
  // Use mutable type for building, then return as readonly
  let mobile = '';
  let tablet = '';
  let desktop = '';

  for (const styleSet of styleSets) {
    mobile = joinClasses([...splitClasses(mobile), ...splitClasses(styleSet.mobile)]);
    tablet = joinClasses([...splitClasses(tablet), ...splitClasses(styleSet.tablet)]);
    desktop = joinClasses([...splitClasses(desktop), ...splitClasses(styleSet.desktop)]);
  }

  return { mobile, tablet, desktop };
}

/**
 * Create an empty StyleSet with no classes.
 */
export function createEmptyStyleSet(): StyleSet {
  return {
    mobile: '',
    tablet: '',
    desktop: '',
  };
}

/**
 * Create a uniform StyleSet where all breakpoints have the same classes.
 *
 * @param classes - Classes to use for all breakpoints
 * @returns StyleSet with identical classes
 */
export function createUniformStyleSet(classes: string): StyleSet {
  return {
    mobile: classes,
    tablet: classes,
    desktop: classes,
  };
}
