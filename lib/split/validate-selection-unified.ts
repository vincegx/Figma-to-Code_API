/**
 * Selection Validation for Split Components (UnifiedElement)
 *
 * Validates user selection and handles edge cases like
 * parent/child overlaps and large component warnings.
 *
 * This is the merge-compatible version of validate-selection.ts,
 * operating on UnifiedElement instead of FigmaNode.
 */

import type { UnifiedElement } from '../types/merge';
import type { ValidationResult } from '../types/split';
import {
  MAX_SELECTED_COMPONENTS,
  MIN_COMPONENT_NODES,
  LARGE_COMPONENT_THRESHOLD,
} from '../types/split';
import { countNodesUnified } from './detect-components-unified';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a node by ID in the UnifiedElement tree
 */
export function findUnifiedNodeById(root: UnifiedElement, targetId: string): UnifiedElement | null {
  if (root.id === targetId) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findUnifiedNodeById(child, targetId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Check if a node is an ancestor of another node
 */
function isAncestor(root: UnifiedElement, ancestorId: string, descendantId: string): boolean {
  const ancestor = findUnifiedNodeById(root, ancestorId);
  if (!ancestor) return false;

  function searchInSubtree(node: UnifiedElement): boolean {
    if (node.id === descendantId) return true;
    if (node.children) {
      for (const child of node.children) {
        if (searchInSubtree(child)) return true;
      }
    }
    return false;
  }

  // Search in ancestor's children (not the ancestor itself)
  if (ancestor.children) {
    for (const child of ancestor.children) {
      if (searchInSubtree(child)) return true;
    }
  }

  return false;
}

/**
 * Remove child IDs if their parent is also selected
 * (parent selection includes all children)
 */
function removeOverlaps(selectedIds: string[], root: UnifiedElement): string[] {
  const result: string[] = [];

  for (const id of selectedIds) {
    // Check if any other selected ID is an ancestor of this ID
    const hasSelectedAncestor = selectedIds.some(
      otherId => otherId !== id && isAncestor(root, otherId, id)
    );

    if (!hasSelectedAncestor) {
      result.push(id);
    }
  }

  return result;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate user selection for merge split export
 *
 * Checks:
 * 1. At least 1 selection required
 * 2. Maximum 20 selections allowed
 * 3. Removes children if parent selected (with warning)
 * 4. Warns for large components (>200 nodes)
 *
 * @param selectedIds - Array of selected node IDs
 * @param rootNode - The root UnifiedElement
 * @returns Validation result with errors, warnings, and cleaned selection
 */
export function validateSelectionUnified(
  selectedIds: string[],
  rootNode: UnifiedElement
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1: Minimum 1 selection
  if (selectedIds.length === 0) {
    errors.push('Select at least one component');
  }

  // Rule 2: Maximum 20 selections
  if (selectedIds.length > MAX_SELECTED_COMPONENTS) {
    errors.push(`Too many components selected (max ${MAX_SELECTED_COMPONENTS})`);
  }

  // Rule 3: Remove overlaps (children of selected parents)
  const cleanedSelection = removeOverlaps(selectedIds, rootNode);
  const removedCount = selectedIds.length - cleanedSelection.length;
  if (removedCount > 0) {
    warnings.push(`${removedCount} node(s) excluded (included in parent selection)`);
  }

  // Rule 4: Check for very large components and minimum nodes
  for (const id of cleanedSelection) {
    const node = findUnifiedNodeById(rootNode, id);
    if (node) {
      const nodeCount = countNodesUnified(node);

      // Validate minimum nodes
      if (nodeCount < MIN_COMPONENT_NODES) {
        warnings.push(`"${node.name}" has only ${nodeCount} nodes (minimum: ${MIN_COMPONENT_NODES})`);
      }

      // Warn for large components
      if (nodeCount > LARGE_COMPONENT_THRESHOLD) {
        warnings.push(`"${node.name}" has ${nodeCount} nodes - consider splitting further`);
      }
    }
  }

  // Rule 5: Check max after cleaning
  if (cleanedSelection.length > MAX_SELECTED_COMPONENTS) {
    errors.push(`Too many components after cleanup (${cleanedSelection.length} > ${MAX_SELECTED_COMPONENTS})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cleanedSelection,
  };
}
