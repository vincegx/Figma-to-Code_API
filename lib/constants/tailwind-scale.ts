// Tailwind Scale Constants
// ============================================================================
// VERBATIM from react-tailwind.ts:564-604, helpers.ts:861-899, helpers.ts:299-308
// ============================================================================

/**
 * Tailwind spacing scale (px → class suffix)
 * Complete scale from 0 to 96 (384px)
 *
 * Used by: normalizeArbitraryValues, consolidateSemanticSpacing, convertSizeToTailwind
 */
export const TAILWIND_SPACING_SCALE: Record<number, string> = {
  0: '0',
  1: 'px',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  // Tailwind skips 13, 15 - no w-13 or w-15 classes exist
  56: '14',
  64: '16',
  // WP38 FIX: gap-18 does NOT exist in Tailwind V3 (skips from 16 to 20)
  // Keep 72px as arbitrary value gap-[72px] for V3 compatibility
  // 72: '18',  // REMOVED - not valid in V3
  80: '20',
  96: '24',
  112: '28',
  128: '32',
  144: '36',
  160: '40',
  176: '44',
  192: '48',
  208: '52',
  224: '56',
  240: '60',
  256: '64',
  288: '72',
  320: '80',
  384: '96',
};

/**
 * Reduced spacing scale for consolidateSemanticSpacing
 * Only includes values up to 96 (24 in Tailwind scale)
 *
 * Used by: consolidateSemanticSpacing
 */
export const TAILWIND_SPACING_SCALE_REDUCED: Record<number, string> = {
  0: '0',
  1: 'px',
  4: '1',
  8: '2',
  12: '3',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  // Tailwind skips 13, 15 - no w-13 or w-15 classes exist
  56: '14',
  64: '16',
  // WP38 FIX: gap-18 does NOT exist in Tailwind V3 (skips from 16 to 20)
  // 72: '18',  // REMOVED - not valid in V3
  80: '20',
  96: '24',
};

/**
 * Standard border radius values
 *
 * Used by: cssPropToTailwind for borderRadius
 */
export const TAILWIND_BORDER_RADIUS_SCALE: Record<number, string> = {
  0: 'rounded-none',
  2: 'rounded-sm',
  4: 'rounded',
  8: 'rounded-lg',
  12: 'rounded-xl',
  16: 'rounded-2xl',
  9999: 'rounded-full',
};

/**
 * Standard padding scale (subset for quick lookup)
 *
 * Used by: cssPropToTailwind for padding
 */
export const TAILWIND_PADDING_SCALE: Record<number, string> = {
  0: 'p-0',
  4: 'p-1',
  8: 'p-2',
  12: 'p-3',
  16: 'p-4',
  20: 'p-5',
  24: 'p-6',
  32: 'p-8',
  40: 'p-10',
  48: 'p-12',
  64: 'p-16',
};
