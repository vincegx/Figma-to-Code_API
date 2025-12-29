/**
 * Spacing & Layout CSS to Tailwind Handlers
 *
 * Handles: padding, margin, gap, position, flex, grid, width, height, overflow, z-index
 * VERBATIM from helpers.ts
 */

import { TAILWIND_SPACING_SCALE } from '../../constants';

/**
 * T184: Convert size value to Tailwind class with standard scale
 *
 * @param value - CSS size value (e.g., "16px", "1rem")
 * @param prefix - Tailwind prefix (w, h, p, m, etc.)
 * @returns Tailwind class string
 */
export function convertSizeToTailwind(value: string, prefix: string): string {
  // WP08: Handle 'auto' value with native Tailwind class
  if (value === 'auto') {
    return `${prefix}-auto`;
  }

  // WP31: Handle percentage values with standard Tailwind classes
  const percentMap: Record<string, string> = {
    '100%': 'full',
    '50%': '1/2',
    '33.333333%': '1/3',
    '66.666667%': '2/3',
    '25%': '1/4',
    '75%': '3/4',
    '20%': '1/5',
    '40%': '2/5',
    '60%': '3/5',
    '80%': '4/5',
  };
  if (percentMap[value]) {
    return `${prefix}-${percentMap[value]}`;
  }

  // WP25 FIX: Match both integer and decimal px values (876.9999389648438px)
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (!pxMatch) {
    // Non-px units: use arbitrary value
    return `${prefix}-[${value}]`;
  }

  // WP25 FIX: Round decimal pixel values (876.9999389648438 → 877)
  // Plugin Figma rounds dimensions to nearest integer
  const px = Math.round(parseFloat(pxMatch[1]));

  // WP31: MCP génère explicitement pl-0, py-0, etc. - on fait pareil
  // Ne PAS skip les valeurs à 0

  // Standard Tailwind size scale
  const standards = TAILWIND_SPACING_SCALE;

  if (standards[px]) {
    return `${prefix}-${standards[px]}`;
  }

  // Arbitrary value for non-standard sizes
  return `${prefix}-[${px}px]`;
}

/**
 * Handle display property
 */
export function handleDisplay(cssValue: string): string {
  const displayMap: Record<string, string> = {
    flex: 'flex',
    'inline-flex': 'inline-flex', // WP25 FIX: Add inline-flex mapping
    block: 'block',
    inline: 'inline',
    'inline-block': 'inline-block',
    grid: 'grid',
    'inline-grid': 'inline-grid', // WP31: GROUP stacking pattern
    hidden: 'hidden',
  };
  return displayMap[cssValue] || '';
}

/**
 * Handle CSS Grid properties for GROUP stacking (MCP pattern)
 */
export function handleGridTemplateColumns(cssValue: string): string {
  if (cssValue === 'max-content') return 'grid-cols-[max-content]';
  // Tailwind arbitrary values: replace spaces with underscores
  const escaped = cssValue.replace(/,\s+/g, ',_').replace(/\s+/g, '_');
  return `grid-cols-[${escaped}]`;
}

export function handleGridTemplateRows(cssValue: string): string {
  if (cssValue === 'max-content') return 'grid-rows-[max-content]';
  // Tailwind arbitrary values: replace spaces with underscores
  const escaped = cssValue.replace(/,\s+/g, ',_').replace(/\s+/g, '_');
  return `grid-rows-[${escaped}]`;
}

export function handlePlaceItems(cssValue: string): string {
  if (cssValue === 'start') return 'place-items-start';
  if (cssValue === 'center') return 'place-items-center';
  if (cssValue === 'end') return 'place-items-end';
  return `place-items-${cssValue}`;
}

export function handleGridArea(cssValue: string): string {
  // MCP uses [grid-area:1_/_1] format
  return `[grid-area:${cssValue.replace(/ /g, '_')}]`;
}

/**
 * Handle flex direction
 * WP08: Generate flex-row explicitly for responsive overrides
 */
export function handleFlexDirection(cssValue: string): string {
  const directionMap: Record<string, string> = {
    row: 'flex-row', // WP08: Explicit for responsive overrides
    column: 'flex-col',
    'row-reverse': 'flex-row-reverse',
    'column-reverse': 'flex-col-reverse',
  };
  return directionMap[cssValue] || '';
}

/**
 * Handle padding (standard values: 4, 8, 12, 16, 20, 24, 32...)
 */
export function handlePadding(cssValue: string): string {
  // WP25: Handle multi-value padding "12px 20px" → "py-3 px-5"
  const multiMatch = cssValue.match(/^(\d+)px\s+(\d+)px$/);
  if (multiMatch) {
    const vertical = parseInt(multiMatch[1], 10);
    const horizontal = parseInt(multiMatch[2], 10);
    const py = convertSizeToTailwind(`${vertical}px`, 'py');
    const px = convertSizeToTailwind(`${horizontal}px`, 'px');
    return `${py} ${px}`.trim();
  }

  // Single value padding
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
  return '';
}

/**
 * Handle gap
 * WP31 FIX: Skip negative gap values - CSS gap doesn't support negative
 */
export function handleGap(cssValue: string): string {
  const numericValue = parseFloat(cssValue);
  if (numericValue < 0) {
    return ''; // Skip negative gap - will be handled by margin on children
  }
  return `gap-[${cssValue}]`;
}

/**
 * Flexbox alignment handlers
 */
export function handleAlignSelf(cssValue: string): string {
  const alignMap: Record<string, string> = {
    'stretch': 'self-stretch',
    'flex-start': 'self-start',
    'flex-end': 'self-end',
    'center': 'self-center',
    'baseline': 'self-baseline',
  };
  return alignMap[cssValue] || '';
}

export function handleJustifyContent(cssValue: string): string {
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

export function handleAlignItems(cssValue: string): string {
  const alignMap: Record<string, string> = {
    'flex-start': 'items-start',
    'flex-end': 'items-end',
    'center': 'items-center',
    'stretch': 'items-stretch',
    'baseline': 'items-baseline',
  };
  return alignMap[cssValue] || '';
}

export function handleAlignContent(cssValue: string): string {
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

/**
 * Flex property handler
 */
export function handleFlex(cssValue: string): string {
  if (cssValue === '1 1 0%' || cssValue === '1') return 'flex-1';
  if (cssValue === 'none') return 'flex-none';
  if (cssValue === '0 1 auto') return 'flex-auto';
  return '';
}

export function handleFlexWrap(cssValue: string): string {
  if (cssValue === 'wrap') return 'flex-wrap';
  if (cssValue === 'nowrap') return ''; // WP31: Skip - c'est le défaut
  if (cssValue === 'wrap-reverse') return 'flex-wrap-reverse';
  return '';
}

/**
 * WP25: Flex grow
 * WP31: flex-grow-0 must be explicit for responsive resets (md:grow-0)
 */
export function handleFlexGrow(cssValue: string): string {
  if (cssValue === '0') return 'grow-0'; // Explicit for responsive contexts
  if (cssValue === '1') return 'flex-grow';
  return `flex-grow-[${cssValue}]`;
}

/**
 * Position handlers
 */
export function handlePosition(cssValue: string): string {
  if (cssValue === 'absolute') return 'absolute';
  if (cssValue === 'relative') return 'relative';
  if (cssValue === 'fixed') return 'fixed';
  if (cssValue === 'sticky') return 'sticky';
  return '';
}

/**
 * Overflow handlers
 * WP31: Ne pas générer overflow-visible (c'est le défaut)
 */
export function handleOverflow(cssValue: string): string {
  if (cssValue === 'hidden') return 'overflow-hidden';
  if (cssValue === 'auto') return 'overflow-auto';
  if (cssValue === 'scroll') return 'overflow-scroll';
  if (cssValue === 'visible') return ''; // Skip - c'est le défaut
  return '';
}

export function handleOverflowX(cssValue: string): string {
  if (cssValue === 'hidden') return 'overflow-x-hidden';
  if (cssValue === 'auto') return 'overflow-x-auto';
  if (cssValue === 'scroll') return 'overflow-x-scroll';
  return '';
}

export function handleOverflowY(cssValue: string): string {
  if (cssValue === 'hidden') return 'overflow-y-hidden';
  if (cssValue === 'auto') return 'overflow-y-auto';
  if (cssValue === 'scroll') return 'overflow-y-scroll';
  return '';
}

/**
 * Z-index handler
 */
export function handleZIndex(cssValue: string): string {
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

/**
 * WP25: Grid properties
 */
export function handleGridColumnEnd(cssValue: string): string {
  if (cssValue.startsWith('span ')) {
    const span = cssValue.replace('span ', '');
    return `col-span-${span}`;
  }
  return '';
}

export function handleGridRowEnd(cssValue: string): string {
  if (cssValue.startsWith('span ')) {
    const span = cssValue.replace('span ', '');
    return `row-span-${span}`;
  }
  return '';
}
