/**
 * Merge Module
 *
 * Exports all merge-related functionality for responsive component generation.
 */

// Element Matcher - matches elements across breakpoints
export {
  buildElementIndex,
  getDisambiguatedNames,
  matchElements,
  matchChildren,
  type ElementIndex,
  type MatchedElement,
  type MatchResult,
} from './element-matcher';

// Visibility Mapper - generates Tailwind visibility classes
export {
  getVisibilityClasses,
  getVisibilityConfig,
  hasPartialVisibility,
  getPresentBreakpoints,
  getMissingBreakpoints,
  createPresence,
  type ElementPresence,
  type VisibilityConfig,
} from './visibility-mapper';

// Tailwind Responsive - generates mobile-first responsive classes
export {
  extractStyleDifferences,
  addResponsivePrefix,
  generateResponsiveClasses,
  mergeStyleSets,
  createEmptyStyleSet,
  createUniformStyleSet,
  type StyleSet,
} from './tailwind-responsive';

// Note: merge-engine is server-only (uses merge-store which uses fs)
// Import directly from '@/lib/merge/merge-engine' in API routes only

// Responsive Code Generator - generates framework-specific code
export {
  generateResponsiveCode,
  generateElementCode,
} from './responsive-code-generator';
