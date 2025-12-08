// Merge Scoring Constants
// ============================================================================
// VERBATIM from merge-simple-alt-nodes.ts
// These values are CRITICAL - do not modify without extensive testing
// ============================================================================

/**
 * Tolerance for zero detection
 * Values below this are considered "essentially zero"
 *
 * Used by: formatValue (line 185), isEssentiallyZero (line 200)
 */
export const ZERO_THRESHOLD = 0.01;

/**
 * Tolerance for value equivalence comparison
 * Used to handle floating point noise in CSS values
 *
 * Used by: areValuesEquivalent (line 210)
 */
export const VALUE_TOLERANCE = 0.5;

/**
 * Tolerance for shorthand property matching
 * Tighter tolerance for comparing shorthand vs longhand values
 *
 * Used by: removeRedundantLonghands (line 325)
 */
export const SHORTHAND_TOLERANCE = 0.1;

/**
 * Weight multiplier for absolute position difference in child matching
 * Lower is better - penalizes position mismatch
 *
 * Used by: findBestMatch (line 614)
 */
export const POSITION_WEIGHT = 10;

/**
 * Weight multiplier for relative position difference in child matching
 * Higher weight than absolute position
 *
 * Used by: findBestMatch (line 614)
 */
export const RELATIVE_POS_WEIGHT = 100;

/**
 * Bonus score (subtracted) for similar names
 * Rewards partial name matches
 *
 * Used by: findBestMatch (line 619)
 */
export const NAME_SIMILARITY_BONUS = 50;

/**
 * Maximum allowed absolute position difference for fallback matching
 *
 * Used by: findBestMatch (line 623)
 */
export const MAX_POSITION_DIFF = 3;

/**
 * Maximum allowed relative position difference for fallback matching
 *
 * Used by: findBestMatch (line 623)
 */
export const MAX_RELATIVE_DIFF = 0.2;
