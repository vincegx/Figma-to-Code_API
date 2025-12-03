/**
 * Hook: useHealthScore (WP44 Refactor)
 *
 * Calculates a composite health score (0-100) based on:
 * - Rules loaded: 0-30 points
 * - Nodes imported: 0-20 points
 * - Semantic conversion rate: 0-25 points
 * - Auto-layout (responsive) coverage: 0-25 points
 *
 * Returns breakdown for tooltip display.
 */

import { useMemo, useEffect, useState } from 'react';
import { useNodesStore } from '@/lib/store';

export interface HealthScoreDetails {
  /** Nodes imported in library */
  nodesCount: number;
  /** Nodes that have been viewed (code generated) */
  nodesViewed: number;
  /** Official rules count */
  officialRules: number;
  /** Community rules count */
  communityRules: number;
  /** Custom rules count */
  customRules: number;
  /** Total rules */
  totalRules: number;
}

/** WP44: Score breakdown for tooltip */
export interface ScoreBreakdown {
  rules: { points: number; max: 30 };
  nodes: { points: number; max: 20 };
  semantic: { points: number; max: 25; percent: number };
  responsive: { points: number; max: 25; percent: number };
}

export interface HealthScoreResult {
  /** Final health score (0-100) */
  score: number;
  /** Score level for UI display */
  level: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  /** Detailed breakdown */
  details: HealthScoreDetails;
  /** WP44: Score breakdown for tooltip */
  breakdown: ScoreBreakdown;
  /** Improvement suggestions */
  suggestions: string[];
}

interface RulesData {
  officialRules: unknown[];
  communityRules: unknown[];
  customRules: unknown[];
}

export function useHealthScore(): HealthScoreResult {
  const nodes = useNodesStore((s) => s.nodes);
  const [rulesData, setRulesData] = useState<RulesData>({
    officialRules: [],
    communityRules: [],
    customRules: [],
  });

  // Load rules from API (correct format)
  useEffect(() => {
    async function loadRules() {
      try {
        const response = await fetch('/api/rules');
        if (response.ok) {
          const data = await response.json();
          setRulesData({
            officialRules: data.officialRules || [],
            communityRules: data.communityRules || [],
            customRules: data.customRules || [],
          });
        }
      } catch (error) {
        console.error('Failed to load rules for health score:', error);
      }
    }
    loadRules();
  }, []);

  return useMemo(() => {
    const nodesCount = nodes.length;
    const nodesViewed = nodes.filter((n) => (n.usage?.viewCount || 0) > 0).length;

    const officialRules = rulesData.officialRules.length;
    const communityRules = rulesData.communityRules.length;
    const customRules = rulesData.customRules.length;
    const totalRules = officialRules + communityRules + customRules;

    // WP44: Aggregate transform stats from all nodes
    let totalNodesCount = 0;
    let autoLayoutCount = 0;
    let semanticCount = 0;
    let arbitraryCount = 0;

    nodes.forEach((node) => {
      if (node.transformStats) {
        totalNodesCount += node.transformStats.totalNodes;
        autoLayoutCount += node.transformStats.autoLayoutCount;
        semanticCount += node.transformStats.semanticCount;
        arbitraryCount += node.transformStats.arbitraryCount;
      }
    });

    // WP44: New scoring calculation
    // Rules loaded: 0-30 points
    const rulesScore = Math.min(30, totalRules > 0 ? 30 : 0);

    // Nodes imported: 0-20 points
    const nodesScore = Math.min(20, nodesCount > 0 ? 10 + Math.min(10, nodesCount) : 0);

    // Semantic conversion: 0-25 points (semanticCount / total %)
    const totalStyleCount = semanticCount + arbitraryCount;
    const semanticPercent = totalStyleCount > 0 ? semanticCount / totalStyleCount : 0;
    const semanticScore = Math.round(semanticPercent * 25);

    // Auto-layout coverage (responsive): 0-25 points (autoLayoutCount / totalNodes %)
    const responsivePercent = totalNodesCount > 0 ? autoLayoutCount / totalNodesCount : 0;
    const responsiveScore = Math.round(responsivePercent * 25);

    // Calculate final score
    let score = rulesScore + nodesScore + semanticScore + responsiveScore;

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine level
    let level: HealthScoreResult['level'];
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'needs-improvement';
    else level = 'poor';

    // Generate suggestions
    const suggestions: string[] = [];
    if (totalRules === 0) {
      suggestions.push('No rules loaded - check figma-data/rules/');
    }
    if (nodesCount === 0) {
      suggestions.push('Import Figma nodes to start');
    }
    if (nodesCount > 0 && nodesViewed === 0) {
      suggestions.push('View nodes to generate code');
    }
    if (semanticPercent < 0.5 && totalStyleCount > 0) {
      suggestions.push('Increase semantic class usage for better code quality');
    }
    if (responsivePercent < 0.5 && totalNodesCount > 0) {
      suggestions.push('Use more auto-layout in your Figma designs');
    }

    // WP44: Build breakdown for tooltip
    const breakdown: ScoreBreakdown = {
      rules: { points: rulesScore, max: 30 },
      nodes: { points: nodesScore, max: 20 },
      semantic: { points: semanticScore, max: 25, percent: Math.round(semanticPercent * 100) },
      responsive: { points: responsiveScore, max: 25, percent: Math.round(responsivePercent * 100) },
    };

    return {
      score,
      level,
      details: {
        nodesCount,
        nodesViewed,
        officialRules,
        communityRules,
        customRules,
        totalRules,
      },
      breakdown,
      suggestions,
    };
  }, [nodes, rulesData]);
}
