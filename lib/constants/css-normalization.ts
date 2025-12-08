// CSS Normalization Constants
// ============================================================================
// VERBATIM from merge-simple-alt-nodes.ts:37-109
// ============================================================================

/**
 * Properties that are Figma-specific and should be excluded from CSS output.
 * These don't translate to valid CSS and create noise in the style diff.
 */
export const FIGMA_SPECIFIC_PROPS = new Set([
  'fills',
  'strokes',
  'mix-blend-mode',
  'mixBlendMode',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-linecap (SVG)',
  'stroke-linejoin (SVG)',
]);

/**
 * CSS default values that are implicit and don't need to be specified.
 * Key: property name (kebab-case), Value: default value
 */
export const CSS_DEFAULT_VALUES: Record<string, string> = {
  'flex-grow': '0',
  'flex-shrink': '1',
  'flex-wrap': 'nowrap',
  'overflow': 'visible',
  'align-self': 'auto',
  'order': '0',
  'opacity': '1',
  'z-index': 'auto',
};

/**
 * Figma-specific values that should be excluded
 */
export const FIGMA_SPECIFIC_VALUES = new Set([
  'PASS_THROUGH',  // Figma's mix-blend-mode default
]);

/**
 * Mapping from camelCase to kebab-case for normalization
 */
export const CAMEL_TO_KEBAB: Record<string, string> = {
  'flexDirection': 'flex-direction',
  'flexGrow': 'flex-grow',
  'flexShrink': 'flex-shrink',
  'flexWrap': 'flex-wrap',
  'alignItems': 'align-items',
  'alignSelf': 'align-self',
  'justifyContent': 'justify-content',
  'borderRadius': 'border-radius',
  'paddingTop': 'padding-top',
  'paddingBottom': 'padding-bottom',
  'paddingLeft': 'padding-left',
  'paddingRight': 'padding-right',
  'marginTop': 'margin-top',
  'marginBottom': 'margin-bottom',
  'marginLeft': 'margin-left',
  'marginRight': 'margin-right',
  'borderWidth': 'border-width',
  'borderRightWidth': 'border-right-width',
  'borderLeftWidth': 'border-left-width',
  'borderTopWidth': 'border-top-width',
  'borderBottomWidth': 'border-bottom-width',
  'mixBlendMode': 'mix-blend-mode',
  'backgroundImage': 'background-image',
  'backgroundColor': 'background-color',
  'backgroundSize': 'background-size',
  'lineHeight': 'line-height',
  'fontFamily': 'font-family',
  'fontSize': 'font-size',
  'fontWeight': 'font-weight',
  'textAlign': 'text-align',
  'verticalAlign': 'vertical-align',
  'maxWidth': 'max-width',
  'maxHeight': 'max-height',
  'minWidth': 'min-width',
  'minHeight': 'min-height',
};

/**
 * Properties where 0 is a meaningful reset value (not noise)
 */
export const ZERO_IS_MEANINGFUL = new Set([
  'min-width', 'min-height', 'max-width', 'max-height',
  'gap', 'row-gap', 'column-gap',
  'padding', 'margin', 'border-width', 'border-radius',
]);

/**
 * Shorthand to longhand property mappings.
 * Order matters: [top, right, bottom, left] for box model properties
 */
export const SHORTHAND_LONGHANDS: Record<string, string[]> = {
  'padding': ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  'margin': ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  'gap': ['row-gap', 'column-gap'],
};
