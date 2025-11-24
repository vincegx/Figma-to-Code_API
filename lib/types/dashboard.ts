/**
 * Dashboard Statistics Types
 *
 * Defines types for dashboard analytics and statistics display.
 */

import type { LibraryNode, NodeCollection } from './library';
import type { RuleSet, RuleStats } from './rules';
import type { GeneratedCode } from './code-generation';

// ============================================================================
// Overview Statistics
// ============================================================================

export interface DashboardStats {
  readonly overview: OverviewStats;
  readonly library: LibraryActivityStats;
  readonly codeGeneration: CodeGenerationStats;
  readonly rules: RulePerformanceStats;
  readonly activity: ActivityStats;
  readonly generatedAt: string;
}

// ============================================================================
// Overview Stats
// ============================================================================

export interface OverviewStats {
  readonly totalNodes: number;
  readonly totalCollections: number;
  readonly totalRules: number;
  readonly totalGeneratedFiles: number;
  readonly totalCodeLines: number;
  readonly storageUsed: number; // bytes
  readonly storageAvailable?: number; // bytes
}

// ============================================================================
// Library Activity Stats
// ============================================================================

export interface LibraryActivityStats {
  readonly nodesAddedToday: number;
  readonly nodesAddedThisWeek: number;
  readonly nodesAddedThisMonth: number;
  readonly mostViewedNodes: readonly {
    readonly node: LibraryNode;
    readonly views: number;
  }[];
  readonly mostExportedNodes: readonly {
    readonly node: LibraryNode;
    readonly exports: number;
  }[];
  readonly recentlyAdded: readonly LibraryNode[];
  readonly topCategories: readonly {
    readonly category: string;
    readonly count: number;
    readonly percentage: number;
  }[];
  readonly topTags: readonly {
    readonly tag: string;
    readonly count: number;
    readonly percentage: number;
  }[];
}

// ============================================================================
// Code Generation Stats
// ============================================================================

export interface CodeGenerationStats {
  readonly totalGenerations: number;
  readonly successfulGenerations: number;
  readonly failedGenerations: number;
  readonly successRate: number; // 0-100
  readonly averageConfidence: number; // 0-100
  readonly totalLinesGenerated: number;
  readonly totalFilesGenerated: number;
  readonly formatDistribution: readonly {
    readonly format: 'tsx' | 'html' | 'vue' | 'swift';
    readonly count: number;
    readonly percentage: number;
  }[];
  readonly recentGenerations: readonly {
    readonly code: GeneratedCode;
    readonly generatedAt: string;
  }[];
  readonly averageGenerationTime: number; // milliseconds
}

// ============================================================================
// Rule Performance Stats
// ============================================================================

export interface RulePerformanceStats {
  readonly totalRules: number;
  readonly enabledRules: number;
  readonly disabledRules: number;
  readonly totalMatches: number;
  readonly averageMatchesPerRule: number;
  readonly topPerformingRules: readonly {
    readonly ruleId: string;
    readonly ruleName: string;
    readonly matches: number;
    readonly averageConfidence: number;
  }[];
  readonly underperformingRules: readonly {
    readonly ruleId: string;
    readonly ruleName: string;
    readonly matches: number;
    readonly averageConfidence: number;
  }[];
  readonly ruleSetStats: readonly {
    readonly ruleSet: RuleSet;
    readonly stats: RuleStats[];
  }[];
}

// ============================================================================
// Activity Timeline Stats
// ============================================================================

export type ActivityType =
  | 'node_added'
  | 'node_deleted'
  | 'node_updated'
  | 'code_generated'
  | 'rule_created'
  | 'rule_updated'
  | 'collection_created';

export interface ActivityEvent {
  readonly id: string;
  readonly type: ActivityType;
  readonly timestamp: string;
  readonly description: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ActivityStats {
  readonly recentActivity: readonly ActivityEvent[];
  readonly activityByType: ReadonlyMap<ActivityType, number>;
  readonly activityByDay: readonly {
    readonly date: string;
    readonly count: number;
    readonly breakdown: ReadonlyMap<ActivityType, number>;
  }[];
  readonly peakActivityTime?: {
    readonly hour: number;
    readonly count: number;
  };
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface TimeSeriesDataPoint {
  readonly timestamp: string;
  readonly value: number;
  readonly label?: string;
}

export interface PieChartDataPoint {
  readonly label: string;
  readonly value: number;
  readonly percentage: number;
  readonly color?: string;
}

export interface BarChartDataPoint {
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

export interface ChartData {
  readonly timeSeries: readonly TimeSeriesDataPoint[];
  readonly pieCharts: Record<string, readonly PieChartDataPoint[]>;
  readonly barCharts: Record<string, readonly BarChartDataPoint[]>;
}

// ============================================================================
// Widget Types
// ============================================================================

export type WidgetType =
  | 'stat-card'
  | 'chart'
  | 'list'
  | 'table'
  | 'activity-feed'
  | 'quick-actions';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface DashboardWidget {
  readonly id: string;
  readonly type: WidgetType;
  readonly title: string;
  readonly size: WidgetSize;
  readonly position: {
    readonly row: number;
    readonly col: number;
  };
  readonly config: Record<string, unknown>;
  readonly refreshInterval?: number; // milliseconds
}

export interface DashboardLayout {
  readonly widgets: readonly DashboardWidget[];
  readonly columns: number;
  readonly gap: number; // pixels
}

// ============================================================================
// Quick Actions
// ============================================================================

export type QuickActionType =
  | 'import_nodes'
  | 'create_rule'
  | 'generate_code'
  | 'create_collection'
  | 'export_library';

export interface QuickAction {
  readonly type: QuickActionType;
  readonly label: string;
  readonly icon: string;
  readonly description?: string;
  readonly disabled?: boolean;
  readonly badge?: {
    readonly text: string;
    readonly variant: 'info' | 'warning' | 'success';
  };
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface DashboardNotification {
  readonly id: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly timestamp: string;
  readonly read: boolean;
  readonly action?: {
    readonly label: string;
    readonly href: string;
  };
}

// ============================================================================
// Dashboard State
// ============================================================================

export interface DashboardState {
  readonly stats: DashboardStats;
  readonly layout: DashboardLayout;
  readonly quickActions: readonly QuickAction[];
  readonly notifications: readonly DashboardNotification[];
  readonly lastRefreshed: string;
  readonly isLoading: boolean;
}

// ============================================================================
// Dashboard Configuration
// ============================================================================

export interface DashboardConfig {
  readonly autoRefresh: boolean;
  readonly refreshInterval: number; // milliseconds
  readonly defaultLayout: DashboardLayout;
  readonly enableNotifications: boolean;
  readonly maxNotifications: number;
  readonly theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  defaultLayout: {
    widgets: [],
    columns: 12,
    gap: 16,
  },
  enableNotifications: true,
  maxNotifications: 50,
  theme: 'system',
};
