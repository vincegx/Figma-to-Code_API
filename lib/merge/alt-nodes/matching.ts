/**
 * Layer Name Matching
 *
 * Functions for matching children across breakpoints by layer name.
 * VERBATIM from merge-simple-alt-nodes.ts
 */

import type { SimpleAltNode } from '../../altnode-transform';

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
export interface ChildMatch {
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
export function findBestMatch(
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
export function matchChildrenByName(
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
