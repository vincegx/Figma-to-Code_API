/**
 * Style Extraction
 *
 * Extracts and normalizes CSS styles from Figma node properties.
 * VERBATIM from altnode-transform.ts
 */

import type { FigmaNode } from '../types/figma';
import type { SimpleAltNode, FillData } from './types';
import figmaConfig from '../figma-transform-config.json';
import { resolveVariableName } from './index';

/**
 * WP28 T210: Extract universal fallbacks for all properties defined in config
 *
 * This function ensures that ALL Figma properties have CSS fallback values,
 * even if no rule matches. Rules will optimize these fallbacks to semantic classes.
 *
 * Example: fontSize: 14 → styles.fontSize = "14px" (fallback)
 *          If rule matches → "text-sm" (optimized)
 *          If no rule → "text-[14px]" (fallback used)
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
export function extractUniversalFallbacks(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  const node = figmaNode as any;

  // Extract simple properties with direct unit conversion
  for (const [figmaProp, mapping] of Object.entries(figmaConfig.propertyMappings)) {
    if (!mapping.extract) continue;

    // Skip gap (itemSpacing) when justify-content is space-between - flexbox handles spacing
    // WP31 FIX: Skip negative itemSpacing - will be handled as margin on children
    if (figmaProp === 'itemSpacing') {
      if (node.primaryAxisAlignItems === 'SPACE_BETWEEN') {
        continue;
      }
      // Negative gap is invalid in CSS - store for child margin processing
      if (typeof node[figmaProp] === 'number' && node[figmaProp] < 0) {
        altNode.negativeItemSpacing = node[figmaProp];
        altNode.layoutDirection = node.layoutMode === 'HORIZONTAL' ? 'row' : 'column';
        continue;
      }
    }

    // WP31: Skip strokeWeight in these cases:
    // 1. When individualStrokeWeights exists (handled separately with shorthand)
    // 2. When strokes array is empty or all strokes are hidden (no visible border)
    if (figmaProp === 'strokeWeight') {
      if (node.individualStrokeWeights) continue;
      if (!node.strokes || !node.strokes.some((s: any) => s.visible !== false)) continue;
    }

    const value = node[figmaProp];
    if (value !== undefined && value !== null) {
      const cssValue = mapping.unit ? `${value}${mapping.unit}` : String(value);
      altNode.styles[mapping.cssProperty] = cssValue;
    }
  }

  // WP32: Check if this is an image element that needs fixed dimensions for cropping
  // Images with scaleMode FILL/CROP need fixed dimensions for object-fit: cover to work
  const imageFill = node.fills?.find((f: any) => f.type === 'IMAGE' && f.visible !== false);
  const imageNeedsFixedDimensions = imageFill && (imageFill.scaleMode === 'FILL' || imageFill.scaleMode === 'CROP');

  // Extract enum properties with value mappings
  for (const [figmaProp, enumMapping] of Object.entries(figmaConfig.enumMappings)) {
    const figmaValue = node[figmaProp];
    if (figmaValue !== undefined && figmaValue !== null) {
      const valueMapping = (enumMapping as any).values[String(figmaValue)];
      if (valueMapping && valueMapping.css) {
        // Apply all CSS properties from the mapping
        for (const [cssProp, cssValue] of Object.entries(valueMapping.css)) {
          let finalValue = cssValue as string;

          // WP32 FIX: For images with FILL/CROP scaleMode, force fixed dimensions
          // This ensures object-fit: cover works correctly for cropping
          if (imageNeedsFixedDimensions) {
            const nodeSize = node.size;
            if (cssProp === 'width' && finalValue === '100%' && nodeSize) {
              finalValue = `${nodeSize.x}px`;
            }
            if (cssProp === 'height' && finalValue === '100%' && nodeSize) {
              finalValue = `${nodeSize.y}px`;
            }
          }

          // Handle template variables like ${absoluteBoundingBox.width}px
          if (finalValue.includes('${')) {
            // WP32 FIX: Use size.x/y for rotated elements (actual dimensions before rotation)
            // absoluteBoundingBox gives the bounding box AFTER rotation which is incorrect
            const hasRotation = node.rotation && node.rotation !== 0;
            const nodeSize = node.size;

            if (hasRotation && nodeSize) {
              // Rotated element: use size.x/y
              finalValue = finalValue.replace('${absoluteBoundingBox.width}', String(nodeSize.x));
              finalValue = finalValue.replace('${absoluteBoundingBox.height}', String(nodeSize.y));
            } else if (figmaNode.absoluteBoundingBox) {
              // Non-rotated element: use absoluteBoundingBox
              finalValue = finalValue.replace('${absoluteBoundingBox.width}', String(figmaNode.absoluteBoundingBox.width));
              finalValue = finalValue.replace('${absoluteBoundingBox.height}', String(figmaNode.absoluteBoundingBox.height));
            }
          }

          // Skip width/height if layoutSizing is FILL (already set to 100% in normalizeLayout)
          const layoutSizingH = node.layoutSizingHorizontal;
          const layoutSizingV = node.layoutSizingVertical;
          if (cssProp === 'width' && layoutSizingH === 'FILL') continue;
          if (cssProp === 'height' && layoutSizingV === 'FILL') continue;

          // Skip HUG auto when no children (except TEXT) - use pixel dimensions from normalizeLayout
          const hasNoChildren = !node.children || node.children.length === 0;
          const isText = figmaNode.type === 'TEXT';
          if (cssProp === 'width' && layoutSizingH === 'HUG' && hasNoChildren && !isText) continue;
          if (cssProp === 'height' && layoutSizingV === 'HUG' && hasNoChildren && !isText) continue;

          altNode.styles[cssProp] = finalValue;
        }
      }
    }
  }

  // WP31 T224: Extract Figma variables (boundVariables)
  if (node.boundVariables) {
    for (const [figmaProp, varRef] of Object.entries(node.boundVariables)) {
      // Handle nested refs (rectangleCornerRadii has 4 sub-properties)
      if (figmaProp === 'rectangleCornerRadii' && varRef && typeof varRef === 'object' && !(varRef as any).id) {
        // Check if all 4 corners use the same variable
        const corners = varRef as Record<string, { id?: string }>;
        const ids = Object.values(corners).map(c => c?.id).filter(Boolean);
        const uniqueIds = [...new Set(ids)];

        if (uniqueIds.length === 1 && uniqueIds[0]) {
          // All corners use same variable - use single border-radius
          const varName = resolveVariableName(uniqueIds[0], figmaNode);
          const fallbackValue = node.cornerRadius ?? 0;
          if (varName) {
            altNode.styles['border-radius'] = `var(--${varName}, ${fallbackValue}px)`;
          }
        }
        // TODO: Handle 4 different variables for each corner if needed
        continue;
      }

      const varArray = Array.isArray(varRef) ? varRef : [varRef];
      for (const ref of varArray) {
        if (ref?.id) {
          const varName = resolveVariableName(ref.id, figmaNode);
          const fallbackValue = node[figmaProp];

          if (varName) {
            const mapping = (figmaConfig.propertyMappings as Record<string, { cssProperty?: string; unit?: string }>)[figmaProp];
            const cssProperty = mapping?.cssProperty || figmaProp;
            const fallback = mapping?.unit ? `${fallbackValue}${mapping.unit}` : String(fallbackValue);
            altNode.styles[cssProperty] = `var(--${varName}, ${fallback})`;
          }
        }
      }
    }
  }

  // WP31 T225: Extract TEXT node style properties
  if (node.type === 'TEXT' && node.style) {
    // Font properties
    if (node.style.fontFamily) altNode.styles['font-family'] = node.style.fontFamily;
    // WP31: Use fontStyle to derive correct CSS weight (Figma's fontWeight can be non-standard variable font values)
    // fontStyle contains the style name (Regular, Bold, Black, etc.) which maps to standard CSS weights
    if (node.style.fontStyle) {
      const styleToWeight: Record<string, number> = {
        'Thin': 100, 'Hairline': 100,
        'ExtraLight': 200, 'Extra Light': 200, 'UltraLight': 200, 'Ultra Light': 200,
        'Light': 300,
        'Regular': 400, 'Normal': 400,
        'Medium': 500,
        'SemiBold': 600, 'Semi Bold': 600, 'DemiBold': 600, 'Demi Bold': 600,
        'Bold': 700,
        'ExtraBold': 800, 'Extra Bold': 800, 'UltraBold': 800, 'Ultra Bold': 800,
        'Black': 900, 'Heavy': 900
      };
      const weight = styleToWeight[node.style.fontStyle];
      if (weight) {
        altNode.styles['font-weight'] = String(weight);
      } else if (node.style.fontWeight) {
        // Fallback to Figma's fontWeight if style not recognized
        altNode.styles['font-weight'] = String(node.style.fontWeight);
      }
    } else if (node.style.fontWeight) {
      altNode.styles['font-weight'] = String(node.style.fontWeight);
    }
    if (node.style.fontSize) altNode.styles['font-size'] = `${node.style.fontSize}px`;

    // Letter spacing
    if (node.style.letterSpacing !== undefined && node.style.letterSpacing !== 0) {
      altNode.styles['letter-spacing'] = `${node.style.letterSpacing}px`;
    }

    // Line-height: handled in normalizeText() with PIXELS vs unitless logic

    // Text alignment
    if (node.style.textAlignHorizontal) {
      const alignMap: Record<string, string> = {
        'LEFT': 'left',
        'CENTER': 'center',
        'RIGHT': 'right',
        'JUSTIFIED': 'justify'
      };
      altNode.styles['text-align'] = alignMap[node.style.textAlignHorizontal] || 'left';
    }

    // Text transform
    if (node.style.textCase === 'UPPER') altNode.styles['text-transform'] = 'uppercase';
    if (node.style.textCase === 'LOWER') altNode.styles['text-transform'] = 'lowercase';
  }

  // WP28 COMPLETION: Handle Complex properties that need special logic
  extractComplexProperties(figmaNode, altNode);
}

/**
 * WP28 COMPLETION: Extract complex properties that require special handling
 *
 * Complex properties from WP27:
 * 1. rectangleCornerRadii: 4-value array [topLeft, topRight, bottomRight, bottomLeft]
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
function extractComplexProperties(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  const node = figmaNode as any;

  // rectangleCornerRadii: Individual corner radii (4 values)
  // WP31 FIX: Skip if border-radius already set with CSS variable (from boundVariables)
  if (node.rectangleCornerRadii && Array.isArray(node.rectangleCornerRadii)) {
    const existingBorderRadius = altNode.styles['border-radius'];
    const hasVariableBinding = typeof existingBorderRadius === 'string' && existingBorderRadius.includes('var(--');

    // Only set fixed values if not already bound to a variable
    if (!hasVariableBinding) {
      const [tl, tr, br, bl] = node.rectangleCornerRadii;

      // Check if all corners are the same
      if (tl === tr && tr === br && br === bl) {
        // All same: use simple border-radius
        altNode.styles['border-radius'] = `${tl}px`;
      } else {
        // Different corners: use 4-value syntax
        altNode.styles['border-radius'] = `${tl}px ${tr}px ${br}px ${bl}px`;

        // Also set individual corner properties for specificity
        if (tl !== 0) altNode.styles['border-top-left-radius'] = `${tl}px`;
        if (tr !== 0) altNode.styles['border-top-right-radius'] = `${tr}px`;
        if (br !== 0) altNode.styles['border-bottom-right-radius'] = `${br}px`;
        if (bl !== 0) altNode.styles['border-bottom-left-radius'] = `${bl}px`;
      }
    }
  }

  // WP31 T226: Extract TEXT color from fills
  if (node.type === 'TEXT' && node.fills && Array.isArray(node.fills)) {
    const solidFill = node.fills.find((f: any) => f.type === 'SOLID');
    if (solidFill?.color) {
      const { r, g, b, a } = solidFill.color;
      // Multiply color alpha by fill opacity (both can affect transparency)
      const colorAlpha = a ?? 1;
      const fillOpacity = solidFill.opacity ?? 1;
      const finalAlpha = colorAlpha * fillOpacity;
      const rgba = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${finalAlpha})`;
      altNode.styles['color'] = rgba;
    }
  }
}

/**
 * WP25: Extract ALL additional Figma properties to CSS
 * Complements the normalize* functions above with comprehensive property extraction
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
export function normalizeAdditionalProperties(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  const node = figmaNode as any;

  // NOTE: overflow (clipsContent) handled by official-clipscontent-true rule
  // NOTE: opacity handled by official-opacity rule
  // NOTE: mixBlendMode handled by official-blendmode rule (but keep mapping for COMPLEX values)

  // Blend mode (COMPLEX mapping - keep for non-NORMAL values)
  // WP28 T209: Now uses externalized config for blend modes and exclusions
  if (node.blendMode && !figmaConfig.constants.blendModeExclusions.includes(node.blendMode)) {
    const cssBlendMode = figmaConfig.blendModes[node.blendMode as keyof typeof figmaConfig.blendModes];
    if (cssBlendMode) {
      altNode.styles.mixBlendMode = cssBlendMode;
    }
  }

  // NOTE: minWidth, maxWidth, minHeight, maxHeight handled by official-min*/max* rules

  // WP25: Aspect ratio preservation
  if (node.preserveRatio === true && node.absoluteBoundingBox) {
    const width = node.absoluteBoundingBox.width;
    const height = node.absoluteBoundingBox.height;
    if (width && height) {
      const ratio = width / height;
      altNode.styles.aspectRatio = ratio.toFixed(4);
    }
  }

  // WP31: Individual stroke weights - use per-side classes (border-t, border-b, etc.)
  // Reset all borders with border-0 first, then apply individual sides
  // Only apply if strokes exist (individualStrokeWeights can exist without visible strokes)
  if (node.individualStrokeWeights && node.strokes && node.strokes.length > 0) {
    const { top, right, bottom, left } = node.individualStrokeWeights;
    // border-0 resets all sides (must come before individual sides)
    altNode.styles.border = '0px';
    if (top) altNode.styles.borderTopWidth = `${top}px`;
    if (right) altNode.styles.borderRightWidth = `${right}px`;
    if (bottom) altNode.styles.borderBottomWidth = `${bottom}px`;
    if (left) altNode.styles.borderLeftWidth = `${left}px`;
  }

  // WP31: Stroke style - only if at least one stroke is visible
  if (node.strokes && node.strokes.some((s: any) => s.visible !== false)) {
    const style = (node.strokeDashes && node.strokeDashes.length > 0) ? 'dashed' : 'solid';
    altNode.styles['border-style'] = style;
  }
}

/**
 * Normalize auto-layout to CSS flexbox
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 * @param parentLayoutMode - Parent's layoutMode for flex vs inline-flex logic (WP25)
 * @param parentBounds - Parent's absoluteBoundingBox for constraints positioning (WP31)
 */
export function normalizeLayout(figmaNode: FigmaNode, altNode: SimpleAltNode, parentLayoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE', parentBounds?: { x: number; y: number; width: number; height: number }, parentLayoutSizing?: { horizontal?: string; vertical?: string }): void {
  const node = figmaNode as any;

  // Grid template columns/rows (COMPLEX - calculated values, not in rules)
  // WP28 T209: Now uses config constant for layout mode comparison
  if (node.layoutMode === figmaConfig.constants.layoutModes.GRID) {
    // NOTE: display:grid is handled by official-layoutmode-grid rule
    if (node.gridColumnsSizing) {
      altNode.styles.gridTemplateColumns = node.gridColumnsSizing;
    } else if (node.gridColumnCount) {
      altNode.styles.gridTemplateColumns = `repeat(${node.gridColumnCount}, 1fr)`;
    }

    if (node.gridRowsSizing) {
      altNode.styles.gridTemplateRows = node.gridRowsSizing;
    } else if (node.gridRowCount) {
      altNode.styles.gridTemplateRows = `repeat(${node.gridRowCount}, 1fr)`;
    }
    // NOTE: rowGap/columnGap are handled by official-gridrowgap/gridcolumngap rules
  }

  // WP25 FIX: FigmaToCode logic for flex vs inline-flex
  // Use 'flex' when parent has same layoutMode, otherwise 'inline-flex'
  // This matches FigmaToCode's getFlex() function
  // WP28 T209: Now uses config constants for layout mode comparisons
  if (node.layoutMode === figmaConfig.constants.layoutModes.HORIZONTAL ||
      node.layoutMode === figmaConfig.constants.layoutModes.VERTICAL) {
    const hasSameLayoutMode = parentLayoutMode === node.layoutMode;
    altNode.styles.display = hasSameLayoutMode ? 'flex' : 'inline-flex';
    // WP08: Add flexDirection to styles for merge comparison
    // Without this, merge can't detect row vs column differences between breakpoints
    altNode.styles.flexDirection = node.layoutMode === figmaConfig.constants.layoutModes.HORIZONTAL ? 'row' : 'column';
  }
  // NOTE: gap handled by rules
  // NOTE: counterAxisSpacing handled by official-counteraxisspacing rules

  // NOTE: layoutGrow handled by official-layoutgrow rules
  // NOTE: layoutAlign handled by official-layoutalign rules

  // WP25: layoutPositioning ABSOLUTE → calculate top/left (COMPLEX calculation, not in rules)
  // WP28 T209: Now uses config constant for layout positioning comparison
  // WP31: Handle CENTER constraints with calc(50% + offset) + translate(-50%, -50%)
  if (node.layoutPositioning === figmaConfig.constants.layoutPositioning.absolute) {
    // NOTE: position: absolute is handled by official-layoutpositioning rule
    // But top/left require parent calculation, so we keep them here
    // WP31 FIX: Use parentBounds parameter (from recursive call) OR node.parent.absoluteBoundingBox
    const parentBox = parentBounds || node.parent?.absoluteBoundingBox;
    if (node.absoluteBoundingBox && parentBox) {
      const nodeBox = node.absoluteBoundingBox;
      const constraints = (node as any).constraints;

      // WP31: CENTER constraints use calc(50% + offset) pattern
      // WP38: Also handle RIGHT/BOTTOM constraints for responsive positioning
      const isVerticalCenter = constraints?.vertical === 'CENTER';
      const isHorizontalCenter = constraints?.horizontal === 'CENTER';
      const isVerticalBottom = constraints?.vertical === 'BOTTOM';
      const isHorizontalRight = constraints?.horizontal === 'RIGHT';

      // Handle horizontal positioning
      if (isHorizontalCenter) {
        const parentCenterX = parentBox.width / 2;
        const nodeCenterX = (nodeBox.x - parentBox.x) + nodeBox.width / 2;
        const offsetX = nodeCenterX - parentCenterX;
        const sign = offsetX >= 0 ? '+' : '';
        altNode.styles.left = `calc(50%${sign}${offsetX.toFixed(2)}px)`;
        altNode.styles.translateX = '-50%';
      } else if (isHorizontalRight) {
        // WP38: RIGHT constraint → use right instead of left for responsive behavior
        altNode.styles.right = `${parentBox.width - (nodeBox.x - parentBox.x) - nodeBox.width}px`;
      } else {
        altNode.styles.left = `${nodeBox.x - parentBox.x}px`;
      }

      // Handle vertical positioning
      if (isVerticalCenter) {
        const parentCenterY = parentBox.height / 2;
        const nodeCenterY = (nodeBox.y - parentBox.y) + nodeBox.height / 2;
        const offsetY = nodeCenterY - parentCenterY;
        const sign = offsetY >= 0 ? '+' : '';
        altNode.styles.top = `calc(50%${sign}${offsetY.toFixed(2)}px)`;
        altNode.styles.translateY = '-50%';
      } else if (isVerticalBottom) {
        // WP38: BOTTOM constraint → use bottom instead of top for responsive behavior
        altNode.styles.bottom = `${parentBox.height - (nodeBox.y - parentBox.y) - nodeBox.height}px`;
      } else {
        altNode.styles.top = `${nodeBox.y - parentBox.y}px`;
      }
    }
  }

  // WP31: Handle constraints for free-positioned children (parent has no layoutMode)
  const constraints = (node as any).constraints;
  if (!parentLayoutMode && constraints && node.absoluteBoundingBox && parentBounds) {
    const nodeBox = node.absoluteBoundingBox;
    altNode.styles.position = 'absolute';

    if (constraints.vertical === 'BOTTOM') {
      altNode.styles.bottom = `${parentBounds.height - (nodeBox.y - parentBounds.y) - nodeBox.height}px`;
    } else {
      altNode.styles.top = `${nodeBox.y - parentBounds.y}px`;
    }

    if (constraints.horizontal === 'RIGHT') {
      altNode.styles.right = `${parentBounds.width - (nodeBox.x - parentBounds.x) - nodeBox.width}px`;
    } else {
      altNode.styles.left = `${nodeBox.x - parentBounds.x}px`;
    }
  }


  // WP25: Grid child properties - use anchorIndex for position (0-indexed in Figma, 1-indexed in CSS)
  // Only set explicit positions if child has grid properties (is a grid child)
  if (node.gridColumnAnchorIndex !== undefined || node.gridColumnSpan !== undefined) {
    const colStart = (node.gridColumnAnchorIndex ?? 0) + 1; // CSS Grid is 1-indexed
    const colSpan = node.gridColumnSpan ?? 1;
    if (colSpan > 1) {
      altNode.styles['grid-column'] = `${colStart} / span ${colSpan}`;
    } else {
      // For span 1, don't set explicit position - let CSS Grid auto-place
      // This avoids conflicts and works better with responsive layouts
    }
  }
  if (node.gridRowAnchorIndex !== undefined || node.gridRowSpan !== undefined) {
    const rowStart = (node.gridRowAnchorIndex ?? 0) + 1; // CSS Grid is 1-indexed
    const rowSpan = node.gridRowSpan ?? 1;
    if (rowSpan > 1) {
      altNode.styles['grid-row'] = `${rowStart} / span ${rowSpan}`;
    } else {
      // For span 1, don't set explicit position - let CSS Grid auto-place
    }
  }

  // Padding
  const paddingTop = node.paddingTop;
  const paddingRight = node.paddingRight;
  const paddingBottom = node.paddingBottom;
  const paddingLeft = node.paddingLeft;

  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    const t = paddingTop || 0;
    const r = paddingRight || 0;
    const b = paddingBottom || 0;
    const l = paddingLeft || 0;

    if (t === b && l === r) {
      if (t === l) {
        altNode.styles.padding = `${t}px`;
      } else {
        altNode.styles.padding = `${t}px ${r}px`;
      }
    } else {
      altNode.styles.padding = `${t}px ${r}px ${b}px ${l}px`;
    }
  }

  // Extract justify-content/align-items for responsive merge diff
  const axisMap: Record<string, string> = { MIN: 'flex-start', CENTER: 'center', MAX: 'flex-end', SPACE_BETWEEN: 'space-between', BASELINE: 'baseline' };
  if ((figmaNode as any).primaryAxisAlignItems && axisMap[(figmaNode as any).primaryAxisAlignItems]) {
    altNode.styles['justify-content'] = axisMap[(figmaNode as any).primaryAxisAlignItems];
  }
  if ((figmaNode as any).counterAxisAlignItems && axisMap[(figmaNode as any).counterAxisAlignItems]) {
    altNode.styles['align-items'] = axisMap[(figmaNode as any).counterAxisAlignItems];
  }

  // Width and height
  // WP32 FIX: Use node.size for rotated elements (actual dimensions before rotation)
  // absoluteBoundingBox gives the bounding box AFTER rotation which is incorrect
  const nodeSize = (figmaNode as any).size;
  const hasRotation = (figmaNode as any).rotation && (figmaNode as any).rotation !== 0;

  // Figma Auto Layout sizing: FILL = responsive (100%), FIXED = pixel value, HUG = auto
  const layoutSizingH = (figmaNode as any).layoutSizingHorizontal;
  const layoutSizingV = (figmaNode as any).layoutSizingVertical;
  const layoutGrow = (figmaNode as any).layoutGrow;

  // Width
  // WP38: Don't set any width when layoutGrow is present - grow basis-0 handles sizing
  if (layoutGrow) {
    // Skip width - flex grow handles it
  } else if (layoutSizingH === 'FILL') {
    altNode.styles.width = '100%';
  } else if (hasRotation && nodeSize) {
    altNode.styles.width = `${nodeSize.x}px`;
  } else if (figmaNode.absoluteBoundingBox) {
    altNode.styles.width = `${figmaNode.absoluteBoundingBox.width}px`;
  }

  // Height
  // WP31: Images with scaleMode FILL need fixed height for object-fit: cover to crop correctly
  const hasImageFill = (figmaNode as any).fills?.some((f: any) => f.type === 'IMAGE' && f.scaleMode === 'FILL');
  // WP38: When parent is HUG, h-full won't work (100% of auto = 0). Use pixel height.
  const parentIsHugVertical = parentLayoutSizing?.vertical === 'HUG';
  if (layoutSizingV === 'FILL' && hasImageFill && figmaNode.absoluteBoundingBox) {
    // Use pixel height for images to enable proper cropping
    altNode.styles.height = `${figmaNode.absoluteBoundingBox.height}px`;
  } else if (layoutSizingV === 'FILL' && parentIsHugVertical && figmaNode.absoluteBoundingBox) {
    // Parent is HUG - use pixel height instead of 100%
    altNode.styles.height = `${figmaNode.absoluteBoundingBox.height}px`;
  } else if (layoutSizingV === 'FILL') {
    altNode.styles.height = '100%';
  } else if (layoutSizingV === 'HUG' && ((figmaNode as any).children?.length > 0 || figmaNode.type === 'TEXT')) {
    altNode.styles.height = 'auto';
  } else if (hasRotation && nodeSize) {
    altNode.styles.height = `${nodeSize.y}px`;
  } else if (figmaNode.absoluteBoundingBox) {
    altNode.styles.height = `${figmaNode.absoluteBoundingBox.height}px`;
  }

  // WP38: Add min-h-px min-w-px for elements with layoutGrow (like MCP)
  // This helps the flex algorithm calculate sizes correctly
  // But only when no explicit sizing (FILL already has height/width)
  const hasLayoutGrow = (figmaNode as any).layoutGrow === 1;
  if (hasLayoutGrow) {
    const verticalSizing = (figmaNode as any).layoutSizingVertical;
    const horizontalSizing = (figmaNode as any).layoutSizingHorizontal;
    // Only add min-height if not already filling parent
    if (verticalSizing !== 'FILL') {
      altNode.styles['min-height'] = '1px';
    }
    // Only add min-width if not already filling parent
    if (horizontalSizing !== 'FILL') {
      altNode.styles['min-width'] = '1px';
    }
  }
}

/**
 * Convert Figma fills to CSS background
 * WP32: Now extracts ALL fills for multi-layer rendering like MCP
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
export function normalizeFills(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  // WP31: Skip fills for SVG types - fill is in the SVG, not as CSS background
  const nodeType = figmaNode.type as string;
  if (nodeType === 'VECTOR' || nodeType === 'BOOLEAN_OPERATION') {
    return;
  }

  const fills = (figmaNode as any).fills;
  if (!fills || fills.length === 0) {
    return;
  }

  // WP32: Extract ALL visible fills for multi-layer rendering
  const visibleFills = fills.filter((f: any) => f.visible !== false);
  if (visibleFills.length === 0) {
    return;
  }

  // WP32: Build fillsData array with all fills in render order (bottom to top)
  const fillsData: FillData[] = [];
  let lastImageFill: any = null;

  for (const fill of visibleFills) {
    const fillData: FillData = {
      type: fill.type,
      visible: true,
      opacity: fill.opacity,
    };

    if (fill.type === 'IMAGE' && fill.imageRef) {
      fillData.imageRef = fill.imageRef;
      fillData.scaleMode = fill.scaleMode || 'FILL';
      lastImageFill = fill; // Track last image for backward compat
    } else if (fill.type === 'SOLID' && fill.color) {
      fillData.color = {
        r: fill.color.r,
        g: fill.color.g,
        b: fill.color.b,
        a: fill.color.a ?? fill.opacity ?? 1
      };
    } else if (fill.type.startsWith('GRADIENT') && fill.gradientStops) {
      fillData.gradientStops = fill.gradientStops.map((stop: any) => ({
        color: {
          r: stop.color.r,
          g: stop.color.g,
          b: stop.color.b,
          a: stop.color.a ?? 1
        },
        position: stop.position
      }));
      fillData.gradientHandlePositions = fill.gradientHandlePositions;
      fillData.gradientTransform = fill.gradientTransform;
    }

    fillsData.push(fillData);
  }

  // WP32: Store all fills for multi-layer rendering
  if (fillsData.length > 0) {
    altNode.fillsData = fillsData;
  }

  // WP32: Keep imageData for backward compatibility (use LAST image fill - topmost)
  if (lastImageFill) {
    altNode.imageData = {
      imageRef: lastImageFill.imageRef,
      nodeId: figmaNode.id,
      scaleMode: lastImageFill.scaleMode || 'FILL'
    };
  }

  // WP25 FIX: TEXT nodes should use 'color' property, not 'background'
  // For simple single-fill cases, also set CSS styles for fallback
  const isTextNode = figmaNode.type === 'TEXT';
  const colorProp = isTextNode ? 'color' : 'background';
  const firstFill = visibleFills[0];

  if (firstFill.type === figmaConfig.constants.fillTypes.solid && firstFill.color) {
    const { r, g, b } = firstFill.color;
    const a = firstFill.opacity ?? 1;
    const rgbaValue = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;

    // WP31 T224: Check for Figma variable bindings (uses loaded variables map)
    const boundVars = (figmaNode as any).boundVariables;
    if (boundVars && boundVars.fills && boundVars.fills[0]?.id) {
      const varId = boundVars.fills[0].id;
      const varName = resolveVariableName(varId, figmaNode);
      if (varName) {
        altNode.styles[colorProp] = `var(--${varName}, ${rgbaValue})`;
      } else {
        altNode.styles[colorProp] = rgbaValue;
      }
    } else {
      altNode.styles[colorProp] = rgbaValue;
    }
  } else if (firstFill.type === figmaConfig.constants.fillTypes.gradientLinear && firstFill.gradientStops) {
    // WP38: Calculate correct angle and positions from gradientHandlePositions
    const handles = firstFill.gradientHandlePositions;
    let angleDeg = 180; // Default
    let startPct = 0;
    let endPct = 100;

    if (handles && handles.length >= 2) {
      const start = handles[0];
      const end = handles[1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      // CSS angle: 0deg = to top, clockwise
      angleDeg = Math.round(Math.atan2(dx, -dy) * 180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      // Calculate gradient direction vector
      const angleRad = angleDeg * Math.PI / 180;
      const dirX = Math.sin(angleRad);
      const dirY = -Math.cos(angleRad);

      // Element corners dot products with gradient direction
      const corners = [[0, 0], [1, 0], [0, 1], [1, 1]];
      const dots = corners.map(([x, y]) => x * dirX + y * dirY);
      const minDot = Math.min(...dots);
      const maxDot = Math.max(...dots);
      const extent = maxDot - minDot;

      if (extent > 0) {
        // Project gradient handles onto CSS gradient axis
        const startDot = start.x * dirX + start.y * dirY;
        const endDot = end.x * dirX + end.y * dirY;
        startPct = ((startDot - minDot) / extent) * 100;
        endPct = ((endDot - minDot) / extent) * 100;
      }
    }

    const stops = firstFill.gradientStops
      .map((stop: any) => {
        const { r, g, b } = stop.color;
        const a = stop.color.a ?? 1;
        // Interpolate position between startPct and endPct
        const pct = startPct + stop.position * (endPct - startPct);
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${pct.toFixed(2)}%`;
      })
      .join(', ');
    altNode.styles[colorProp] = `linear-gradient(${angleDeg}deg, ${stops})`;
  } else if (firstFill.type === figmaConfig.constants.fillTypes.image && firstFill.imageRef) {
    // Keep background-image style for CSS fallback
    altNode.styles.backgroundImage = `url(${firstFill.imageRef})`;
    altNode.styles.backgroundSize = 'cover';

    // Apply image filters (exposure, contrast) as CSS filters
    if (firstFill.filters) {
      const cssFilters: string[] = [];
      if (firstFill.filters.exposure !== undefined && firstFill.filters.exposure !== 0) {
        cssFilters.push(`brightness(${1 + firstFill.filters.exposure})`);
      }
      if (firstFill.filters.contrast !== undefined && firstFill.filters.contrast !== 0) {
        cssFilters.push(`contrast(${1 + firstFill.filters.contrast})`);
      }
      if (cssFilters.length > 0) {
        altNode.styles.filter = cssFilters.join(' ');
      }
    }
  }
}

/**
 * Convert Figma strokes to CSS border
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
export function normalizeStrokes(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  const node = figmaNode as any;

  // Apply border/outline if strokes exist
  if (node.strokes && node.strokes.length > 0) {
    const stroke = node.strokes.find((s: any) => s.visible !== false);
    if (stroke) {
      const weight = node.strokeWeight || 1;
      let color: string | null = null;

      // WP38: Handle gradient strokes - use first color as fallback (CSS doesn't support gradient borders natively)
      if (stroke.type === 'GRADIENT_LINEAR' || stroke.type === 'GRADIENT_RADIAL' || stroke.type === 'GRADIENT_ANGULAR' || stroke.type === 'GRADIENT_DIAMOND') {
        const firstStop = stroke.gradientStops?.[0];
        if (firstStop?.color) {
          const { r, g, b } = firstStop.color;
          const a = firstStop.color.a ?? 1;
          color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
        }
      } else if (stroke.color) {
        // Solid color stroke
        const { r, g, b } = stroke.color;
        // Multiply color alpha by stroke opacity (both can affect transparency)
        const colorAlpha = stroke.color.a ?? 1;
        const strokeOpacity = stroke.opacity ?? 1;
        const a = colorAlpha * strokeOpacity;
        color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;

        // WP31 T224: Check for Figma variable bindings on strokes
        // Variables can be bound at stroke level (stroke.boundVariables.color) or node level
        const strokeBoundVars = stroke.boundVariables;
        const nodeBoundVars = (figmaNode as any).boundVariables;
        const varBinding = strokeBoundVars?.color || nodeBoundVars?.strokes?.[0];
        if (varBinding?.id) {
          const varName = resolveVariableName(varBinding.id, figmaNode);
          if (varName) {
            color = `var(--${varName}, ${color})`;
          }
        }
      }

      if (color) {
        // WP31: Apply color per-side if individualStrokeWeights exists
        if (node.individualStrokeWeights) {
          const { top, right, bottom, left } = node.individualStrokeWeights;
          if (top) altNode.styles['border-top-color'] = color;
          if (right) altNode.styles['border-right-color'] = color;
          if (bottom) altNode.styles['border-bottom-color'] = color;
          if (left) altNode.styles['border-left-color'] = color;
        } else {
          // WP31 FIX: Always use border to match MCP output (not outline)
          altNode.styles.border = `${weight}px solid ${color}`;
        }
      }
    }
  }

  // NOTE: borderRadius (cornerRadius) handled by official-cornerradius rules
}

/**
 * Convert Figma effects to CSS box-shadow
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
export function normalizeEffects(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  if (!figmaNode.effects || figmaNode.effects.length === 0) {
    return;
  }

  const node = figmaNode as any;
  // Check if this is an image element (PNG detoure needs drop-shadow instead of box-shadow)
  const hasImageFill = node.fills?.some((f: any) => f.type === 'IMAGE' && f.visible !== false);

  // WP28 T209: Now uses config constants for effect types and default color
  const dropShadows = figmaNode.effects
    .filter(effect => effect.visible !== false &&
            effect.type === figmaConfig.constants.effectTypes.dropShadow);

  const innerShadows = figmaNode.effects
    .filter(effect => effect.visible !== false &&
            effect.type === figmaConfig.constants.effectTypes.innerShadow);

  // For images: use filter drop-shadow (respects transparency)
  // drop-shadow doesn't support spread or inset
  if (hasImageFill && dropShadows.length > 0) {
    const dropShadowFilters = dropShadows.map(effect => {
      const { r, g, b } = effect.color || figmaConfig.defaults.color;
      const a = effect.color?.a ?? 1;
      const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const blur = effect.radius || 0;
      return `drop-shadow(${x}px ${y}px ${blur}px ${color})`;
    });
    altNode.styles.filter = dropShadowFilters.join(' ');
  } else {
    // For non-images: use box-shadow (supports spread and inset)
    const allShadows = [...dropShadows, ...innerShadows].map(effect => {
      const { r, g, b } = effect.color || figmaConfig.defaults.color;
      const a = effect.color?.a ?? 1;
      const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
      const x = effect.offset?.x || 0;
      const y = effect.offset?.y || 0;
      const blur = effect.radius || 0;
      const spread = effect.spread || 0;
      const inset = effect.type === figmaConfig.constants.effectTypes.innerShadow ? 'inset ' : '';
      return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
    });

    if (allShadows.length > 0) {
      altNode.styles.boxShadow = allShadows.join(', ');
    }
  }

  // WP25: Handle blur effects
  // WP28 T209: Now uses config constants for effect types
  const layerBlur = figmaNode.effects.find(
    effect => effect.visible !== false && effect.type === figmaConfig.constants.effectTypes.layerBlur
  );
  if (layerBlur && (layerBlur as any).radius) {
    const blurValue = `blur(${(layerBlur as any).radius}px)`;
    // Combine with existing filter (drop-shadow) if present
    altNode.styles.filter = altNode.styles.filter
      ? `${altNode.styles.filter} ${blurValue}`
      : blurValue;
  }

  // WP25: Handle background blur
  const backgroundBlur = figmaNode.effects.find(
    effect => effect.visible !== false && effect.type === figmaConfig.constants.effectTypes.backgroundBlur
  );
  if (backgroundBlur && (backgroundBlur as any).radius) {
    altNode.styles.backdropFilter = `blur(${(backgroundBlur as any).radius}px)`;
  }
}

/**
 * Convert Figma text properties to CSS font properties
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 */
export function normalizeText(figmaNode: FigmaNode, altNode: SimpleAltNode): void {
  if (figmaNode.type !== 'TEXT') {
    return;
  }

  const textNode = figmaNode as any;
  const style = textNode.style;

  if (!style) {
    return;
  }

  // Font family
  if (style.fontFamily) {
    altNode.styles.fontFamily = style.fontFamily;
  }

  // NOTE: fontSize handled by official-fontsize rules
  // NOTE: fontWeight handled by official-fontweight rules

  // Line height: skip when lineHeight > element height (single-line text in fixed box)
  const elementHeight = figmaNode.absoluteBoundingBox?.height;
  const skipLineHeight = elementHeight && style.lineHeightPx && style.lineHeightPx > elementHeight;

  if (!skipLineHeight) {
    if (style.lineHeightPx && style.lineHeightUnit === 'PIXELS') {
      altNode.styles['line-height'] = `${style.lineHeightPx}px`;
    } else if (style.lineHeightPercentFontSize) {
      const unitless = (style.lineHeightPercentFontSize / 100).toFixed(2);
      altNode.styles['line-height'] = unitless;
    }
  }

  // NOTE: textAlign handled by official-textalignhorizontal rules
  // NOTE: letterSpacing handled by official-letterspacing rules
  // NOTE: textTransform (textCase) handled by official-textcase rules
  // NOTE: textDecoration handled by official-textdecoration rules

  // WP25: Text vertical alignment
  // WP28 T209: Now uses externalized config for text vertical align mapping
  if (style.textAlignVertical) {
    const verticalAlign = figmaConfig.textVerticalAlign[style.textAlignVertical as keyof typeof figmaConfig.textVerticalAlign];
    if (verticalAlign) {
      altNode.styles.verticalAlign = verticalAlign;
    }
  }

  // WP25: Paragraph spacing - REMOVED
  // paragraphSpacing is for spacing BETWEEN paragraphs in multi-line text,
  // NOT an external margin. Converting it to marginBottom breaks flex centering.
  // The gap property on parent flex containers handles spacing between elements.

  // WP25: Paragraph indent
  if (style.paragraphIndent) {
    altNode.styles.textIndent = `${style.paragraphIndent}px`;
  }

  // Color (from fills)
  // WP28 T209: Now uses config constant for fill type
  const fills = textNode.fills;
  if (fills && fills.length > 0) {
    const fill = fills.find((f: any) => f.visible !== false && f.type === figmaConfig.constants.fillTypes.solid);
    if (fill && fill.color) {
      const { r, g, b } = fill.color;
      const a = fill.opacity ?? 1;
      altNode.styles.color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
  }
}
