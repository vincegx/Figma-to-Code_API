/**
 * WP39 T324: Tailwind v4 Class Mapper
 *
 * Provides migration from Tailwind v3 to v4 syntax.
 * Handles all breaking changes between versions.
 *
 * Reference: https://tailwindcss.com/docs/upgrade-guide
 */

import { cssPropToTailwind } from './helpers';
import { deduplicateTailwindClasses, type ClassMapper, type TailwindVersion } from './class-mapper';

// ============================================================================
// V3 → V4 Migration Mappings
// ============================================================================

/**
 * Direct class renames from v3 to v4
 * Source: https://tailwindcss.com/docs/upgrade-guide#renamed-utilities
 */
const V3_TO_V4_RENAMES: Record<string, string> = {
  // Shadow scale shifted
  'shadow-sm': 'shadow-xs',
  'shadow': 'shadow-sm',
  // Note: shadow-md, shadow-lg, etc. unchanged

  // Drop shadow scale shifted
  'drop-shadow-sm': 'drop-shadow-xs',
  'drop-shadow': 'drop-shadow-sm',

  // Blur scale shifted
  'blur-sm': 'blur-xs',
  'blur': 'blur-sm',

  // Backdrop blur scale shifted
  'backdrop-blur-sm': 'backdrop-blur-xs',
  'backdrop-blur': 'backdrop-blur-sm',

  // Border radius scale shifted
  'rounded-sm': 'rounded-xs',
  'rounded': 'rounded-sm',

  // Ring default width now explicit
  'ring': 'ring-3',

  // Outline renamed
  'outline-none': 'outline-hidden',

  // Text utilities renamed
  'overflow-ellipsis': 'text-ellipsis',

  // Box decoration renamed
  'decoration-slice': 'box-decoration-slice',
  'decoration-clone': 'box-decoration-clone',
};

/**
 * Classes removed in v4 (replaced by modifier syntax)
 * These should already be using the new syntax in our codebase
 */
const V3_REMOVED_CLASSES = new Set([
  // Opacity utilities replaced by color modifiers (bg-black/50)
  'bg-opacity-0', 'bg-opacity-5', 'bg-opacity-10', 'bg-opacity-20', 'bg-opacity-25',
  'bg-opacity-30', 'bg-opacity-40', 'bg-opacity-50', 'bg-opacity-60', 'bg-opacity-70',
  'bg-opacity-75', 'bg-opacity-80', 'bg-opacity-90', 'bg-opacity-95', 'bg-opacity-100',
  'text-opacity-0', 'text-opacity-5', 'text-opacity-10', 'text-opacity-20', 'text-opacity-25',
  'text-opacity-30', 'text-opacity-40', 'text-opacity-50', 'text-opacity-60', 'text-opacity-70',
  'text-opacity-75', 'text-opacity-80', 'text-opacity-90', 'text-opacity-95', 'text-opacity-100',
  'border-opacity-0', 'border-opacity-5', 'border-opacity-10', 'border-opacity-20', 'border-opacity-25',
  'border-opacity-30', 'border-opacity-40', 'border-opacity-50', 'border-opacity-60', 'border-opacity-70',
  'border-opacity-75', 'border-opacity-80', 'border-opacity-90', 'border-opacity-95', 'border-opacity-100',
  'divide-opacity-0', 'divide-opacity-5', 'divide-opacity-10', 'divide-opacity-20', 'divide-opacity-25',
  'divide-opacity-30', 'divide-opacity-40', 'divide-opacity-50', 'divide-opacity-60', 'divide-opacity-70',
  'divide-opacity-75', 'divide-opacity-80', 'divide-opacity-90', 'divide-opacity-95', 'divide-opacity-100',
  'ring-opacity-0', 'ring-opacity-5', 'ring-opacity-10', 'ring-opacity-20', 'ring-opacity-25',
  'ring-opacity-30', 'ring-opacity-40', 'ring-opacity-50', 'ring-opacity-60', 'ring-opacity-70',
  'ring-opacity-75', 'ring-opacity-80', 'ring-opacity-90', 'ring-opacity-95', 'ring-opacity-100',
  'placeholder-opacity-0', 'placeholder-opacity-5', 'placeholder-opacity-10', 'placeholder-opacity-20',
  'placeholder-opacity-25', 'placeholder-opacity-30', 'placeholder-opacity-40', 'placeholder-opacity-50',
  'placeholder-opacity-60', 'placeholder-opacity-70', 'placeholder-opacity-75', 'placeholder-opacity-80',
  'placeholder-opacity-90', 'placeholder-opacity-95', 'placeholder-opacity-100',
]);

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Migrate a single class from v3 to v4 syntax
 * @param cls - Tailwind v3 class
 * @returns Tailwind v4 class (or original if no migration needed)
 */
export function migrateClassV3ToV4(cls: string): string {
  // 1. Direct rename mapping
  if (V3_TO_V4_RENAMES[cls]) {
    return V3_TO_V4_RENAMES[cls];
  }

  // 2. CSS variable syntax: bg-[--brand] → bg-(--brand)
  // v3: bg-[--my-color] or bg-[var(--my-color)]
  // v4: bg-(--my-color)
  if (cls.includes('[--')) {
    return cls.replace(/\[(--[^\]]+)\]/g, '($1)');
  }

  // 3. Handle var() inside arbitrary values
  // bg-[var(--color)] → bg-(--color)
  if (cls.includes('[var(--')) {
    const match = cls.match(/\[var\((--[^)]+)\)(?:,[^\]]+)?\]/);
    if (match) {
      return cls.replace(/\[var\((--[^)]+)\)(?:,[^\]]+)?\]/, `(${match[1]})`);
    }
  }

  // 4. Grid comma syntax: grid-cols-[max-content,auto] → grid-cols-[max-content_auto]
  if ((cls.startsWith('grid-cols-[') || cls.startsWith('grid-rows-[')) && cls.includes(',')) {
    return cls.replace(/,/g, '_');
  }

  // 5. Handle important modifier position
  // v3: !flex (prefix)
  // v4: flex! (suffix)
  if (cls.startsWith('!') && !cls.startsWith('!-')) {
    // Move ! to the end
    return cls.slice(1) + '!';
  }

  // 6. Removed classes (should be filtered out or warning)
  if (V3_REMOVED_CLASSES.has(cls)) {
    // Return empty - these are handled by color modifiers now
    console.warn(`[WP39] Deprecated v3 class removed: ${cls}. Use color modifiers instead (e.g., bg-black/50)`);
    return '';
  }

  // No migration needed
  return cls;
}

/**
 * Migrate an array of classes from v3 to v4 syntax
 * @param classes - Array of Tailwind v3 classes
 * @returns Array of Tailwind v4 classes
 */
export function migrateV3ToV4(classes: string[]): string[] {
  return classes
    .map(migrateClassV3ToV4)
    .filter(cls => cls !== ''); // Remove empty strings from removed classes
}

// ============================================================================
// V4 Class Mapper
// ============================================================================

/**
 * Tailwind v4 Class Mapper
 * Generates v4 syntax by applying v3 mapping then migrating
 */
export const classMapperV4: ClassMapper = {
  version: 'v4',

  mapCssToTailwind(property: string, value: string): string {
    // Use v3 mapper first, then migrate
    const v3Class = cssPropToTailwind(property, value);
    if (!v3Class) return '';

    // Handle multi-class results (e.g., "py-3 px-5")
    const classes = v3Class.split(' ').filter(Boolean);
    const migratedClasses = migrateV3ToV4(classes);
    return migratedClasses.join(' ');
  },

  postProcess(classes: string[]): string[] {
    // First deduplicate
    const deduped = deduplicateTailwindClasses(classes);
    // Then migrate to v4
    return migrateV3ToV4(deduped);
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a class needs migration from v3 to v4
 */
export function needsMigration(cls: string): boolean {
  if (V3_TO_V4_RENAMES[cls]) return true;
  if (cls.includes('[--')) return true;
  if (cls.includes('[var(--')) return true;
  if ((cls.startsWith('grid-cols-[') || cls.startsWith('grid-rows-[')) && cls.includes(',')) return true;
  if (cls.startsWith('!') && !cls.startsWith('!-')) return true;
  if (V3_REMOVED_CLASSES.has(cls)) return true;
  return false;
}

/**
 * Get migration details for a class
 */
export function getMigrationInfo(cls: string): { from: string; to: string; reason: string } | null {
  if (V3_TO_V4_RENAMES[cls]) {
    return { from: cls, to: V3_TO_V4_RENAMES[cls], reason: 'Renamed utility' };
  }
  if (cls.includes('[--')) {
    return { from: cls, to: migrateClassV3ToV4(cls), reason: 'CSS variable syntax change' };
  }
  if (cls.includes('[var(--')) {
    return { from: cls, to: migrateClassV3ToV4(cls), reason: 'var() syntax simplified' };
  }
  if ((cls.startsWith('grid-cols-[') || cls.startsWith('grid-rows-[')) && cls.includes(',')) {
    return { from: cls, to: migrateClassV3ToV4(cls), reason: 'Grid comma syntax' };
  }
  if (cls.startsWith('!') && !cls.startsWith('!-')) {
    return { from: cls, to: migrateClassV3ToV4(cls), reason: 'Important modifier position' };
  }
  if (V3_REMOVED_CLASSES.has(cls)) {
    return { from: cls, to: '', reason: 'Removed - use color modifiers' };
  }
  return null;
}

export default classMapperV4;
