/**
 * Tailwind Class Processing
 *
 * Functions for deduplicating, normalizing, and consolidating Tailwind classes.
 * VERBATIM from react-tailwind.ts
 */

import { TAILWIND_SPACING_SCALE_REDUCED } from '../../constants';

/**
 * WP08: Smart split for Tailwind classes that preserves arbitrary values with spaces.
 * e.g., "border border-[var(--var, rgba(38, 38, 38, 1))] border-solid" should split correctly.
 */
export function smartSplitTailwindClasses(classString: string): string[] {
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
 * Normalize arbitrary value classes to standard Tailwind classes when possible
 * Examples:
 * - gap-[10px] → gap-2.5
 * - gap-[24px] → gap-6
 * - w-[16px] → w-4
 * - h-[48px] → h-12
 */
function normalizeArbitraryValues(classes: string[]): string[] {
  // Tailwind spacing scale (px → class suffix)
  // Complete scale from 0 to 96 (384px)
  const standardSpacing: Record<number, string> = {
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

  return classes.map(cls => {
    // Match arbitrary px values: gap-[10px], w-[48px], pl-[16px], etc.
    const match = cls.match(/^(gap-|gap-x-|gap-y-|w-|h-|min-w-|max-w-|min-h-|max-h-|p-|pt-|pb-|pl-|pr-|px-|py-|m-|mt-|mb-|ml-|mr-|mx-|my-)\[(\d+)px\]$/);

    if (match) {
      const prefix = match[1];
      const px = parseInt(match[2], 10);

      // If exact match in standard scale, use it
      if (standardSpacing[px]) {
        return `${prefix}${standardSpacing[px]}`;
      }

      // WP38: Don't round w-/h- dimensions and ml-/mt- positioning - keep exact pixel values
      if (prefix === 'w-' || prefix === 'h-' || prefix === 'min-w-' || prefix === 'max-w-' || prefix === 'min-h-' || prefix === 'max-h-' || prefix === 'ml-' || prefix === 'mt-') {
        return cls; // Keep exact arbitrary value
      }

      // WP25 FIX: Find nearest standard value (within 5% tolerance)
      // Plugin Figma rounds w-[390px] → w-96 (384px)
      let nearestPx: number | null = null;
      let smallestDiff = Infinity;

      for (const [standardPx, suffix] of Object.entries(standardSpacing)) {
        const stdPx = parseInt(standardPx, 10);
        const diff = Math.abs(px - stdPx);
        const percentDiff = diff / px;

        // Accept if within 5% and closer than previous best
        if (percentDiff <= 0.05 && diff < smallestDiff) {
          nearestPx = stdPx;
          smallestDiff = diff;
        }
      }

      // Use nearest if found, otherwise keep arbitrary
      if (nearestPx !== null) {
        return `${prefix}${standardSpacing[nearestPx]}`;
      }
    }

    // No match or not standard - keep original
    return cls;
  });
}

/**
 * Remove default flex properties that don't need to be specified
 * AND add explicit alignment defaults that Plugin Figma generates
 *
 * Remove these redundant defaults:
 * - flex-nowrap (default for flex containers)
 * - self-auto (default for flex items)
 * - grow-0 (default for flex items)
 * - shrink (default value is 1, so only shrink without value is default)
 *
 * Add these explicit defaults (Plugin Figma behavior):
 * - justify-start (if no justify-* present and has flex/inline-flex)
 * - items-start (if no items-* present and has flex/inline-flex)
 */
function removeDefaultFlexProperties(classes: string[]): string[] {
  const defaults = new Set([
    'flex-nowrap',  // Default wrap behavior
    'self-auto',    // Default align-self
    'grow-0',       // Default flex-grow
    'shrink',       // Default flex-shrink (shrink-1 is explicit)
  ]);

  // Filter out redundant defaults
  const filtered = classes.filter(cls => !defaults.has(cls));

  // Check if this is a flex container
  const hasFlex = filtered.some(cls => cls === 'flex' || cls === 'inline-flex');

  if (hasFlex) {
    // Add justify-start if no justify-* class present
    const hasJustify = filtered.some(cls => cls.startsWith('justify-'));
    if (!hasJustify) {
      filtered.push('justify-start');
    }

    // Add items-start if no items-* class present
    const hasItems = filtered.some(cls => cls.startsWith('items-'));
    if (!hasItems) {
      filtered.push('items-start');
    }
  }

  return filtered;
}

/**
 * Consolidate matching padding/margin pairs into semantic classes
 * Examples:
 * - pl-12 pr-12 → px-12
 * - pt-10 pb-10 → py-10
 * - pl-[48px] pr-[48px] → px-12 (if 48px = standard value)
 *
 * Only consolidates when BOTH sides have the SAME value AND it's a standard Tailwind value
 */
function consolidateSemanticSpacing(classes: string[]): string[] {
  const result: string[] = [];
  const consumed = new Set<number>();

  // Use imported constant instead of local duplicate
  const standardSpacing = TAILWIND_SPACING_SCALE_REDUCED;

  // Extract value from class (pl-12 → 12, pl-[48px] → 48)
  function extractValue(cls: string, prefix: string): number | null {
    if (!cls.startsWith(prefix)) return null;

    const rest = cls.substring(prefix.length);

    // Standard class: pl-12 → 12
    const standardMatch = rest.match(/^(\d+)$/);
    if (standardMatch) {
      const suffix = standardMatch[1];
      // Find px value for this suffix
      for (const [px, suf] of Object.entries(standardSpacing)) {
        if (suf === suffix) return parseInt(px, 10);
      }
    }

    // Arbitrary value: pl-[48px] → 48
    const arbitraryMatch = rest.match(/^\[(\d+)px\]$/);
    if (arbitraryMatch) {
      return parseInt(arbitraryMatch[1], 10);
    }

    return null;
  }

  // PHASE 1: Pre-scan to find all-four-sides padding/margin
  // This must happen BEFORE pair consolidation to avoid consuming pairs first
  // WP25 FIX: Handle BOTH standard AND arbitrary values
  const paddingValues = new Map<number, { pt: number, pb: number, pl: number, pr: number }>();

  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];

    if (cls.startsWith('pt-')) {
      const val = extractValue(cls, 'pt-');
      if (val !== null) {  // WP25: Accept ALL values, not just standard
        if (!paddingValues.has(val)) {
          paddingValues.set(val, { pt: -1, pb: -1, pl: -1, pr: -1 });
        }
        paddingValues.get(val)!.pt = i;
      }
    } else if (cls.startsWith('pb-')) {
      const val = extractValue(cls, 'pb-');
      if (val !== null) {
        if (!paddingValues.has(val)) {
          paddingValues.set(val, { pt: -1, pb: -1, pl: -1, pr: -1 });
        }
        paddingValues.get(val)!.pb = i;
      }
    } else if (cls.startsWith('pl-')) {
      const val = extractValue(cls, 'pl-');
      if (val !== null) {
        if (!paddingValues.has(val)) {
          paddingValues.set(val, { pt: -1, pb: -1, pl: -1, pr: -1 });
        }
        paddingValues.get(val)!.pl = i;
      }
    } else if (cls.startsWith('pr-')) {
      const val = extractValue(cls, 'pr-');
      if (val !== null) {
        if (!paddingValues.has(val)) {
          paddingValues.set(val, { pt: -1, pb: -1, pl: -1, pr: -1 });
        }
        paddingValues.get(val)!.pr = i;
      }
    }
  }

  // Check if any value has all four sides - if so, consolidate to p-
  for (const [val, indices] of paddingValues.entries()) {
    if (indices.pt !== -1 && indices.pb !== -1 && indices.pl !== -1 && indices.pr !== -1) {
      // Use standard class if available, otherwise arbitrary
      const className = standardSpacing[val] ? `p-${standardSpacing[val]}` : `p-[${val}px]`;
      result.push(className);
      consumed.add(indices.pt);
      consumed.add(indices.pb);
      consumed.add(indices.pl);
      consumed.add(indices.pr);
    }
  }

  // PHASE 2: Consolidate remaining pairs
  for (let i = 0; i < classes.length; i++) {
    if (consumed.has(i)) continue;

    const cls = classes[i];

    // PRIORITY 2: Check for padding-left + padding-right consolidation
    // WP25 FIX: Handle BOTH standard AND arbitrary values
    if (cls.startsWith('pl-')) {
      const leftValue = extractValue(cls, 'pl-');
      if (leftValue !== null) {  // Accept ALL values
        // Look for matching pr-
        for (let j = i + 1; j < classes.length; j++) {
          if (consumed.has(j)) continue;
          const other = classes[j];
          if (other.startsWith('pr-')) {
            const rightValue = extractValue(other, 'pr-');
            if (rightValue === leftValue) {
              // Consolidate to px- (use standard if available, otherwise arbitrary)
              const className = standardSpacing[leftValue] ? `px-${standardSpacing[leftValue]}` : `px-[${leftValue}px]`;
              result.push(className);
              consumed.add(i);
              consumed.add(j);
              break;
            }
          }
        }
      }
    }

    // PRIORITY 3: Check for padding-top + padding-bottom consolidation
    // WP25 FIX: Handle BOTH standard AND arbitrary values
    if (cls.startsWith('pt-') && !consumed.has(i)) {
      const topValue = extractValue(cls, 'pt-');
      if (topValue !== null) {  // Accept ALL values
        // Look for matching pb-
        for (let j = i + 1; j < classes.length; j++) {
          if (consumed.has(j)) continue;
          const other = classes[j];
          if (other.startsWith('pb-')) {
            const bottomValue = extractValue(other, 'pb-');
            if (bottomValue === topValue) {
              // Consolidate to py- (use standard if available, otherwise arbitrary)
              const className = standardSpacing[topValue] ? `py-${standardSpacing[topValue]}` : `py-[${topValue}px]`;
              result.push(className);
              consumed.add(i);
              consumed.add(j);
              break;
            }
          }
        }
      }
    }

    // If not consolidated, keep original
    if (!consumed.has(i)) {
      result.push(cls);
    }
  }

  return result;
}

/**
 * Deduplicate Tailwind classes with intelligent conflict resolution.
 *
 * WP25 FIX: Multi-pass deduplication with proper priority tracking
 *
 * Priority order (higher wins):
 * - Specific classes override generic: pt-[40px] overrides py-10
 * - Later classes override earlier classes for same property
 *
 * Examples:
 * - pt-[40px] overrides py-10 (specific padding-top beats combined py)
 * - pl-[32px] overrides px-8 (specific padding-left beats combined px)
 * - Later classes override earlier classes for same property
 *
 * @param classes - Array of Tailwind class strings
 * @returns Deduplicated array with conflicts resolved
 */
export function deduplicateTailwindClasses(classes: string[]): string[] {
  const result: string[] = [];
  const seenExact = new Set<string>();

  // Track which specific padding/margin classes we've seen
  const specificClasses = {
    paddingTop: false,
    paddingBottom: false,
    paddingLeft: false,
    paddingRight: false,
    marginTop: false,
    marginBottom: false,
    marginLeft: false,
    marginRight: false,
  };

  // Track property-based classes (keep only LAST occurrence for each property)
  const propertyMap = new Map<string, string>();

  // First pass: identify specific classes and track property-based ones
  for (const cls of classes) {
    if (cls.startsWith('pt-')) specificClasses.paddingTop = true;
    if (cls.startsWith('pb-')) specificClasses.paddingBottom = true;
    if (cls.startsWith('pl-')) specificClasses.paddingLeft = true;
    if (cls.startsWith('pr-')) specificClasses.paddingRight = true;
    if (cls.startsWith('mt-')) specificClasses.marginTop = true;
    if (cls.startsWith('mb-')) specificClasses.marginBottom = true;
    if (cls.startsWith('ml-')) specificClasses.marginLeft = true;
    if (cls.startsWith('mr-')) specificClasses.marginRight = true;

    // WP25 FIX: Track display classes (keep last) - inline-flex vs flex conflict
    if (cls === 'flex' || cls === 'inline-flex' || cls === 'block' || cls === 'inline-block' || cls === 'grid' || cls === 'inline-grid') {
      propertyMap.set('display', cls);
    }

    // Track gap/width/height classes (keep last)
    if (cls.startsWith('gap-')) propertyMap.set('gap', cls);
    if (cls.startsWith('gap-x-')) propertyMap.set('gap-x', cls);
    if (cls.startsWith('gap-y-')) propertyMap.set('gap-y', cls);
    if (cls.startsWith('w-')) propertyMap.set('width', cls);
    if (cls.startsWith('h-')) propertyMap.set('height', cls);
    if (cls.startsWith('min-w-')) propertyMap.set('min-width', cls);
    if (cls.startsWith('max-w-')) propertyMap.set('max-width', cls);
    if (cls.startsWith('min-h-')) propertyMap.set('min-height', cls);
    if (cls.startsWith('max-h-')) propertyMap.set('max-height', cls);
  }

  // Second pass: filter classes
  for (const cls of classes) {
    // Skip if exact duplicate
    if (seenExact.has(cls)) continue;

    // Skip py- if we have specific pt- or pb-
    if (cls.startsWith('py-') && (specificClasses.paddingTop || specificClasses.paddingBottom)) {
      continue;
    }

    // Skip px- if we have specific pl- or pr-
    if (cls.startsWith('px-') && (specificClasses.paddingLeft || specificClasses.paddingRight)) {
      continue;
    }

    // Skip my- if we have specific mt- or mb-
    if (cls.startsWith('my-') && (specificClasses.marginTop || specificClasses.marginBottom)) {
      continue;
    }

    // Skip mx- if we have specific ml- or mr-
    if (cls.startsWith('mx-') && (specificClasses.marginLeft || specificClasses.marginRight)) {
      continue;
    }

    // For property-based classes, only keep the LAST occurrence
    // Check if this class is tracked in propertyMap
    let isPropertyClass = false;
    let propertyKey = '';

    // WP25 FIX: Track display classes
    if (cls === 'flex' || cls === 'inline-flex' || cls === 'block' || cls === 'inline-block' || cls === 'grid' || cls === 'inline-grid') {
      isPropertyClass = true;
      propertyKey = 'display';
    }
    else if (cls.startsWith('gap-x-')) { isPropertyClass = true; propertyKey = 'gap-x'; }
    else if (cls.startsWith('gap-y-')) { isPropertyClass = true; propertyKey = 'gap-y'; }
    else if (cls.startsWith('gap-')) { isPropertyClass = true; propertyKey = 'gap'; }
    else if (cls.startsWith('w-')) { isPropertyClass = true; propertyKey = 'width'; }
    else if (cls.startsWith('h-')) { isPropertyClass = true; propertyKey = 'height'; }
    else if (cls.startsWith('min-w-')) { isPropertyClass = true; propertyKey = 'min-width'; }
    else if (cls.startsWith('max-w-')) { isPropertyClass = true; propertyKey = 'max-width'; }
    else if (cls.startsWith('min-h-')) { isPropertyClass = true; propertyKey = 'min-height'; }
    else if (cls.startsWith('max-h-')) { isPropertyClass = true; propertyKey = 'max-height'; }

    // Skip if this is a property class but NOT the last occurrence
    if (isPropertyClass && propertyMap.get(propertyKey) !== cls) {
      continue;
    }

    result.push(cls);
    seenExact.add(cls);
  }

  // WP25 FIX: Normalize arbitrary values to standard Tailwind classes
  // gap-[10px] → gap-2.5, w-[16px] → w-4
  const normalized = normalizeArbitraryValues(result);

  // WP31 FIX: Remove negative gap classes - CSS gap doesn't support negative values
  // gap-[-380px] is invalid, negative spacing is handled via margin on children
  // Only match gap-[-Xpx] or gap-x-[-Xpx] or gap-y-[-Xpx] with NEGATIVE values inside brackets
  const withoutNegativeGap = normalized.filter(cls => {
    const negativeGapMatch = cls.match(/^gap(-[xy])?\[-\d/);
    return !negativeGapMatch;
  });

  // WP25 FIX: Remove default flex properties that are redundant
  // flex-nowrap, self-auto, grow-0, shrink are defaults
  const filtered = removeDefaultFlexProperties(withoutNegativeGap);

  // WP25 FIX: Consolidate semantic padding/margin pairs
  // pl-[48px] pr-[48px] → px-12 (only for standard Tailwind values)
  return consolidateSemanticSpacing(filtered);
}
