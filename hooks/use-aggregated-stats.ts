/**
 * WP43: Hook for aggregated transform stats
 *
 * Aggregates TransformStats from all nodes for dashboard metrics cards.
 * Handles nodes without stats (legacy imports before WP43).
 */

import { useMemo } from 'react';
import { useNodesStore } from '@/lib/store';

export interface AggregatedStats {
  // Totals
  totalNodes: number;
  autoLayoutCount: number;
  imagesCount: number;
  iconsCount: number;
  gradientsCount: number;
  semanticCount: number;
  arbitraryCount: number;

  // Computed metrics
  /** Percentage of semantic classes (0-100) */
  semanticScore: number;
  /** Percentage of nodes with auto-layout (0-100) */
  responsivePercent: number;
  /** Total assets (images + icons + gradients) */
  totalAssets: number;

  // Coverage tracking (for legacy nodes)
  /** Number of nodes with transformStats */
  nodesWithStats: number;
  /** Number of nodes missing transformStats */
  nodesWithoutStats: number;
  /** True if all nodes have stats */
  hasCompleteData: boolean;

  // Asset breakdown for bar chart
  assetBreakdown: {
    images: number;
    icons: number;
    gradients: number;
  };
}

/**
 * Aggregate transform stats across all library nodes
 *
 * @returns Aggregated statistics for dashboard display
 */
export function useAggregatedStats(): AggregatedStats {
  const nodes = useNodesStore((s) => s.nodes);

  return useMemo(() => {
    const totals = {
      totalNodes: 0,
      autoLayoutCount: 0,
      imagesCount: 0,
      iconsCount: 0,
      gradientsCount: 0,
      semanticCount: 0,
      arbitraryCount: 0,
    };

    let nodesWithStats = 0;
    let nodesWithoutStats = 0;

    // Aggregate stats from all nodes
    nodes.forEach((node) => {
      if (node.transformStats) {
        nodesWithStats++;
        totals.totalNodes += node.transformStats.totalNodes;
        totals.autoLayoutCount += node.transformStats.autoLayoutCount;
        totals.imagesCount += node.transformStats.imagesCount;
        totals.iconsCount += node.transformStats.iconsCount;
        totals.gradientsCount += node.transformStats.gradientsCount;
        totals.semanticCount += node.transformStats.semanticCount;
        totals.arbitraryCount += node.transformStats.arbitraryCount;
      } else {
        nodesWithoutStats++;
      }
    });

    // Compute derived metrics
    const totalClasses = totals.semanticCount + totals.arbitraryCount;
    const semanticScore =
      totalClasses > 0 ? Math.round((totals.semanticCount / totalClasses) * 100) : 0;

    const responsivePercent =
      totals.totalNodes > 0
        ? Math.round((totals.autoLayoutCount / totals.totalNodes) * 100)
        : 0;

    const totalAssets = totals.imagesCount + totals.iconsCount + totals.gradientsCount;

    return {
      // Totals
      totalNodes: totals.totalNodes,
      autoLayoutCount: totals.autoLayoutCount,
      imagesCount: totals.imagesCount,
      iconsCount: totals.iconsCount,
      gradientsCount: totals.gradientsCount,
      semanticCount: totals.semanticCount,
      arbitraryCount: totals.arbitraryCount,

      // Computed
      semanticScore,
      responsivePercent,
      totalAssets,

      // Coverage
      nodesWithStats,
      nodesWithoutStats,
      hasCompleteData: nodesWithoutStats === 0,

      // Asset breakdown for bar chart
      assetBreakdown: {
        images: totals.imagesCount,
        icons: totals.iconsCount,
        gradients: totals.gradientsCount,
      },
    };
  }, [nodes]);
}

export default useAggregatedStats;
