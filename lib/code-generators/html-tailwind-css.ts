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
  extractThemeLayer,
  mergeTailwindClasses,
  generateFinalCSS,
  type CompiledElement,
} from '../utils/tailwind-to-css';
import { toPascalCase } from './helpers';

// ============================================================================
// JSX to HTML Conversion with Semantic Classes
// ============================================================================

/**
 * Extract class mappings from JSX: original Tailwind classes → semantic names
 */
function extractClassMappings(jsxCode: string): Map<string, { semanticClass: string; classes: string[] }> {
  const mappings = new Map<string, { semanticClass: string; classes: string[] }>();
  const usedNames = new Set<string>();

  // Match data-layer and className pairs
  const regex = /data-layer="([^"]*)"[^>]*?className="([^"]*)"/g;

  let match;
  while ((match = regex.exec(jsxCode)) !== null) {
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
  html = html.replace(/style=\{\{([^}]*)\}\}/g, (_match, styleContent) => {
    const cssProps = styleContent
      .split(',')
      .map((prop: string) => {
        const [key, value] = prop.split(':').map((s: string) => s.trim());
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
  nodeId?: string
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

  // Collect all unique classes
  const allClasses = new Set<string>();
  for (const { classes } of classMappings.values()) {
    classes.forEach(c => allClasses.add(c));
  }

  if (allClasses.size > 0) {
    try {
      // Build a fake HTML with all classes for the API
      const fakeHtml = `<div class="${Array.from(allClasses).join(' ')}"></div>`;
      const compiledCSS = await compileTailwindViaAPI(fakeHtml, 'v4');

      // Extract theme layer and parse CSS
      themeCSS = extractThemeLayer(compiledCSS);
      cssMap = parseCSSToMap(compiledCSS);

      console.log('[HTML-TW-CSS] Compiled', allClasses.size, 'classes →', cssMap.size, 'CSS rules');
    } catch (error) {
      console.warn('[HTML-TW-CSS] Compilation failed:', error);
    }
  }

  // Step 4: Build compiled elements with merged CSS
  const compiledElements: CompiledElement[] = [];
  for (const [, { semanticClass, classes }] of classMappings) {
    const cssProperties = mergeTailwindClasses(classes, cssMap);
    compiledElements.push({
      semanticClass,
      tailwindClasses: classes,
      cssProperties,
    });
  }

  // Step 5: Generate final CSS with semantic class names
  css = generateFinalCSS(compiledElements, themeCSS);

  // Step 6: Extract and remove inline CSS variables from React code BEFORE conversion
  let inlineCSS = '';
  let cleanedReactCode = reactResult.code;

  // Extract CSS vars from style tag (self-closing: />)
  const styleMatch = cleanedReactCode.match(/<style\s+dangerouslySetInnerHTML=\{\{\s*__html:\s*`([\s\S]*?)`\s*\}\}\s*\/>/);
  if (styleMatch) {
    inlineCSS = styleMatch[1].trim();
    // Remove style tag from React code before conversion
    cleanedReactCode = cleanedReactCode.replace(/<style\s+dangerouslySetInnerHTML=\{\{\s*__html:\s*`[\s\S]*?`\s*\}\}\s*\/>\s*/g, '');
  }

  // Step 7: Convert JSX to HTML with semantic class names
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
