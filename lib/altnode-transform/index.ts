/**
 * AltNode Transformation Engine
 *
 * Transforms Figma JSON to normalized AltNode representation with FigmaToCode production patterns.
 * Implements 23 improvements from FigmaToCode analysis (5 CRITICAL + 12 HIGH + 6 MEDIUM priority).
 *
 * CRITICAL Improvements (T034):
 * 1. Hidden node marking (visible: false preserved, shown dimmed in tree - T156)
 * 2. GROUP node inlining (skip wrapper, process children)
 * 3. Unique name generation (Button, Button_01, Button_02)
 * 4. originalNode reference preservation
 * 5. Cumulative rotation tracking
 *
 * HIGH Priority Improvements (T040):
 * - Rotation conversion (radians → degrees)
 * - Icon detection (isLikelyIcon)
 * - Empty container optimization
 * - Layout wrap support
 *
 * VERBATIM from altnode-transform.ts
 */

import type { FigmaNode } from '../types/figma';
import figmaConfig from '../figma-transform-config.json';
import { getVariableCssNameSync } from '../utils/variable-css';

// Re-export types
export type { SimpleAltNode, FillData } from './types';

// Re-export handlers for external use
export { handleGroupInlining, isLikelyIcon, applyHighPriorityImprovements } from './node-handlers';

// Import types for internal use
import type { SimpleAltNode } from './types';

// Import style extraction functions
import {
  extractUniversalFallbacks,
  normalizeAdditionalProperties,
  normalizeLayout,
  normalizeFills,
  normalizeStrokes,
  normalizeEffects,
  normalizeText,
} from './style-extraction';

// Import node handlers
import { handleGroupInlining, applyHighPriorityImprovements } from './node-handlers';

// Global name counter for unique name generation
const nameCounters: Map<string, number> = new Map();

/**
 * Reset name counters (useful for testing)
 */
export function resetNameCounters(): void {
  nameCounters.clear();
}

/**
 * Generate unique component name with suffix counters
 *
 * @param baseName - Original node name from Figma
 * @returns Unique sanitized name (e.g., "Button", "Button_01", "Button_02")
 */
export function generateUniqueName(baseName: string): string {
  // Sanitize name for component usage
  let sanitized = baseName.replace(/[^a-zA-Z0-9]/g, '');

  // Handle empty names
  if (!sanitized) {
    sanitized = 'Component';
  }

  // Handle numeric-leading names
  if (/^[0-9]/.test(sanitized)) {
    sanitized = 'Component' + sanitized;
  }

  const count = nameCounters.get(sanitized) || 0;
  nameCounters.set(sanitized, count + 1);

  return count === 0 ? sanitized : `${sanitized}_${count.toString().padStart(2, '0')}`;
}

/**
 * Map Figma node type to simplified type
 *
 * WP28 T209: Now uses externalized config instead of hardcoded typeMap
 *
 * @param figmaType - Figma node type
 * @returns Simplified type string
 */
function mapNodeType(figmaType: string): string {
  return figmaConfig.typeMapping[figmaType as keyof typeof figmaConfig.typeMapping] || 'div';
}

// WP31 T224: Module-level variable map for resolveVariableName
let currentVariablesMap: Record<string, unknown> = {};

/**
 * Transform Figma node to AltNode
 *
 * Main entry point for transformation engine. Implements FigmaToCode production patterns:
 * - Invisible node filtering
 * - GROUP node inlining
 * - Unique name generation
 * - Rotation tracking
 * - Property normalization
 *
 * @param figmaNode - Figma node from API
 * @param cumulativeRotation - Cumulative rotation from parent nodes (degrees)
 * @param parentLayoutMode - Parent's layoutMode for flex vs inline-flex logic (WP25)
 * @param parentBounds - Parent's absoluteBoundingBox for constraints positioning (WP31)
 * @param variables - WP31 T224: Figma variables map for CSS variable resolution
 * @returns Transformed AltNode or null if filtered out
 */
export function transformToAltNode(
  figmaNode: FigmaNode,
  cumulativeRotation: number = 0,
  parentLayoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE',
  parentBounds?: { x: number; y: number; width: number; height: number },
  variables?: Record<string, unknown>,
  parentLayoutSizing?: { horizontal?: string; vertical?: string }
): SimpleAltNode | null {
  // WP31 T224: Store variables in module scope for resolveVariableName
  if (variables) {
    currentVariablesMap = variables;
  }
  // NOTE: Hidden nodes (visible === false) are KEPT in tree with visible: false
  // This allows the UI to show hidden nodes with EyeOff indicator (T156)
  // The `visible` property is preserved at line 531

  // CRITICAL: GROUP node inlining
  if (figmaNode.type === 'GROUP' && figmaNode.children) {
    return handleGroupInlining(figmaNode, cumulativeRotation, parentLayoutMode, parentBounds, parentLayoutSizing);
  }

  // CRITICAL: Unique name generation
  const uniqueName = generateUniqueName(figmaNode.name);

  // Calculate this node's cumulative rotation (input + own rotation)
  const nodeRotation = (figmaNode as any).rotation || 0;
  const nodeCumulativeRotation = cumulativeRotation - (nodeRotation * 180 / Math.PI);

  // WP25 FIX: Flatten style properties into originalNode for rule matching
  // Rules check originalNode.fontWeight, but Figma stores it in node.style.fontWeight
  const flattenedNode = { ...figmaNode };
  if ((figmaNode as any).style) {
    Object.assign(flattenedNode, (figmaNode as any).style);
  }

  const altNode: SimpleAltNode = {
    id: figmaNode.id,
    name: figmaNode.name,
    uniqueName,
    type: mapNodeType(figmaNode.type), // HTML tag for rendering
    originalType: figmaNode.type, // T177: Preserve Figma type for TEXT detection
    styles: {},
    children: [],
    originalNode: flattenedNode, // CRITICAL: preserve complete Figma data with flattened style
    visible: figmaNode.visible ?? true,
    canBeFlattened: false,
    cumulativeRotation: nodeCumulativeRotation,
  };

  // Normalize properties
  normalizeLayout(figmaNode, altNode, parentLayoutMode, parentBounds, parentLayoutSizing);
  normalizeFills(figmaNode, altNode);
  normalizeStrokes(figmaNode, altNode);
  normalizeEffects(figmaNode, altNode);
  normalizeText(figmaNode, altNode);
  normalizeAdditionalProperties(figmaNode, altNode); // WP25: Extract ALL Figma properties

  // T228: Extract VECTOR SVG data
  if (figmaNode.type === 'VECTOR') {
    const vectorNode = figmaNode as any;

    if (vectorNode.fillGeometry || vectorNode.strokeGeometry) {
      altNode.svgData = {
        fillGeometry: vectorNode.fillGeometry,
        strokeGeometry: vectorNode.strokeGeometry,
        fills: vectorNode.fills,
        strokes: vectorNode.strokes,
        strokeWeight: vectorNode.strokeWeight,
        bounds: vectorNode.absoluteBoundingBox || { x: 0, y: 0, width: 100, height: 100 }
      };
    }
  }

  // WP38: Handle geometric shapes (ELLIPSE, POLYGON, STAR, REGULAR_POLYGON)
  // These shapes need clip-path or border-radius to clip content (especially images) correctly
  if (['ELLIPSE', 'POLYGON', 'STAR', 'REGULAR_POLYGON'].includes(figmaNode.type)) {
    const shapeNode = figmaNode as any;

    if (figmaNode.type === 'ELLIPSE') {
      // For ellipse: use border-radius: 50% (works for circles and ellipses)
      altNode.styles['border-radius'] = '50%';
      altNode.styles['overflow'] = 'hidden';
    } else if (shapeNode.fillGeometry?.[0]?.path) {
      // For polygons/stars: use clip-path with SVG path from Figma
      altNode.styles['clip-path'] = `path('${shapeNode.fillGeometry[0].path}')`;
    }
  }

  // WP28 T210: Extract universal fallbacks for ALL properties in config
  // This ensures every property has a CSS fallback, even if no rule matches
  // Rules will override these fallbacks with semantic classes (e.g., text-sm instead of text-[14px])
  extractUniversalFallbacks(figmaNode, altNode);

  // Apply HIGH priority improvements
  applyHighPriorityImprovements(figmaNode, altNode, cumulativeRotation);

  // Transform children recursively with updated cumulative rotation
  // WP25 FIX: Pass this node's layoutMode to children for flex vs inline-flex logic
  // WP31: Pass this node's bounds to children for constraints positioning
  // WP38: Pass this node's layoutSizing to children for FILL inside HUG detection
  if (figmaNode.children) {
    const currentLayoutMode = (figmaNode as any).layoutMode as 'HORIZONTAL' | 'VERTICAL' | 'NONE' | undefined;
    const currentBounds = figmaNode.absoluteBoundingBox;
    const currentLayoutSizing = {
      horizontal: (figmaNode as any).layoutSizingHorizontal,
      vertical: (figmaNode as any).layoutSizingVertical
    };
    altNode.children = figmaNode.children
      .map(child => transformToAltNode(child, nodeCumulativeRotation, currentLayoutMode, currentBounds, undefined, currentLayoutSizing))
      .filter((node): node is SimpleAltNode => node !== null);

    // WP38: Handle itemReverseZIndex (Canvas Stacking "First on Top")
    // When itemReverseZIndex: true, Figma wants first child on top, but CSS puts last on top
    // Apply z-index to children to match Figma's visual stacking
    if ((figmaNode as any).itemReverseZIndex === true && altNode.children.length > 1) {
      const childCount = altNode.children.length;
      altNode.children.forEach((child, index) => {
        child.styles['z-index'] = String(childCount - index);
      });
    }

    // Parent needs position:relative if any child has layoutPositioning ABSOLUTE
    // But don't overwrite absolute (absolute also acts as positioning context)
    const hasAbsoluteChild = figmaNode.children.some((child: any) => child.layoutPositioning === 'ABSOLUTE');
    if (hasAbsoluteChild && altNode.styles.position !== 'absolute') {
      altNode.styles.position = 'relative';
      // WP38: Non-absolute siblings need position:relative to stack above absolute elements
      // In CSS, absolute elements stack on top of static elements by default
      for (const child of altNode.children) {
        if (child.styles.position !== 'absolute') {
          child.styles.position = 'relative';
        }
      }
    }
  }

  // WP32: Image containers with children need position:relative for proper z-stacking
  // When a node has imageData AND children, the background image is rendered absolute
  // The container needs position:relative as positioning context
  // Children need position:relative to stack above the absolute background
  if (altNode.imageData && altNode.children && altNode.children.length > 0) {
    altNode.styles.position = 'relative';
    for (const child of altNode.children) {
      if (child.styles.position !== 'absolute') {
        child.styles.position = 'relative';
      }
    }
  }

  return altNode;
}

/**
 * WP31 T224: Helper function to resolve Figma variable names from variable IDs
 *
 * Resolution order:
 * 1. Check system-variables.json (extracted from node, may have user-updated names)
 * 2. Check Figma API variables (Enterprise only)
 * 3. Fallback to ID-based name
 *
 * @param variableId - Figma variable ID (e.g., "VariableID:abc/123:45")
 * @param figmaNode - Original Figma node with document context
 * @returns Variable name (e.g., "colors-main-01") or fallback based on ID
 */
export function resolveVariableName(variableId: string, figmaNode: FigmaNode): string | null {
  // WP31: First check system-variables.json (has user-updatable names)
  const cachedName = getVariableCssNameSync(variableId);
  if (cachedName) {
    return cachedName;
  }

  // WP31 T224: Check module-level variables map from Figma API (Enterprise only)
  if (currentVariablesMap && Object.keys(currentVariablesMap).length > 0) {
    // API response has nested structure: { variables: { id → { name, ... } } }
    const variablesObj = (currentVariablesMap as any).variables || currentVariablesMap;

    // Try direct lookup first
    const variable = variablesObj[variableId] as { name?: string } | undefined;
    if (variable?.name) {
      // Sanitize name for CSS custom property (replace / and spaces)
      return variable.name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase();
    }

    // Try matching by the numeric ID part (e.g., "125:11")
    const idMatch = variableId.match(/(\d+:\d+)$/);
    if (idMatch) {
      const numericId = idMatch[1];
      for (const [key, val] of Object.entries(variablesObj)) {
        if (key.includes(numericId)) {
          const v = val as { name?: string };
          if (v?.name) {
            return v.name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase();
          }
        }
      }
    }
  }

  // Try to access figmaNode.document.variables if available (legacy path)
  const doc = (figmaNode as any).document;
  if (doc?.variables) {
    const variable = doc.variables[variableId];
    if (variable?.name) {
      return variable.name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase();
    }
  }

  // Fallback: Extract a meaningful name from the variable ID
  // "VariableID:710641395bac9f5822c4c329c8e7d6bb6fc986f8/125:11" -> "var-125-11"
  const idMatch = variableId.match(/(\d+):(\d+)$/);
  if (idMatch) {
    return `var-${idMatch[1]}-${idMatch[2]}`;
  }

  // Last fallback: use a hash of the ID
  return `var-${Math.abs(variableId.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)).toString(16)}`;
}
