/**
 * Node Type Handlers
 *
 * Specialized handlers for different Figma node types (GROUP, VECTOR, etc.).
 * VERBATIM from altnode-transform.ts
 */

import type { FigmaNode } from '../types/figma';
import type { SimpleAltNode } from './types';
import figmaConfig from '../figma-transform-config.json';
import { transformToAltNode, generateUniqueName } from './index';

/**
 * Handle GROUP node inlining
 *
 * FigmaToCode CRITICAL improvement: GROUP nodes are inlined to avoid unnecessary wrapper divs.
 * If GROUP has 1 child, return child directly. If multiple children, create container but mark as GROUP.
 *
 * @param groupNode - GROUP node from Figma
 * @param cumulativeRotation - Cumulative rotation from parent nodes
 * @returns Transformed node or null if empty
 */
export function handleGroupInlining(
  groupNode: FigmaNode,
  cumulativeRotation: number,
  parentLayoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE',
  parentBounds?: { x: number; y: number; width: number; height: number },
  parentLayoutSizing?: { horizontal?: string; vertical?: string }
): SimpleAltNode | null {
  if (!groupNode.children || groupNode.children.length === 0) {
    return null; // Empty GROUP, skip entirely
  }

  // Calculate cumulative rotation for children
  const groupRotation = (groupNode as any).rotation || 0;
  const newCumulativeRotation = cumulativeRotation - (groupRotation * 180 / Math.PI);

  // WP25 FIX: Pass parent layoutMode through GROUP inlining
  // If GROUP has only 1 child, return child directly (inline the GROUP)
  if (groupNode.children.length === 1) {
    const singleChild = groupNode.children[0];
    const altChild = transformToAltNode(singleChild, newCumulativeRotation, parentLayoutMode, parentBounds, undefined, parentLayoutSizing);

    // Transfer GROUP's absolute positioning to the inlined child
    if (altChild && (groupNode as any).layoutPositioning === 'ABSOLUTE') {
      altChild.styles.position = 'absolute';
      const groupBounds = groupNode.absoluteBoundingBox;
      // WP38: For rotated GROUPs, use absoluteBoundingBox relative to parent
      // relativeTransform values are in rotated coordinates, not screen coordinates
      if ((groupNode as any).rotation && parentBounds && groupBounds) {
        altChild.styles.left = `${groupBounds.x - parentBounds.x}px`;
        altChild.styles.top = `${groupBounds.y - parentBounds.y}px`;
        altChild.styles.transform = `rotate(${(groupNode as any).rotation * 180 / Math.PI}deg)`;
        // Use size (pre-rotation) not absoluteBoundingBox (post-rotation expanded)
        const groupSize = (groupNode as any).size;
        if (groupSize) {
          altChild.styles.width = `${groupSize.x}px`;
          altChild.styles.height = `${groupSize.y}px`;
        }
      } else {
        const transform = (groupNode as any).relativeTransform;
        if (transform) {
          altChild.styles.left = `${transform[0][2]}px`;
          altChild.styles.top = `${transform[1][2]}px`;
        }
      }
    }

    // Transfer GROUP's opacity to the inlined child
    if (altChild && (groupNode as any).opacity !== undefined && (groupNode as any).opacity !== 1) {
      altChild.styles.opacity = String((groupNode as any).opacity);
    }

    // Re-apply relative if altChild has children with position:absolute (positioning context needed)
    if (altChild && altChild.children?.some((c: any) => c.styles?.position === 'absolute')) {
      if (altChild.styles.position !== 'absolute') {
        altChild.styles.position = 'relative';
      }
    }
    return altChild;
  }

  // Multiple children: create container but mark as GROUP
  // WP25 FIX: GROUP doesn't have layoutMode, so pass parent's layoutMode to children
  // WP31: GROUPs use CSS Grid to stack children (MCP pattern)
  // Pattern: inline-grid + grid-area:1/1 for all children + margin for positioning
  const groupBounds = groupNode.absoluteBoundingBox;

  // WP31: Calculate GROUP position relative to parent (for free-positioned GROUPs)
  const groupStyles: Record<string, string> = {
    display: 'inline-grid',
    'grid-template-columns': 'max-content',
    'grid-template-rows': 'max-content',
    'place-items': 'start',
  };

  // WP31: If parent has no layoutMode, GROUP needs absolute positioning
  // WP38: Also handle layoutPositioning ABSOLUTE with constraints (RIGHT/BOTTOM)
  const isAbsolutePositioned = (groupNode as any).layoutPositioning === 'ABSOLUTE';
  const constraints = (groupNode as any).constraints;

  if ((!parentLayoutMode || isAbsolutePositioned) && parentBounds && groupBounds) {
    groupStyles.position = 'absolute';
    groupStyles.width = `${groupBounds.width}px`;
    groupStyles.height = `${groupBounds.height}px`;

    // WP38: Handle RIGHT constraint
    if (constraints?.horizontal === 'RIGHT') {
      groupStyles.right = `${parentBounds.width - (groupBounds.x - parentBounds.x) - groupBounds.width}px`;
    } else {
      groupStyles.left = `${groupBounds.x - parentBounds.x}px`;
    }

    // WP38: Handle BOTTOM constraint
    if (constraints?.vertical === 'BOTTOM') {
      groupStyles.bottom = `${parentBounds.height - (groupBounds.y - parentBounds.y) - groupBounds.height}px`;
    } else {
      groupStyles.top = `${groupBounds.y - parentBounds.y}px`;
    }
  }

  // WP38 Fix #23: Detect Figma mask pattern (isMask: true on first child)
  // Pattern: First child with isMask + IMAGE fill acts as alpha mask for subsequent children
  // Solution: Store maskImageRef on children, generator applies CSS mask-image with resolved URL
  const maskChild = groupNode.children[0];
  const hasMaskPattern = (maskChild as any)?.isMask === true;
  let maskImageRef: string | null = null;

  if (hasMaskPattern) {
    // Extract imageRef from mask element's IMAGE fill
    const maskFills = (maskChild as any)?.fills || [];
    const imageFill = maskFills.find((f: any) => f.type === 'IMAGE' && f.imageRef);
    if (imageFill?.imageRef) {
      maskImageRef = imageFill.imageRef;
    }
  }

  const container: SimpleAltNode = {
    id: groupNode.id,
    name: groupNode.name,
    uniqueName: generateUniqueName(groupNode.name),
    type: 'group',
    originalType: groupNode.type, // T177: Preserve original type
    styles: groupStyles,
    children: groupNode.children
      .filter((child, index) => {
        // WP38 Fix #23: Skip the mask element itself (it's invisible in Figma output)
        if (hasMaskPattern && index === 0 && (child as any).isMask) {
          return false;
        }
        return true;
      })
      .map(child => {
        // WP38: Pass groupBounds as parentBounds so children calculate position relative to GROUP, not grandparent
        // This prevents double-offset (GROUP at 41,41 + child at 41,41 = child at 82,82)
        // GROUP doesn't have layoutSizing - pass parent's sizing through
        const altChild = transformToAltNode(child, newCumulativeRotation, undefined, groupBounds, undefined, parentLayoutSizing);

        // WP38 Fix #23: Store maskImageRef on masked elements (children after mask)
        // The generator will resolve the URL and apply CSS mask-image styles
        if (altChild && hasMaskPattern && maskImageRef) {
          altChild.maskImageRef = maskImageRef;
        }

        if (altChild && groupBounds && child.absoluteBoundingBox) {
          const childBounds = child.absoluteBoundingBox;
          const childConstraints = (child as any).constraints;

          // WP38: For children with RIGHT/BOTTOM constraints, use absolute positioning
          // This allows negative values and proper responsive behavior
          const isHorizontalRight = childConstraints?.horizontal === 'RIGHT';
          const isVerticalBottom = childConstraints?.vertical === 'BOTTOM';

          if (isHorizontalRight || isVerticalBottom) {
            // Use absolute positioning like MCP
            altChild.styles.position = 'absolute';

            if (isHorizontalRight) {
              const rightOffset = groupBounds.width - (childBounds.x - groupBounds.x) - childBounds.width;
              altChild.styles.right = `${rightOffset}px`;
            } else {
              altChild.styles.left = `${childBounds.x - groupBounds.x}px`;
            }

            if (isVerticalBottom) {
              const bottomOffset = groupBounds.height - (childBounds.y - groupBounds.y) - childBounds.height;
              altChild.styles.bottom = `${bottomOffset}px`;
            } else {
              altChild.styles.top = `${childBounds.y - groupBounds.y}px`;
            }
          } else {
            // WP31: Standard grid stacking with margins
            const marginLeft = Math.round(childBounds.x - groupBounds.x);
            const marginTop = Math.round(childBounds.y - groupBounds.y);

            altChild.styles['grid-area'] = '1 / 1';
            if (marginLeft > 0) altChild.styles['margin-left'] = `${marginLeft}px`;
            if (marginTop > 0) altChild.styles['margin-top'] = `${marginTop}px`;

            // Clear absolute position styles for grid children
            delete altChild.styles.position;
            delete altChild.styles.top;
            delete altChild.styles.left;
            delete altChild.styles.right;
            delete altChild.styles.bottom;

            // Re-apply relative if altChild has children with position:absolute (positioning context needed)
            const hasAbsoluteChild = altChild.children?.some((c: any) => c.styles?.position === 'absolute');
            if (hasAbsoluteChild) {
              altChild.styles.position = 'relative';
            }
          }
        }
        return altChild;
      })
      .filter((node): node is SimpleAltNode => node !== null),
    originalNode: groupNode,
    visible: true,
    canBeFlattened: false,
    cumulativeRotation: newCumulativeRotation,
  };

  return container;
}

/**
 * Detect if node is likely an icon
 *
 * FigmaToCode HIGH priority: Icon detection for special handling
 * WP28 T209: Now uses externalized config for thresholds and icon types
 *
 * @param figmaNode - Figma node to check
 * @returns true if likely an icon
 */
export function isLikelyIcon(figmaNode: FigmaNode): boolean {
  // Check type (icons are usually VECTOR, BOOLEAN_OPERATION, or small COMPONENT)
  if (figmaConfig.constants.iconNodeTypes.includes(figmaNode.type)) {
    return true;
  }

  // Check size (icons typically ≤64px) - threshold from config
  const width = figmaNode.absoluteBoundingBox?.width || 0;
  const height = figmaNode.absoluteBoundingBox?.height || 0;
  if (width <= figmaConfig.thresholds.iconMaxSize && height <= figmaConfig.thresholds.iconMaxSize) {
    // Check if it has export settings (common for icons)
    const exportSettings = (figmaNode as any).exportSettings;
    if (exportSettings && exportSettings.length > 0) {
      return true;
    }

    // Small COMPONENT might be an icon - threshold from config
    if (figmaNode.type === 'COMPONENT' &&
        width <= figmaConfig.thresholds.iconComponentMaxSize &&
        height <= figmaConfig.thresholds.iconComponentMaxSize) {
      return true;
    }
  }

  return false;
}

/**
 * Apply FigmaToCode HIGH priority improvements
 *
 * @param figmaNode - Original Figma node
 * @param altNode - AltNode being constructed
 * @param cumulativeRotation - Cumulative rotation in degrees
 */
export function applyHighPriorityImprovements(
  figmaNode: FigmaNode,
  altNode: SimpleAltNode,
  cumulativeRotation: number
): void {
  // 1. Rotation conversion (radians → degrees)
  // WP28 T209: Now uses config default for rotation check
  // WP32 FIX: Keep Figma's rotation sign - CSS rotate() uses same convention
  const rotation = (figmaNode as any).rotation;
  if (rotation && rotation !== figmaConfig.defaults.rotation) {
    const rotationDegrees = rotation * 180 / Math.PI;
    altNode.styles.transform = `rotate(${rotationDegrees}deg)`;
  }

  // 2. Icon detection
  altNode.isIcon = isLikelyIcon(figmaNode);

  // 3. Empty container optimization
  // If FRAME is empty and has no fills/strokes/effects, mark as empty
  // (Note: Disabled for now to avoid test failures - can be enabled per use case)
  // if (
  //   figmaNode.type === 'FRAME' &&
  //   (!figmaNode.children || figmaNode.children.length === 0) &&
  //   (!(figmaNode as any).fills || (figmaNode as any).fills.length === 0) &&
  //   (!(figmaNode as any).strokes || (figmaNode as any).strokes.length === 0)
  // ) {
  //   altNode.type = 'rectangle';
  // }

  // 4. Layout wrap support
  // NOTE: flexWrap (layoutWrap) handled by official-layoutwrap rules
}
