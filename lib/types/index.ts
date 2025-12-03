/**
 * Centralized Type Exports
 *
 * Single entry point for all type definitions in the application.
 * Import from this file instead of individual type modules.
 */

// ============================================================================
// Figma API Types
// ============================================================================

export type {
  // Node Types
  FigmaNode,
  FigmaNodeType,
  FrameNode,
  GroupNode,
  TextNode,
  RectangleNode,
  EllipseNode,
  VectorNode,
  ComponentNode,
  InstanceNode,

  // Paint Types
  Paint,
  PaintType,
  SolidPaint,
  GradientPaint,
  ImagePaint,
  GradientStop,

  // Effect Types
  Effect,
  EffectType,

  // Style Types
  TypeStyle,

  // Layout Types
  LayoutMode,
  LayoutAlign,
  LayoutGrid,

  // Base Types
  Color,
  Rectangle,
  Constraints,
  ConstraintType,

  // API Response Types
  FigmaFileResponse,
  FigmaNodeResponse,
} from './figma';

// ============================================================================
// AltNode Types
// ============================================================================

export type {
  // Core AltNode Types
  AltNode,
  AltFrameNode,
  AltGroupNode,
  AltTextNode,
  AltRectangleNode,
  AltEllipseNode,
  AltVectorNode,
  AltComponentNode,
  AltInstanceNode,

  // Enhanced Types
  AltRectangle,
  AltLayoutProperties,
  AltCornerRadius,
  AltStroke,
  AltFill,
  AltTextStyle,

  // Tree Structure
  AltSceneNode,

  // Transformation
  TransformOptions,
  SizingMode,

  // Utility Types
  AltNodeWithChildren,
  AltLeafNode,
  AltContainerNode,
} from './altnode';

export { DEFAULT_TRANSFORM_OPTIONS } from './altnode';

// ============================================================================
// Rule Types
// ============================================================================

export type {
  // Condition Types
  Condition,
  RuleCondition,
  CompositeCondition,
  ConditionOperator,

  // Rule Types
  MappingRule,
  RuleMetadata,
  RulePriority,
  ConflictStrategy,

  // Match Types
  RuleMatch,
  RuleConflict,
  EvaluationContext,

  // Template Types
  CodeTemplate,
  TemplateVariable,

  // Rule Set Types
  RuleSet,
  RuleSetImport,
  RuleSetExport,

  // Pattern Types
  BuiltInPattern,
  ButtonPattern,
  CardPattern,
  InputPattern,

  // Statistics
  RuleStats,
  RuleSetStats,
} from './rules';

// ============================================================================
// Code Generation Types
// ============================================================================

export type {
  // Format Types
  CodeFormat,
  IndentStyle,
  FormatOptions,

  // Generation Context
  GenerationContext,

  // Code Structure
  CodeImport,
  CodeDependency,
  GeneratedCode,

  // Results
  GenerationResult,
  GenerationSuccess,
  GenerationFailure,

  // Errors & Warnings
  GenerationError,
  GenerationErrorCode,
  GenerationWarning,
  GenerationWarningCode,

  // Batch Generation
  BatchGenerationOptions,
  BatchGenerationResult,

  // Export Types
  ExportStrategy,
  ExportOptions,
  ExportedFile,
  ExportResult,

  // Preview Types
  CodePreview,
  LivePreviewOptions,

  // Configuration
  GeneratorConfig,
} from './code-generation';

export { DEFAULT_FORMAT_OPTIONS, DEFAULT_GENERATOR_CONFIG } from './code-generation';

// ============================================================================
// Library Types
// ============================================================================

export type {
  // Library Entry
  LibraryNode,
  LibraryNodeWithCode,

  // Index Types
  LibraryIndex,
  LibraryStats,

  // Search & Filter
  SearchField,
  SearchQuery,
  SortField,
  SortDirection,
  FilterOptions,
  SearchOptions,
  SearchResult,

  // Import Types
  FigmaImportSource,
  ImportOptions,
  ImportProgress,
  ImportResult,

  // Export Types
  LibraryExportOptions,
  LibraryExportResult,

  // Collection Types
  NodeCollection,
  CollectionStats,

  // Bulk Operations
  BulkUpdateOptions,
  BulkDeleteOptions,
  BulkOperationResult,

  // Storage Types
  StorageBackend,
  StorageConfig,
  StorageStats,

  // Configuration
  LibraryConfig,
} from './library';

export { DEFAULT_LIBRARY_CONFIG } from './library';

// ============================================================================
// Dashboard Types
// ============================================================================

export type {
  // Core Dashboard
  DashboardStats,
  OverviewStats,

  // Activity Stats
  LibraryActivityStats,
  CodeGenerationStats,
  RulePerformanceStats,
  ActivityStats,
  ActivityEvent,
  ActivityType,

  // Chart Data
  ChartData,
  TimeSeriesDataPoint,
  PieChartDataPoint,
  BarChartDataPoint,

  // Widget Types
  WidgetType,
  WidgetSize,
  DashboardWidget,
  DashboardLayout,

  // Quick Actions
  QuickAction,
  QuickActionType,

  // Notifications
  DashboardNotification,
  NotificationType,

  // Dashboard State
  DashboardState,
  DashboardConfig,
} from './dashboard';

export { DEFAULT_DASHBOARD_CONFIG } from './dashboard';

// ============================================================================
// Stats History Types (WP44)
// ============================================================================

export type {
  DailyStats,
  StatsHistory,
} from './stats-history';

export { EMPTY_DAILY_STATS, DEFAULT_STATS_HISTORY } from './stats-history';

// ============================================================================
// Versioning Types (WP40)
// ============================================================================

export type {
  // Version Entry
  VersionEntry,
  VersionsFile,

  // Diff Types
  PropertyChange,
  NodeDiff,
  DiffSummary,

  // Refetch Types
  RefetchStep,
  RefetchProgress,
  RefetchResult,

  // API Response Types
  VersionsResponse,
  VersionDataResponse,
} from './versioning';

export {
  TRACKED_PROPERTIES,
  IGNORED_PROPERTIES,
  MAX_HISTORY_VERSIONS,
} from './versioning';

// ============================================================================
// Store Types
// ============================================================================

export type {
  // Nodes Store
  NodesStore,
  NodesStoreState,
  NodesStoreActions,

  // Rules Store
  RulesStore,
  RulesStoreState,
  RulesStoreActions,

  // UI Store
  UIStore,
  UIStoreState,
  UIStoreActions,
  AppPage,
  Theme,
  Toast,
  ToastVariant,
  Modal,

  // Root Store
  RootStore,
} from './stores';

// ============================================================================
// Type Guards
// ============================================================================

export {
  // Figma Node Guards
  isFigmaNode,
  isFrameNode,
  isGroupNode,
  isTextNode,
  isRectangleNode,
  isEllipseNode,
  isVectorNode,
  isComponentNode,
  isInstanceNode,
  hasChildren,

  // Paint Guards
  isPaint,
  isSolidPaint,
  isGradientPaint,
  isImagePaint,

  // AltNode Guards
  isAltNode,
  isAltFrameNode,
  isAltGroupNode,
  isAltTextNode,
  isAltRectangleNode,
  isAltEllipseNode,
  isAltVectorNode,
  isAltComponentNode,
  isAltInstanceNode,
  isAltNodeWithChildren,
  isAltLeafNode,

  // Rule Guards
  isRuleCondition,
  isCompositeCondition,
  isMappingRule,
  isRuleMatch,

  // Generation Guards
  isGenerationResult,
  isGenerationSuccess,
  isGenerationFailure,

  // Library Guards
  isLibraryNode,
  isLibraryNodeWithCode,

  // Validation Guards
  isValidNodeType,
  isValidColor,
  isValidRectangle,
  isValidEffect,

  // Array Guards
  isFigmaNodeArray,
  isAltNodeArray,
  isPaintArray,
  isEffectArray,
  isRuleMatchArray,

  // Assertions
  assertFigmaNode,
  assertAltNode,
  assertMappingRule,
  assertLibraryNode,

  // Validation Utilities
  validate,
} from './guards';

export type { ValidationResult } from './guards';

// ============================================================================
// Utility Type Helpers
// ============================================================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all readonly properties in T mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Make all readonly properties in T mutable recursively
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

/**
 * Extract keys from T that have values assignable to U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Require at least one of the specified keys
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Require exactly one of the specified keys
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, never>>;
  }[Keys];

/**
 * Extract promise resolve type
 */
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
