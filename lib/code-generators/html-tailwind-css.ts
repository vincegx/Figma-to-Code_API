/**
 * HTML/CSS Generator using Tailwind v4 Compiler
 *
 * Strategy: Reuse React Tailwind v4 generator (99% fidelity) and convert to pure HTML/CSS.
 * 1. Generate React/Tailwind v4 code (proven quality)
 * 2. Convert JSX to HTML with semantic class names
 * 3. Compile Tailwind classes to CSS via v4 API
 * 4. Output: Modern CSS with variables, zero Tailwind dependency
 */

import type { SimpleAltNode } from '../altnode-transform';
import { GeneratedCodeOutput } from './react';
import type { MultiFrameworkRule, FrameworkType } from '../types/rules';
import { generateReactTailwindV4 } from './react-tailwind-v4';
import {
  compileTailwindViaAPI,
  parseCSSToMap,
  parseMediaQueries,
  extractThemeLayer,
  mergeTailwindClasses,
  generateFinalCSS,
  type CompiledElement,
  type CustomBreakpoints,
} from '../utils/tailwind-to-css';
import { toPascalCase } from './helpers';

// ============================================================================
// JSX to HTML Conversion with Semantic Classes
// ============================================================================

/**
 * Extract class mappings from JSX: original Tailwind classes → semantic names
 *
 * Captures ALL className occurrences:
 * - With data-layer: Uses layer name as semantic class
 * - Without data-layer: Generates semantic name from first class or uses generic name
 */
function extractClassMappings(jsxCode: string): Map<string, { semanticClass: string; classes: string[] }> {
  const mappings = new Map<string, { semanticClass: string; classes: string[] }>();
  const usedNames = new Set<string>();

  // First pass: Match elements WITH data-layer (preferred names)
  const withLayerRegex = /data-layer="([^"]*)"[^>]*?className="([^"]*)"/g;
  let match;
  while ((match = withLayerRegex.exec(jsxCode)) !== null) {
    const layerName = match[1];
    const classString = match[2];

    // Skip if already mapped (same class string)
    if (mappings.has(classString)) continue;

    let baseName = toPascalCase(layerName) || 'Element';
    let semanticClass = baseName;
    let counter = 2;
    while (usedNames.has(semanticClass)) {
      semanticClass = `${baseName}${counter}`;
      counter++;
    }
    usedNames.add(semanticClass);

    mappings.set(classString, {
      semanticClass,
      classes: classString.split(/\s+/).filter(Boolean),
    });
  }

  // Second pass: Match elements WITHOUT data-layer (pseudo-elements, wrappers)
  const allClassNameRegex = /className="([^"]*)"/g;
  while ((match = allClassNameRegex.exec(jsxCode)) !== null) {
    const classString = match[1];

    // Skip if already mapped
    if (mappings.has(classString)) continue;

    // Generate semantic name from the classes
    const classes = classString.split(/\s+/).filter(Boolean);
    if (classes.length === 0) continue;

    // Use first meaningful class for naming
    const firstClass = classes[0];
    let baseName = toPascalCase(firstClass) || 'Element';

    // Clean up arbitrary value names like "W1440px" → "CustomWidth"
    if (baseName.match(/^\d/) || baseName.includes('[')) {
      baseName = 'StyledElement';
    }

    let semanticClass = baseName;
    let counter = 2;
    while (usedNames.has(semanticClass)) {
      semanticClass = `${baseName}${counter}`;
      counter++;
    }
    usedNames.add(semanticClass);

    mappings.set(classString, {
      semanticClass,
      classes,
    });
  }

  return mappings;
}

/**
 * Convert JSX to HTML, replacing Tailwind classes with semantic names
 */
function jsxToHtmlWithSemanticClasses(
  jsxCode: string,
  classMappings: Map<string, { semanticClass: string; classes: string[] }>
): string {
  let html = jsxCode;

  // Remove function wrapper - find return ( ... );
  const returnStart = html.indexOf('return (');
  if (returnStart !== -1) {
    // Find the matching closing paren
    let depth = 0;
    let inReturn = false;
    let start = -1;
    let end = -1;

    for (let i = returnStart + 7; i < html.length; i++) {
      const char = html[i];
      if (char === '(') {
        if (!inReturn) {
          inReturn = true;
          start = i + 1;
        }
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0 && inReturn) {
          end = i;
          break;
        }
      }
    }

    if (start !== -1 && end !== -1) {
      html = html.substring(start, end).trim();
    }
  }

  // Remove React fragments <> and </>
  html = html.replace(/^\s*<>\s*/, '');
  html = html.replace(/\s*<\/>\s*$/, '');

  // Replace each className with semantic class
  for (const [originalClasses, { semanticClass }] of classMappings) {
    const escapedClasses = originalClasses.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(
      new RegExp(`className="${escapedClasses}"`, 'g'),
      `class="${semanticClass}"`
    );
  }

  // className="..." → class="..." (catch any remaining)
  html = html.replace(/className="/g, 'class="');

  // className={`...`} → class="..."
  html = html.replace(/className=\{`([^`]*)`\}/g, 'class="$1"');

  // className={variable} → remove
  html = html.replace(/className=\{[^}]+\}/g, '');

  // style={{ ... }} → style="..."
  // Use a smarter regex that handles nested braces and parens
  html = html.replace(/style=\{\{([\s\S]*?)\}\}/g, (_match, styleContent) => {
    // Parse style content handling rgba(), etc.
    // Split on commas that are NOT inside parentheses
    const props: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (const char of styleContent) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === ',' && parenDepth === 0) {
        props.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) props.push(current.trim());

    const cssProps = props
      .map((prop: string) => {
        // Split on first colon only (value may contain colons)
        const colonIdx = prop.indexOf(':');
        if (colonIdx === -1) return '';
        const key = prop.slice(0, colonIdx).trim();
        const value = prop.slice(colonIdx + 1).trim();
        if (!key || !value) return '';
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const cssValue = value.replace(/['"]/g, '');
        return `${cssKey}: ${cssValue}`;
      })
      .filter(Boolean)
      .join('; ');
    return cssProps ? `style="${cssProps}"` : '';
  });

  // src={variable} → src="[image]"
  html = html.replace(/src=\{([^}]+)\}/g, 'src="[image]"');

  // Remove data-node-id
  html = html.replace(/\s*data-node-id="[^"]*"/g, '');

  // Self-closing tags
  const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link'];
  html = html.replace(/<(\w+)([^>]*)\s*\/>/g, (_match, tag, attrs) => {
    if (voidElements.includes(tag.toLowerCase())) {
      return `<${tag}${attrs} />`;
    }
    return `<${tag}${attrs}></${tag}>`;
  });

  // Clean up whitespace
  html = html.replace(/\n\s*\n/g, '\n');

  return html.trim();
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Generate HTML + pure CSS from AltNode tree
 *
 * Uses React Tailwind v4 generator and compiles to modern CSS.
 */
export async function generateHTMLTailwindCSS(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string> = {},
  allRules: MultiFrameworkRule[] = [],
  _framework: FrameworkType = 'html-css',
  figmaFileKey?: string,
  figmaAccessToken?: string,
  nodeId?: string,
  breakpoints?: CustomBreakpoints
): Promise<GeneratedCodeOutput> {
  // Step 1: Generate React Tailwind v4 code (99% fidelity)
  const reactResult = await generateReactTailwindV4(
    altNode,
    resolvedProperties,
    allRules,
    'react-tailwind-v4',
    figmaFileKey,
    figmaAccessToken,
    nodeId
  );

  // Step 2: Extract class mappings (Tailwind classes → semantic names)
  const classMappings = extractClassMappings(reactResult.code);

  // Step 3: Compile all classes with Tailwind v4 via API
  let css = '';
  let themeCSS = '';
  let cssMap = new Map<string, Record<string, string>>();
  let mediaQueries = { queries: new Map() as Map<string, { selector: string; properties: Record<string, string> }[]> };

  // Collect all unique classes
  const allClasses = new Set<string>();
  for (const { classes } of classMappings.values()) {
    classes.forEach(c => allClasses.add(c));
  }

  if (allClasses.size > 0) {
    try {
      // Build a fake HTML with all classes for the API
      const fakeHtml = `<div class="${Array.from(allClasses).join(' ')}"></div>`;
      const compiledCSS = await compileTailwindViaAPI(fakeHtml, 'v4', breakpoints);

      // Extract theme layer and parse CSS (including media queries)
      themeCSS = extractThemeLayer(compiledCSS);
      cssMap = parseCSSToMap(compiledCSS);
      mediaQueries = parseMediaQueries(compiledCSS);

      console.log('[HTML-TW-CSS] Compiled', allClasses.size, 'classes →', cssMap.size, 'CSS rules,', mediaQueries.queries.size, 'media queries');
    } catch (error) {
      console.warn('[HTML-TW-CSS] Compilation failed:', error);
    }
  }

  // Step 4: Build compiled elements with merged CSS (base styles only)
  const compiledElements: CompiledElement[] = [];
  for (const [, { semanticClass, classes }] of classMappings) {
    // Filter out responsive classes (md:, lg:, etc.) for base styles
    const baseClasses = classes.filter(c => !c.match(/^(sm|md|lg|xl|2xl):/));
    const cssProperties = mergeTailwindClasses(baseClasses, cssMap);
    compiledElements.push({
      semanticClass,
      tailwindClasses: classes,
      cssProperties,
    });
  }

  // Step 5: Build mapping from Tailwind responsive class → semantic classes (one-to-many)
  // e.g., "md:flex-row" used by ["TitleSection", "OverviewCards", "AccountInfo"]
  // FIX: Changed from Map<string, string> to Map<string, string[]>
  // because multiple elements can use the same responsive class
  const responsiveClassMapping = new Map<string, string[]>();
  for (const [, { semanticClass, classes }] of classMappings) {
    for (const cls of classes) {
      if (cls.match(/^(sm|md|lg|xl|2xl):/)) {
        const existing = responsiveClassMapping.get(cls) || [];
        existing.push(semanticClass);
        responsiveClassMapping.set(cls, existing);
      }
    }
  }

  // Step 6: Generate final CSS with semantic class names and media queries
  css = generateFinalCSS(compiledElements, themeCSS, mediaQueries, responsiveClassMapping);

  // Step 7: Extract and remove inline CSS variables from React code BEFORE conversion
  let inlineCSS = '';
  let cleanedReactCode = reactResult.code;

  // Extract CSS vars from style tag (self-closing: />)
  const styleMatch = cleanedReactCode.match(/<style\s+dangerouslySetInnerHTML=\{\{\s*__html:\s*`([\s\S]*?)`\s*\}\}\s*\/>/);
  if (styleMatch) {
    inlineCSS = styleMatch[1].trim();
    // Remove style tag from React code before conversion
    cleanedReactCode = cleanedReactCode.replace(/<style\s+dangerouslySetInnerHTML=\{\{\s*__html:\s*`[\s\S]*?`\s*\}\}\s*\/>\s*/g, '');
  }

  // Step 8: Convert JSX to HTML with semantic class names
  const htmlContent = jsxToHtmlWithSemanticClasses(cleanedReactCode, classMappings);

  // Combine CSS: merge Figma vars into @layer theme
  let finalCSS = css;
  if (inlineCSS) {
    // Extract just the variable declarations from :root { ... }
    const varMatch = inlineCSS.match(/:root\s*\{([\s\S]*?)\}/);
    if (varMatch) {
      const figmaVars = varMatch[1].trim();
      // Insert Figma vars into @layer theme { :root, :host { ... } }
      finalCSS = css.replace(
        /(@layer\s+theme\s*\{\s*:root,\s*:host\s*\{)/,
        `$1\n    /* Figma Variables */\n    ${figmaVars.split('\n').join('\n    ')}\n    /* Tailwind Variables */`
      );
    } else {
      // Fallback: prepend as-is
      finalCSS = `${inlineCSS}\n\n${css}`;
    }
  }

  return {
    code: htmlContent.trim(),
    format: 'html-css',
    language: 'html',
    metadata: {
      componentName: reactResult.metadata.componentName,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
    css: finalCSS,
    assets: reactResult.assets,
    googleFontsUrl: reactResult.googleFontsUrl,
  };
}

export default generateHTMLTailwindCSS;
