/**
 * Convert string to PascalCase for React component names
 *
 * Examples:
 *   "button-primary" → "ButtonPrimary"
 *   "icon_24px" → "Icon24px"
 *   "123Button" → "Component123Button" (prefix numeric-leading)
 *
 * @param str - Input string
 * @returns PascalCase string
 */
export function toPascalCase(str: string): string {
  // Remove non-alphanumeric characters, split into words
  const words = str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const pascalCased = words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  // FigmaToCode enhancement: Prefix numeric-leading names
  if (/^[0-9]/.test(pascalCased)) {
    return 'Component' + pascalCased;
  }

  return pascalCased || 'Component'; // Fallback if empty
}

/**
 * Convert CSS object to string
 *
 * Example:
 *   { display: 'flex', padding: '16px' } → "display: flex; padding: 16px;"
 *
 * @param cssObject - CSS properties as object
 * @returns CSS string
 */
export function cssObjectToString(cssObject: Record<string, string>): string {
  return Object.entries(cssObject)
    .map(([key, value]) => `${toKebabCase(key)}: ${value}`)
    .join('; ');
}

/**
 * Convert CSS property + value to Tailwind class
 *
 * FigmaToCode enhancements:
 * - Arbitrary values: gap-[13px] for non-standard values
 * - Rotation classes: rotate-45, rotate-[47deg]
 * - Opacity conversion: 0-1 → opacity-0, opacity-25, opacity-50, opacity-75, opacity-100
 *
 * @param cssProperty - CSS property name (camelCase)
 * @param cssValue - CSS value
 * @returns Tailwind class string (or empty if no mapping)
 */
export function cssPropToTailwind(cssProperty: string, cssValue: string): string {
  // Normalize property name
  const prop = cssProperty.toLowerCase();

  // Display
  if (prop === 'display') {
    const displayMap: Record<string, string> = {
      flex: 'flex',
      block: 'block',
      inline: 'inline',
      'inline-block': 'inline-block',
      grid: 'grid',
      hidden: 'hidden',
    };
    return displayMap[cssValue] || '';
  }

  // Flex direction
  if (prop === 'flexdirection') {
    const directionMap: Record<string, string> = {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    };
    return directionMap[cssValue] || '';
  }

  // Padding (standard values: 4, 8, 12, 16, 20, 24, 32...)
  if (prop === 'padding') {
    const match = cssValue.match(/^(\d+)px$/);
    if (match) {
      const px = parseInt(match[1], 10);
      // Tailwind scale: p-0, p-1 (4px), p-2 (8px), p-4 (16px), p-8 (32px)
      const standardValues: Record<number, string> = {
        0: 'p-0',
        4: 'p-1',
        8: 'p-2',
        12: 'p-3',
        16: 'p-4',
        20: 'p-5',
        24: 'p-6',
        32: 'p-8',
        40: 'p-10',
        48: 'p-12',
        64: 'p-16',
      };
      return standardValues[px] || `p-[${px}px]`; // Arbitrary value fallback
    }
  }

  // Gap (FigmaToCode enhancement: arbitrary values)
  if (prop === 'gap') {
    const match = cssValue.match(/^(\d+)px$/);
    if (match) {
      const px = parseInt(match[1], 10);
      const standardValues: Record<number, string> = {
        0: 'gap-0',
        4: 'gap-1',
        8: 'gap-2',
        12: 'gap-3',
        16: 'gap-4',
        20: 'gap-5',
        24: 'gap-6',
        32: 'gap-8',
      };
      return standardValues[px] || `gap-[${px}px]`; // Arbitrary value
    }
  }

  // Background color (hex → Tailwind color)
  if (prop === 'backgroundcolor') {
    return hexToTailwindColor(cssValue, 'bg');
  }

  // Text color
  if (prop === 'color') {
    return hexToTailwindColor(cssValue, 'text');
  }

  // Border radius
  if (prop === 'borderradius') {
    const match = cssValue.match(/^(\d+)px$/);
    if (match) {
      const px = parseInt(match[1], 10);
      const standardValues: Record<number, string> = {
        0: 'rounded-none',
        2: 'rounded-sm',
        4: 'rounded',
        8: 'rounded-lg',
        12: 'rounded-xl',
        16: 'rounded-2xl',
        9999: 'rounded-full',
      };
      return standardValues[px] || `rounded-[${px}px]`;
    }
  }

  // Rotation (FigmaToCode enhancement)
  if (prop === 'transform' && cssValue.includes('rotate')) {
    const match = cssValue.match(/rotate\((-?\d+)deg\)/);
    if (match) {
      const degrees = parseInt(match[1], 10);
      const standardRotations: Record<number, string> = {
        0: '',
        45: 'rotate-45',
        90: 'rotate-90',
        180: 'rotate-180',
        [-45]: '-rotate-45',
        [-90]: '-rotate-90',
        [-180]: '-rotate-180',
      };
      return standardRotations[degrees] || `rotate-[${degrees}deg]`;
    }
  }

  // Opacity (FigmaToCode enhancement: 0-1 → Tailwind scale)
  if (prop === 'opacity') {
    const opacity = parseFloat(cssValue);
    // Round to nearest Tailwind opacity value
    if (opacity <= 0.125) return 'opacity-0';     // 0-12.5% → 0
    if (opacity <= 0.375) return 'opacity-25';   // 12.5-37.5% → 25
    if (opacity <= 0.625) return 'opacity-50';   // 37.5-62.5% → 50
    if (opacity <= 0.875) return 'opacity-75';   // 62.5-87.5% → 75
    return 'opacity-100';                         // 87.5-100% → 100
  }

  // T184: Expand Tailwind mapping to 90%+ coverage

  // Width/Height
  if (prop === 'width') return convertSizeToTailwind(cssValue, 'w');
  if (prop === 'maxwidth') return convertSizeToTailwind(cssValue, 'max-w');
  if (prop === 'minwidth') return convertSizeToTailwind(cssValue, 'min-w');
  if (prop === 'height') return convertSizeToTailwind(cssValue, 'h');
  if (prop === 'maxheight') return convertSizeToTailwind(cssValue, 'max-h');
  if (prop === 'minheight') return convertSizeToTailwind(cssValue, 'min-h');

  // Flexbox alignment
  if (prop === 'alignself') {
    const alignMap: Record<string, string> = {
      'stretch': 'self-stretch',
      'flex-start': 'self-start',
      'flex-end': 'self-end',
      'center': 'self-center',
      'baseline': 'self-baseline',
    };
    return alignMap[cssValue] || '';
  }

  if (prop === 'justifycontent') {
    const justifyMap: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'center': 'justify-center',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    };
    return justifyMap[cssValue] || '';
  }

  if (prop === 'alignitems') {
    const alignMap: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      'center': 'items-center',
      'stretch': 'items-stretch',
      'baseline': 'items-baseline',
    };
    return alignMap[cssValue] || '';
  }

  if (prop === 'aligncontent') {
    const alignMap: Record<string, string> = {
      'flex-start': 'content-start',
      'flex-end': 'content-end',
      'center': 'content-center',
      'stretch': 'content-stretch',
      'space-between': 'content-between',
      'space-around': 'content-around',
    };
    return alignMap[cssValue] || '';
  }

  // Flex properties
  if (prop === 'flex') {
    if (cssValue === '1 1 0%' || cssValue === '1') return 'flex-1';
    if (cssValue === 'none') return 'flex-none';
    if (cssValue === '0 1 auto') return 'flex-auto';
    return '';
  }

  if (prop === 'flexwrap') {
    if (cssValue === 'wrap') return 'flex-wrap';
    if (cssValue === 'nowrap') return 'flex-nowrap';
    if (cssValue === 'wrap-reverse') return 'flex-wrap-reverse';
    return '';
  }

  // Typography
  if (prop === 'fontfamily') {
    // Custom fonts use arbitrary values: font-['Poppins']
    const cleanFont = cssValue.replace(/['"]/g, '');
    return `font-['${cleanFont}']`;
  }

  if (prop === 'fontweight') {
    const weights: Record<string, string> = {
      '100': 'font-thin',
      '200': 'font-extralight',
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black',
    };
    return weights[cssValue] || `font-[${cssValue}]`;
  }

  if (prop === 'fontsize') {
    return convertSizeToTailwind(cssValue, 'text');
  }

  if (prop === 'lineheight') {
    return convertSizeToTailwind(cssValue, 'leading');
  }

  if (prop === 'texttransform') {
    if (cssValue === 'uppercase') return 'uppercase';
    if (cssValue === 'lowercase') return 'lowercase';
    if (cssValue === 'capitalize') return 'capitalize';
    if (cssValue === 'none') return 'normal-case';
    return '';
  }

  if (prop === 'textdecoration') {
    if (cssValue === 'underline') return 'underline';
    if (cssValue === 'line-through') return 'line-through';
    if (cssValue === 'none') return 'no-underline';
    return '';
  }

  if (prop === 'textalign') {
    if (cssValue === 'left') return 'text-left';
    if (cssValue === 'center') return 'text-center';
    if (cssValue === 'right') return 'text-right';
    if (cssValue === 'justify') return 'text-justify';
    return '';
  }

  // Position
  if (prop === 'position') {
    if (cssValue === 'absolute') return 'absolute';
    if (cssValue === 'relative') return 'relative';
    if (cssValue === 'fixed') return 'fixed';
    if (cssValue === 'sticky') return 'sticky';
    return '';
  }

  if (prop === 'top') return convertSizeToTailwind(cssValue, 'top');
  if (prop === 'left') return convertSizeToTailwind(cssValue, 'left');
  if (prop === 'right') return convertSizeToTailwind(cssValue, 'right');
  if (prop === 'bottom') return convertSizeToTailwind(cssValue, 'bottom');

  // Overflow
  if (prop === 'overflow') {
    if (cssValue === 'hidden') return 'overflow-hidden';
    if (cssValue === 'auto') return 'overflow-auto';
    if (cssValue === 'scroll') return 'overflow-scroll';
    if (cssValue === 'visible') return 'overflow-visible';
    return '';
  }

  if (prop === 'overflowx') {
    if (cssValue === 'hidden') return 'overflow-x-hidden';
    if (cssValue === 'auto') return 'overflow-x-auto';
    if (cssValue === 'scroll') return 'overflow-x-scroll';
    return '';
  }

  if (prop === 'overflowy') {
    if (cssValue === 'hidden') return 'overflow-y-hidden';
    if (cssValue === 'auto') return 'overflow-y-auto';
    if (cssValue === 'scroll') return 'overflow-y-scroll';
    return '';
  }

  // Outline (for borders with outline-offset)
  if (prop === 'outline') {
    // Parse "1px solid #color"
    const match = cssValue.match(/^(\d+)px\s+solid/);
    if (match) {
      return `outline outline-${match[1]}`;
    }
    return '';
  }

  if (prop === 'outlineoffset') {
    return `outline-offset-[${cssValue}]`;
  }

  // Border
  if (prop === 'borderwidth') {
    const match = cssValue.match(/^(\d+)px$/);
    if (match) {
      const px = parseInt(match[1], 10);
      const standards: Record<number, string> = {
        0: 'border-0',
        1: 'border',
        2: 'border-2',
        4: 'border-4',
        8: 'border-8',
      };
      return standards[px] || `border-[${px}px]`;
    }
    return '';
  }

  // Margin
  if (prop === 'margin') {
    return convertSizeToTailwind(cssValue, 'm');
  }
  if (prop === 'margintop') return convertSizeToTailwind(cssValue, 'mt');
  if (prop === 'marginright') return convertSizeToTailwind(cssValue, 'mr');
  if (prop === 'marginbottom') return convertSizeToTailwind(cssValue, 'mb');
  if (prop === 'marginleft') return convertSizeToTailwind(cssValue, 'ml');

  // Z-index
  if (prop === 'zindex') {
    const standards: Record<string, string> = {
      '0': 'z-0',
      '10': 'z-10',
      '20': 'z-20',
      '30': 'z-30',
      '40': 'z-40',
      '50': 'z-50',
    };
    return standards[cssValue] || `z-[${cssValue}]`;
  }

  // No mapping found
  return '';
}

/**
 * T184: Convert size value to Tailwind class with standard scale
 *
 * @param value - CSS size value (e.g., "16px", "1rem")
 * @param prefix - Tailwind prefix (w, h, p, m, etc.)
 * @returns Tailwind class string
 */
function convertSizeToTailwind(value: string, prefix: string): string {
  const pxMatch = value.match(/^(\d+)px$/);
  if (!pxMatch) {
    // Non-px units: use arbitrary value
    return `${prefix}-[${value}]`;
  }

  const px = parseInt(pxMatch[1], 10);

  // Standard Tailwind size scale
  const standards: Record<number, string> = {
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

  if (standards[px]) {
    return `${prefix}-${standards[px]}`;
  }

  // Arbitrary value for non-standard sizes
  return `${prefix}-[${px}px]`;
}

/**
 * Convert hex color to Tailwind color class
 *
 * TODO (MEDIUM priority from FigmaToCode): Implement precise hex-to-Tailwind mapping
 * For MVP: Return arbitrary value `bg-[#FF0000]`
 *
 * @param hexColor - Hex color string (#FF0000)
 * @param prefix - Tailwind prefix (bg, text, border)
 * @returns Tailwind color class
 */
function hexToTailwindColor(hexColor: string, prefix: string): string {
  // MVP: Use arbitrary values for all colors
  return `${prefix}-[${hexColor}]`;

  // TODO: Map common hex values to Tailwind colors
  // const colorMap: Record<string, string> = {
  //   '#EF4444': `${prefix}-red-500`,
  //   '#3B82F6': `${prefix}-blue-500`,
  //   // ... add more mappings
  // };
  // return colorMap[hexColor.toUpperCase()] || `${prefix}-[${hexColor}]`;
}

/**
 * Convert camelCase to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Format code with indentation
 *
 * @param code - Unformatted code string
 * @param indentSize - Number of spaces per indent level
 * @returns Formatted code string
 */
export function formatCode(code: string, indentSize: number = 2): string {
  // Basic formatting: normalize line breaks, trim whitespace
  return code
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * T185: Extract text content with line breaks preserved
 *
 * Converts newlines in TEXT nodes to <br/> tags for proper formatting
 *
 * @param node - SimpleAltNode (must be TEXT type)
 * @returns Text content with line breaks as <br/> tags
 */
export function extractTextContent(node: any): string {
  const rawText = node.originalNode?.characters || '';

  // Replace double newlines with <br/><br/>
  // Replace single newlines with <br/>
  return rawText
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

/**
 * T180: Extract component properties as data-* attributes
 *
 * Extracts Figma component properties (variants, boolean props) as HTML data attributes
 *
 * @param node - SimpleAltNode with potential component properties
 * @returns Record of data-* attribute names to values
 */
export function extractComponentDataAttributes(node: any): Record<string, string> {
  const attributes: Record<string, string> = {};
  const original = node.originalNode;

  if (!original) return attributes;

  // Extract from componentPropertyReferences
  if (original.componentPropertyReferences) {
    for (const [key, ref] of Object.entries(original.componentPropertyReferences)) {
      // Sanitize key: remove ALL special chars and numbers, convert to kebab-case
      const sanitized = key
        .replace(/[^a-zA-Z\s]/g, '')     // Remove special chars AND numbers
        .replace(/\s+/g, '-')            // Spaces to hyphens
        .replace(/([A-Z])/g, '-$1')      // camelCase to kebab-case
        .toLowerCase()
        .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
        .replace(/-+/g, '-');            // Collapse multiple hyphens

      if (sanitized) {
        attributes[`data-${sanitized}`] = 'true'; // Boolean properties
      }
    }
  }

  // Extract from componentProperties (variant values)
  if (original.componentProperties) {
    for (const [key, prop] of Object.entries(original.componentProperties)) {
      // Sanitize key: remove ALL special chars and numbers, convert to kebab-case
      const sanitized = key
        .replace(/[^a-zA-Z\s]/g, '')     // Remove special chars AND numbers
        .replace(/\s+/g, '-')            // Spaces to hyphens
        .replace(/([A-Z])/g, '-$1')      // camelCase to kebab-case
        .toLowerCase()
        .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
        .replace(/-+/g, '-');            // Collapse multiple hyphens

      if (sanitized) {
        const value = (prop as any).value || 'true';
        attributes[`data-${sanitized}`] = String(value);
      }
    }
  }

  return attributes;
}

/**
 * T181: Convert Figma variables to CSS custom properties
 * DEFERRED - Stub implementation
 *
 * @param node - SimpleAltNode with potential Figma variables
 * @returns Record of CSS custom property names to values
 */
export function extractCSSVariables(node: any): Record<string, string> {
  // TODO WP26: Full implementation
  // 1. Parse node.originalNode.boundVariables
  // 2. Resolve variable values from Figma variables API
  // 3. Convert to CSS custom properties: --color-primary, --spacing-sm, etc.

  return {}; // Stub - no variables extracted yet
}

/**
 * T182: Extract SVG content from VECTOR nodes
 * DEFERRED - Stub implementation
 *
 * @param node - SimpleAltNode (must be VECTOR type)
 * @returns SVG string or null
 */
export function extractSVGContent(node: any): string | null {
  // TODO WP27: Full implementation
  // 1. Access node.originalNode.fills, strokes, effects
  // 2. Generate SVG path data from vector network
  // 3. Apply fill, stroke, effects to SVG elements

  return null; // Stub - no SVG extraction yet
}

/**
 * T183: Extract image URL from RECTANGLE with image fills
 * DEFERRED - Stub implementation
 *
 * @param node - SimpleAltNode with potential image fill
 * @returns Image URL or null
 */
export function extractImageURL(node: any): string | null {
  // TODO WP28: Full implementation
  // 1. Check node.originalNode.fills for IMAGE type
  // 2. Extract imageRef from fill
  // 3. Construct Figma image URL from imageRef

  return null; // Stub - no image extraction yet
}
