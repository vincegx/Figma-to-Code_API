/**
 * Code Generation Helper Functions
 *
 * Utilities for converting names, CSS properties, and generating code formatting
 */

/**
 * Convert kebab-case or space-separated name to PascalCase
 *
 * @param name - Input name (e.g., "primary-button", "Primary Button")
 * @returns PascalCase name (e.g., "PrimaryButton")
 *
 * @example
 * toPascalCase("primary-button") // "PrimaryButton"
 * toPascalCase("Button Label") // "ButtonLabel"
 * toPascalCase("my_component") // "MyComponent"
 */
export function toPascalCase(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ') // Replace non-alphanumeric with spaces
    .split(' ')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert camelCase or PascalCase to kebab-case
 *
 * @param name - Input name (e.g., "PrimaryButton", "myComponent")
 * @returns kebab-case name (e.g., "primary-button", "my-component")
 *
 * @example
 * toKebabCase("PrimaryButton") // "primary-button"
 * toKebabCase("myComponent") // "my-component"
 */
export function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between lowercase and uppercase
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .toLowerCase();
}

/**
 * Convert CSS properties object to inline style string
 *
 * @param styles - CSS properties object
 * @returns CSS style string (e.g., "display: flex; gap: 16px;")
 *
 * @example
 * cssObjectToString({ display: 'flex', gap: '16px' })
 * // "display: flex; gap: 16px;"
 */
export function cssObjectToString(
  styles: Record<string, string | number | undefined>
): string {
  return Object.entries(styles)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case for CSS properties
      const cssKey = toKebabCase(key);
      return `${cssKey}: ${value};`;
    })
    .join(' ');
}

/**
 * Convert CSS properties to Tailwind utility classes
 *
 * Maps common CSS properties to their Tailwind equivalents
 *
 * @param styles - CSS properties object
 * @returns Array of Tailwind class names
 *
 * @example
 * convertToTailwindClasses({ display: 'flex', gap: '16px', padding: '8px' })
 * // ['flex', 'gap-4', 'p-2']
 */
export function convertToTailwindClasses(
  styles: Record<string, string | number | undefined>
): string[] {
  const classes: string[] = [];

  for (const [key, value] of Object.entries(styles)) {
    if (value === undefined) continue;

    // Display
    if (key === 'display') {
      if (value === 'flex') classes.push('flex');
      if (value === 'block') classes.push('block');
      if (value === 'inline') classes.push('inline');
      if (value === 'inline-block') classes.push('inline-block');
    }

    // Flex direction
    if (key === 'flexDirection') {
      if (value === 'row') classes.push('flex-row');
      if (value === 'column') classes.push('flex-col');
    }

    // Gap (assume px values, convert to Tailwind scale)
    if (key === 'gap') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`gap-${pixelsToTailwindScale(pixels)}`);
      }
    }

    // Padding
    if (key === 'padding') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`p-${pixelsToTailwindScale(pixels)}`);
      }
    }

    if (key === 'paddingTop') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`pt-${pixelsToTailwindScale(pixels)}`);
      }
    }

    if (key === 'paddingBottom') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`pb-${pixelsToTailwindScale(pixels)}`);
      }
    }

    if (key === 'paddingLeft') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`pl-${pixelsToTailwindScale(pixels)}`);
      }
    }

    if (key === 'paddingRight') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`pr-${pixelsToTailwindScale(pixels)}`);
      }
    }

    // Margin
    if (key === 'margin') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        classes.push(`m-${pixelsToTailwindScale(pixels)}`);
      }
    }

    // Border radius
    if (key === 'borderRadius') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        if (pixels === 4) classes.push('rounded');
        else if (pixels === 8) classes.push('rounded-lg');
        else if (pixels === 16) classes.push('rounded-2xl');
        else classes.push('rounded');
      }
    }

    // Background color
    if (key === 'background' || key === 'backgroundColor') {
      // Tailwind doesn't have arbitrary color classes by default
      // We'd need to use arbitrary values like bg-[#ff0000]
      // For now, skip or use common color names
      if (value === '#ffffff' || value === 'white') classes.push('bg-white');
      if (value === '#000000' || value === 'black') classes.push('bg-black');
      // Add more common colors as needed
    }

    // Text color
    if (key === 'color') {
      if (value === '#ffffff' || value === 'white') classes.push('text-white');
      if (value === '#000000' || value === 'black') classes.push('text-black');
    }

    // Font size
    if (key === 'fontSize') {
      const pixels = parsePixelValue(String(value));
      if (pixels !== null) {
        if (pixels === 12) classes.push('text-xs');
        else if (pixels === 14) classes.push('text-sm');
        else if (pixels === 16) classes.push('text-base');
        else if (pixels === 18) classes.push('text-lg');
        else if (pixels === 20) classes.push('text-xl');
        else if (pixels === 24) classes.push('text-2xl');
        else classes.push('text-base');
      }
    }

    // Font weight
    if (key === 'fontWeight') {
      const weight = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (weight === 400) classes.push('font-normal');
      if (weight === 500) classes.push('font-medium');
      if (weight === 600) classes.push('font-semibold');
      if (weight === 700) classes.push('font-bold');
    }

    // Text align
    if (key === 'textAlign') {
      if (value === 'left') classes.push('text-left');
      if (value === 'center') classes.push('text-center');
      if (value === 'right') classes.push('text-right');
    }

    // Width and height
    if (key === 'width') {
      // For specific pixel values, use arbitrary values
      if (value === '100%') classes.push('w-full');
      else if (value === 'auto') classes.push('w-auto');
    }

    if (key === 'height') {
      if (value === '100%') classes.push('h-full');
      else if (value === 'auto') classes.push('h-auto');
    }

    // Position
    if (key === 'position') {
      if (value === 'relative') classes.push('relative');
      if (value === 'absolute') classes.push('absolute');
      if (value === 'fixed') classes.push('fixed');
      if (value === 'sticky') classes.push('sticky');
    }

    // Justify content
    if (key === 'justifyContent') {
      if (value === 'flex-start') classes.push('justify-start');
      if (value === 'flex-end') classes.push('justify-end');
      if (value === 'center') classes.push('justify-center');
      if (value === 'space-between') classes.push('justify-between');
      if (value === 'space-around') classes.push('justify-around');
      if (value === 'space-evenly') classes.push('justify-evenly');
    }

    // Align items
    if (key === 'alignItems') {
      if (value === 'flex-start') classes.push('items-start');
      if (value === 'flex-end') classes.push('items-end');
      if (value === 'center') classes.push('items-center');
      if (value === 'baseline') classes.push('items-baseline');
      if (value === 'stretch') classes.push('items-stretch');
    }
  }

  return classes;
}

/**
 * Parse pixel value from string
 *
 * @param value - CSS value string (e.g., "16px", "1rem")
 * @returns Pixel value as number, or null if not parseable
 */
function parsePixelValue(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match && match[1] !== undefined ? parseFloat(match[1]) : null;
}

/**
 * Convert pixel value to Tailwind spacing scale
 *
 * Tailwind scale: 1 = 0.25rem = 4px
 * So: 4px = 1, 8px = 2, 16px = 4, etc.
 *
 * @param pixels - Pixel value
 * @returns Tailwind scale value
 */
function pixelsToTailwindScale(pixels: number): number {
  return Math.round(pixels / 4);
}

/**
 * Indent code string by specified levels
 *
 * @param code - Code string to indent
 * @param levels - Number of indentation levels (2 spaces each)
 * @returns Indented code
 */
export function indent(code: string, levels: number): string {
  const indentation = '  '.repeat(levels);
  return code
    .split('\n')
    .map((line) => (line.trim().length > 0 ? indentation + line : line))
    .join('\n');
}

/**
 * Escape special characters in string for use in code generation
 *
 * @param text - Text to escape
 * @returns Escaped text safe for code generation
 */
export function escapeString(text: string): string {
  return text
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t'); // Escape tabs
}
