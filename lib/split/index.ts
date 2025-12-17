/**
 * Split Components Module
 *
 * Re-exports for the "Split into Components" feature.
 */

// FigmaNode-based (for nodes page)
export { detectComponents, countNodes } from './detect-components';
export { validateSelection, findNodeById } from './validate-selection';

// UnifiedElement-based (for merge page)
export { detectComponentsUnified, countNodesUnified } from './detect-components-unified';
export { validateSelectionUnified, findUnifiedNodeById } from './validate-selection-unified';
