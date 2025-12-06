import type { SimpleAltNode, FillData } from '../altnode-transform';
import { toPascalCase, cssPropToTailwind, extractTextContent, extractComponentDataAttributes, scaleModeToTailwind, truncateLayerName, toCamelCase, uniquePropName } from './helpers';
import { GeneratedCodeOutput, GeneratedAsset } from './react';
import type { MultiFrameworkRule, FrameworkType } from '../types/rules';
import type { CollectedProp, GenerateOptions } from '../types/code-generator';
import { evaluateMultiFrameworkRules } from '../rule-engine';
import { vectorToDataURL, convertVectorToSVG } from '../utils/svg-converter';
import { fetchFigmaImages, extractImageNodes, extractSvgContainers, fetchNodesAsSVG, generateSvgFilename, SvgExportNode } from '../utils/image-fetcher';
import { generateCssVariableDefinitions } from '../utils/variable-css';
import { getVisibilityClasses } from '../merge/visibility-mapper';

/**
 * WP08: Smart split for Tailwind classes that preserves arbitrary values with spaces.
 * e.g., "border border-[var(--var, rgba(38, 38, 38, 1))] border-solid" should split correctly.
 */
function smartSplitTailwindClasses(classString: string): string[] {
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
 * WP47: Collect all text and image props from the node tree
 * Traverses the AltNode tree and collects TEXT nodes and IMAGE fills
 *
 * @param node - Root AltNode to traverse
 * @param imageUrls - Map of imageRef → URL for images
 * @param propNames - Set to track used prop names (for uniqueness)
 * @returns Array of collected props
 */
function collectProps(
  node: SimpleAltNode,
  imageUrls: Record<string, string>,
  propNames: Set<string>
): CollectedProp[] {
  const props: CollectedProp[] = [];

  function traverse(n: SimpleAltNode) {
    // Skip hidden nodes
    if (n.visible === false) return;

    // Collect TEXT nodes (skip very short texts like initials "D", "C", "T")
    if (n.originalType === 'TEXT') {
      const textContent = (n.originalNode as any)?.characters || '';
      const trimmed = textContent.trim();
      if (trimmed && trimmed.length > 2) {
        const propName = uniquePropName(n.name, propNames);
        props.push({
          name: propName,
          type: 'text',
          defaultValue: textContent,
          layerName: n.name,
          nodeId: n.id,
        });
      }
    }

    // Collect IMAGE fills - only simple images (no children, single fill)
    // Skip backgrounds/layered images which are rendered differently
    const hasChildren = 'children' in n && n.children && n.children.length > 0;
    if (!hasChildren) {
      if (n.fillsData && n.fillsData.length === 1) {
        const imageFill = n.fillsData.find((f: FillData) => f.type === 'IMAGE');
        if (imageFill && imageFill.imageRef) {
          const imageUrl = imageUrls[imageFill.imageRef] || '';
          if (imageUrl) {
            const propName = uniquePropName(n.name, propNames);
            props.push({
              name: propName,
              type: 'image',
              defaultValue: imageUrl,
              layerName: n.name,
              nodeId: n.id,
            });
          }
        }
      }
      // Also check imageData for backward compatibility (only if no multi-fills)
      else if (n.imageData?.imageRef && (!n.fillsData || n.fillsData.length <= 1)) {
        const imageUrl = imageUrls[n.imageData.imageRef] || '';
        if (imageUrl) {
          const propName = uniquePropName(n.name, propNames);
          props.push({
            name: propName,
            type: 'image',
            defaultValue: imageUrl,
            layerName: n.name,
            nodeId: n.id,
          });
        }
      }
    }

    // Recursively traverse children
    if ('children' in n && n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return props;
}

/**
 * WP47: Generate TypeScript Props interface
 * Groups props by type (text, then images) for better readability
 *
 * @param componentName - PascalCase component name
 * @param props - Array of collected props
 * @returns TypeScript interface string
 */
function generatePropsInterface(componentName: string, props: CollectedProp[]): string {
  if (props.length === 0) return '';

  const textProps = props.filter(p => p.type === 'text');
  const imageProps = props.filter(p => p.type === 'image');

  const lines: string[] = [];

  if (textProps.length > 0) {
    lines.push('  // Text content');
    textProps.forEach(p => lines.push(`  ${p.name}?: string;`));
  }

  if (imageProps.length > 0) {
    if (textProps.length > 0) lines.push('');
    lines.push('  // Images');
    imageProps.forEach(p => lines.push(`  ${p.name}?: string;`));
  }

  return `interface ${componentName}Props {\n${lines.join('\n')}\n}\n\n`;
}

/**
 * WP47: Generate props destructuring with default values
 * Groups props by type (text, then images) for consistency with interface
 *
 * @param componentName - PascalCase component name
 * @param props - Array of collected props
 * @returns Destructuring string for function parameters
 */
function generatePropsDestructuring(componentName: string, props: CollectedProp[]): string {
  if (props.length === 0) return '';

  const escapeValue = (value: string) => value
    .replace(/\u2028/g, '\\n')  // Line Separator → \n
    .replace(/\u2029/g, '\\n')  // Paragraph Separator → \n
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');

  const textProps = props.filter(p => p.type === 'text');
  const imageProps = props.filter(p => p.type === 'image');

  const lines: string[] = [];

  if (textProps.length > 0) {
    lines.push('  // Text content');
    textProps.forEach(p => lines.push(`  ${p.name} = "${escapeValue(p.defaultValue)}",`));
  }

  if (imageProps.length > 0) {
    if (textProps.length > 0) lines.push('');
    lines.push('  // Images');
    imageProps.forEach(p => lines.push(`  ${p.name} = "${escapeValue(p.defaultValue)}",`));
  }

  return `{\n${lines.join('\n')}\n}: ${componentName}Props`;
}

/**
 * WP47: Create a map for JSX generation using nodeId as key (unique)
 * This allows generateTailwindJSXElement to look up if a node should use a prop
 *
 * @param props - Array of collected props
 * @returns Map of nodeId → { propName, type }
 */
function createPropLookup(props: CollectedProp[]): Map<string, { propName: string; type: 'text' | 'image' }> {
  const lookup = new Map<string, { propName: string; type: 'text' | 'image' }>();
  for (const p of props) {
    lookup.set(p.nodeId, { propName: p.name, type: p.type });
  }
  return lookup;
}

/**
 * WP31: Extract font families and their weights from node tree
 */
function extractFonts(node: SimpleAltNode): Map<string, Set<number>> {
  const fonts = new Map<string, Set<number>>();

  function traverse(n: SimpleAltNode) {
    if (n.styles?.['font-family']) {
      const fontFamily = String(n.styles['font-family']).replace(/['"]/g, '').split(',')[0].trim();
      if (fontFamily) {
        if (!fonts.has(fontFamily)) {
          fonts.set(fontFamily, new Set<number>());
        }
        const weight = parseInt(String(n.styles['font-weight'] || '400'), 10);
        fonts.get(fontFamily)!.add(weight);
      }
    }
    n.children?.forEach(traverse);
  }

  traverse(node);
  return fonts;
}

/**
 * WP31: Generate Google Fonts URL from font map with specific weights
 */
function generateGoogleFontsUrl(fonts: Map<string, Set<number>>): string | undefined {
  if (fonts.size === 0) return undefined;

  const families = Array.from(fonts.entries())
    .map(([font, weights]) => {
      const sortedWeights = Array.from(weights).sort((a, b) => a - b).join(';');
      return `family=${encodeURIComponent(font)}:wght@${sortedWeights}`;
    })
    .join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * WP32: SVG export info for generating imports and assets
 */
interface SvgExportInfo {
  nodeId: string;
  varName: string;      // vector, vector2, etc.
  filename: string;     // vector.svg
  path: string;         // ./img/vector.svg
  svgContent: string;   // SVG string content
  isComplex: boolean;
}

/**
 * WP32: Generate unique variable name from node name
 * Converts "My Icon" → "myIcon", handles duplicates with suffix
 */
function generateSvgVarName(nodeName: string, usedNames: Set<string>): string {
  // Convert to camelCase: "My Icon" → "myIcon", "Vector" → "vector"
  let baseName = nodeName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .trim()
    .split(/\s+/)
    .map((word, i) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // Default to "vector" if empty
  if (!baseName) baseName = 'vector';

  // Find unique name with suffix if needed
  let varName = baseName;
  let counter = 2;
  while (usedNames.has(varName)) {
    varName = `${baseName}${counter}`;
    counter++;
  }

  usedNames.add(varName);
  return varName;
}

/**
 * WP32: Convert FillData gradient to CSS gradient string
 * Applies fill opacity to gradient stop colors (like MCP does)
 */
function fillDataToGradientCSS(fill: FillData): string {
  if (!fill.gradientStops) return '';

  // WP32: Apply fill opacity to each stop's alpha
  const fillOpacity = fill.opacity ?? 1;

  const stops = fill.gradientStops
    .map(stop => {
      const { r, g, b, a = 1 } = stop.color;
      // Multiply color alpha by fill opacity
      const finalAlpha = a * fillOpacity;
      return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha}) ${Math.round(stop.position * 100)}%`;
    })
    .join(', ');

  // Calculate angle from gradient handles if available
  let angle = 180; // Default: top to bottom
  if (fill.gradientHandlePositions && fill.gradientHandlePositions.length >= 2) {
    const [start, end] = fill.gradientHandlePositions;
    angle = Math.round(Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI + 90);
  }

  if (fill.type === 'GRADIENT_RADIAL') {
    return `radial-gradient(circle, ${stops})`;
  }
  return `linear-gradient(${angle}deg, ${stops})`;
}

/**
 * WP32: Convert FillData solid color to CSS rgba string
 * Applies fill opacity to color alpha (like MCP does)
 */
function fillDataToColorCSS(fill: FillData): string {
  if (!fill.color) return '';
  const { r, g, b, a = 1 } = fill.color;
  // WP32: Multiply color alpha by fill opacity
  const fillOpacity = fill.opacity ?? 1;
  const finalAlpha = a * fillOpacity;
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha})`;
}

/**
 * Filter out properties with unresolved variables or empty values
 * @param props - Raw resolved properties from rule evaluation
 * @returns Cleaned properties without $value placeholders
 */
function cleanResolvedProperties(props: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(props)) {
    // Ensure value is a string
    const stringValue = String(value);

    // Skip properties with unresolved variables
    if (stringValue.includes('$value') || stringValue.includes('${')) {
      continue;
    }
    // Skip empty values
    if (!stringValue || stringValue.trim() === '') {
      continue;
    }
    cleaned[key] = stringValue;
  }

  return cleaned;
}

/**
 * Deduplicate Tailwind classes and resolve conflicts
 *
 * Conflict resolution rules:
 * - pt-[40px] overrides py-10 (specific padding-top beats combined py)
 * - pl-[32px] overrides px-8 (specific padding-left beats combined px)
 * - Later classes override earlier classes for same property
 *
 * @param classes - Array of Tailwind class strings
 * @returns Deduplicated array with conflicts resolved
 */
function deduplicateTailwindClasses(classes: string[]): string[] {
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

      // WP38: Don't round w-/h- dimensions - MCP keeps exact pixel values
      // Only apply nearest-value rounding to gap/padding/margin
      if (prefix === 'w-' || prefix === 'h-' || prefix === 'min-w-' || prefix === 'max-w-' || prefix === 'min-h-' || prefix === 'max-h-') {
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

  // Tailwind spacing scale (px → class suffix)
  const standardSpacing: Record<number, string> = {
    0: '0',
    1: 'px',
    4: '1',
    8: '2',
    12: '3',
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
    // 72: '18',  // REMOVED - not valid in V3
    80: '20',
    96: '24',
  };

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
 * Generate React JSX component with Tailwind CSS classes
 *
 * Output format:
 *   export function ButtonComponent() {
 *     return (
 *       <div className="flex p-4 bg-red-500 rounded-lg">
 *         <span className="text-white font-semibold">Button Text</span>
 *       </div>
 *     );
 *   }
 *
 * FigmaToCode enhancements:
 * - Arbitrary values for non-standard sizes: gap-[13px]
 * - Rotation classes: rotate-45, rotate-[47deg]
 * - Opacity conversion: 0-1 → opacity-0, opacity-25, opacity-50, opacity-75, opacity-100
 *
 * @param altNode - The AltNode tree to generate code from
 * @param resolvedProperties - CSS properties from rule evaluation
 * @param allRules - All available rules for child evaluation
 * @param framework - Target framework for code generation
 * @returns GeneratedCodeOutput object with Tailwind JSX string
 */
export async function generateReactTailwind(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind',
  figmaFileKey?: string,
  figmaAccessToken?: string,
  nodeId?: string,
  options?: GenerateOptions
): Promise<GeneratedCodeOutput> {
  const componentName = toPascalCase(altNode.name);

  // WP31: Extract fonts and generate Google Fonts URL
  const fonts = extractFonts(altNode);
  const googleFontsUrl = generateGoogleFontsUrl(fonts);

  // FIX: Clean properties to remove $value placeholders
  const cleanedProps = cleanResolvedProperties(resolvedProperties);

  // WP32: Build image URLs map
  // - For local viewer: use /api/images/{nodeId}/{filename}
  // - For export: use Figma API URLs
  let imageUrls: Record<string, string> = {};

  if (nodeId) {
    // Local viewer mode: use local API route
    // WP32: Extract real nodeId from lib-{nodeId} format
    const realNodeId = nodeId.startsWith('lib-') ? nodeId.replace('lib-', '') : nodeId;

    const imageNodes = extractImageNodes(altNode);
    for (const imgNode of imageNodes) {
      const filename = `${realNodeId}_${imgNode.imageRef.substring(0, 8)}.png`;
      imageUrls[imgNode.imageRef] = `/api/images/${nodeId}/${filename}`;
    }
    // console.log(`✅ Using ${Object.keys(imageUrls).length} local image paths`);
  } else if (figmaFileKey && figmaAccessToken) {
    // Export mode: fetch from Figma API
    const imageNodes = extractImageNodes(altNode);
    const imageRefs = imageNodes.map(n => n.imageRef);
    if (imageRefs.length > 0) {
      imageUrls = await fetchFigmaImages(figmaFileKey, imageRefs, figmaAccessToken);
      // console.log(`✅ Fetched ${Object.keys(imageUrls).length} image URLs from Figma API`);
    }
  }

  // WP32: Build SVG exports with variable names for clean imports
  // Viewer mode (nodeId present) → use pre-downloaded SVGs from local API
  // Export mode (no nodeId) → use imports + separate files
  const isViewerMode = !!nodeId;
  const svgExports: SvgExportInfo[] = [];
  const svgVarNames: Record<string, string> = {}; // nodeId → varName (for export mode)
  const svgDataUrls: Record<string, string> = {}; // nodeId → data URL or local API URL (for viewer mode)
  const usedVarNames = new Set<string>();

  // WP32: SVG containers - used in BOTH modes now
  // In viewer mode: use pre-downloaded SVGs from /api/images/{nodeId}/{filename}.svg
  // In export mode: download whole container as single SVG
  // WP32: Simple SVG map - nodeId → bounds (from Figma API export)
  const svgBoundsMap: Map<string, { width: number; height: number }> = new Map();

  // WP32: Extract all nodes to export as SVG (VECTORs + multi-VECTOR containers)
  const svgNodes = extractSvgContainers(altNode);

  // Build bounds map
  for (const svgNode of svgNodes) {
    svgBoundsMap.set(svgNode.nodeId, svgNode.bounds);
  }

  if (isViewerMode && svgNodes.length > 0) {
    // WP32: Viewer mode - use pre-downloaded SVGs from local API
    for (const svgNode of svgNodes) {
      const filename = generateSvgFilename(svgNode.name, svgNode.nodeId);
      svgDataUrls[svgNode.nodeId] = `/api/images/${nodeId}/${filename}`;
    }
    // console.log(`✅ Using ${Object.keys(svgDataUrls).length} local SVG paths for viewer`);
  } else if (!isViewerMode && svgNodes.length > 0) {
    // WP32: Export mode - fetch from Figma API
    let svgContent: Record<string, string> = {};
    if (figmaFileKey && figmaAccessToken) {
      const nodeIds = svgNodes.map(n => n.nodeId);
      svgContent = await fetchNodesAsSVG(figmaFileKey, nodeIds, figmaAccessToken);
      // console.log(`✅ Fetched ${Object.keys(svgContent).length} SVGs from Figma API`);
    }

    for (const svgNode of svgNodes) {
      const varName = generateSvgVarName(svgNode.name || 'svg', usedVarNames);
      const filename = `${varName}.svg`;
      const path = `./img/${filename}`;
      const content = svgContent[svgNode.nodeId] || `<svg xmlns="http://www.w3.org/2000/svg"><text y="20">Missing SVG</text></svg>`;

      svgExports.push({
        nodeId: svgNode.nodeId,
        varName,
        filename,
        path,
        svgContent: content,
        isComplex: true,
      });
      svgVarNames[svgNode.nodeId] = varName;
    }
  }

  // Generate SVG imports (export mode only)
  const svgImports = !isViewerMode && svgExports.length > 0
    ? svgExports.map(svg => `import ${svg.varName} from "${svg.path}";`).join('\n')
    : '';

  // Generate assets for export (export mode only)
  const assets: GeneratedAsset[] = !isViewerMode
    ? svgExports.map(svg => ({
        filename: svg.filename,
        path: svg.path,
        content: svg.svgContent,
        type: 'svg' as const,
      }))
    : [];

  // WP32: Pass appropriate map based on mode
  const svgMap = isViewerMode ? svgDataUrls : svgVarNames;

  // WP47: Collect props if withProps is enabled
  const propNames = new Set<string>();
  const collectedProps = options?.withProps
    ? collectProps(altNode, imageUrls, propNames)
    : [];
  const propLookup = options?.withProps
    ? createPropLookup(collectedProps)
    : new Map();

  // Generate JSX (with prop lookup for withProps mode)
  const jsx = generateTailwindJSXElement(
    altNode,
    cleanedProps,
    0,
    allRules,
    framework,
    imageUrls,
    svgMap,
    isViewerMode,
    svgBoundsMap,
    undefined,
    false,
    propLookup
  );

  // WP31: Generate CSS variable definitions for React-Tailwind
  // console.log('[REACT-TAILWIND] Calling generateCssVariableDefinitions...');
  const cssVariables = generateCssVariableDefinitions();
  // console.log('[REACT-TAILWIND] cssVariables length:', cssVariables.length);

  // Build style tag with CSS variables (if any)
  const styleTag = cssVariables
    ? `      <style dangerouslySetInnerHTML={{ __html: \`${cssVariables}\` }} />\n`
    : '';

  // WP47: Build code with props interface if enabled
  const importSection = svgImports ? `${svgImports}\n\n` : '';

  let code: string;
  if (options?.withProps && collectedProps.length > 0) {
    const propsInterface = generatePropsInterface(componentName, collectedProps);
    const propsDestructuring = generatePropsDestructuring(componentName, collectedProps);
    code = `${importSection}${propsInterface}export function ${componentName}(${propsDestructuring}) {
  return (
    <>
${styleTag}${jsx}    </>
  );
}`;
  } else {
    code = `${importSection}export function ${componentName}() {
  return (
    <>
${styleTag}${jsx}    </>
  );
}`;
  }

  return {
    code,
    format: 'react-tailwind',
    language: 'tsx',
    metadata: {
      componentName,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
    assets: assets.length > 0 ? assets : undefined,
    googleFontsUrl,
  };
}

/**
 * Recursively generate JSX element with Tailwind classes
 *
 * @param node - Current AltNode
 * @param properties - Resolved CSS properties for this node
 * @param depth - Indentation depth
 * @param allRules - All available rules for child evaluation
 * @param framework - Target framework for code generation
 * @param imageUrls - Map of imageRef → URL
 * @param svgMap - WP32: nodeId → varName (export) or data URL (viewer)
 * @param isViewerMode - WP32: true = data URLs inline, false = import variables
 * @param svgBoundsMap - WP32: Map of nodeId → { width, height } for SVG nodes
 * @param parentNegativeSpacing - WP31: Negative itemSpacing from parent (for margin)
 * @param isLastChild - WP31: Whether this is the last child (no margin needed)
 * @param propLookup - WP47: Map of layerName → propName for props mode
 * @returns JSX string with Tailwind classes
 */
function generateTailwindJSXElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  depth: number,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind',
  imageUrls: Record<string, string> = {},
  svgMap: Record<string, string> = {},  // WP32: nodeId → varName (export) or data URL (viewer)
  isViewerMode: boolean = false,  // WP32: true = data URLs inline, false = import variables
  svgBoundsMap: Map<string, { width: number; height: number }> = new Map(),
  parentNegativeSpacing?: { value: number; direction: 'row' | 'column' },  // WP31: From parent
  isLastChild: boolean = false,  // WP31: Last child doesn't need margin
  propLookup: Map<string, { propName: string; type: 'text' | 'image' }> = new Map()  // WP47: Props lookup
): string {
  // WP32: Skip hidden nodes - they should not be rendered in generated code
  if (node.visible === false) {
    return '';
  }

  const indent = '  '.repeat(depth + 1);

  // WP32: Handle SVG nodes (VECTORs or multi-VECTOR containers)
  const svgBounds = svgBoundsMap.get(node.id);
  if (svgBounds) {
    const svgValue = svgMap[node.id];
    const altText = node.name || 'svg';

    // WP32 DEBUG
    // console.log(`🔍 SVG: ${node.name} (${node.id}) - bounds: ${JSON.stringify(svgBounds)}`);

    // Build data attributes
    // WP38: Truncate long layer names (TEXT nodes often use full text content)
    const componentAttrs = extractComponentDataAttributes(node);
    const allDataAttrs = {
      'data-layer': truncateLayerName(node.name),
      'data-node-id': node.id,
      ...componentAttrs
    };
    const dataAttrString = Object.entries(allDataAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    // Simple: img with SVG dimensions from Figma API
    // WP31: Respect width/height from AltNode styles (e.g., 100% from FILL) over fixed pixel bounds
    const nodeWidth = node.styles?.width;
    const nodeHeight = node.styles?.height;
    const { width, height } = svgBounds;

    // Use percentage width/height if specified, otherwise use fixed pixel dimensions
    const widthClass = (typeof nodeWidth === 'string' && nodeWidth.includes('%'))
      ? cssPropToTailwind('width', nodeWidth)
      : (width > 0 ? `w-[${Math.round(width)}px]` : '');
    const heightClass = (typeof nodeHeight === 'string' && nodeHeight.includes('%'))
      ? cssPropToTailwind('height', nodeHeight)
      : (height > 0 ? `h-[${Math.round(height)}px]` : '');
    const sizeClasses = [widthClass, heightClass].filter(Boolean).join(' ');

    // WP31: Include positioning and GROUP-related styles for SVG containers
    // position/top/left needed for free-positioned SVGs in frames without layoutMode
    const positioningStyles = ['position', 'top', 'left', 'right', 'bottom', 'grid-area', 'margin-left', 'margin-top', 'margin-right', 'margin-bottom'];
    const nodeStyleClasses = Object.entries(node.styles || {})
      .filter(([prop]) => positioningStyles.includes(prop))
      .map(([prop, value]) => cssPropToTailwind(prop, String(value)))
      .filter(Boolean)
      .join(' ');
    const allClasses = ['block', 'max-w-none', sizeClasses, nodeStyleClasses].filter(Boolean).join(' ');

    if (svgValue) {
      const imgSrc = isViewerMode ? `"${svgValue}"` : `{${svgValue}}`;
      return `${indent}<img ${dataAttrString} className="${allClasses}" alt="${altText}" src=${imgSrc} />\n`;
    }
    return `${indent}<div ${dataAttrString} className="${allClasses}" />\n`;
  }

  const htmlTag = mapNodeTypeToHTMLTag(node.originalType); // T177: Use originalType for tag mapping

  // T178: Add data-layer attribute
  // T180: Extract component properties as data-* attributes
  // WP31: Add data-node-id for node-by-node comparison with MCP reference
  // WP38: Truncate long layer names (TEXT nodes often use full text content)
  const componentAttrs = extractComponentDataAttributes(node);
  const allDataAttrs = {
    'data-layer': truncateLayerName(node.name), // T178: Original Figma name (truncated)
    'data-node-id': node.id, // WP31: Figma node ID for comparison
    ...componentAttrs // T180: Component properties
  };

  const dataAttrString = Object.entries(allDataAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  // Merge base styles from AltNode with rule overrides
  // Rules take precedence over computed styles
  // Convert node.styles values to strings if needed
  const baseStyles: Record<string, string> = {};
  const hasChildren = 'children' in node && node.children.length > 0;
  const hasFlex = node.styles?.display === 'flex' || node.styles?.display === 'inline-flex';

  for (const [key, value] of Object.entries(node.styles || {})) {
    // WP31: MCP garde le height même sur flex containers - on fait pareil
    baseStyles[key] = typeof value === 'number' ? String(value) : value;
  }

  const mergedStyles: Record<string, string> = {
    ...baseStyles,
    ...properties,
  };

  // WP25 FIX: Merge classes from rules AND base styles
  let tailwindClasses: string;

  // Convert base styles to Tailwind classes
  const baseClasses = Object.entries(baseStyles)
    .filter(([key]) => key !== 'className') // Skip className in baseStyles
    .map(([cssProperty, cssValue]) => cssPropToTailwind(cssProperty, cssValue))
    .filter(Boolean);

  // WP08: Add responsive classes from responsiveStyles (md: and lg: prefixes)
  // Note: cssPropToTailwind may return multiple classes (e.g., "border border-[color] border-solid")
  // We need to prefix EACH class with md: or lg:
  // Use smartSplitTailwindClasses to handle arbitrary values with spaces inside brackets
  const responsiveClasses: string[] = [];
  if (node.responsiveStyles?.md) {
    for (const [cssProperty, cssValue] of Object.entries(node.responsiveStyles.md)) {
      const twClass = cssPropToTailwind(cssProperty, String(cssValue));
      if (twClass) {
        // Smart split to preserve arbitrary values, then prefix each class
        const classes = smartSplitTailwindClasses(twClass);
        for (const cls of classes) {
          responsiveClasses.push(`md:${cls}`);
        }
      }
    }
  }
  if (node.responsiveStyles?.lg) {
    for (const [cssProperty, cssValue] of Object.entries(node.responsiveStyles.lg)) {
      const twClass = cssPropToTailwind(cssProperty, String(cssValue));
      if (twClass) {
        // Smart split to preserve arbitrary values, then prefix each class
        const classes = smartSplitTailwindClasses(twClass);
        for (const cls of classes) {
          responsiveClasses.push(`lg:${cls}`);
        }
      }
    }
  }

  // WP31: Add MCP-style structural classes
  const structuralClasses: string[] = [];

  // Add visibility classes for partial visibility (mobile-only, tablet-only, etc.)
  // This ensures elements are hidden/shown at correct breakpoints
  if (node.presence) {
    const visibilityClasses = getVisibilityClasses(node.presence);
    if (visibilityClasses) {
      // Split visibility classes and add them (e.g., "hidden md:block" → ["hidden", "md:block"])
      structuralClasses.push(...visibilityClasses.split(/\s+/).filter(Boolean));
    }
  }

  // MCP adds these utility classes systematically
  structuralClasses.push('box-border'); // Ensure box-sizing: border-box
  structuralClasses.push('content-stretch'); // MCP custom utility

  // Add relative for positioned elements (like MCP), unless already absolute
  // WP31: Skip relative for GROUP children (grid-area stacking) - relative creates stacking context issues
  const isGridChild = node.styles?.['grid-area'];
  if (node.originalType !== 'TEXT' && node.styles?.position !== 'absolute' && !isGridChild) {
    structuralClasses.push('relative');
  }

  // Add shrink-0 for flex items (MCP adds it almost everywhere)
  structuralClasses.push('shrink-0');

  // WP31: Add negative margin from parent's negative itemSpacing
  // This replaces invalid gap-[-Xpx] with valid mr-[-Xpx] or mb-[-Xpx]
  if (parentNegativeSpacing && !isLastChild) {
    const marginClass = parentNegativeSpacing.direction === 'row'
      ? `mr-[${parentNegativeSpacing.value}px]`
      : `mb-[${parentNegativeSpacing.value}px]`;
    structuralClasses.push(marginClass);
  }

  // WP31: Add flex centering for icon containers (fixed size with SVG children)
  const hasVectorChildren = 'children' in node && node.children.some(
    (child: SimpleAltNode) => child.originalType === 'VECTOR' || child.svgData
  );
  const hasFixedSize = node.styles?.width && node.styles?.height;
  const displayValue = String(node.styles?.display || '');
  const isNotFlexContainer = !displayValue.includes('flex');
  if (hasVectorChildren && hasFixedSize && isNotFlexContainer) {
    structuralClasses.push('flex', 'items-center', 'justify-center');
  }

  if (properties.className) {
    // WP28 T211: Rules come LAST so they override fallback base classes
    // This ensures semantic classes from rules (text-sm) beat raw fallbacks (text-[14px])
    // Architecture: fallbacks provide CSS guarantee → rules optimize to semantic classes
    const ruleClasses = properties.className.split(/\s+/).filter(Boolean);
    // WP08: Include responsive classes (md:, lg:) after base classes
    const allClasses = [...structuralClasses, ...baseClasses, ...responsiveClasses, ...ruleClasses];

    // WP28 T211: Deduplicate classes with correct priority
    // Rules win: text-sm overrides text-[14px], flex-col overrides flex-column
    // Last occurrence wins in deduplicateTailwindClasses(), so rules (last) beat fallbacks (first)
    let uniqueClasses = deduplicateTailwindClasses(allClasses);

    // WP38: Remove self-stretch when max-width is present (like MCP)
    // Elements with max-width should be centered by parent's items-center, not stretched
    const hasMaxWidth = uniqueClasses.some(c => c.startsWith('max-w-'));
    if (hasMaxWidth) {
      uniqueClasses = uniqueClasses.filter(c => c !== 'self-stretch');
    }

    tailwindClasses = uniqueClasses.join(' ');
  } else {
    // No rules - just use structural + base classes (fallbacks)
    // WP08: Include responsive classes (md:, lg:) after base classes
    const allClasses = [...structuralClasses, ...baseClasses, ...responsiveClasses];
    tailwindClasses = allClasses.join(' ');
  }

  const hasClasses = tailwindClasses.length > 0;

  // Generate JSX
  let jsxString = '';

  // T177 CRITICAL FIX: TEXT nodes MUST use text content, not children
  // TEXT nodes in Figma can have children (for styling spans) but we want the raw text
  if (node.originalType === 'TEXT') {
    // T185: Use extractTextContent to preserve line breaks
    const content = extractTextContent(node);

    // WP47: Check if this text node should use a prop (lookup by nodeId)
    const textProp = propLookup.get(node.id);
    const usesProp = textProp && textProp.type === 'text';

    if (content) {
      if (usesProp) {
        // Use prop reference instead of hardcoded content
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>{${textProp.propName}}</${htmlTag}>`;
      } else {
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>${content}</${htmlTag}>`;
      }
    } else {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}></${htmlTag}>`;
    }
  } else if (node.originalType === 'VECTOR' && node.svgData) {
    // WP32: SVG rendering - viewer mode uses data URLs, export mode uses import variables
    const svgValue = svgMap[node.id];
    const altText = node.name || 'vector';
    // Extract width/height from node.styles for proper sizing (JSX style object)
    const width = node.styles?.width || '';
    const height = node.styles?.height || '';
    const sizeStyle = (width && height) ? ` style={{ width: '${width}', height: '${height}' }}` : '';

    if (svgValue) {
      if (isViewerMode) {
        // WP32: Viewer mode - inline data URL with dimensions
        jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}${sizeStyle} alt="${altText}" src="${svgValue}" />`;
      } else {
        // WP32: Export mode - use variable reference for clean imports
        jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}${sizeStyle} alt="${altText}" src={${svgValue}} />`;
      }
    } else {
      // Fallback: inline data URL
      const svgDataUrl = vectorToDataURL(node.svgData);
      jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}${sizeStyle} alt="${altText}" src="${svgDataUrl}" />`;
    }
  } else if (node.fillsData && node.fillsData.length > 0) {
    // WP32: Multi-fill rendering - render ALL fills as stacked layers like MCP
    const hasChildren = 'children' in node && node.children.length > 0;
    const hasMultipleFills = node.fillsData.length > 1;
    const hasImageFill = node.fillsData.some((f: FillData) => f.type === 'IMAGE');

    // If multiple fills OR has image fill with children, use layered rendering
    if (hasMultipleFills || (hasImageFill && hasChildren)) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

      // Render all fills as stacked layers (decorative, hidden from screen readers)
      // WP31 FIX: Add rounded-[inherit] only if parent has border-radius
      const hasBorderRadius = node.styles['border-radius'] && node.styles['border-radius'] !== '0px';
      const inheritRadius = hasBorderRadius ? ' overflow-hidden rounded-[inherit]' : '';
      const childInheritRadius = hasBorderRadius ? ' rounded-[inherit]' : '';
      jsxString += `${indent}  <div aria-hidden="true" className="absolute inset-0 pointer-events-none${inheritRadius}">\n`;

      for (const fill of node.fillsData) {
        if (fill.type === 'IMAGE' && fill.imageRef) {
          const imageUrl = imageUrls[fill.imageRef] || `https://placehold.co/300x200`;
          // WP32: Use scaleMode for object-fit class
          const objectFitClass = scaleModeToTailwind(fill.scaleMode);
          jsxString += `${indent}    <img alt="" className="absolute inset-0 w-full h-full ${objectFitClass}${childInheritRadius}" src="${imageUrl}" />\n`;
        } else if (fill.type === 'SOLID') {
          const colorCSS = fillDataToColorCSS(fill);
          jsxString += `${indent}    <div className="absolute inset-0${childInheritRadius}" style={{ backgroundColor: "${colorCSS}" }} />\n`;
        } else if (fill.type.startsWith('GRADIENT')) {
          const gradientCSS = fillDataToGradientCSS(fill);
          jsxString += `${indent}    <div className="absolute inset-0${childInheritRadius}" style={{ backgroundImage: "${gradientCSS}" }} />\n`;
        }
      }

      jsxString += `${indent}  </div>\n`;

      // Render children (position:relative comes from altnode-transform)
      if (hasChildren) {
        // WP31: Prepare negative spacing for children
        const childNegativeSpacing = node.negativeItemSpacing && node.layoutDirection
          ? { value: node.negativeItemSpacing, direction: node.layoutDirection }
          : undefined;
        const childrenArray = (node as any).children;
        for (let i = 0; i < childrenArray.length; i++) {
          const child = childrenArray[i];
          const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
          const childProps = cleanResolvedProperties(childResult.properties);
          const isLast = i === childrenArray.length - 1;
          jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework, imageUrls, svgMap, isViewerMode, svgBoundsMap, childNegativeSpacing, isLast, propLookup);
        }
      }

      jsxString += `${indent}</${htmlTag}>`;
    } else if (hasImageFill && !hasChildren) {
      // Single image fill without children - simple img tag
      // WP32: Add object-fit based on scaleMode (FILL → object-cover, FIT → object-contain)
      const imageFill = node.fillsData.find((f: FillData) => f.type === 'IMAGE');
      const imageUrl = imageUrls[imageFill?.imageRef || ''] || 'https://placehold.co/300x200';
      const altText = node.name || 'image';
      const objectFitClass = scaleModeToTailwind(imageFill?.scaleMode);
      const imgClasses = hasClasses ? `${tailwindClasses} ${objectFitClass}` : objectFitClass;

      // WP47: Check if this image node should use a prop (lookup by nodeId)
      const imageProp = propLookup.get(node.id);
      const usesImageProp = imageProp && imageProp.type === 'image';

      if (usesImageProp) {
        jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src={${imageProp.propName}} />`;
      } else {
        jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src="${imageUrl}" />`;
      }
    } else {
      // Single non-image fill (solid/gradient) - render as div with background
      const fill = node.fillsData[0];
      const styleProps: string[] = [];
      if (fill.type === 'SOLID') {
        styleProps.push(`backgroundColor: "${fillDataToColorCSS(fill)}"`);
      } else if (fill.type.startsWith('GRADIENT')) {
        styleProps.push(`backgroundImage: "${fillDataToGradientCSS(fill)}"`);
      }

      // WP38 Fix #23: Apply mask-image for Figma mask pattern
      if (node.maskImageRef) {
        const maskUrl = imageUrls[node.maskImageRef] || '';
        if (maskUrl) {
          styleProps.push(`WebkitMaskImage: "url('${maskUrl}')"`);
          styleProps.push(`maskImage: "url('${maskUrl}')"`);
          styleProps.push(`WebkitMaskSize: "contain"`);
          styleProps.push(`maskSize: "contain"`);
          styleProps.push(`WebkitMaskRepeat: "no-repeat"`);
          styleProps.push(`maskRepeat: "no-repeat"`);
          styleProps.push(`WebkitMaskPosition: "center"`);
          styleProps.push(`maskPosition: "center"`);
        }
      }

      const styleString = styleProps.join(', ');

      if (hasChildren) {
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} style={{ ${styleString} }}>\n`;
        // WP31: Prepare negative spacing for children
        const childNegativeSpacing = node.negativeItemSpacing && node.layoutDirection
          ? { value: node.negativeItemSpacing, direction: node.layoutDirection }
          : undefined;
        const childrenArray = (node as any).children;
        for (let i = 0; i < childrenArray.length; i++) {
          const child = childrenArray[i];
          const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
          const childProps = cleanResolvedProperties(childResult.properties);
          const isLast = i === childrenArray.length - 1;
          jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework, imageUrls, svgMap, isViewerMode, svgBoundsMap, childNegativeSpacing, isLast, propLookup);
        }
        jsxString += `${indent}</${htmlTag}>`;
      } else {
        jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} style={{ ${styleString} }} />`;
      }
    }
  } else if (shouldRenderAsImgTag(node)) {
    // WP32: Fallback for backward compatibility - single image without fillsData
    const imageUrl = imageUrls[node.imageData?.imageRef || ''] || extractImageUrl(node) || 'https://placehold.co/300x200';
    const altText = node.name || 'image';
    const objectFitClass = scaleModeToTailwind(node.imageData?.scaleMode);
    const imgClasses = hasClasses ? `${tailwindClasses} ${objectFitClass}` : objectFitClass;

    // WP47: Check if this image node should use a prop (lookup by nodeId)
    const imageProp = propLookup.get(node.id);
    const usesImageProp = imageProp && imageProp.type === 'image';

    if (usesImageProp) {
      jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src={${imageProp.propName}} />`;
    } else {
      jsxString += `${indent}<img ${dataAttrString} className="${imgClasses}" alt="${altText}" src="${imageUrl}" />`;
    }
  } else {
    // Non-TEXT, Non-VECTOR, Non-IMAGE nodes: check for children
    const hasChildren = 'children' in node && node.children.length > 0;

    if (hasChildren) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

      // WP31: Prepare negative spacing for children
      const childNegativeSpacing = node.negativeItemSpacing && node.layoutDirection
        ? { value: node.negativeItemSpacing, direction: node.layoutDirection }
        : undefined;
      const childrenArray = (node as any).children;
      for (let i = 0; i < childrenArray.length; i++) {
        const child = childrenArray[i];
        // Evaluate rules for this child
        const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
        const childProps = cleanResolvedProperties(childResult.properties);
        const isLast = i === childrenArray.length - 1;

        jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework, imageUrls, svgMap, isViewerMode, svgBoundsMap, childNegativeSpacing, isLast, propLookup);
      }

      jsxString += `${indent}</${htmlTag}>`;
    } else {
      // Empty leaf node
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} />`;
    }
  }

  return jsxString + '\n';
}

/**
 * Map Figma node type to HTML tag
 */
function mapNodeTypeToHTMLTag(nodeType: string): string {
  const mapping: Record<string, string> = {
    FRAME: 'div',
    RECTANGLE: 'div',
    TEXT: 'span',
    GROUP: 'div',
    COMPONENT: 'div',
    INSTANCE: 'div',
    VECTOR: 'svg',
    ELLIPSE: 'div',
  };

  return mapping[nodeType] || 'div';
}

/**
 * WP25 T183: Determine if a node should render as <img> tag vs background-image
 *
 * WP32 FIX: Use imageData as primary criteria (set by altnode-transform)
 * Use <img> if:
 * - Node has imageData with imageRef (from altnode-transform)
 * - OR node has image fill AND no children
 */
function shouldRenderAsImgTag(node: SimpleAltNode): boolean {
  // WP32: Primary check - imageData is set by altnode-transform for image fills
  if (node.imageData?.imageRef) {
    return true;
  }

  // Fallback: Check originalNode fills (for backward compatibility)
  const hasImageFill = (node.originalNode as any)?.fills?.some(
    (fill: any) => fill.type === 'IMAGE'
  );
  const hasNoChildren = !node.children || node.children.length === 0;

  return hasImageFill && hasNoChildren;
}

/**
 * WP25 T183: Extract image URL from node
 *
 * Returns imageRef from fills or null
 */
function extractImageUrl(node: SimpleAltNode): string | null {
  const fills = (node.originalNode as any)?.fills || [];
  const imageFill = fills.find((fill: any) => fill.type === 'IMAGE');

  if (imageFill && imageFill.imageRef) {
    return imageFill.imageRef;
  }

  return null;
}
