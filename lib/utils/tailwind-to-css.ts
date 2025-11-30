/**
 * Tailwind to CSS Compiler (Client-side)
 *
 * Converts Tailwind classes to pure CSS using the /api/generate-tailwind-css endpoint.
 * This allows using Tailwind v4 compiler without importing Node.js modules.
 */

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
// API-based Compilation
// ============================================================================

/**
 * Compile Tailwind classes to CSS using the API endpoint
 *
 * @param code - Code containing Tailwind classes (HTML or JSX)
 * @param version - Tailwind version ('v3' or 'v4')
 * @returns Generated CSS string
 */
export async function compileTailwindViaAPI(
  code: string,
  version: 'v3' | 'v4' = 'v4'
): Promise<string> {
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
    console.error('[tailwind-to-css] Compilation failed:', error);
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
    }
  }

  return merged;
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

  // Generate rules for each element
  for (const element of elements) {
    if (Object.keys(element.cssProperties).length === 0) continue;

    const propsStr = Object.entries(element.cssProperties)
      .map(([prop, value]) => `  ${prop}: ${value};`)
      .join('\n');

    rules.push(`.${element.semanticClass} {\n${propsStr}\n}`);
  }

  return rules.join('\n\n');
}
