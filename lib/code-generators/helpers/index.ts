/**
 * Code Generator Helpers
 *
 * Dispatcher for CSS → Tailwind conversion + utility functions.
 * VERBATIM from helpers.ts
 */

// Re-export handlers for direct use
export { convertSizeToTailwind } from './spacing-layout';
export { hexToTailwindColor } from './visual';

// Import handlers for dispatcher
import {
  convertSizeToTailwind,
  handleDisplay,
  handleGridTemplateColumns,
  handleGridTemplateRows,
  handlePlaceItems,
  handleGridArea,
  handleFlexDirection,
  handlePadding,
  handleGap,
  handleAlignSelf,
  handleJustifyContent,
  handleAlignItems,
  handleAlignContent,
  handleFlex,
  handleFlexWrap,
  handleFlexGrow,
  handlePosition,
  handleOverflow,
  handleOverflowX,
  handleOverflowY,
  handleZIndex,
  handleGridColumnEnd,
  handleGridRowEnd,
} from './spacing-layout';

import {
  hexToTailwindColor,
  handleBorder,
  handleBackground,
  handleColor,
  handleBorderRadius,
  handleBorderTopLeftRadius,
  handleBorderTopRightRadius,
  handleBorderBottomRightRadius,
  handleBorderBottomLeftRadius,
  handleTranslateX,
  handleTranslateY,
  handleTransformRotate,
  handleOpacity,
  handleFontFamily,
  handleFontWeight,
  handleFontSize,
  handleTextTransform,
  handleTextDecoration,
  handleTextAlign,
  handleVerticalAlign,
  handleTextIndent,
  handleOutline,
  handleOutlineOffset,
  handleBorderWidth,
  handleBorderTopWidth,
  handleBorderRightWidth,
  handleBorderBottomWidth,
  handleBorderLeftWidth,
  handleBorderTopColor,
  handleBorderRightColor,
  handleBorderBottomColor,
  handleBorderLeftColor,
  handleBorderColor,
  handleBorderStyle,
  handleFilter,
  handleBackdropFilter,
  handleAspectRatio,
  handleMixBlendMode,
  handleBoxShadow,
} from './visual';

/**
 * WP38: Shorten layer name for data-layer attribute
 *
 * Figma TEXT nodes often use full text content as layer name,
 * which creates excessively long data-layer attributes.
 * Extract first few words instead of truncating mid-word.
 *
 * @param name - Original Figma layer name
 * @param maxWords - Maximum number of words (default 4)
 * @returns Shortened name with first N words
 */
export function truncateLayerName(name: string, maxWords: number = 4): string {
  if (!name) return name;

  // First format the name to clean it up
  const formatted = formatLayerName(name);

  // Then truncate if needed (split by dash for kebab-case)
  const parts = formatted.split('-');
  if (parts.length <= maxWords) {
    return formatted;
  }

  return parts.slice(0, maxWords).join('-');
}

/**
 * Format layer name for data-layer attribute
 *
 * Cleans up Figma layer names to be more readable:
 * - _Default icon & shape → default-icon-shape
 * - Button/Primary → button-primary
 * - #Header 01 → header-01
 *
 * @param name - Original Figma layer name
 * @returns Formatted kebab-case name
 */
export function formatLayerName(name: string): string {
  if (!name) return name;

  return name
    .replace(/^[_#]+/, '')              // Remove leading _ or #
    .replace(/[&]/g, 'and')             // Replace & with 'and'
    .replace(/[\/\\]/g, '-')            // Replace / and \ with -
    .replace(/[^a-zA-Z0-9\s-]/g, '')    // Remove other special chars
    .replace(/\s+/g, '-')               // Replace spaces with -
    .replace(/-+/g, '-')                // Collapse multiple dashes
    .replace(/^-|-$/g, '')              // Remove leading/trailing dashes
    .toLowerCase();                      // Convert to lowercase
}

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

  // Escape JSX special characters BEFORE adding <br/> tags
  // < and > would be parsed as JSX tags, { and } as expressions
  const escaped = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');

  // Replace double newlines with <br/><br/>
  // Replace single newlines with <br/>
  return escaped
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
  return null; // Stub - no image extraction yet
}

/**
 * WP32: Convert Figma scaleMode to CSS object-fit
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
      return 'none';
    default:
      return 'cover';
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

/**
 * WP47: Convert layer name to camelCase prop name
 *
 * Examples:
 *   "Hero Image" → "heroImage"
 *   "CTA Button" → "ctaButton"
 *   "title-text" → "titleText"
 *   "" → "prop"
 *
 * @param str - Original Figma layer name
 * @returns camelCase prop name
 */
export function toCamelCase(str: string): string {
  if (!str || !str.trim()) return 'prop';

  return str
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special chars except spaces, hyphens, underscores
    .trim()
    .split(/[\s-_]+/) // Split on spaces, hyphens, underscores
    .filter(Boolean) // Remove empty strings
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('') || 'prop';
}

/**
 * WP47: Generate unique prop name with suffix if duplicate
 *
 * Examples:
 *   uniquePropName("title", new Set()) → "title"
 *   uniquePropName("title", new Set(["title"])) → "title2"
 *   uniquePropName("title", new Set(["title", "title2"])) → "title3"
 *
 * @param name - Original layer name
 * @param existing - Set of already-used prop names
 * @returns Unique prop name (adds to existing set)
 */
export function uniquePropName(name: string, existing: Set<string>): string {
  let propName = toCamelCase(name);

  // Ensure valid JavaScript identifier (can't start with number)
  if (/^\d/.test(propName)) {
    propName = 'prop' + propName;
  }

  if (!existing.has(propName)) {
    existing.add(propName);
    return propName;
  }

  let i = 2;
  while (existing.has(`${propName}${i}`)) i++;
  existing.add(`${propName}${i}`);
  return `${propName}${i}`;
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

  // === SPACING & LAYOUT ===

  if (prop === 'display') return handleDisplay(cssValue);
  if (prop === 'gridtemplatecolumns') return handleGridTemplateColumns(cssValue);
  if (prop === 'gridtemplaterows') return handleGridTemplateRows(cssValue);
  if (prop === 'placeitems') return handlePlaceItems(cssValue);
  if (prop === 'gridarea') return handleGridArea(cssValue);
  if (prop === 'flexdirection') return handleFlexDirection(cssValue);
  if (prop === 'padding') return handlePadding(cssValue);

  // WP31 FIX: Individual padding properties (T223) - Force arbitrary values
  if (prop === 'paddingtop') return `pt-[${cssValue}]`;
  if (prop === 'paddingbottom') return `pb-[${cssValue}]`;
  if (prop === 'paddingleft') return `pl-[${cssValue}]`;
  if (prop === 'paddingright') return `pr-[${cssValue}]`;

  if (prop === 'gap') return handleGap(cssValue);
  if (prop === 'rowgap') return convertSizeToTailwind(cssValue, 'gap-y');
  if (prop === 'columngap') return convertSizeToTailwind(cssValue, 'gap-x');

  if (prop === 'alignself') return handleAlignSelf(cssValue);
  if (prop === 'justifycontent') return handleJustifyContent(cssValue);
  if (prop === 'alignitems') return handleAlignItems(cssValue);
  if (prop === 'aligncontent') return handleAlignContent(cssValue);
  if (prop === 'flex') return handleFlex(cssValue);
  if (prop === 'flexwrap') return handleFlexWrap(cssValue);
  if (prop === 'flexgrow') return handleFlexGrow(cssValue);

  if (prop === 'position') return handlePosition(cssValue);
  if (prop === 'top') return convertSizeToTailwind(cssValue, 'top');
  if (prop === 'left') return convertSizeToTailwind(cssValue, 'left');
  if (prop === 'right') return convertSizeToTailwind(cssValue, 'right');
  if (prop === 'bottom') return convertSizeToTailwind(cssValue, 'bottom');

  if (prop === 'overflow') return handleOverflow(cssValue);
  if (prop === 'overflowx') return handleOverflowX(cssValue);
  if (prop === 'overflowy') return handleOverflowY(cssValue);

  if (prop === 'width') return convertSizeToTailwind(cssValue, 'w');
  if (prop === 'maxwidth') return convertSizeToTailwind(cssValue, 'max-w');
  if (prop === 'minwidth') return convertSizeToTailwind(cssValue, 'min-w');
  if (prop === 'height') return convertSizeToTailwind(cssValue, 'h');
  if (prop === 'maxheight') return convertSizeToTailwind(cssValue, 'max-h');
  if (prop === 'minheight') return convertSizeToTailwind(cssValue, 'min-h');

  if (prop === 'zindex') return handleZIndex(cssValue);
  if (prop === 'gridcolumnend') return handleGridColumnEnd(cssValue);
  if (prop === 'gridrowend') return handleGridRowEnd(cssValue);

  if (prop === 'margin') return convertSizeToTailwind(cssValue, 'm');
  if (prop === 'margintop') return convertSizeToTailwind(cssValue, 'mt');
  if (prop === 'marginright') return convertSizeToTailwind(cssValue, 'mr');
  if (prop === 'marginbottom') return convertSizeToTailwind(cssValue, 'mb');
  if (prop === 'marginleft') return convertSizeToTailwind(cssValue, 'ml');

  // === VISUAL ===

  if (prop === 'border') return handleBorder(cssValue);
  if (prop === 'background' || prop === 'backgroundcolor') return handleBackground(cssValue);
  if (prop === 'color') return handleColor(cssValue);
  if (prop === 'borderradius') return handleBorderRadius(cssValue);
  if (prop === 'bordertopleftradius') return handleBorderTopLeftRadius(cssValue);
  if (prop === 'bordertoprightradius') return handleBorderTopRightRadius(cssValue);
  if (prop === 'borderbottomrightradius') return handleBorderBottomRightRadius(cssValue);
  if (prop === 'borderbottomleftradius') return handleBorderBottomLeftRadius(cssValue);

  if (prop === 'translatex') return handleTranslateX(cssValue);
  if (prop === 'translatey') return handleTranslateY(cssValue);
  if (prop === 'transform' && cssValue.includes('rotate')) return handleTransformRotate(cssValue);

  if (prop === 'opacity') return handleOpacity(cssValue);

  if (prop === 'fontfamily') return handleFontFamily(cssValue);
  if (prop === 'fontweight') return handleFontWeight(cssValue);
  if (prop === 'fontsize') return handleFontSize(cssValue);
  if (prop === 'lineheight') return convertSizeToTailwind(cssValue, 'leading');
  if (prop === 'texttransform') return handleTextTransform(cssValue);
  if (prop === 'textdecoration') return handleTextDecoration(cssValue);
  if (prop === 'textalign') return handleTextAlign(cssValue);
  if (prop === 'verticalalign') return handleVerticalAlign(cssValue);
  if (prop === 'textindent') return handleTextIndent(cssValue);

  if (prop === 'outline') return handleOutline(cssValue);
  if (prop === 'outlineoffset') return handleOutlineOffset(cssValue);

  if (prop === 'borderwidth') return handleBorderWidth(cssValue);
  if (prop === 'bordertopwidth') return handleBorderTopWidth(cssValue);
  if (prop === 'borderrightwidth') return handleBorderRightWidth(cssValue);
  if (prop === 'borderbottomwidth') return handleBorderBottomWidth(cssValue);
  if (prop === 'borderleftwidth') return handleBorderLeftWidth(cssValue);

  if (prop === 'bordertopcolor') return handleBorderTopColor(cssValue);
  if (prop === 'borderrightcolor') return handleBorderRightColor(cssValue);
  if (prop === 'borderbottomcolor') return handleBorderBottomColor(cssValue);
  if (prop === 'borderleftcolor') return handleBorderLeftColor(cssValue);
  if (prop === 'bordercolor') return handleBorderColor(cssValue);

  if (prop === 'borderstyle' || prop === 'bordertopstyle' || prop === 'borderrightstyle' ||
      prop === 'borderbottomstyle' || prop === 'borderleftstyle') {
    return handleBorderStyle(cssValue);
  }

  if (prop === 'filter') return handleFilter(cssValue);
  if (prop === 'backdropfilter') return handleBackdropFilter(cssValue);
  if (prop === 'aspectratio') return handleAspectRatio(cssValue);
  if (prop === 'mixblendmode') return handleMixBlendMode(cssValue);
  if (prop === 'boxshadow') return handleBoxShadow(cssValue);

  // No mapping found
  return '';
}
