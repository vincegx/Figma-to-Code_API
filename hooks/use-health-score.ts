/**
 * Hook: useHealthScore
 *
 * Calculates a composite health score (0-100) based on:
 * - MultiFramework rules coverage (official + community + custom)
 * - Nodes imported
 * - Nodes with code generated (viewCount/exportCount)
 *
 * Reflects actual Figma→Code conversion setup quality.
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

export interface HealthScoreResult {
  /** Final health score (0-100) */
  score: number;
  /** Score level for UI display */
  level: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  /** Detailed breakdown */
  details: HealthScoreDetails;
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

    // Calculate score based on actual system usage
    let score = 0;

    // Rules base (0-50 points) - having rules is essential
    if (totalRules > 0) {
      // Base 30 for having any rules
      score += 30;
      // +10 for having official rules
      if (officialRules > 0) score += 10;
      // +10 for having community rules
      if (communityRules > 0) score += 10;
    }

    // Nodes imported (0-25 points)
    if (nodesCount > 0) {
      score += Math.min(25, 5 + nodesCount * 2);
    }

    // Nodes viewed/generated (0-25 points) - usage indicator
    if (nodesCount > 0 && nodesViewed > 0) {
      const viewRatio = nodesViewed / nodesCount;
      score += Math.round(viewRatio * 25);
    }

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
    if (customRules === 0 && totalRules > 0) {
      suggestions.push('Create custom rules for your design system');
    }

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
      suggestions,
    };
  }, [nodes, rulesData]);
}
