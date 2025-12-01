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
 * Extract @layer theme block (CSS variables) from v4 output
 */
export function extractThemeLayer(css: string): string {
  // Match @layer theme { :root { ... } }
  const themeMatch = css.match(/@layer\s+theme\s*\{[\s\S]*?\n\s*\}/);
  return themeMatch ? themeMatch[0] : '';
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

// ============================================================================
// Direct Compilation (Node.js fallback)
// ============================================================================

/**
 * Compile Tailwind classes directly using PostCSS (Node.js only)
 * This is used as fallback when API is not available
 *
 * Uses eval-based dynamic require to prevent Next.js from bundling
 * these Node.js-only modules for the client.
 *
 * @param code - Code containing Tailwind classes (HTML or JSX)
 * @param version - Tailwind version ('v3' or 'v4')
 * @returns Generated CSS string
 */
async function compileTailwindDirect(
  code: string,
  version: 'v3' | 'v4' = 'v4'
): Promise<string> {
  try {
    // Use eval to prevent Next.js static analysis from bundling these modules
    // eslint-disable-next-line no-eval
    const dynamicRequire = eval('require');

    if (version === 'v4') {
      // Tailwind v4: Use compile API directly
      const { compile } = dynamicRequire('tailwindcss-v4');
      const { readFileSync } = dynamicRequire('fs');
      const path = dynamicRequire('path');

      const compiler = await compile('@import "tailwindcss";', {
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
      console.log('[tailwind-to-css] V4 direct compilation successful');
      return css;
    } else {
      // Tailwind v3: Use PostCSS
      const postcss = dynamicRequire('postcss');
      const tailwindcss = dynamicRequire('tailwindcss');

      const inputCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;
      `;

      const tailwindConfig = {
        content: [{ raw: code, extension: 'html' }],
        theme: { extend: {} },
        corePlugins: { preflight: false },
      };

      const result = await postcss([
        tailwindcss(tailwindConfig),
      ]).process(inputCSS, { from: undefined });

      console.log('[tailwind-to-css] V3 direct compilation successful');
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
 * @returns Generated CSS string
 */
export async function compileTailwindViaAPI(
  code: string,
  version: 'v3' | 'v4' = 'v4'
): Promise<string> {
  // Node.js: Use direct compilation (API not available)
  if (isNode) {
    console.log('[tailwind-to-css] Node.js detected, using direct compilation');
    return compileTailwindDirect(code, version);
  }

  // Browser: Use API
  try {
    const response = await fetch('/api/generate-tailwind-css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, version }),
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
      const borderMatch = cls.match(/^border(-[trbl])?-\[(.+)\]$/);
      if (borderMatch) {
        const side = borderMatch[1]; // -t, -r, -b, -l, or undefined
        const value = borderMatch[2];
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
 * @returns Complete CSS string
 */
export function generateFinalCSS(
  elements: CompiledElement[],
  themeCSS: string
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

  return rules.join('\n\n');
}
