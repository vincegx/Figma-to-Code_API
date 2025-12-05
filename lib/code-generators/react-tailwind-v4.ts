/**
 * WP39 T325: React + Tailwind v4 Code Generator
 *
 * Generates React JSX with Tailwind v4 utility classes.
 * Uses react-tailwind.ts as base, then migrates classes to v4 syntax.
 *
 * Key differences from v3:
 * - shadow-sm → shadow-xs, shadow → shadow-sm
 * - rounded-sm → rounded-xs, rounded → rounded-sm
 * - ring → ring-3
 * - bg-[--var] → bg-(--var)
 * - grid-cols-[a,b] → grid-cols-[a_b]
 */

import { generateReactTailwind } from './react-tailwind';
import { migrateV3ToV4 } from './class-mapper-v4';
import type { SimpleAltNode } from '../altnode-transform';
import type { GeneratedCodeOutput } from './react';
import type { MultiFrameworkRule, FrameworkType } from '../types/rules';
import type { GenerateOptions } from '../types/code-generator';

/**
 * Migrate className strings from v3 to v4 syntax
 * Handles both single classes and space-separated class strings
 */
function migrateClassNameAttribute(code: string): string {
  // Match className="..." or className={`...`}
  return code.replace(
    /className="([^"]+)"/g,
    (match, classes) => {
      const classArray = classes.split(/\s+/).filter(Boolean);
      const migratedClasses = migrateV3ToV4(classArray);
      return `className="${migratedClasses.join(' ')}"`;
    }
  );
}

/**
 * Migrate class="..." for HTML output (used in some edge cases)
 */
function migrateClassAttribute(code: string): string {
  return code.replace(
    /class="([^"]+)"/g,
    (match, classes) => {
      const classArray = classes.split(/\s+/).filter(Boolean);
      const migratedClasses = migrateV3ToV4(classArray);
      return `class="${migratedClasses.join(' ')}"`;
    }
  );
}

/**
 * Generate React + Tailwind v4 code from AltNode tree
 *
 * @param altNode - Root SimpleAltNode to generate code from
 * @param resolvedProperties - Pre-resolved CSS properties from rules
 * @param allRules - All mapping rules for evaluation
 * @param framework - Target framework (always 'react-tailwind-v4')
 * @param figmaFileKey - Figma file key for image fetching
 * @param figmaAccessToken - Figma API token for image fetching
 * @param nodeId - Optional node ID for targeted generation
 * @param options - WP47: Generation options (withProps)
 * @returns Generated code output with v4 Tailwind classes
 */
export async function generateReactTailwindV4(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string> = {},
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind-v4',
  figmaFileKey?: string,
  figmaAccessToken?: string,
  nodeId?: string,
  options?: GenerateOptions
): Promise<GeneratedCodeOutput> {
  // 1. Generate v3 code using the existing generator (WP47: pass options)
  const v3Result = await generateReactTailwind(
    altNode,
    resolvedProperties,
    allRules,
    'react-tailwind', // Use v3 generator
    figmaFileKey,
    figmaAccessToken,
    nodeId,
    options
  );

  // 2. Migrate className attributes from v3 to v4
  const migratedCode = migrateClassNameAttribute(v3Result.code);

  // 3. Return with updated format
  return {
    ...v3Result,
    code: migratedCode,
    format: 'react-tailwind-v4',
  };
}

/**
 * Synchronous version for simple cases without image fetching
 */
export function generateReactTailwindV4Sync(
  code: string
): string {
  return migrateClassNameAttribute(code);
}

export default generateReactTailwindV4;
