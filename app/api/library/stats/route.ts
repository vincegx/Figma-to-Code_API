import { NextResponse } from 'next/server';
import type { DashboardStats } from '@/lib/types/dashboard';

/**
 * GET /api/library/stats
 *
 * Returns dashboard statistics.
 * For MVP, returns placeholder stats with valid structure.
 * Full implementation with actual calculations will be added later.
 */
export async function GET() {
  try {
    // Placeholder stats with correct DashboardStats structure
    const stats: DashboardStats = {
      overview: {
        totalNodes: 0,
        totalCollections: 0,
        totalRules: 0,
        totalGeneratedFiles: 0,
        totalCodeLines: 0,
        storageUsed: 0,
      },
      library: {
        nodesAddedToday: 0,
        nodesAddedThisWeek: 0,
        nodesAddedThisMonth: 0,
        mostViewedNodes: [],
        mostExportedNodes: [],
        recentlyAdded: [],
        topCategories: [],
        topTags: [],
      },
      codeGeneration: {
        totalGenerations: 0,
        successfulGenerations: 0,
        failedGenerations: 0,
        successRate: 0,
        averageConfidence: 0,
        totalLinesGenerated: 0,
        totalFilesGenerated: 0,
        formatDistribution: [],
        recentGenerations: [],
        averageGenerationTime: 0,
      },
      rules: {
        totalRules: 0,
        enabledRules: 0,
        disabledRules: 0,
        totalMatches: 0,
        averageMatchesPerRule: 0,
        topPerformingRules: [],
        underperformingRules: [],
        ruleSetStats: [],
      },
      activity: {
        recentActivity: [],
        activityByType: new Map(),
        activityByDay: [],
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to generate stats:', error);
    return NextResponse.json(
      { error: 'Failed to load stats' },
      { status: 500 }
    );
  }
}
