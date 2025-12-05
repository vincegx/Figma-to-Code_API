/**
 * Visibility Mapper
 *
 * Generates Tailwind visibility classes based on element presence across breakpoints.
 * Implements FR-006 from the specification.
 *
 * Mobile-first approach:
 * - Base state (mobile): no prefix
 * - Tablet overrides: md: prefix
 * - Desktop overrides: lg: prefix
 *
 * Visibility Logic:
 * - Elements hidden at mobile that appear later use "hidden md:block" or "hidden lg:block"
 * - Elements visible at mobile that hide later use "md:hidden" or "lg:hidden"
 */

import type { Breakpoint } from '../types/merge';

// ============================================================================
// Types
// ============================================================================

/**
 * Presence of an element across breakpoints
 */
export interface ElementPresence {
  readonly mobile: boolean;
  readonly tablet: boolean;
  readonly desktop: boolean;
}

/**
 * Visibility class configuration
 */
export interface VisibilityConfig {
  /** The generated visibility classes */
  readonly classes: string;
  /** Human-readable description of visibility pattern */
  readonly description: string;
  /** Whether this element has partial visibility (not in all breakpoints) */
  readonly isPartial: boolean;
}

// ============================================================================
// Visibility Mapping
// ============================================================================

/**
 * Visibility class mapping based on presence pattern.
 *
 * Pattern key format: "M|T|D" where each is "1" (present) or "0" (absent)
 *
 * FR-006 Specification:
 * - All 3 present: "" (no visibility class needed)
 * - Mobile only: "md:hidden"
 * - Tablet only: "hidden md:block lg:hidden"
 * - Desktop only: "hidden lg:block"
 * - Mobile + Tablet: "lg:hidden"
 * - Tablet + Desktop: "hidden md:block"
 * - Mobile + Desktop: "md:hidden lg:block" (rare edge case)
 * - None present: Should not happen, but handle gracefully
 */
const VISIBILITY_MAP: Record<string, VisibilityConfig> = {
  // All three present - visible everywhere
  '1|1|1': {
    classes: '',
    description: 'Visible on all breakpoints',
    isPartial: false,
  },

  // Single breakpoint visible
  '1|0|0': {
    classes: 'md:hidden',
    description: 'Mobile only',
    isPartial: true,
  },
  '0|1|0': {
    classes: 'hidden md:block lg:hidden',
    description: 'Tablet only',
    isPartial: true,
  },
  '0|0|1': {
    classes: 'hidden lg:block',
    description: 'Desktop only',
    isPartial: true,
  },

  // Two breakpoints visible
  '1|1|0': {
    classes: 'lg:hidden',
    description: 'Mobile and tablet only',
    isPartial: true,
  },
  '0|1|1': {
    classes: 'hidden md:block',
    description: 'Tablet and desktop only',
    isPartial: true,
  },
  '1|0|1': {
    classes: 'md:hidden lg:block',
    description: 'Mobile and desktop only (gap at tablet)',
    isPartial: true,
  },

  // None visible - should not happen but handle gracefully
  '0|0|0': {
    classes: 'hidden',
    description: 'Hidden on all breakpoints',
    isPartial: true,
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Convert presence object to lookup key
 */
function presenceToKey(presence: ElementPresence): string {
  return `${presence.mobile ? '1' : '0'}|${presence.tablet ? '1' : '0'}|${presence.desktop ? '1' : '0'}`;
}

/**
 * Get visibility classes for an element based on its presence across breakpoints.
 *
 * @param presence - Object indicating which breakpoints contain the element
 * @returns Tailwind visibility classes string
 */
export function getVisibilityClasses(presence: ElementPresence): string {
  const key = presenceToKey(presence);
  return VISIBILITY_MAP[key]?.classes ?? '';
}

/**
 * Get detailed visibility configuration for an element.
 *
 * @param presence - Object indicating which breakpoints contain the element
 * @returns Full visibility configuration including description
 */
export function getVisibilityConfig(presence: ElementPresence): VisibilityConfig {
  const key = presenceToKey(presence);
  return VISIBILITY_MAP[key] ?? VISIBILITY_MAP['0|0|0'];
}

/**
 * Check if an element has partial visibility (not present in all breakpoints).
 *
 * @param presence - Object indicating which breakpoints contain the element
 * @returns true if element is missing from at least one breakpoint
 */
export function hasPartialVisibility(presence: ElementPresence): boolean {
  return !(presence.mobile && presence.tablet && presence.desktop);
}

/**
 * Get the list of breakpoints where an element is present.
 *
 * @param presence - Object indicating which breakpoints contain the element
 * @returns Array of breakpoint names
 */
export function getPresentBreakpoints(presence: ElementPresence): Breakpoint[] {
  const result: Breakpoint[] = [];
  if (presence.mobile) result.push('mobile');
  if (presence.tablet) result.push('tablet');
  if (presence.desktop) result.push('desktop');
  return result;
}

/**
 * Get the list of breakpoints where an element is absent.
 *
 * @param presence - Object indicating which breakpoints contain the element
 * @returns Array of breakpoint names
 */
export function getMissingBreakpoints(presence: ElementPresence): Breakpoint[] {
  const result: Breakpoint[] = [];
  if (!presence.mobile) result.push('mobile');
  if (!presence.tablet) result.push('tablet');
  if (!presence.desktop) result.push('desktop');
  return result;
}

/**
 * Create a presence object from a MatchedElement.
 * Convenience function for use with element-matcher results.
 *
 * @param hasM - Whether element exists in mobile
 * @param hasT - Whether element exists in tablet
 * @param hasD - Whether element exists in desktop
 * @returns ElementPresence object
 */
export function createPresence(hasM: boolean, hasT: boolean, hasD: boolean): ElementPresence {
  return {
    mobile: hasM,
    tablet: hasT,
    desktop: hasD,
  };
}
