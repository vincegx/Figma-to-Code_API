---
work_package_id: "WP07"
subtasks:
  - "T058"
  - "T059"
  - "T060"
  - "T061"
  - "T062"
  - "T063"
  - "T064"
  - "T065"
  - "T066"
title: "Zustand State Management"
phase: "Phase 1 - Core Engine"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-11-24T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP07 – Zustand State Management

## Objectives & Success Criteria

Implement 3 Zustand stores (nodes-store, rules-store, ui-store) with actions for multi-node library management. Zustand provides lightweight, performant global state with DevTools support for debugging.

**Success Criteria**:
- Load library: nodes-store.loadLibrary() fetches library index, populates nodes array
- Import node: nodes-store.importNode() adds node to library, updates state
- Select node: nodes-store.selectNode() updates selectedNodeId, UI reflects change
- Create rule: rules-store.createRule() adds rule to library, match counts update
- Zustand DevTools shows state changes in real-time
- State persistence: UI preferences (theme, viewMode, filters) persist in localStorage
- Success Criteria SC-004: Navigate between pages, return to previous state without data loss

## Context & Constraints

**Architecture**: Zustand chosen over Context API for DevTools support and performance at scale (100+ nodes). Three separate stores maintain clear separation of concerns.

**Key Decisions from Planning**:
- Zustand (1KB) chosen over Redux (complex) for simplicity
- Three stores: nodes-store (library management), rules-store (rule CRUD), ui-store (theme, stats, loading)
- State persisted in localStorage for UI preferences only (theme, viewMode, filters)
- Rules and nodes loaded from filesystem via API routes (not localStorage)
- DashboardStats cached with 5-minute TTL to avoid recalculating on every render

**Constitutional Principles**:
- Principle V: Type Safety Throughout – All store interfaces fully typed (NodesState, RulesState, UIState)
- Principle VI: Simple Before Clever – Three focused stores, avoid cross-store dependencies
- Principle VII: Live Feedback – State updates trigger immediate UI re-renders (<100ms)

**Related Documents**:
- [plan.md](../plan.md) – Zustand architecture (Section: State Management Decision)
- [data-model.md](../data-model.md) – NodesState, RulesState, UIState interfaces
- [spec.md](../spec.md) – User Stories (Library management, Rule management, Dashboard)
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T058 – Create lib/store/nodes-store.ts with NodesState

**Purpose**: Manage multi-node library state (imported nodes, selection, view mode, search, filters, sort).

**Steps**:
1. Create `lib/store/nodes-store.ts`:
   ```typescript
   import { create } from 'zustand';
   import { devtools, persist } from 'zustand/middleware';
   import { NodeMetadata } from '../types/library';

   /**
    * NodesState: Multi-node library management
    *
    * State:
    * - nodes: Array of imported node metadata (from library-index.json)
    * - selectedNodeId: Currently selected node (for Viewer page)
    * - viewMode: 'grid' | 'list' (library page display mode)
    * - searchTerm: Search filter text
    * - filters: Active filters (type, coverage)
    * - sortCriteria: Sort field and order
    */
   export interface NodesState {
     // Data
     nodes: NodeMetadata[];
     selectedNodeId: string | null;

     // UI preferences (persisted in localStorage)
     viewMode: 'grid' | 'list';
     searchTerm: string;
     filters: {
       type: string | null; // FRAME, TEXT, etc.
       coverage: { min: number; max: number } | null;
     };
     sortCriteria: {
       field: 'name' | 'date' | 'type' | 'coverage';
       order: 'asc' | 'desc';
     };

     // Actions (see T059)
     loadLibrary: () => Promise<void>;
     importNode: (nodeMetadata: NodeMetadata) => void;
     deleteNode: (nodeId: string) => void;
     selectNode: (nodeId: string | null) => void;
     setViewMode: (mode: 'grid' | 'list') => void;
     setSearchTerm: (term: string) => void;
     setFilters: (filters: Partial<NodesState['filters']>) => void;
     setSortCriteria: (criteria: Partial<NodesState['sortCriteria']>) => void;
   }

   /**
    * Create nodes store with DevTools and persistence
    */
   export const useNodesStore = create<NodesState>()(
     devtools(
       persist(
         (set, get) => ({
           // Initial state
           nodes: [],
           selectedNodeId: null,
           viewMode: 'grid',
           searchTerm: '',
           filters: {
             type: null,
             coverage: null,
           },
           sortCriteria: {
             field: 'date',
             order: 'desc',
           },

           // Actions placeholder (implemented in T059)
           loadLibrary: async () => {
             // Will be implemented in T059
           },
           importNode: (nodeMetadata: NodeMetadata) => {
             set((state) => ({
               nodes: [...state.nodes, nodeMetadata],
             }));
           },
           deleteNode: (nodeId: string) => {
             set((state) => ({
               nodes: state.nodes.filter(node => node.id !== nodeId),
               selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
             }));
           },
           selectNode: (nodeId: string | null) => {
             set({ selectedNodeId: nodeId });
           },
           setViewMode: (mode: 'grid' | 'list') => {
             set({ viewMode: mode });
           },
           setSearchTerm: (term: string) => {
             set({ searchTerm: term });
           },
           setFilters: (filters) => {
             set((state) => ({
               filters: { ...state.filters, ...filters },
             }));
           },
           setSortCriteria: (criteria) => {
             set((state) => ({
               sortCriteria: { ...state.sortCriteria, ...criteria },
             }));
           },
         }),
         {
           name: 'nodes-store', // localStorage key
           partialize: (state) => ({
             // Persist UI preferences only, NOT nodes data (loaded from filesystem)
             viewMode: state.viewMode,
             searchTerm: state.searchTerm,
             filters: state.filters,
             sortCriteria: state.sortCriteria,
           }),
         }
       ),
       { name: 'NodesStore' } // DevTools name
     )
   );
   ```

2. Verify store compiles with TypeScript strict mode

**Files**: `lib/store/nodes-store.ts`

**Parallel?**: Yes (can develop concurrently with T060, T062)

**Notes**:
- nodes array loaded from `/api/library/index` (WP03), not hardcoded
- selectedNodeId used by Viewer page (WP10) to display selected node
- viewMode, searchTerm, filters, sortCriteria persisted in localStorage for UX consistency
- Zustand persist middleware: only UI preferences persisted, NOT nodes data
- DevTools middleware: enables time-travel debugging in browser extension

---

### Subtask T059 – Add nodes-store actions: loadLibrary(), importNode(), deleteNode(), selectNode(), etc.

**Purpose**: Implement all nodes-store actions for library management.

**Steps**:
1. Implement loadLibrary() action in `lib/store/nodes-store.ts`:
   ```typescript
   loadLibrary: async () => {
     try {
       // Fetch library index from API route (WP03)
       const response = await fetch('/api/library/index');
       if (!response.ok) {
         throw new Error('Failed to load library index');
       }

       const libraryIndex = await response.json();
       const nodes: NodeMetadata[] = libraryIndex.nodes || [];

       set({ nodes });
     } catch (error) {
       console.error('Failed to load library:', error);
       // TODO: Show toast error (will be implemented in WP08/WP09)
     }
   },
   ```

2. All other actions already implemented in T058 (importNode, deleteNode, selectNode, setters)

3. Test actions:
   ```typescript
   // In component or test file
   import { useNodesStore } from '@/lib/store/nodes-store';

   // Load library
   await useNodesStore.getState().loadLibrary();
   console.log(useNodesStore.getState().nodes); // Should show loaded nodes

   // Select node
   useNodesStore.getState().selectNode('node-123');
   console.log(useNodesStore.getState().selectedNodeId); // 'node-123'

   // Set view mode
   useNodesStore.getState().setViewMode('list');
   console.log(useNodesStore.getState().viewMode); // 'list'
   ```

**Files**: `lib/store/nodes-store.ts`

**Parallel?**: No (extends T058)

**Notes**:
- loadLibrary() called on Homepage/Library page mount
- importNode() called after successful Figma API import (WP08)
- deleteNode() removes from state + triggers API call to delete files (WP09)
- selectNode() updates Viewer page context (WP10)
- Setters (setViewMode, setSearchTerm, etc.) update UI preferences immediately

---

### Subtask T060 – Create lib/store/rules-store.ts with RulesState

**Purpose**: Manage global rule library state (rules array, selection, matches).

**Steps**:
1. Create `lib/store/rules-store.ts`:
   ```typescript
   import { create } from 'zustand';
   import { devtools } from 'zustand/middleware';
   import { MappingRule, RuleMatch } from '../types/rule';

   /**
    * RulesState: Global rule library management
    *
    * State:
    * - rules: Array of mapping rules (from mapping-rules.json)
    * - selectedRuleId: Currently selected rule (for Rule Manager main panel)
    * - ruleMatches: Cached match counts per rule (ruleId → match count)
    */
   export interface RulesState {
     // Data
     rules: MappingRule[];
     selectedRuleId: string | null;
     ruleMatches: Map<string, number>; // ruleId → match count across all nodes

     // Actions (see T061)
     loadRules: () => Promise<void>;
     saveRules: () => Promise<void>;
     createRule: (rule: MappingRule) => void;
     updateRule: (ruleId: string, updates: Partial<MappingRule>) => void;
     deleteRule: (ruleId: string) => void;
     duplicateRule: (ruleId: string) => void;
     importRules: (rulesJson: string) => Promise<void>;
     exportRules: () => string;
     evaluateRules: (nodeId: string) => RuleMatch[];
     selectRule: (ruleId: string | null) => void;
   }

   /**
    * Create rules store with DevTools
    */
   export const useRulesStore = create<RulesState>()(
     devtools(
       (set, get) => ({
         // Initial state
         rules: [],
         selectedRuleId: null,
         ruleMatches: new Map(),

         // Actions placeholder (implemented in T061)
         loadRules: async () => {
           // Will be implemented in T061
         },
         saveRules: async () => {
           // Will be implemented in T061
         },
         createRule: (rule: MappingRule) => {
           set((state) => ({
             rules: [...state.rules, rule],
           }));
         },
         updateRule: (ruleId: string, updates: Partial<MappingRule>) => {
           set((state) => ({
             rules: state.rules.map(rule =>
               rule.id === ruleId ? { ...rule, ...updates } : rule
             ),
           }));
         },
         deleteRule: (ruleId: string) => {
           set((state) => ({
             rules: state.rules.filter(rule => rule.id !== ruleId),
             selectedRuleId: state.selectedRuleId === ruleId ? null : state.selectedRuleId,
           }));
         },
         duplicateRule: (ruleId: string) => {
           const originalRule = get().rules.find(r => r.id === ruleId);
           if (!originalRule) return;

           const duplicatedRule: MappingRule = {
             ...originalRule,
             id: `${originalRule.id}-copy-${Date.now()}`,
             name: `${originalRule.name} (Copy)`,
             priority: originalRule.priority - 1, // Lower priority than original
           };

           set((state) => ({
             rules: [...state.rules, duplicatedRule],
           }));
         },
         importRules: async (rulesJson: string) => {
           // Will be implemented in T061
         },
         exportRules: () => {
           // Will be implemented in T061
           return '';
         },
         evaluateRules: (nodeId: string) => {
           // Will be implemented in T061 (calls WP05 rule engine)
           return [];
         },
         selectRule: (ruleId: string | null) => {
           set({ selectedRuleId: ruleId });
         },
       }),
       { name: 'RulesStore' } // DevTools name
     )
   );
   ```

2. Verify store compiles with TypeScript strict mode

**Files**: `lib/store/rules-store.ts`

**Parallel?**: Yes (can develop concurrently with T058, T062)

**Notes**:
- rules array loaded from `mapping-rules.json` via API route (WP03)
- selectedRuleId used by Rule Manager main panel (WP11)
- ruleMatches caches match counts for Rule Manager sidebar badges (WP11)
- No persistence middleware: rules loaded from filesystem, not localStorage
- evaluateRules() action calls WP05 rule engine for single node

---

### Subtask T061 – Add rules-store actions: loadRules(), saveRules(), createRule(), updateRule(), etc.

**Purpose**: Implement all rules-store actions for rule CRUD operations.

**Steps**:
1. Implement loadRules() and saveRules() in `lib/store/rules-store.ts`:
   ```typescript
   loadRules: async () => {
     try {
       // Fetch rules from API route (WP03)
       const response = await fetch('/api/rules');
       if (!response.ok) {
         throw new Error('Failed to load rules');
       }

       const rulesData = await response.json();
       const rules: MappingRule[] = rulesData.rules || [];

       set({ rules });
     } catch (error) {
       console.error('Failed to load rules:', error);
       // TODO: Show toast error
     }
   },

   saveRules: async () => {
     try {
       const { rules } = get();

       const rulesData = {
         version: '1.0.0',
         rules,
         metadata: {
           createdAt: new Date().toISOString(),
           lastModified: new Date().toISOString(),
         },
       };

       const response = await fetch('/api/rules', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(rulesData),
       });

       if (!response.ok) {
         throw new Error('Failed to save rules');
       }

       console.log('Rules saved successfully');
     } catch (error) {
       console.error('Failed to save rules:', error);
       // TODO: Show toast error
     }
   },
   ```

2. Implement importRules() and exportRules():
   ```typescript
   importRules: async (rulesJson: string) => {
     try {
       const rulesData = JSON.parse(rulesJson);

       // Validate schema (basic check)
       if (!rulesData.rules || !Array.isArray(rulesData.rules)) {
         throw new Error('Invalid rules JSON format');
       }

       // Merge with existing rules (conflict resolution: keep imported if duplicate ID)
       const existingRules = get().rules;
       const importedRules: MappingRule[] = rulesData.rules;
       const existingIds = new Set(existingRules.map(r => r.id));

       const newRules = importedRules.filter(r => !existingIds.has(r.id));
       const conflictingRules = importedRules.filter(r => existingIds.has(r.id));

       if (conflictingRules.length > 0) {
         console.warn(`${conflictingRules.length} rules have duplicate IDs and will be skipped`);
         // TODO: Show conflict resolution dialog (WP11)
       }

       set((state) => ({
         rules: [...state.rules, ...newRules],
       }));

       // Auto-save after import
       await get().saveRules();
     } catch (error) {
       console.error('Failed to import rules:', error);
       throw error;
     }
   },

   exportRules: () => {
     const { rules } = get();

     const rulesData = {
       version: '1.0.0',
       rules,
       metadata: {
         exportedAt: new Date().toISOString(),
       },
     };

     return JSON.stringify(rulesData, null, 2);
   },
   ```

3. Implement evaluateRules() (calls WP05 rule engine):
   ```typescript
   import { evaluateRules as runRuleEngine } from '../rule-engine';
   import { useNodesStore } from './nodes-store';

   evaluateRules: (nodeId: string) => {
     // Load node data from nodes-store
     const node = useNodesStore.getState().nodes.find(n => n.id === nodeId);
     if (!node) {
       console.warn(`Node ${nodeId} not found`);
       return [];
     }

     // Load AltNode from cache (TODO: implement in WP04 integration)
     // For now, assume AltNode available
     const altNode = null; // Placeholder

     if (!altNode) {
       console.warn(`AltNode for ${nodeId} not loaded`);
       return [];
     }

     // Run rule engine (WP05)
     const rules = get().rules;
     const matches = runRuleEngine(altNode, rules);

     return matches;
   },
   ```

4. Test actions:
   ```typescript
   // Load rules
   await useRulesStore.getState().loadRules();
   console.log(useRulesStore.getState().rules); // Should show loaded rules

   // Create rule
   const newRule: MappingRule = {
     id: 'rule-001',
     name: 'Button Style',
     priority: 10,
     selector: { type: 'FRAME', name: 'Button' },
     transformer: { backgroundColor: '#EF4444', padding: '16px' },
   };
   useRulesStore.getState().createRule(newRule);
   console.log(useRulesStore.getState().rules.length); // Incremented

   // Export rules
   const json = useRulesStore.getState().exportRules();
   console.log(json); // JSON string with rules
   ```

**Files**: `lib/store/rules-store.ts`

**Parallel?**: No (extends T060)

**Notes**:
- loadRules() called on Rule Manager page mount (WP11)
- saveRules() called after rule create/update/delete
- importRules() validates JSON schema, merges with existing rules
- exportRules() returns JSON string for download
- evaluateRules() integrates with WP05 rule engine for Applied Rules Inspector (WP10)

---

### Subtask T062 – Create lib/store/ui-store.ts with UIState

**Purpose**: Manage UI state (theme, loading flags, dashboard stats).

**Steps**:
1. Create `lib/store/ui-store.ts`:
   ```typescript
   import { create } from 'zustand';
   import { devtools, persist } from 'zustand/middleware';
   import { DashboardStats } from '../types/library';

   /**
    * UIState: Global UI preferences and transient state
    *
    * State:
    * - theme: 'light' | 'dark' | 'system' (persisted)
    * - isImporting: Flag for import loading state
    * - isLoadingRules: Flag for rule loading state
    * - stats: Cached dashboard stats (total nodes, rules, coverage)
    * - statsLastUpdated: Timestamp of last stats calculation (for TTL)
    */
   export interface UIState {
     // Preferences (persisted in localStorage)
     theme: 'light' | 'dark' | 'system';

     // Transient state (NOT persisted)
     isImporting: boolean;
     isLoadingRules: boolean;
     stats: DashboardStats | null;
     statsLastUpdated: number | null; // Unix timestamp

     // Actions (see T063)
     setTheme: (theme: 'light' | 'dark' | 'system') => void;
     setImporting: (isImporting: boolean) => void;
     loadStats: () => Promise<void>;
     invalidateStats: () => void;
   }

   /**
    * Create UI store with DevTools and persistence
    */
   export const useUIStore = create<UIState>()(
     devtools(
       persist(
         (set, get) => ({
           // Initial state
           theme: 'system',
           isImporting: false,
           isLoadingRules: false,
           stats: null,
           statsLastUpdated: null,

           // Actions placeholder (implemented in T063)
           setTheme: (theme: 'light' | 'dark' | 'system') => {
             set({ theme });
           },
           setImporting: (isImporting: boolean) => {
             set({ isImporting });
           },
           loadStats: async () => {
             // Will be implemented in T063
           },
           invalidateStats: () => {
             set({ stats: null, statsLastUpdated: null });
           },
         }),
         {
           name: 'ui-store', // localStorage key
           partialize: (state) => ({
             // Persist theme only, NOT transient state
             theme: state.theme,
           }),
         }
       ),
       { name: 'UIStore' } // DevTools name
     )
   );
   ```

2. Verify store compiles with TypeScript strict mode

**Files**: `lib/store/ui-store.ts`

**Parallel?**: Yes (can develop concurrently with T058, T060)

**Notes**:
- theme persisted in localStorage, applied to entire app via Context Provider (WP12)
- isImporting, isLoadingRules flags show loading spinners in UI
- stats cached with 5-minute TTL to avoid recalculating on every render
- statsLastUpdated timestamp enables TTL check: if (now - lastUpdated > 5min) → recalculate

---

### Subtask T063 – Add ui-store actions: setTheme(), setImporting(), loadStats(), invalidateStats()

**Purpose**: Implement all ui-store actions for UI state management.

**Steps**:
1. Implement loadStats() action in `lib/store/ui-store.ts`:
   ```typescript
   loadStats: async () => {
     const STATS_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
     const now = Date.now();
     const lastUpdated = get().statsLastUpdated;

     // Check TTL: if stats still valid, skip recalculation
     if (lastUpdated && (now - lastUpdated) < STATS_TTL) {
       console.log('Stats cache valid, skipping recalculation');
       return;
     }

     try {
       // Fetch stats from API route (WP03)
       const response = await fetch('/api/library/stats');
       if (!response.ok) {
         throw new Error('Failed to load stats');
       }

       const stats: DashboardStats = await response.json();

       set({
         stats,
         statsLastUpdated: now,
       });
     } catch (error) {
       console.error('Failed to load stats:', error);
       // TODO: Show toast error
     }
   },
   ```

2. All other actions already implemented in T062 (setTheme, setImporting, invalidateStats)

3. Test actions:
   ```typescript
   // Set theme
   useUIStore.getState().setTheme('dark');
   console.log(useUIStore.getState().theme); // 'dark'

   // Load stats (first time)
   await useUIStore.getState().loadStats();
   console.log(useUIStore.getState().stats); // DashboardStats object

   // Load stats again (within 5 min) → cache hit
   await useUIStore.getState().loadStats();
   // Should log "Stats cache valid, skipping recalculation"

   // Invalidate stats
   useUIStore.getState().invalidateStats();
   console.log(useUIStore.getState().stats); // null
   ```

**Files**: `lib/store/ui-store.ts`

**Parallel?**: No (extends T062)

**Notes**:
- loadStats() called on Homepage mount (WP08) and after node/rule changes
- invalidateStats() called after import, delete, rule create/update/delete
- setTheme() updates state, theme provider re-renders app with new theme (WP12)
- setImporting() shows loading spinner during Figma API import (WP08)

---

### Subtask T064 – Create lib/store/index.ts to combine stores and export hooks

**Purpose**: Central export point for all Zustand stores.

**Steps**:
1. Create `lib/store/index.ts`:
   ```typescript
   /**
    * Central export for all Zustand stores
    *
    * Usage:
    *   import { useNodesStore, useRulesStore, useUIStore } from '@/lib/store';
    */

   export { useNodesStore } from './nodes-store';
   export type { NodesState } from './nodes-store';

   export { useRulesStore } from './rules-store';
   export type { RulesState } from './rules-store';

   export { useUIStore } from './ui-store';
   export type { UIState } from './ui-store';

   /**
    * Helper hook: Get combined state from all stores
    * Useful for debugging or global state inspection
    */
   export function useAllStores() {
     const nodesStore = useNodesStore();
     const rulesStore = useRulesStore();
     const uiStore = useUIStore();

     return {
       nodes: nodesStore,
       rules: rulesStore,
       ui: uiStore,
     };
   }
   ```

2. Verify imports work in components:
   ```typescript
   // In component file
   import { useNodesStore, useRulesStore, useUIStore } from '@/lib/store';

   function MyComponent() {
     const nodes = useNodesStore(state => state.nodes);
     const rules = useRulesStore(state => state.rules);
     const theme = useUIStore(state => state.theme);

     return <div>...</div>;
   }
   ```

**Files**: `lib/store/index.ts`

**Parallel?**: No (requires T058-T063 complete)

**Notes**:
- index.ts provides clean import API for components
- useAllStores() helper useful for debugging
- TypeScript types exported for type-safe usage in components

---

### Subtask T065 – Setup Zustand DevTools integration for debugging

**Purpose**: Enable time-travel debugging and state inspection in browser DevTools.

**Steps**:
1. Install Zustand DevTools browser extension:
   - Chrome: https://chrome.google.com/webstore/detail/redux-devtools/
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/

2. Verify DevTools middleware already configured in T058, T060, T062:
   ```typescript
   import { devtools } from 'zustand/middleware';

   export const useNodesStore = create<NodesState>()(
     devtools(
       // ... store implementation
       { name: 'NodesStore' } // DevTools name
     )
   );
   ```

3. Test DevTools integration:
   - Open browser DevTools (F12)
   - Navigate to "Redux" tab (added by extension)
   - Trigger state changes:
     - Import node → see `NodesStore/importNode` action in DevTools
     - Create rule → see `RulesStore/createRule` action
     - Set theme → see `UIStore/setTheme` action
   - Use time-travel slider to revert state changes

4. Verify state inspection:
   - Select action in DevTools
   - View "State" tab to see current state
   - View "Diff" tab to see state changes
   - View "Action" tab to see action payload

**Files**: None (configuration already in stores)

**Parallel?**: No (requires T058-T063 complete)

**Notes**:
- DevTools middleware adds ~2KB to bundle size (acceptable tradeoff for debugging)
- DevTools only active in development mode (removed in production build)
- Name parameter helps identify which store triggered action (NodesStore, RulesStore, UIStore)
- Time-travel debugging enables replaying user interactions for bug reproduction

---

### Subtask T066 – Test state updates: import node → nodes array grows, create rule → rules array updates

**Purpose**: Validate end-to-end state management flow.

**Steps**:
1. Create integration test in `__tests__/integration/state-management.test.ts`:
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest';
   import { useNodesStore, useRulesStore, useUIStore } from '@/lib/store';
   import { NodeMetadata } from '@/lib/types/library';
   import { MappingRule } from '@/lib/types/rule';

   describe('State Management - Integration Tests', () => {
     beforeEach(() => {
       // Reset stores to initial state before each test
       useNodesStore.setState({
         nodes: [],
         selectedNodeId: null,
         viewMode: 'grid',
         searchTerm: '',
         filters: { type: null, coverage: null },
         sortCriteria: { field: 'date', order: 'desc' },
       });

       useRulesStore.setState({
         rules: [],
         selectedRuleId: null,
         ruleMatches: new Map(),
       });

       useUIStore.setState({
         theme: 'system',
         isImporting: false,
         isLoadingRules: false,
         stats: null,
         statsLastUpdated: null,
       });
     });

     it('should import node and update nodes array', () => {
       const nodeMetadata: NodeMetadata = {
         id: 'node-123',
         name: 'Button Component',
         type: 'COMPONENT',
         importDate: '2025-11-24T10:00:00Z',
         thumbnailPath: 'figma-data/node-123/screenshot.png',
         dataPath: 'figma-data/node-123/data.json',
         fileKey: 'ABC123',
         coverage: 0,
       };

       // Initial state: 0 nodes
       expect(useNodesStore.getState().nodes.length).toBe(0);

       // Import node
       useNodesStore.getState().importNode(nodeMetadata);

       // Verify state updated
       expect(useNodesStore.getState().nodes.length).toBe(1);
       expect(useNodesStore.getState().nodes[0].id).toBe('node-123');
       expect(useNodesStore.getState().nodes[0].name).toBe('Button Component');
     });

     it('should create rule and update rules array', () => {
       const rule: MappingRule = {
         id: 'rule-001',
         name: 'Button Style',
         priority: 10,
         selector: { type: 'FRAME', name: 'Button' },
         transformer: { backgroundColor: '#EF4444', padding: '16px' },
       };

       // Initial state: 0 rules
       expect(useRulesStore.getState().rules.length).toBe(0);

       // Create rule
       useRulesStore.getState().createRule(rule);

       // Verify state updated
       expect(useRulesStore.getState().rules.length).toBe(1);
       expect(useRulesStore.getState().rules[0].id).toBe('rule-001');
       expect(useRulesStore.getState().rules[0].name).toBe('Button Style');
     });

     it('should delete node and update state', () => {
       const nodeMetadata: NodeMetadata = {
         id: 'node-123',
         name: 'Button',
         type: 'COMPONENT',
         importDate: '2025-11-24T10:00:00Z',
         thumbnailPath: '',
         dataPath: '',
         fileKey: 'ABC123',
         coverage: 0,
       };

       // Import and select node
       useNodesStore.getState().importNode(nodeMetadata);
       useNodesStore.getState().selectNode('node-123');

       expect(useNodesStore.getState().nodes.length).toBe(1);
       expect(useNodesStore.getState().selectedNodeId).toBe('node-123');

       // Delete node
       useNodesStore.getState().deleteNode('node-123');

       // Verify state updated
       expect(useNodesStore.getState().nodes.length).toBe(0);
       expect(useNodesStore.getState().selectedNodeId).toBe(null); // Selection cleared
     });

     it('should persist UI preferences across store resets', () => {
       // Set view mode and search term
       useNodesStore.getState().setViewMode('list');
       useNodesStore.getState().setSearchTerm('Button');

       // Verify state updated
       expect(useNodesStore.getState().viewMode).toBe('list');
       expect(useNodesStore.getState().searchTerm).toBe('Button');

       // Simulate page refresh: re-create store
       // (Persistence middleware should restore preferences from localStorage)
       // NOTE: This test requires actual localStorage mock or integration with browser
     });

     it('should set theme and update UI state', () => {
       // Initial theme: system
       expect(useUIStore.getState().theme).toBe('system');

       // Set dark theme
       useUIStore.getState().setTheme('dark');

       // Verify state updated
       expect(useUIStore.getState().theme).toBe('dark');
     });
   });
   ```

2. Run integration tests:
   ```bash
   npm test state-management.test.ts
   ```

3. Manual testing:
   - Import node via Homepage → verify nodes-store.nodes updates
   - Create rule via Rule Manager → verify rules-store.rules updates
   - Change theme via Settings → verify ui-store.theme updates
   - Navigate between pages → verify state preserved (Success Criteria SC-004)

**Files**: `__tests__/integration/state-management.test.ts`

**Parallel?**: No (requires T058-T065 complete)

**Notes**:
- Integration tests verify state updates across actions
- Persistence testing requires localStorage mock (or real browser environment)
- Manual testing validates UI interactions trigger correct state changes
- Success Criteria SC-004: Navigate between pages, return to previous state without data loss

## Definition of Done Checklist

- [ ] `lib/store/nodes-store.ts` created with NodesState and actions
- [ ] `lib/store/rules-store.ts` created with RulesState and actions
- [ ] `lib/store/ui-store.ts` created with UIState and actions
- [ ] `lib/store/index.ts` created with combined exports
- [ ] Zustand DevTools configured and tested (time-travel debugging works)
- [ ] UI preferences persisted in localStorage (theme, viewMode, filters)
- [ ] Integration tests written and passing (import node, create rule, delete node)
- [ ] State updates trigger UI re-renders (<100ms latency)
- [ ] All stores compile with TypeScript strict mode (zero errors)
- [ ] Success Criteria SC-004 verified: Navigate between pages, state preserved

## Review Guidance

**Key Acceptance Checkpoints**:
1. Three stores created: nodes-store (library), rules-store (rules), ui-store (theme/stats)
2. All actions implemented: loadLibrary, importNode, deleteNode, selectNode, loadRules, createRule, etc.
3. DevTools middleware configured: actions visible in Redux DevTools extension
4. Persistence middleware configured: UI preferences restore from localStorage
5. State updates trigger immediate UI re-renders (test with React DevTools Profiler)
6. No cross-store dependencies (nodes-store does NOT import rules-store, etc.)
7. Integration tests pass: state updates verified

**Reviewers should verify**:
- No `any` types in store modules (TypeScript strict mode)
- Store interfaces match data-model.md types (NodesState, RulesState, UIState)
- Actions pure (no side effects beyond state updates + API calls)
- Persistence partialize correct: only UI preferences persisted, NOT data (nodes, rules)
- DevTools names descriptive (NodesStore, RulesStore, UIStore)
- TTL logic correct: stats cached for 5 minutes, then recalculated
- State reset on deleteNode: selectedNodeId cleared if deleted node was selected

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
