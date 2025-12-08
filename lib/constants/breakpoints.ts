// Breakpoint Constants
// ============================================================================
// Centralized breakpoint values used across the application
// ============================================================================

/**
 * Standard device breakpoints for preview
 *
 * Used by: viewer/[nodeId]/page.tsx, merge/[id]/page.tsx
 */
export const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  desktopXL: { width: 1440, height: 900 },
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Merge engine breakpoint thresholds
 *
 * Used by: merge-engine.ts for responsive detection
 */
export const MERGE_BREAKPOINTS = {
  mobileMaxWidth: 420,
  tabletMaxWidth: 960,
  mobileWidth: 375,
  tabletWidth: 768,
  desktopWidth: 1280,
} as const;
