/**
 * Visual CSS to Tailwind Handlers
 *
 * Handles: colors, borders, backgrounds, text, typography, opacity, transforms
 * VERBATIM from helpers.ts
 */

/**
 * Convert color (hex/rgba) to Tailwind color class
 *
 * WP25: Enhanced to parse rgba() and map common colors to standard Tailwind classes
 *
 * @param color - Color string (rgba(...) or #hex)
 * @param prefix - Tailwind prefix (bg, text, border)
 * @returns Tailwind color class
 */
export function hexToTailwindColor(color: string, prefix: string): string {
  // Parse rgba() - capture alpha if present
  let hex = color;
  let alpha: number | null = null;
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    if (rgbaMatch[4] !== undefined) {
      alpha = parseFloat(rgbaMatch[4]);
    }
    hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  // If alpha < 1, use arbitrary rgba value to preserve transparency
  if (alpha !== null && alpha < 1) {
    // Use arbitrary value with full rgba for transparency
    return `${prefix}-[${color.replace(/\s/g, '')}]`;
  }

  // WP25 FIX: Map common colors to standard Tailwind classes
  const colorMap: Record<string, string> = {
    // White/Black/Gray
    '#FFFFFF': 'white',
    '#000000': 'black',
    '#F9FAFB': 'gray-50',
    '#F3F4F6': 'gray-100',
    '#E5E7EB': 'gray-200',
    '#D1D5DB': 'gray-300',
    '#9CA3AF': 'gray-400',
    '#6B7280': 'gray-500',
    '#4B5563': 'gray-600',
    '#374151': 'gray-700',
    '#1F2937': 'gray-800',
    '#111827': 'gray-900',

    // Red
    '#FEE2E2': 'red-100',
    '#FECACA': 'red-200',
    '#FCA5A5': 'red-300',
    '#F87171': 'red-400',
    '#EF4444': 'red-500',
    '#DC2626': 'red-600',
    '#B91C1C': 'red-700',

    // Blue
    '#DBEAFE': 'blue-100',
    '#BFDBFE': 'blue-200',
    '#93C5FD': 'blue-300',
    '#60A5FA': 'blue-400',
    '#3B82F6': 'blue-500',
    '#2563EB': 'blue-600',
    '#1D4ED8': 'blue-700',
  };

  const tailwindColor = colorMap[hex];
  if (tailwindColor) {
    return `${prefix}-${tailwindColor}`;
  }

  // Fallback to arbitrary value
  return `${prefix}-[${hex}]`;
}

/**
 * Handle composite border property (e.g., "1px solid white")
 * WP31 FIX, WP38: Support decimal strokeWeight
 */
export function handleBorder(cssValue: string): string {
  // WP31: Handle border reset for individual stroke weights
  if (cssValue === '0px') {
    return 'border-0';
  }
  // WP38: Support decimal strokeWeight (e.g., 1.48px)
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px\s+solid\s+(.*)/);
  if (match) {
    const width = match[1];
    const color = match[2].trim();

    // Generate Tailwind classes: border + border-color
    const borderClass = width === '1' ? 'border' : `border-[${width}px]`;

    // Handle color - could be rgba(), hex, or variable
    if (color.startsWith('rgba(')) {
      const colorClass = hexToTailwindColor(color, 'border');
      return colorClass ? `${borderClass} ${colorClass}` : borderClass;
    } else if (color.startsWith('var(')) {
      // WP08: CSS variable - use color: prefix to fix Tailwind parsing bug
      const varMatch = color.match(/var\((--[\w-]+)/);
      if (varMatch) {
        const varName = varMatch[1];
        return `${borderClass} border-[color:var(${varName})] border-solid`;
      }
      return `${borderClass} border-solid`;
    } else {
      // Hex or named color
      const colorClass = hexToTailwindColor(color, 'border');
      return colorClass ? `${borderClass} ${colorClass}` : borderClass;
    }
  }
  return '';
}

/**
 * Handle background color
 * WP25 FIX: AltNode uses 'background', not 'backgroundcolor'
 * WP31 FIX: Handle CSS variables
 */
export function handleBackground(cssValue: string): string {
  if (cssValue.startsWith('var(')) {
    return `bg-[${cssValue}]`;
  }
  return hexToTailwindColor(cssValue, 'bg');
}

/**
 * Handle text color
 * WP31 FIX: Handle CSS variables
 */
export function handleColor(cssValue: string): string {
  if (cssValue.startsWith('var(')) {
    return `text-[color:${cssValue}]`;
  }
  return hexToTailwindColor(cssValue, 'text');
}

/**
 * Handle border radius
 */
export function handleBorderRadius(cssValue: string): string {
  // WP38: Handle percentage values (50% for circles/ellipses)
  if (cssValue === '50%') {
    return 'rounded-full';
  }

  // WP31 FIX: Handle CSS variables in border-radius (Tailwind v3 syntax)
  if (cssValue.startsWith('var(')) {
    const varMatch = cssValue.match(/var\((--[\w-]+)/);
    if (varMatch) {
      return `rounded-[var(${varMatch[1]})]`;
    }
  }

  // WP25 FIX: Match decimal px values (35.55555725097656px)
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) {
    const px = Math.round(parseFloat(match[1]));
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
  return '';
}

/**
 * WP38: Individual corner border-radius (asymmetric corners)
 */
export function handleBorderTopLeftRadius(cssValue: string): string {
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) return `rounded-tl-[${match[1]}px]`;
  return '';
}

export function handleBorderTopRightRadius(cssValue: string): string {
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) return `rounded-tr-[${match[1]}px]`;
  return '';
}

export function handleBorderBottomRightRadius(cssValue: string): string {
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) return `rounded-br-[${match[1]}px]`;
  return '';
}

export function handleBorderBottomLeftRadius(cssValue: string): string {
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) return `rounded-bl-[${match[1]}px]`;
  return '';
}

/**
 * WP31: Translate properties for CENTER constraints (MCP pattern)
 */
export function handleTranslateX(cssValue: string): string {
  return `translate-x-[${cssValue}]`;
}

export function handleTranslateY(cssValue: string): string {
  return `translate-y-[${cssValue}]`;
}

/**
 * Rotation (FigmaToCode enhancement)
 */
export function handleTransformRotate(cssValue: string): string {
  // WP25 FIX: Match decimal degrees (47.5deg)
  const match = cssValue.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
  if (match) {
    const degrees = Math.round(parseFloat(match[1]));
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
  return '';
}

/**
 * Opacity (FigmaToCode enhancement: 0-1 → Tailwind scale)
 */
export function handleOpacity(cssValue: string): string {
  const opacity = parseFloat(cssValue);
  // Round to nearest Tailwind opacity value
  if (opacity <= 0.125) return 'opacity-0';     // 0-12.5% → 0
  if (opacity <= 0.375) return 'opacity-25';   // 12.5-37.5% → 25
  if (opacity <= 0.625) return 'opacity-50';   // 37.5-62.5% → 50
  if (opacity <= 0.875) return 'opacity-75';   // 62.5-87.5% → 75
  return 'opacity-100';                         // 87.5-100% → 100
}

/**
 * Typography handlers
 */
export function handleFontFamily(cssValue: string): string {
  // Custom fonts use arbitrary values: font-['Poppins']
  // WP31: Tailwind uses underscores for spaces in arbitrary values
  const cleanFont = cssValue.replace(/['"]/g, '').replace(/ /g, '_');
  return `font-['${cleanFont}']`;
}

export function handleFontWeight(cssValue: string): string {
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

export function handleFontSize(cssValue: string): string {
  // WP25: Font size has special Tailwind classes
  const match = cssValue.match(/^(\d+)px$/);
  if (match) {
    const px = parseInt(match[1], 10);
    const fontSizeMap: Record<number, string> = {
      12: 'text-xs',
      14: 'text-sm',
      16: 'text-base',
      18: 'text-lg',
      20: 'text-xl',
      24: 'text-2xl',
      30: 'text-3xl',
      36: 'text-4xl',
      48: 'text-5xl',
      60: 'text-6xl',
      72: 'text-7xl',
      96: 'text-8xl',
      128: 'text-9xl',
    };
    return fontSizeMap[px] || `text-[${px}px]`;
  }
  return `text-[${cssValue}]`;
}

export function handleTextTransform(cssValue: string): string {
  if (cssValue === 'uppercase') return 'uppercase';
  if (cssValue === 'lowercase') return 'lowercase';
  if (cssValue === 'capitalize') return 'capitalize';
  if (cssValue === 'none') return 'normal-case';
  return '';
}

export function handleTextDecoration(cssValue: string): string {
  if (cssValue === 'underline') return 'underline';
  if (cssValue === 'line-through') return 'line-through';
  if (cssValue === 'none') return 'no-underline';
  return '';
}

export function handleTextAlign(cssValue: string): string {
  if (cssValue === 'left') return 'text-left';
  if (cssValue === 'center') return 'text-center';
  if (cssValue === 'right') return 'text-right';
  if (cssValue === 'justify') return 'text-justify';
  return '';
}

/**
 * WP25: Text properties
 * WP31: Skip vertical-align → self-* conversion
 */
export function handleVerticalAlign(cssValue: string): string {
  // Only keep non-flex specific values
  if (cssValue === 'baseline') return 'align-baseline';
  if (cssValue === 'text-top') return 'align-text-top';
  if (cssValue === 'text-bottom') return 'align-text-bottom';
  // Skip top/middle/bottom - let layoutAlign handle flex alignment
  return '';
}

export function handleTextIndent(cssValue: string): string {
  return `indent-[${cssValue}]`;
}

/**
 * Outline handlers
 */
export function handleOutline(cssValue: string): string {
  // Parse "1px solid #color"
  const match = cssValue.match(/^(\d+)px\s+solid/);
  if (match) {
    return `outline outline-${match[1]}`;
  }
  return '';
}

export function handleOutlineOffset(cssValue: string): string {
  // WP25 FIX: Round decimal px values (-1.5536061525344849px → -2px)
  const match = cssValue.match(/^(-?\d+(?:\.\d+)?)px$/);
  if (match) {
    const px = Math.round(parseFloat(match[1]));
    return `outline-offset-[${px}px]`;
  }
  return `outline-offset-[${cssValue}]`;
}

/**
 * Border width handlers
 */
export function handleBorderWidth(cssValue: string): string {
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (match) {
    const px = Math.round(parseFloat(match[1]));
    if (px === 0) return 'border-0';
    if (px === 1) return 'border';
    const standards: Record<number, string> = { 2: 'border-2', 4: 'border-4', 8: 'border-8' };
    return standards[px] || `border-[${px}px]`;
  }
  return '';
}

/**
 * WP31: Individual border widths (border on specific sides only)
 */
export function handleBorderTopWidth(cssValue: string): string {
  if (cssValue === '0px') return '';
  return cssValue === '1px' ? 'border-t' : `border-t-[${cssValue}]`;
}

export function handleBorderRightWidth(cssValue: string): string {
  if (cssValue === '0px') return '';
  return cssValue === '1px' ? 'border-r' : `border-r-[${cssValue}]`;
}

export function handleBorderBottomWidth(cssValue: string): string {
  if (cssValue === '0px') return '';
  return cssValue === '1px' ? 'border-b' : `border-b-[${cssValue}]`;
}

export function handleBorderLeftWidth(cssValue: string): string {
  if (cssValue === '0px') return '';
  return cssValue === '1px' ? 'border-l' : `border-l-[${cssValue}]`;
}

/**
 * WP31: Individual border colors
 * WP08: Use color: prefix for CSS variables
 */
export function handleBorderTopColor(cssValue: string): string {
  const colorNoSpaces = cssValue.replace(/\s+/g, '');
  if (colorNoSpaces.startsWith('var(')) {
    return `border-t-[color:${colorNoSpaces}]`;
  }
  return `border-t-[${colorNoSpaces}]`;
}

export function handleBorderRightColor(cssValue: string): string {
  const colorNoSpaces = cssValue.replace(/\s+/g, '');
  if (colorNoSpaces.startsWith('var(')) {
    return `border-r-[color:${colorNoSpaces}]`;
  }
  return `border-r-[${colorNoSpaces}]`;
}

export function handleBorderBottomColor(cssValue: string): string {
  const colorNoSpaces = cssValue.replace(/\s+/g, '');
  if (colorNoSpaces.startsWith('var(')) {
    return `border-b-[color:${colorNoSpaces}]`;
  }
  return `border-b-[${colorNoSpaces}]`;
}

export function handleBorderLeftColor(cssValue: string): string {
  const colorNoSpaces = cssValue.replace(/\s+/g, '');
  if (colorNoSpaces.startsWith('var(')) {
    return `border-l-[color:${colorNoSpaces}]`;
  }
  return `border-l-[${colorNoSpaces}]`;
}

/**
 * WP31: Generic border-color
 * WP08: Use border-[color:var(...)] syntax for CSS variables
 */
export function handleBorderColor(cssValue: string): string {
  const colorNoSpaces = cssValue.replace(/\s+/g, '');
  if (colorNoSpaces.startsWith('var(')) {
    return `border-[color:${colorNoSpaces}]`;
  }
  return `border-[${colorNoSpaces}]`;
}

/**
 * WP31: Border style conversion
 */
export function handleBorderStyle(cssValue: string): string {
  if (cssValue === 'solid') return 'border-solid';
  if (cssValue === 'dashed') return 'border-dashed';
  if (cssValue === 'dotted') return 'border-dotted';
  return '';
}

/**
 * WP25: Filter (blur)
 */
export function handleFilter(cssValue: string): string {
  // Handle drop-shadow (for images with transparency)
  if (cssValue.includes('drop-shadow')) {
    return `[filter:${cssValue.replace(/\s+/g, '_')}]`;
  }
  // Handle brightness/contrast (from Figma image filters)
  if (cssValue.includes('brightness') || cssValue.includes('contrast')) {
    return `[filter:${cssValue.replace(/\s+/g, '_')}]`;
  }
  // Handle blur
  if (cssValue.includes('blur')) {
    const match = cssValue.match(/blur\((\d+)px\)/);
    if (match) {
      const px = parseInt(match[1], 10);
      if (px === 0) return 'blur-none';
      if (px <= 4) return 'blur-sm';
      if (px <= 8) return 'blur';
      if (px <= 12) return 'blur-md';
      if (px <= 16) return 'blur-lg';
      if (px <= 24) return 'blur-xl';
      return 'blur-3xl';
    }
  }
  return '';
}

/**
 * WP25: Backdrop filter
 */
export function handleBackdropFilter(cssValue: string): string {
  if (cssValue.includes('blur')) {
    const match = cssValue.match(/blur\((\d+)px\)/);
    if (match) {
      const px = parseInt(match[1], 10);
      if (px === 0) return 'backdrop-blur-none';
      if (px <= 4) return 'backdrop-blur-sm';
      if (px <= 8) return 'backdrop-blur';
      if (px <= 12) return 'backdrop-blur-md';
      if (px <= 16) return 'backdrop-blur-lg';
      if (px <= 24) return 'backdrop-blur-xl';
      return 'backdrop-blur-3xl';
    }
  }
  return '';
}

/**
 * WP25: Aspect ratio
 */
export function handleAspectRatio(cssValue: string): string {
  const ratio = parseFloat(cssValue);
  if (ratio === 1) return 'aspect-square';
  if (Math.abs(ratio - 16/9) < 0.01) return 'aspect-video';
  return `aspect-[${cssValue}]`;
}

/**
 * WP25: Mix blend mode
 */
export function handleMixBlendMode(cssValue: string): string {
  const blendModes: Record<string, string> = {
    'normal': 'mix-blend-normal',
    'multiply': 'mix-blend-multiply',
    'screen': 'mix-blend-screen',
    'overlay': 'mix-blend-overlay',
    'darken': 'mix-blend-darken',
    'lighten': 'mix-blend-lighten',
    'color-dodge': 'mix-blend-color-dodge',
    'color-burn': 'mix-blend-color-burn',
    'hard-light': 'mix-blend-hard-light',
    'soft-light': 'mix-blend-soft-light',
    'difference': 'mix-blend-difference',
    'exclusion': 'mix-blend-exclusion',
    'hue': 'mix-blend-hue',
    'saturation': 'mix-blend-saturation',
    'color': 'mix-blend-color',
    'luminosity': 'mix-blend-luminosity',
  };
  return blendModes[cssValue] || '';
}

/**
 * Convert CSS box-shadow to Tailwind shadow class
 * Uses arbitrary value syntax for custom shadows
 */
export function handleBoxShadow(cssValue: string): string {
  if (!cssValue || cssValue === 'none') return 'shadow-none';
  // Use arbitrary value for custom shadows
  return `shadow-[${cssValue.replace(/\s+/g, '_')}]`;
}
