/**
 * Merge Module
 *
 * Exports merge-related functionality for responsive component generation.
 *
 * Main pipeline:
 * 1. Load SimpleAltNodes for each breakpoint (mobile, tablet, desktop)
 * 2. Merge using mergeSimpleAltNodes (matching + style diff in one pass)
 * 3. Convert to UnifiedElement for stats/UI with toUnifiedElement
 * 4. Generate code using generateReactTailwind
 */

// Visibility Mapper - generates Tailwind visibility classes based on presence
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

// SimpleAltNode Merger - matches elements and computes responsive style diffs
export {
  mergeSimpleAltNodes,
  toUnifiedElement,
  getSourceNodeId,
} from './merge-simple-alt-nodes';

// Note: merge-engine is server-only (uses merge-store which uses fs)
// Import directly from '@/lib/merge/merge-engine' in API routes only
