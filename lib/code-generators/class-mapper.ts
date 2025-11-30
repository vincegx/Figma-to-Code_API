/**
 * WP39 T321: Class Mapper Interface
 *
 * Provides a unified interface for mapping CSS properties to Tailwind classes.
 * Supports both v3 and v4 syntax through different mapper implementations.
 */

import { cssPropToTailwind } from './helpers';

/**
 * Tailwind version identifier
 */
export type TailwindVersion = 'v3' | 'v4';

/**
 * Interface for CSS to Tailwind class mapping
 */
export interface ClassMapper {
  readonly version: TailwindVersion;

  /**
   * Convert a CSS property-value pair to Tailwind class
   * @param property - CSS property name (camelCase or kebab-case)
   * @param value - CSS value
   * @returns Tailwind class string (or empty if no mapping)
   */
  mapCssToTailwind(property: string, value: string): string;

  /**
   * Post-process generated classes (dedupe, migrate, etc.)
   * @param classes - Array of Tailwind classes
   * @returns Processed array of classes
   */
  postProcess(classes: string[]): string[];
}

/**
 * Deduplicate and clean Tailwind classes
 * Removes duplicates and handles conflicting utility classes
 *
 * @param classes - Array of Tailwind classes (may have duplicates)
 * @returns Deduplicated array
 */
export function deduplicateTailwindClasses(classes: string[]): string[] {
  // Use Set to remove exact duplicates
  const unique = [...new Set(classes.filter(c => c.trim()))];

  // Track utility prefixes for conflict resolution
  // Later classes override earlier ones for the same prefix
  const prefixMap = new Map<string, string>();
  const nonPrefixed: string[] = [];

  // Utility prefixes that can conflict
  const conflictingPrefixes = [
    'w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-',
    'p-', 'pt-', 'pr-', 'pb-', 'pl-', 'px-', 'py-',
    'm-', 'mt-', 'mr-', 'mb-', 'ml-', 'mx-', 'my-',
    'gap-', 'gap-x-', 'gap-y-',
    'text-', 'font-', 'leading-', 'tracking-',
    'bg-', 'border-', 'rounded-',
    'flex-', 'grid-', 'items-', 'justify-', 'self-',
    'top-', 'right-', 'bottom-', 'left-',
    'z-', 'opacity-', 'rotate-', 'scale-',
    'translate-x-', 'translate-y-',
    'shadow-', 'blur-', 'backdrop-blur-',
    'overflow-', 'overflow-x-', 'overflow-y-',
  ];

  for (const cls of unique) {
    let matched = false;
    for (const prefix of conflictingPrefixes) {
      if (cls.startsWith(prefix) || cls.startsWith(`-${prefix}`)) {
        // Handle negative prefix
        const effectivePrefix = cls.startsWith('-') ? `-${prefix}` : prefix;
        prefixMap.set(effectivePrefix, cls);
        matched = true;
        break;
      }
    }
    if (!matched) {
      nonPrefixed.push(cls);
    }
  }

  // Combine: non-prefixed first, then prefixed (last wins for conflicts)
  return [...nonPrefixed, ...prefixMap.values()];
}

/**
 * Tailwind v3 Class Mapper
 * Uses current Tailwind v3 syntax (shadow-sm, rounded-sm, etc.)
 */
export const classMapperV3: ClassMapper = {
  version: 'v3',

  mapCssToTailwind(property: string, value: string): string {
    return cssPropToTailwind(property, value);
  },

  postProcess(classes: string[]): string[] {
    return deduplicateTailwindClasses(classes);
  },
};

/**
 * Get the appropriate class mapper for a Tailwind version
 * @param version - Target Tailwind version
 * @returns ClassMapper implementation
 */
export function getClassMapper(version: TailwindVersion): ClassMapper {
  switch (version) {
    case 'v3':
      return classMapperV3;
    case 'v4':
      // Import v4 mapper dynamically to avoid circular dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { classMapperV4 } = require('./class-mapper-v4');
      return classMapperV4;
    default:
      return classMapperV3;
  }
}

export default classMapperV3;
