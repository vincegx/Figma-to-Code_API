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

  // No mapping found
  return '';
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
