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
  const prop = cssProperty.toLowerCase().replace(/-/g, '');

  // Display
  if (prop === 'display') {
    const displayMap: Record<string, string> = {
      flex: 'flex',
      'inline-flex': 'inline-flex', // WP25 FIX: Add inline-flex mapping
      block: 'block',
      inline: 'inline',
      'inline-block': 'inline-block',
      grid: 'grid',
      hidden: 'hidden',
    };
    return displayMap[cssValue] || '';
  }

  // Flex direction
  // WP31: flex-row est le défaut, ne pas le générer (comme MCP)
  if (prop === 'flexdirection') {
    const directionMap: Record<string, string> = {
      row: '', // WP31: Skip - c'est le défaut
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    };
    return directionMap[cssValue] || '';
  }

  // Padding (standard values: 4, 8, 12, 16, 20, 24, 32...)
  if (prop === 'padding') {
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
  }

  // WP31 FIX: Individual padding properties (T223) - Force arbitrary values to match MCP
  if (prop === 'paddingtop') return `pt-[${cssValue}]`;
  if (prop === 'paddingbottom') return `pb-[${cssValue}]`;
  if (prop === 'paddingleft') return `pl-[${cssValue}]`;
  if (prop === 'paddingright') return `pr-[${cssValue}]`;

  // Gap (FigmaToCode enhancement: arbitrary values)
  // WP31 FIX: Force arbitrary values to match MCP output
  // WP31 FIX: Skip negative gap values - CSS gap doesn't support negative (handled via margin)
  if (prop === 'gap') {
    // Parse value to check if negative
    const numericValue = parseFloat(cssValue);
    if (numericValue < 0) {
      return ''; // Skip negative gap - will be handled by margin on children
    }
    return `gap-[${cssValue}]`;
  }

  // WP31 FIX: Handle composite border property (e.g., "1px solid white")
  if (prop === 'border') {
    // WP31: Handle border reset for individual stroke weights
    if (cssValue === '0px') {
      return 'border-0';
    }
    const match = cssValue.match(/^(\d+)px\s+solid\s+(.*)/);
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
        // WP31: CSS variable - Tailwind v3: border-[var(--name)]
        const varMatch = color.match(/var\((--[\w-]+)/);
        if (varMatch) {
          const varName = varMatch[1];
          return `${borderClass} border-[var(${varName})] border-solid`;
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

  // WP25: Row gap
  if (prop === 'rowgap') {
    return convertSizeToTailwind(cssValue, 'gap-y');
  }

  // WP25: Column gap
  if (prop === 'columngap') {
    return convertSizeToTailwind(cssValue, 'gap-x');
  }

  // Background color (hex → Tailwind color)
  // WP25 FIX: AltNode uses 'background', not 'backgroundcolor'
  // WP31 FIX: Handle CSS variables in background
  if (prop === 'background' || prop === 'backgroundcolor') {
    if (cssValue.startsWith('var(')) {
      return `bg-[${cssValue}]`;
    }
    return hexToTailwindColor(cssValue, 'bg');
  }

  // Text color
  // WP31 FIX: Handle CSS variables in color
  if (prop === 'color') {
    if (cssValue.startsWith('var(')) {
      return `text-[color:${cssValue}]`;
    }
    return hexToTailwindColor(cssValue, 'text');
  }

  // Border radius
  if (prop === 'borderradius') {
    // WP31 FIX: Handle CSS variables in border-radius (Tailwind v3 syntax)
    if (cssValue.startsWith('var(')) {
      // Extract the variable part: var(--var-128-217, 28px) → var(--var-128-217)
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
  }

  // WP31: Separate translateX/translateY for CENTER constraints (MCP pattern)
  if (prop === 'translatex') {
    return `translate-x-[${cssValue}]`;
  }
  if (prop === 'translatey') {
    return `translate-y-[${cssValue}]`;
  }

  // Rotation (FigmaToCode enhancement)
  if (prop === 'transform' && cssValue.includes('rotate')) {
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
  // WP31 FIX: Preserve exact widths for layout fidelity - disable auto-responsive conversion
  if (prop === 'width') {
    return convertSizeToTailwind(cssValue, 'w');
  }
  if (prop === 'maxwidth') return convertSizeToTailwind(cssValue, 'max-w');
  if (prop === 'minwidth') return convertSizeToTailwind(cssValue, 'min-w');
  // WP32 FIX: Preserve exact heights for layout fidelity - disable auto-responsive conversion
  // Images with object-fit: cover need fixed dimensions to crop correctly
  if (prop === 'height') {
    return convertSizeToTailwind(cssValue, 'h');
  }
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
    if (cssValue === 'nowrap') return ''; // WP31: Skip - c'est le défaut
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
  // WP31: Ne pas générer overflow-visible (c'est le défaut, comme MCP)
  if (prop === 'overflow') {
    if (cssValue === 'hidden') return 'overflow-hidden';
    if (cssValue === 'auto') return 'overflow-auto';
    if (cssValue === 'scroll') return 'overflow-scroll';
    if (cssValue === 'visible') return ''; // Skip - c'est le défaut
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
    // WP25 FIX: Round decimal px values (-1.5536061525344849px → -2px)
    const match = cssValue.match(/^(-?\d+(?:\.\d+)?)px$/);
    if (match) {
      const px = Math.round(parseFloat(match[1]));
      return `outline-offset-[${px}px]`;
    }
    return `outline-offset-[${cssValue}]`;
  }

  // Border - global width (only used when no individualStrokeWeights)
  if (prop === 'borderwidth') {
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

  // WP31: Individual border widths (border on specific sides only)
  // Use border-t/r/b/l for 1px (standard), arbitrary for other values
  if (prop === 'bordertopwidth') {
    if (cssValue === '0px') return '';
    return cssValue === '1px' ? 'border-t' : `border-t-[${cssValue}]`;
  }
  if (prop === 'borderrightwidth') {
    if (cssValue === '0px') return '';
    return cssValue === '1px' ? 'border-r' : `border-r-[${cssValue}]`;
  }
  if (prop === 'borderbottomwidth') {
    if (cssValue === '0px') return '';
    return cssValue === '1px' ? 'border-b' : `border-b-[${cssValue}]`;
  }
  if (prop === 'borderleftwidth') {
    if (cssValue === '0px') return '';
    return cssValue === '1px' ? 'border-l' : `border-l-[${cssValue}]`;
  }

  // WP31: Individual border colors - use Tailwind arbitrary value syntax
  // Syntax: border-b-[rgba(40,40,40,1)] (no spaces, no "color:" prefix)
  if (prop === 'bordertopcolor') {
    const colorNoSpaces = cssValue.replace(/\s+/g, '');
    return `border-t-[${colorNoSpaces}]`;
  }
  if (prop === 'borderrightcolor') {
    const colorNoSpaces = cssValue.replace(/\s+/g, '');
    return `border-r-[${colorNoSpaces}]`;
  }
  if (prop === 'borderbottomcolor') {
    const colorNoSpaces = cssValue.replace(/\s+/g, '');
    return `border-b-[${colorNoSpaces}]`;
  }
  if (prop === 'borderleftcolor') {
    const colorNoSpaces = cssValue.replace(/\s+/g, '');
    return `border-l-[${colorNoSpaces}]`;
  }
  // WP31: Generic border-color like MCP: border-[#282828] or border-[rgba(...)]
  if (prop === 'bordercolor') {
    const colorNoSpaces = cssValue.replace(/\s+/g, '');
    return `border-[${colorNoSpaces}]`;
  }
  // WP31: Border style conversion
  // Note: Tailwind v3 only has global border-style classes (no border-b-solid)
  // All per-side styles map to global classes since Preflight is disabled
  if (prop === 'borderstyle' || prop === 'bordertopstyle' || prop === 'borderrightstyle' ||
      prop === 'borderbottomstyle' || prop === 'borderleftstyle') {
    if (cssValue === 'solid') return 'border-solid';
    if (cssValue === 'dashed') return 'border-dashed';
    if (cssValue === 'dotted') return 'border-dotted';
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

  // WP31: Position and inset properties for constraints-based positioning
  if (prop === 'position') {
    if (cssValue === 'absolute') return 'absolute';
    if (cssValue === 'relative') return 'relative';
    if (cssValue === 'fixed') return 'fixed';
    if (cssValue === 'sticky') return 'sticky';
    return '';
  }
  if (prop === 'top') return `top-[${cssValue}]`;
  if (prop === 'bottom') return `bottom-[${cssValue}]`;
  if (prop === 'left') return `left-[${cssValue}]`;
  if (prop === 'right') return `right-[${cssValue}]`;

  // WP25: Flex grow
  // WP31: flex-grow-0 est le défaut, ne pas le générer
  if (prop === 'flexgrow') {
    if (cssValue === '0') return ''; // WP31: Skip - c'est le défaut
    if (cssValue === '1') return 'flex-grow';
    return `flex-grow-[${cssValue}]`;
  }

  // WP25: Grid properties
  if (prop === 'gridtemplatecolumns') {
    return `grid-cols-[${cssValue}]`;
  }

  if (prop === 'gridtemplaterows') {
    return `grid-rows-[${cssValue}]`;
  }

  if (prop === 'gridcolumnend') {
    if (cssValue.startsWith('span ')) {
      const span = cssValue.replace('span ', '');
      return `col-span-${span}`;
    }
    return '';
  }

  if (prop === 'gridrowend') {
    if (cssValue.startsWith('span ')) {
      const span = cssValue.replace('span ', '');
      return `row-span-${span}`;
    }
    return '';
  }

  // WP25: Filter (blur)
  if (prop === 'filter' && cssValue.includes('blur')) {
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

  // WP25: Backdrop filter
  if (prop === 'backdropfilter' && cssValue.includes('blur')) {
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

  // WP25: Aspect ratio
  if (prop === 'aspectratio') {
    const ratio = parseFloat(cssValue);
    if (ratio === 1) return 'aspect-square';
    if (Math.abs(ratio - 16/9) < 0.01) return 'aspect-video';
    return `aspect-[${cssValue}]`;
  }

  // WP25: Mix blend mode
  if (prop === 'mixblendmode') {
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

  // WP25: Text properties
  // WP31: Skip vertical-align → self-* conversion
  // In flexbox, alignment is controlled by parent's items-center + child's layoutAlign
  // Converting textAlignVertical to self-start conflicts with parent alignment
  if (prop === 'verticalalign') {
    // Only keep non-flex specific values
    if (cssValue === 'baseline') return 'align-baseline';
    if (cssValue === 'text-top') return 'align-text-top';
    if (cssValue === 'text-bottom') return 'align-text-bottom';
    // Skip top/middle/bottom - let layoutAlign handle flex alignment
    return '';
  }

  if (prop === 'textindent') {
    return `indent-[${cssValue}]`;
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
 * Convert color (hex/rgba) to Tailwind color class
 *
 * WP25: Enhanced to parse rgba() and map common colors to standard Tailwind classes
 *
 * @param color - Color string (rgba(...) or #hex)
 * @param prefix - Tailwind prefix (bg, text, border)
 * @returns Tailwind color class
 */
function hexToTailwindColor(color: string, prefix: string): string {
  // Parse rgba() to hex
  let hex = color;
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
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

/**
 * WP32: Convert Figma scaleMode to CSS object-fit
 *
 * Figma scaleMode determines how an image fills its container:
 * - FILL: Cover the container, cropping if necessary (like object-fit: cover)
 * - FIT: Fit inside container, preserving aspect ratio (like object-fit: contain)
 * - CROP: Same as FILL in most cases
 * - TILE: Repeat the image (requires background-image approach)
 *
 * @param scaleMode - Figma image scaleMode
 * @returns CSS object-fit value
 */
export function scaleModeToObjectFit(scaleMode?: string): string {
  switch (scaleMode) {
    case 'FILL':
    case 'CROP':
      return 'cover';
    case 'FIT':
      return 'contain';
    case 'TILE':
      return 'none'; // Tile requires background-repeat, not object-fit
    default:
      return 'cover'; // Default to cover (most common in Figma)
  }
}

/**
 * WP32: Convert Figma scaleMode to Tailwind object-fit class
 *
 * @param scaleMode - Figma image scaleMode
 * @returns Tailwind class for object-fit
 */
export function scaleModeToTailwind(scaleMode?: string): string {
  switch (scaleMode) {
    case 'FILL':
    case 'CROP':
      return 'object-cover';
    case 'FIT':
      return 'object-contain';
    case 'TILE':
      return 'object-none';
    default:
      return 'object-cover';
  }
}
