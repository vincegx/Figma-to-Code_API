/**
 * Central export for all Zustand stores
 *
 * Usage:
 *   import { useNodesStore, useRulesStore, useUIStore } from '@/lib/store';
 */

import { useNodesStore as nodesStore } from './nodes-store';
import { useRulesStore as rulesStore } from './rules-store';
import { useUIStore as uiStore } from './ui-store';
import { useQuotaStore as quotaStore } from './quota-store';

export { nodesStore as useNodesStore };
export type { NodesState } from './nodes-store';

export { rulesStore as useRulesStore };
export type { RulesState } from './rules-store';

export { uiStore as useUIStore };
export type { UIState } from './ui-store';

export { quotaStore as useQuotaStore };
export type { QuotaState } from './quota-store';

/**
 * Helper function: Get combined state from all stores
 * Useful for debugging or global state inspection
 * Note: This doesn't use hooks, it accesses the store state directly
 */
export function getAllStoresState() {
  return {
    nodes: nodesStore.getState(),
    rules: rulesStore.getState(),
    ui: uiStore.getState(),
    quota: quotaStore.getState(),
  };
}
