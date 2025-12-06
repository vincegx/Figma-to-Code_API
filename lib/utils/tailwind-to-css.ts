/**
 * Tailwind to CSS Compiler (Universal)
 *
 * Converts Tailwind classes to pure CSS.
 * - Browser: Uses /api/generate-tailwind-css endpoint
 * - Node.js: Uses direct PostCSS compilation (fallback)
 *
 * This ensures HTML/CSS generation works in both contexts.
 */

// ============================================================================
// Environment Detection
// ============================================================================

const isNode = typeof window === 'undefined';
const isBrowser = !isNode;

// ============================================================================
// CSS Parsing Utilities
// ============================================================================

/**
 * Parse CSS string into a map of selector → properties
 */
export function parseCSSToMap(css: string): Map<string, Record<string, string>> {
  const result = new Map<string, Record<string, string>>();

  // Simple regex-based CSS parser for utility classes
  // Matches: .class-name { property: value; ... }
  const ruleRegex = /\.([^\s{,]+)\s*\{([^}]*)\}/g;

  let match;
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1];
    const propertiesStr = match[2];

    const properties: Record<string, string> = {};
    const propRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi;

    let propMatch;
    while ((propMatch = propRegex.exec(propertiesStr)) !== null) {
      const prop = propMatch[1].trim();
      const value = propMatch[2].trim();
      properties[prop] = value;
    }

    if (Object.keys(properties).length > 0) {
      result.set(selector, properties);
    }
  }

  return result;
}

/**
 * Parse media queries from CSS string
 * Returns a map of media query string → array of rules
 *
 * Supports both traditional and Tailwind v4 nested formats:
 * - Traditional: @media (min-width: 768px) { .class { ... } }
 * - Tailwind v4: .md\:class { @media (width >= 768px) { ... } }
 */
export function parseMediaQueries(css: string): ParsedMediaQueries {
  const queries = new Map<string, MediaQueryRule[]>();

  // Extract content from @layer utilities if present (Tailwind v4)
  let cssToSearch = css;
  const layerMatch = css.match(/@layer\s+utilities\s*\{/);
  if (layerMatch && layerMatch.index !== undefined) {
    // Find matching closing brace using brace counting
    let depth = 1;
    const startIdx = layerMatch.index + layerMatch[0].length;
    let endIdx = startIdx;
    for (let i = startIdx; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    cssToSearch = css.slice(startIdx, endIdx);
  }

  // Tailwind v4 format: .selector { @media (...) { properties } }
  // Match class rules that contain nested @media
  // Use a simpler approach: find all classes, then check if they have @media inside
  const allSelectorsWithMedia: Array<{ selector: string; content: string }> = [];

  // Find all .class { ... } blocks that contain @media
  let searchIdx = 0;
  while (searchIdx < cssToSearch.length) {
    const dotIdx = cssToSearch.indexOf('.', searchIdx);
    if (dotIdx === -1) break;

    // Find the selector (until { or space)
    let selectorEnd = dotIdx + 1;
    while (selectorEnd < cssToSearch.length && !/[\s{]/.test(cssToSearch[selectorEnd])) {
      selectorEnd++;
    }
    const selector = cssToSearch.slice(dotIdx + 1, selectorEnd);

    // Find opening brace
    const braceIdx = cssToSearch.indexOf('{', selectorEnd);
    if (braceIdx === -1) break;

    // Find matching closing brace
    let depth = 1;
    let closeIdx = braceIdx + 1;
    while (closeIdx < cssToSearch.length && depth > 0) {
      if (cssToSearch[closeIdx] === '{') depth++;
      else if (cssToSearch[closeIdx] === '}') depth--;
      closeIdx++;
    }

    const content = cssToSearch.slice(braceIdx + 1, closeIdx - 1);

    // Check if this block contains @media
    if (content.includes('@media')) {
      allSelectorsWithMedia.push({ selector, content });
    }

    searchIdx = closeIdx;
  }

  // Now parse each selector's @media content
  for (const { selector, content } of allSelectorsWithMedia) {
    // Extract nested @media from within the class
    const nestedMediaRegex = /@media\s*\(([^)]+)\)\s*\{([^}]*)\}/g;
    let mediaMatch;

    while ((mediaMatch = nestedMediaRegex.exec(content)) !== null) {
      const mediaCondition = mediaMatch[1].trim();
      const mediaContent = mediaMatch[2].trim();

      // Parse properties inside the @media
      const properties: Record<string, string> = {};
      const propRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi;

      let propMatch;
      while ((propMatch = propRegex.exec(mediaContent)) !== null) {
        const prop = propMatch[1].trim();
        const value = propMatch[2].trim();
        properties[prop] = value;
      }

      if (Object.keys(properties).length > 0) {
        const mediaQuery = `(${mediaCondition})`;
        const existing = queries.get(mediaQuery) || [];
        queries.set(mediaQuery, [...existing, { selector, properties }]);
      }
    }
  }

  // Also try traditional format: @media { .class { } } (for v3 compatibility)
  const traditionalMediaRegex = /@media\s*([^{]+)\s*\{/g;
  let startMatch;

  while ((startMatch = traditionalMediaRegex.exec(css)) !== null) {
    const mediaQuery = startMatch[1].trim();
    const startIndex = startMatch.index + startMatch[0].length;

    // Skip if this looks like nested media (inside a class rule)
    const beforeMatch = css.slice(Math.max(0, startMatch.index - 50), startMatch.index);
    if (beforeMatch.includes('{') && !beforeMatch.includes('}')) {
      continue; // This is nested inside a class, already handled above
    }

    // Count braces to find matching close
    let depth = 1;
    let endIndex = startIndex;
    for (let i = startIndex; i < css.length; i++) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }

    const mediaContent = css.slice(startIndex, endIndex);

    // Parse rules inside media query
    const ruleRegex = /\.([^\s{,]+)\s*\{([^}]*)\}/g;
    let ruleMatch;

    while ((ruleMatch = ruleRegex.exec(mediaContent)) !== null) {
      const selector = ruleMatch[1];
      const propertiesStr = ruleMatch[2];

      const properties: Record<string, string> = {};
      const propRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi;

      let propMatch;
      while ((propMatch = propRegex.exec(propertiesStr)) !== null) {
        const prop = propMatch[1].trim();
        const value = propMatch[2].trim();
        properties[prop] = value;
      }

      if (Object.keys(properties).length > 0) {
        const existing = queries.get(mediaQuery) || [];
        queries.set(mediaQuery, [...existing, { selector, properties }]);
      }
    }
  }

  return { queries };
}

/**
 * Extract @layer theme block (CSS variables) from v4 output
 * Uses brace counting to handle nested blocks like :root, :host { ... }
 */
export function extractThemeLayer(css: string): string {
  // Find the start of @layer theme
  const startMatch = css.match(/@layer\s+theme\s*\{/);
  if (!startMatch || startMatch.index === undefined) return '';

  const startIndex = startMatch.index;
  let depth = 1; // We've matched the opening brace
  let endIndex = -1;

  // Start scanning after the opening brace
  const scanStart = startIndex + startMatch[0].length;

  for (let i = scanStart; i < css.length; i++) {
    if (css[i] === '{') {
      depth++;
    } else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        endIndex = i + 1; // Include the closing brace
        break;
      }
    }
  }

  if (endIndex === -1) return '';
  return css.slice(startIndex, endIndex);
}

/**
 * Escape CSS selector special characters
 * Tailwind classes like bg-[#FF0000] need escaping
 */
export function escapeSelector(selector: string): string {
  return selector
    .replace(/\\/g, '') // Remove existing escapes first
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\#/g, '\\#')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\%/g, '\\%')
    .replace(/\//g, '\\/');
}

// ============================================================================
// Types
// ============================================================================

export interface CompiledElement {
  semanticClass: string;
  tailwindClasses: string[];
  cssProperties: Record<string, string>;
}

/**
 * Media query rule with selector and properties
 */
export interface MediaQueryRule {
  selector: string;
  properties: Record<string, string>;
}

/**
 * Parsed media queries grouped by query string
 */
export interface ParsedMediaQueries {
  queries: Map<string, MediaQueryRule[]>;
}

// ============================================================================
// Direct Compilation (Node.js fallback)
// ============================================================================

/**
 * Custom breakpoints for responsive CSS generation
 */
export interface CustomBreakpoints {
  mobileWidth: number;
  tabletWidth: number;
}

/**
 * Compile Tailwind classes directly using PostCSS (Node.js only)
 * This is used as fallback when API is not available
 *
 * Uses eval-based dynamic require to prevent Next.js from bundling
 * these Node.js-only modules for the client.
 *
 * @param code - Code containing Tailwind classes (HTML or JSX)
 * @param version - Tailwind version ('v3' or 'v4')
 * @param breakpoints - Optional custom breakpoints
 * @returns Generated CSS string
 */
async function compileTailwindDirect(
  code: string,
  version: 'v3' | 'v4' = 'v4',
  breakpoints?: CustomBreakpoints
): Promise<string> {
  try {
    // Use eval to prevent Next.js static analysis from bundling these modules
    // eslint-disable-next-line no-eval
    const dynamicRequire = eval('require');

    // Default breakpoints
    const bp = breakpoints || { mobileWidth: 480, tabletWidth: 960 };

    if (version === 'v4') {
      // Tailwind v4: Use compile API directly with custom breakpoints
      const { compile } = dynamicRequire('tailwindcss-v4');
      const { readFileSync } = dynamicRequire('fs');
      const path = dynamicRequire('path');

      // Build CSS with custom @theme breakpoints
      const customCSS = `
@import "tailwindcss";

@theme {
  --breakpoint-sm: ${bp.mobileWidth}px;
  --breakpoint-md: ${bp.mobileWidth}px;
  --breakpoint-lg: ${bp.tabletWidth}px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
      `;

      const compiler = await compile(customCSS, {
        loadStylesheet: async (id: string, base: string) => {
          if (id === 'tailwindcss') {
            const cssPath = path.join(process.cwd(), 'node_modules/tailwindcss-v4/index.css');
            return {
              path: 'virtual:tailwindcss/index.css',
              base,
              content: readFileSync(cssPath, 'utf-8'),
            };
          }
          throw new Error(`Cannot load stylesheet: ${id}`);
        },
      });

      // Extract classes from code
      const classes: string[] = [];
      const patterns = [
        /className="([^"]*)"/g,
        /class="([^"]*)"/g,
      ];
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          match[1].split(/\s+/).filter(Boolean).forEach(c => classes.push(c));
        }
      }

      const css = compiler.build([...new Set(classes)]);
      console.log('[tailwind-to-css] V4 direct compilation successful with breakpoints:', bp);
      return css;
    } else {
      // Tailwind v3: Use PostCSS with custom screens
      const postcss = dynamicRequire('postcss');
      const tailwindcss = dynamicRequire('tailwindcss');

      const inputCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;
      `;

      const tailwindConfig = {
        content: [{ raw: code, extension: 'html' }],
        theme: {
          screens: {
            sm: `${bp.mobileWidth}px`,
            md: `${bp.mobileWidth}px`,
            lg: `${bp.tabletWidth}px`,
            xl: '1280px',
            '2xl': '1536px',
          },
          extend: {},
        },
        corePlugins: { preflight: false },
      };

      const result = await postcss([
        tailwindcss(tailwindConfig),
      ]).process(inputCSS, { from: undefined });

      console.log('[tailwind-to-css] V3 direct compilation successful with breakpoints:', bp);
      return result.css;
    }
  } catch (error) {
    console.error('[tailwind-to-css] Direct compilation failed:', error);
    return '';
  }
}

// ============================================================================
// API-based Compilation
// ============================================================================

/**
 * Compile Tailwind classes to CSS
 *
 * Strategy:
 * - Browser: Uses /api/generate-tailwind-css endpoint
 * - Node.js: Uses direct PostCSS compilation (no API available)
 * - Fallback: If API fails in browser, returns empty (can't use PostCSS in browser)
 *
 * @param code - Code containing Tailwind classes (HTML or JSX)
 * @param version - Tailwind version ('v3' or 'v4')
 * @param breakpoints - Optional custom breakpoints for responsive design
 * @returns Generated CSS string
 */
export async function compileTailwindViaAPI(
  code: string,
  version: 'v3' | 'v4' = 'v4',
  breakpoints?: CustomBreakpoints
): Promise<string> {
  // Node.js: Use direct compilation (API not available)
  if (isNode) {
    console.log('[tailwind-to-css] Node.js detected, using direct compilation');
    return compileTailwindDirect(code, version, breakpoints);
  }

  // Browser: Use API
  try {
    const response = await fetch('/api/generate-tailwind-css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, version, breakpoints }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const { css } = await response.json();
    return css || '';
  } catch (error) {
    console.error('[tailwind-to-css] API compilation failed:', error);
    // In browser, we can't use direct compilation (PostCSS is Node.js only)
    // Return empty and let caller handle gracefully
    return '';
  }
}

/**
 * Merge multiple Tailwind classes into a single CSS rule
 *
 * @param classes - Array of Tailwind classes for one element
 * @param cssMap - Pre-compiled CSS map from parseCSSToMap
 * @returns Merged CSS properties object
 */
export function mergeTailwindClasses(
  classes: string[],
  cssMap: Map<string, Record<string, string>>
): Record<string, string> {
  const merged: Record<string, string> = {};

  for (const cls of classes) {
    // Try exact match first
    let props = cssMap.get(cls);

    // Try escaped version for special characters
    if (!props) {
      const escaped = escapeSelector(cls);
      props = cssMap.get(escaped);
    }

    // Try unescaped for already-escaped selectors
    if (!props) {
      // Check all keys for a match
      for (const [key, value] of cssMap.entries()) {
        // Normalize both for comparison
        const normalizedKey = key.replace(/\\/g, '');
        const normalizedCls = cls.replace(/\\/g, '');
        if (normalizedKey === normalizedCls) {
          props = value;
          break;
        }
      }
    }

    if (props) {
      Object.assign(merged, props);
    } else {
      // WP38: Fallback for arbitrary classes not compiled by Tailwind v4
      // Handle border-[color] and border-{t,r,b,l}-[color]
      // Color values: var(...), rgba(...), rgb(...), hsl(...), #hex
      // Also handles Tailwind's color: prefix syntax: border-t-[color:var(...)]
      const borderMatch = cls.match(/^border(-[trbl])?-\[(.+)\]$/);
      if (borderMatch) {
        const side = borderMatch[1]; // -t, -r, -b, -l, or undefined
        let value = borderMatch[2];

        // Strip "color:" prefix if present (Tailwind arbitrary value syntax for colors)
        if (value.startsWith('color:')) {
          value = value.slice(6); // Remove "color:" prefix
        }

        // Check if value looks like a color (not a width like "1px" or "2px_0_0")
        const isColor = /^(var\(|rgba?\(|hsla?\(|#)/.test(value);
        if (isColor) {
          if (side === '-t') {
            merged['border-top-color'] = value;
          } else if (side === '-r') {
            merged['border-right-color'] = value;
          } else if (side === '-b') {
            merged['border-bottom-color'] = value;
          } else if (side === '-l') {
            merged['border-left-color'] = value;
          } else {
            merged['border-color'] = value;
          }
        }
      }
    }
  }

  return merged;
}

/**
 * WP38: Extract CSS variable definitions from theme CSS
 * Returns a map of variable name → value
 */
function extractCSSVariables(themeCSS: string): Map<string, string> {
  const vars = new Map<string, string>();
  // Match --var-name: value; patterns
  const regex = /(--[\w-]+):\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(themeCSS)) !== null) {
    vars.set(match[1], match[2].trim());
  }
  return vars;
}

/**
 * WP38: Resolve CSS variable references to literal values
 * Handles var(--name) and var(--name, fallback)
 */
function resolveCSSVariables(value: string, vars: Map<string, string>): string {
  // Match var(--name) or var(--name, fallback)
  return value.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (match, varName, fallback) => {
    const resolved = vars.get(varName);
    if (resolved) {
      // Recursively resolve in case the value contains more vars
      return resolveCSSVariables(resolved, vars);
    }
    // WP38 FIX: Return original match (not entire value!) when variable not found
    return fallback ? fallback.trim() : match;
  });
}

/**
 * Generate final CSS output with semantic class names
 *
 * @param elements - Array of compiled elements with semantic names
 * @param themeCSS - Theme layer CSS (variable definitions)
 * @param mediaQueries - Optional parsed media queries
 * @param classMapping - Optional map of Tailwind class → semantic class names (one-to-many)
 * @returns Complete CSS string
 */
export function generateFinalCSS(
  elements: CompiledElement[],
  themeCSS: string,
  mediaQueries?: ParsedMediaQueries,
  classMapping?: Map<string, string[]>
): string {
  const rules: string[] = [];

  // Add theme variables first
  if (themeCSS) {
    rules.push(themeCSS);
  }

  // WP38: Extract CSS variables from theme for resolution
  const cssVars = extractCSSVariables(themeCSS);

  // Generate rules for each element
  for (const element of elements) {
    if (Object.keys(element.cssProperties).length === 0) continue;

    const propsStr = Object.entries(element.cssProperties)
      .map(([prop, value]) => {
        // WP38: Resolve Tailwind v4 CSS variables to literal values
        // This ensures compatibility with iframe sandbox where @layer may not work
        const resolvedValue = resolveCSSVariables(value, cssVars);
        return `  ${prop}: ${resolvedValue};`;
      })
      .join('\n');

    rules.push(`.${element.semanticClass} {\n${propsStr}\n}`);
  }

  // Generate media query rules with semantic class names
  if (mediaQueries && classMapping) {
    for (const [mediaQuery, mediaRules] of mediaQueries.queries) {
      // Convert Tailwind v4 syntax (width >= Xpx) to standard (min-width: Xpx)
      let standardMediaQuery = mediaQuery
        .replace(/width\s*>=\s*(\d+)/g, 'min-width: $1')
        .replace(/width\s*<=\s*(\d+)/g, 'max-width: $1');

      // Group properties by semantic class to avoid duplicate selectors
      const groupedByClass = new Map<string, Record<string, string>>();

      for (const rule of mediaRules) {
        // Convert Tailwind selector (e.g., "md\:flex-row") to semantic classes
        // The selector is the escaped Tailwind class
        const tailwindClass = rule.selector.replace(/\\/g, '');
        const semanticClasses = classMapping.get(tailwindClass);

        if (semanticClasses && semanticClasses.length > 0) {
          // Apply to ALL semantic classes that use this Tailwind class
          for (const semanticClass of semanticClasses) {
            const existing = groupedByClass.get(semanticClass) || {};
            for (const [prop, value] of Object.entries(rule.properties)) {
              const resolvedValue = resolveCSSVariables(value, cssVars);
              existing[prop] = resolvedValue;
            }
            groupedByClass.set(semanticClass, existing);
          }
        }
      }

      // Generate rules from grouped properties
      const semanticRules: string[] = [];
      for (const [semanticClass, properties] of groupedByClass) {
        const propsStr = Object.entries(properties)
          .map(([prop, value]) => `    ${prop}: ${value};`)
          .join('\n');
        semanticRules.push(`  .${semanticClass} {\n${propsStr}\n  }`);
      }

      if (semanticRules.length > 0) {
        rules.push(`@media ${standardMediaQuery} {\n${semanticRules.join('\n\n')}\n}`);
      }
    }
  }

  return rules.join('\n\n');
}
