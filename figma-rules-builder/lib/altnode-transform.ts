/**
 * AltNode Transformation Engine
 *
 * Transforms Figma JSON to normalized AltNode representation with CSS-familiar properties
 * Constitutional Principle III: Computed on-the-fly from cached Figma JSON
 *
 * Performance target: <50ms for 100-node tree
 */

import type { FigmaNode, Effect, Color } from './types/figma';
import type { AltNode, AltNodeType, CSSProperties } from './types/altnode';

/**
 * Name counter registry for unique name generation
 * Maps "parentId:name" → occurrence count
 *
 * Note: This is module-level state. In a production system, consider passing
 * this as part of a transformation context object.
 */
const nameCounters = new Map<string, number>();

/**
 * Generate unique component name with suffix counter
 *
 * Prevents naming collisions when multiple nodes have the same name.
 * Uses scoped counters (parentId:name) to allow same names in different contexts.
 *
 * @param name - Base node name from Figma
 * @param parentId - Optional parent node ID for scoping
 * @returns Unique name (first: "Button", subsequent: "Button_01", "Button_02", etc.)
 *
 * @example
 * generateUniqueName("Button") // "Button"
 * generateUniqueName("Button") // "Button_01"
 * generateUniqueName("Button", "parent-1") // "Button" (different scope)
 */
function generateUniqueName(name: string, parentId?: string): string {
  const key = parentId ? `${parentId}:${name}` : name;
  const count = nameCounters.get(key) ?? 0;
  nameCounters.set(key, count + 1);
  return count === 0 ? name : `${name}_${String(count).padStart(2, '0')}`;
}

/**
 * Reset name counters (useful for testing or new transformation sessions)
 */
export function resetNameCounters(): void {
  nameCounters.clear();
}

/**
 * Transform Figma node tree to normalized AltNode tree
 *
 * Entry point for transformation engine. Recursively processes tree and applies
 * all normalization functions.
 *
 * @param figmaNode - Root Figma node from cache
 * @returns Normalized AltNode tree, or null if node is invisible
 *
 * @example
 * const figmaNode = await loadFigmaNode('123:456');
 * const altNode = transformToAltNode(figmaNode);
 * // altNode.styles.display === 'flex'
 */
export function transformToAltNode(figmaNode: FigmaNode): AltNode | null {
  // Filter out invisible nodes (visible: false in Figma)
  if (figmaNode.visible === false) {
    return null;
  }

  // Initialize base AltNode structure
  const altNode: AltNode = {
    id: figmaNode.id,
    name: generateUniqueName(figmaNode.name),
    type: normalizeNodeType(figmaNode.type),
    styles: {},
    originalNode: figmaNode,
    figmaProperties: {
      type: figmaNode.type,
      layoutMode: figmaNode.layoutMode,
    },
  };

  // Apply normalization functions
  normalizeLayout(figmaNode, altNode.styles);
  normalizeFills(figmaNode, altNode.styles);
  normalizeStrokes(figmaNode, altNode.styles);
  normalizeEffects(figmaNode, altNode.styles);
  normalizeText(figmaNode, altNode.styles);
  normalizePadding(figmaNode, altNode.styles);
  normalizeDimensions(figmaNode, altNode.styles);
  normalizePositioning(figmaNode, altNode.styles);

  // Recursively transform children (filter out invisible nodes and inline GROUPs)
  if (figmaNode.children && figmaNode.children.length > 0) {
    const transformedChildren: AltNode[] = [];

    for (const child of figmaNode.children) {
      const transformed = transformToAltNode(child);

      if (transformed === null) {
        // Skip invisible nodes
        continue;
      }

      // Inline GROUP nodes to avoid unnecessary wrapper divs
      if (child.type === 'GROUP' && transformed.children) {
        // Add GROUP's children directly instead of the GROUP wrapper
        transformedChildren.push(...transformed.children);
      } else {
        transformedChildren.push(transformed);
      }
    }

    if (transformedChildren.length > 0) {
      altNode.children = transformedChildren;
    }
  }

  return altNode;
}

/**
 * Normalize Figma node type to AltNode type
 *
 * Maps Figma's verbose node types to simplified categories
 *
 * @param figmaType - Figma node type
 * @returns Normalized AltNode type
 */
function normalizeNodeType(
  figmaType: FigmaNode['type']
): AltNodeType {
  switch (figmaType) {
    case 'TEXT':
      return 'text';
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'VECTOR':
      return 'image';
    case 'GROUP':
      return 'group';
    case 'FRAME':
    case 'COMPONENT':
    case 'INSTANCE':
    default:
      return 'container';
  }
}

/**
 * Normalize auto-layout properties to flexbox
 *
 * Transformation rules:
 * - layoutMode HORIZONTAL → display: flex, flexDirection: row
 * - layoutMode VERTICAL → display: flex, flexDirection: column
 * - itemSpacing → gap
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
export function normalizeLayout(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  if (figmaNode.layoutMode === 'HORIZONTAL') {
    styles.display = 'flex';
    styles.flexDirection = 'row';
    if (figmaNode.itemSpacing !== undefined) {
      styles.gap = `${figmaNode.itemSpacing}px`;
    }
  } else if (figmaNode.layoutMode === 'VERTICAL') {
    styles.display = 'flex';
    styles.flexDirection = 'column';
    if (figmaNode.itemSpacing !== undefined) {
      styles.gap = `${figmaNode.itemSpacing}px`;
    }
  }
}

/**
 * Normalize Figma fills to CSS background
 *
 * Handles:
 * - SOLID fills → background color (hex)
 * - Multiple fills (uses first SOLID fill)
 * - Opacity → RGBA
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
export function normalizeFills(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  if (!figmaNode.fills || figmaNode.fills.length === 0) {
    return;
  }

  // Find first solid fill
  const solidFill = figmaNode.fills.find((fill) => fill.type === 'SOLID');
  if (solidFill && solidFill.color) {
    const opacity = solidFill.opacity ?? 1;
    styles.background = colorToCSS(solidFill.color, opacity);
  }
}

/**
 * Normalize Figma strokes to CSS border
 *
 * Handles:
 * - Stroke color → border-color
 * - Stroke weight (assumed 1px if not specified)
 * - First stroke only (Figma supports multiple strokes)
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
export function normalizeStrokes(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  if (!figmaNode.strokes || figmaNode.strokes.length === 0) {
    return;
  }

  // Use first stroke
  const stroke = figmaNode.strokes[0];
  if (stroke && stroke.type === 'SOLID' && stroke.color) {
    const opacity = stroke.opacity ?? 1;
    const color = colorToCSS(stroke.color, opacity);
    // Default to 1px solid border (Figma API doesn't always provide strokeWeight in nodes response)
    styles.border = `1px solid ${color}`;
  }
}

/**
 * Normalize Figma effects to CSS box-shadow
 *
 * Handles:
 * - DROP_SHADOW → box-shadow
 * - Multiple shadows (combines into single box-shadow)
 * - Shadow offset, blur radius, color
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
export function normalizeEffects(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  if (!figmaNode.effects || figmaNode.effects.length === 0) {
    return;
  }

  // Filter drop shadows
  const dropShadows = figmaNode.effects.filter(
    (effect) => effect.type === 'DROP_SHADOW'
  );

  if (dropShadows.length === 0) {
    return;
  }

  // Convert each shadow to CSS format
  const shadows = dropShadows
    .map((shadow) => effectToBoxShadow(shadow))
    .filter((s): s is string => s !== null);

  if (shadows.length > 0) {
    styles.boxShadow = shadows.join(', ');
  }
}

/**
 * Normalize Figma text properties to CSS font properties
 *
 * Handles:
 * - fontSize → fontSize (with px unit)
 * - fontFamily → fontFamily (with fallback)
 * - characters → text content (stored in figmaProperties)
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
export function normalizeText(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  if (figmaNode.type !== 'TEXT') {
    return;
  }

  if (figmaNode.fontSize !== undefined) {
    styles.fontSize = `${figmaNode.fontSize}px`;
  }

  if (figmaNode.fontFamily) {
    // Add fallback generic font family
    styles.fontFamily = `'${figmaNode.fontFamily}', sans-serif`;
  }
}

/**
 * Normalize Figma padding to CSS padding
 *
 * Handles:
 * - Individual padding values → shorthand notation
 * - Format: top right bottom left (CSS standard)
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
function normalizePadding(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = figmaNode;

  // Only apply if at least one padding value exists
  if (
    paddingTop === undefined &&
    paddingRight === undefined &&
    paddingBottom === undefined &&
    paddingLeft === undefined
  ) {
    return;
  }

  const top = paddingTop ?? 0;
  const right = paddingRight ?? 0;
  const bottom = paddingBottom ?? 0;
  const left = paddingLeft ?? 0;

  // Use shorthand if possible
  if (top === right && right === bottom && bottom === left) {
    styles.padding = `${top}px`;
  } else if (top === bottom && right === left) {
    styles.padding = `${top}px ${right}px`;
  } else {
    styles.padding = `${top}px ${right}px ${bottom}px ${left}px`;
  }
}

/**
 * Normalize Figma dimensions to CSS width/height
 *
 * Extracts dimensions from absoluteBoundingBox if available
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
function normalizeDimensions(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  if (!figmaNode.absoluteBoundingBox) {
    return;
  }

  const { width, height } = figmaNode.absoluteBoundingBox;
  styles.width = `${width}px`;
  styles.height = `${height}px`;
}

/**
 * Convert Figma Color to CSS color string
 *
 * @param color - Figma RGBA color (0-1 range)
 * @param opacity - Optional opacity override
 * @returns CSS color string (hex or rgba)
 */
function colorToCSS(color: Color, opacity: number = 1): string {
  // If fully opaque, use hex notation
  if (opacity === 1 && color.a === 1) {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  // Otherwise use rgba
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a * opacity;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Convert Figma effect to CSS box-shadow
 *
 * @param effect - Figma drop shadow effect
 * @returns CSS box-shadow string or null
 */
function effectToBoxShadow(effect: Effect): string | null {
  if (effect.type !== 'DROP_SHADOW') {
    return null;
  }

  const offsetX = effect.offset?.x ?? 0;
  const offsetY = effect.offset?.y ?? 0;
  const blur = effect.radius ?? 0;
  const color = effect.color
    ? colorToCSS(effect.color)
    : 'rgba(0, 0, 0, 0.1)';

  return `${offsetX}px ${offsetY}px ${blur}px ${color}`;
}

/**
 * Normalize positioning and constraints
 *
 * Edge cases handled:
 * 1. Absolute positioning inside auto-layout
 * 2. Groups without explicit constraints → position: relative
 * 3. Overlapping elements → calculate z-index from stacking order
 *
 * @param figmaNode - Source Figma node
 * @param styles - Target CSS properties object
 */
function normalizePositioning(
  figmaNode: FigmaNode,
  styles: CSSProperties
): void {
  // Handle constraints for positioning
  if (figmaNode.constraints) {
    const { horizontal, vertical } = figmaNode.constraints;

    // If element has CENTER constraints, it may need absolute positioning
    if (horizontal === 'CENTER' || vertical === 'CENTER') {
      styles.position = 'absolute';

      if (figmaNode.absoluteBoundingBox) {
        if (horizontal === 'CENTER') {
          styles.left = '50%';
          styles.transform = styles.transform
            ? `${styles.transform} translateX(-50%)`
            : 'translateX(-50%)';
        }
        if (vertical === 'CENTER') {
          styles.top = '50%';
          styles.transform = styles.transform
            ? `${styles.transform} translateY(-50%)`
            : 'translateY(-50%)';
        }
      }
    }
  }

  // Groups default to position: relative (for containing absolutely positioned children)
  if (figmaNode.type === 'GROUP' && !styles.position) {
    styles.position = 'relative';
  }

  // Frames with children but no layout mode → position: relative
  if (
    figmaNode.type === 'FRAME' &&
    !figmaNode.layoutMode &&
    figmaNode.children &&
    figmaNode.children.length > 0 &&
    !styles.position
  ) {
    styles.position = 'relative';
  }
}

/**
 * Calculate z-index from node order
 *
 * Helper function for handling overlapping elements.
 * Figma stacking order: later children appear on top.
 *
 * @param nodeIndex - Index of node in parent's children array
 * @param _totalSiblings - Total number of siblings (unused, kept for API consistency)
 * @returns Calculated z-index
 *
 * @example
 * // Child at index 0 of 3 siblings
 * calculateZIndex(0, 3) // returns 1
 * // Child at index 2 of 3 siblings
 * calculateZIndex(2, 3) // returns 3
 */
export function calculateZIndex(
  nodeIndex: number,
  _totalSiblings: number
): number {
  // Base z-index of 1, increment by position
  return nodeIndex + 1;
}

/**
 * Transform node with z-index based on sibling order
 *
 * Used when transforming children to maintain stacking order.
 * Call this AFTER transformToAltNode to add z-index to children.
 *
 * @param altNodes - Array of AltNode siblings
 * @returns Same array with z-index applied to overlapping nodes
 *
 * @example
 * const children = figmaNode.children.map(transformToAltNode);
 * applyZIndexToChildren(children);
 */
export function applyZIndexToChildren(altNodes: AltNode[]): AltNode[] {
  // Only apply z-index if there are overlapping positioned elements
  const hasAbsolutePositioned = altNodes.some(
    (node) => node.styles.position === 'absolute'
  );

  if (!hasAbsolutePositioned) {
    return altNodes;
  }

  // Apply z-index to maintain Figma stacking order
  altNodes.forEach((node, index) => {
    if (node.styles.position === 'absolute' || hasAbsolutePositioned) {
      node.styles.zIndex = calculateZIndex(index, altNodes.length);
    }
  });

  return altNodes;
}

/**
 * Handle multi-style text runs
 *
 * Edge case: Figma text nodes can have multiple style runs (different colors, weights).
 * This function detects such cases and stores metadata for code generators.
 *
 * Note: Full implementation requires Figma's styleOverrideTable which is not always
 * available in basic node data. This is a placeholder for future enhancement.
 *
 * @param figmaNode - Source Figma TEXT node
 * @returns Metadata indicating if text has multiple styles
 */
export function detectMultiStyleText(figmaNode: FigmaNode): {
  hasMultipleStyles: boolean;
  characterCount: number;
} {
  if (figmaNode.type !== 'TEXT') {
    return { hasMultipleStyles: false, characterCount: 0 };
  }

  const characterCount = figmaNode.characters?.length ?? 0;

  // Placeholder: Actual implementation would check styleOverrideTable
  // For now, we mark this as a potential multi-style node for code generators
  // to handle specially (e.g., generate <span> elements)
  return {
    hasMultipleStyles: false, // Would check styleOverrideTable
    characterCount,
  };
}
