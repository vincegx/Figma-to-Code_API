import { useMemo } from 'react';
import { useNodesStore } from '@/lib/store/nodes-store';
import { useRulesStore } from '@/lib/store/rules-store';

/**
 * Calculate match count for a specific rule across all nodes
 *
 * @param ruleId - Rule ID to calculate matches for
 * @returns Number of nodes matched by this rule
 *
 * NOTE: This is a placeholder implementation until WP04 (AltNode transformation)
 * and WP05 (Rule Engine) are integrated. Currently returns 0 for all rules.
 */
export function useRuleMatches(ruleId: string): number {
  const nodes = useNodesStore((state) => state.nodes);
  const rules = useRulesStore((state) => state.rules);

  const matchCount = useMemo(() => {
    const rule = rules.find((r) => r.metadata.id === ruleId);
    if (!rule) return 0;

    // TODO: Integrate with WP04 (AltNode transformation) and WP05 (Rule Engine)
    // For MVP: return 0 as placeholder
    //
    // Future implementation:
    // let count = 0;
    // for (const nodeMetadata of nodes) {
    //   // Load AltNode from cache
    //   const altNode = loadAltNodeFromCache(nodeMetadata.id);
    //   if (!altNode) continue;
    //
    //   // Evaluate rule against node
    //   const matches = evaluateRules(altNode, [rule]);
    //   if (matches.length > 0) {
    //     count++;
    //   }
    // }
    // return count;

    return 0; // Placeholder
  }, [ruleId, nodes, rules]);

  return matchCount;
}

/**
 * Calculate match counts for ALL rules
 *
 * @returns Map of ruleId → match count
 *
 * NOTE: This is a placeholder implementation until WP04 and WP05 are integrated.
 * Currently returns all zeros.
 */
export function useAllRuleMatches(): Map<string, number> {
  const nodes = useNodesStore((state) => state.nodes);
  const rules = useRulesStore((state) => state.rules);

  const matchCounts = useMemo(() => {
    const counts = new Map<string, number>();

    // Initialize all rules to 0
    for (const rule of rules) {
      counts.set(rule.metadata.id, 0);
    }

    // TODO: Integrate with WP04 and WP05
    // For MVP: return all zeros
    //
    // Future implementation:
    // for (const nodeMetadata of nodes) {
    //   const altNode = loadAltNodeFromCache(nodeMetadata.id);
    //   if (!altNode) continue;
    //
    //   // Evaluate all rules against this node
    //   const matches = evaluateRules(altNode, rules);
    //
    //   // Increment count for each matched rule
    //   for (const match of matches) {
    //     counts.set(match.ruleId, (counts.get(match.ruleId) || 0) + 1);
    //   }
    // }

    return counts;
  }, [nodes, rules]);

  return matchCounts;
}
