import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MappingRule, RuleMatch } from '../types/rules';
// TODO: Re-enable when WP04 integration is complete
// import { evaluateRules as runRuleEngine } from '../rule-engine';
import { useNodesStore } from './nodes-store';

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

  // Actions
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

      // Actions
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

      createRule: (rule: MappingRule) => {
        set((state) => ({
          rules: [...state.rules, rule],
        }));
      },

      updateRule: (ruleId: string, updates: Partial<MappingRule>) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.metadata.id === ruleId ? { ...rule, ...updates } : rule
          ),
        }));
      },

      deleteRule: (ruleId: string) => {
        set((state) => ({
          rules: state.rules.filter((rule) => rule.metadata.id !== ruleId),
          selectedRuleId:
            state.selectedRuleId === ruleId ? null : state.selectedRuleId,
        }));
      },

      duplicateRule: (ruleId: string) => {
        const originalRule = get().rules.find((r) => r.metadata.id === ruleId);
        if (!originalRule) return;

        const duplicatedRule: MappingRule = {
          ...originalRule,
          metadata: {
            ...originalRule.metadata,
            id: `${originalRule.metadata.id}-copy-${Date.now()}`,
            name: `${originalRule.metadata.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        set((state) => ({
          rules: [...state.rules, duplicatedRule],
        }));
      },

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
          const existingIds = new Set(existingRules.map((r) => r.metadata.id));

          const newRules = importedRules.filter((r) => !existingIds.has(r.metadata.id));
          const conflictingRules = importedRules.filter((r) =>
            existingIds.has(r.metadata.id)
          );

          if (conflictingRules.length > 0) {
            console.warn(
              `${conflictingRules.length} rules have duplicate IDs and will be skipped`
            );
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

      evaluateRules: (nodeId: string): RuleMatch[] => {
        // Load node data from nodes-store
        const node = useNodesStore.getState().nodes.find((n) => n.id === nodeId);
        if (!node) {
          console.warn(`Node ${nodeId} not found`);
          return [];
        }

        // TODO: Load AltNode from cache and call rule engine when WP04 integration is complete
        // For now, return empty array as placeholder
        console.warn('evaluateRules: Rule engine integration pending (WP04)');
        return [];

        // Future implementation:
        // const altNode = loadAltNodeFromCache(nodeId);
        // if (!altNode) {
        //   console.warn(`AltNode for ${nodeId} not loaded`);
        //   return [];
        // }
        // const rules = get().rules;
        // const matches = runRuleEngine(altNode, rules);
        // return matches;
      },

      selectRule: (ruleId: string | null) => {
        set({ selectedRuleId: ruleId });
      },
    }),
    { name: 'RulesStore' } // DevTools name
  )
);
