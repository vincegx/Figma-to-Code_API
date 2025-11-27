import type { SimpleAltNode } from '../altnode-transform';
import { toPascalCase, cssPropToTailwind, extractTextContent, extractComponentDataAttributes } from './helpers';
import { GeneratedCodeOutput } from './react';
import type { MultiFrameworkRule, FrameworkType } from '../types/rules';
import { evaluateMultiFrameworkRules } from '../rule-engine';

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

  // WP25 FIX: Remove default flex properties that are redundant
  // flex-nowrap, self-auto, grow-0, shrink are defaults
  const filtered = removeDefaultFlexProperties(normalized);

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
    52: '13',
    56: '14',
    60: '15',
    64: '16',
    72: '18',
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
    52: '13',
    56: '14',
    60: '15',
    64: '16',
    72: '18',
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
export function generateReactTailwind(
  altNode: SimpleAltNode,
  resolvedProperties: Record<string, string>,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind'
): GeneratedCodeOutput {
  const componentName = toPascalCase(altNode.name);

  // FIX: Clean properties to remove $value placeholders
  const cleanedProps = cleanResolvedProperties(resolvedProperties);

  const jsx = generateTailwindJSXElement(altNode, cleanedProps, 0, allRules, framework);

  const code = `export function ${componentName}() {
  return (
${jsx}  );
}`;

  return {
    code,
    format: 'react-tailwind',
    language: 'tsx',
    metadata: {
      componentName,
      nodeId: altNode.id,
      generatedAt: new Date().toISOString(),
    },
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
 * @returns JSX string with Tailwind classes
 */
function generateTailwindJSXElement(
  node: SimpleAltNode,
  properties: Record<string, string>,
  depth: number,
  allRules: MultiFrameworkRule[] = [],
  framework: FrameworkType = 'react-tailwind'
): string {
  const indent = '  '.repeat(depth + 1);
  const htmlTag = mapNodeTypeToHTMLTag(node.originalType); // T177: Use originalType for tag mapping

  // T178: Add data-layer attribute
  // T180: Extract component properties as data-* attributes
  const componentAttrs = extractComponentDataAttributes(node);
  const allDataAttrs = {
    'data-layer': node.name, // T178: Original Figma name
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
    // WP25 FIX: Don't generate height on flex containers with children
    // Plugin Figma only generates height on leaf elements or when explicitly needed
    if (key === 'height' && hasFlex && hasChildren) {
      continue; // Skip height for flex containers with children
    }

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

  if (properties.className) {
    // WP28 T211: Rules come LAST so they override fallback base classes
    // This ensures semantic classes from rules (text-sm) beat raw fallbacks (text-[14px])
    // Architecture: fallbacks provide CSS guarantee → rules optimize to semantic classes
    const ruleClasses = properties.className.split(/\s+/).filter(Boolean);
    const allClasses = [...baseClasses, ...ruleClasses]; // WP28: baseClasses first, rules last

    // WP28 T211: Deduplicate classes with correct priority
    // Rules win: text-sm overrides text-[14px], flex-col overrides flex-column
    // Last occurrence wins in deduplicateTailwindClasses(), so rules (last) beat fallbacks (first)
    const uniqueClasses = deduplicateTailwindClasses(allClasses);
    tailwindClasses = uniqueClasses.join(' ');
  } else {
    // No rules - just use base classes (fallbacks)
    tailwindClasses = baseClasses.join(' ');
  }

  const hasClasses = tailwindClasses.length > 0;

  // Generate JSX
  let jsxString = '';

  // T177 CRITICAL FIX: TEXT nodes MUST use text content, not children
  // TEXT nodes in Figma can have children (for styling spans) but we want the raw text
  if (node.originalType === 'TEXT') {
    // T185: Use extractTextContent to preserve line breaks
    const content = extractTextContent(node);
    if (content) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>${content}</${htmlTag}>`;
    } else {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}></${htmlTag}>`;
    }
  } else if (node.originalType === 'VECTOR') {
    // WP25 T182: VECTOR nodes should render as SVG with wrapper
    const componentName = node.name.includes('#') ? node.name.split('#')[0] : node.name;
    const svgDataAttr = `data-svg-wrapper data-name="${componentName}" ${dataAttrString}`;

    jsxString += `${indent}<div ${svgDataAttr}${hasClasses ? ` className="${tailwindClasses} relative"` : ' className="relative"'}>\n`;
    jsxString += `${indent}  {/* TODO: Insert SVG content for ${node.name} here */}\n`;
    jsxString += `${indent}  {/* Fetch SVG via Figma API: GET /v1/images/{fileKey}?ids=${(node.originalNode as any)?.id || ''}&format=svg */}\n`;
    jsxString += `${indent}</div>`;
  } else if (shouldRenderAsImgTag(node)) {
    // WP25 T183: Nodes with image fills that should be <img> tags
    const imageUrl = extractImageUrl(node) || 'https://placehold.co/300x200';

    jsxString += `${indent}<img ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''} src="${imageUrl}" />`;
  } else {
    // Non-TEXT, Non-VECTOR nodes: check for children
    const hasChildren = 'children' in node && node.children.length > 0;

    if (hasChildren) {
      jsxString += `${indent}<${htmlTag} ${dataAttrString}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

      // FIX: Recursively generate children with their own rule evaluation
      for (const child of (node as any).children) {
        // Evaluate rules for this child
        const childResult = evaluateMultiFrameworkRules(child, allRules, framework);
        const childProps = cleanResolvedProperties(childResult.properties);

        jsxString += generateTailwindJSXElement(child, childProps, depth + 1, allRules, framework);
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
 * Use <img> if:
 * - Node name contains "image", "img", "photo", "picture" (case-insensitive)
 * - Node has no children (leaf node)
 * - Node has an image fill
 */
function shouldRenderAsImgTag(node: SimpleAltNode): boolean {
  // Check if node has image fill
  const hasImageFill = (node.originalNode as any)?.fills?.some(
    (fill: any) => fill.type === 'IMAGE'
  );
  if (!hasImageFill) {
    return false;
  }

  // Check if node name suggests it's an image
  const isImageNamed = /image|img|photo|picture/i.test(node.name);

  // Check if node has no children (leaf node)
  const hasNoChildren = !node.children || node.children.length === 0;

  return isImageNamed && hasNoChildren;
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
