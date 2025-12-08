/**
 * Zustand Store Type Definitions
 *
 * Defines the complete type system for all three Zustand stores:
 * - nodes-store: Library node management
 * - rules-store: Rule and rule set management
 * - ui-store: UI state and preferences
 */

import type { LibraryNode, LibraryIndex, NodeCollection, SearchOptions, SearchResult, ImportOptions, ImportResult, BulkUpdateOptions, BulkDeleteOptions, BulkOperationResult, LibraryConfig } from './library';
import type { MappingRule, RuleSet, RuleMatch, RuleConflict, RuleSetImport, RuleSetExport, RuleSetStats, ConflictStrategy } from './rules';
import type { GeneratedCode, GenerationResult, BatchGenerationOptions, BatchGenerationResult, ExportOptions, ExportResult, GeneratorConfig } from './code-generation';
import type { DashboardStats, DashboardLayout, DashboardNotification, DashboardConfig } from './dashboard';
import type { AltNode } from './altnode';

// ============================================================================
// Nodes Store Types
// ============================================================================

export interface NodesStoreState {
  // Core State
  readonly nodes: ReadonlyMap<string, LibraryNode>;
  readonly collections: ReadonlyMap<string, NodeCollection>;
  readonly index: LibraryIndex | null;
  readonly selectedNodeIds: readonly string[];
  readonly config: LibraryConfig;

  // Loading & Error State
  readonly isLoading: boolean;
  readonly error: string | null;

  // Import State
  readonly importProgress: {
    readonly isImporting: boolean;
    readonly total: number;
    readonly completed: number;
    readonly failed: number;
    readonly currentNode?: string;
  } | null;
}

export interface NodesStoreActions {
  // Node Management
  addNode: (node: LibraryNode) => void;
  addNodes: (nodes: readonly LibraryNode[]) => void;
  removeNode: (nodeId: string) => void;
  removeNodes: (nodeIds: readonly string[]) => void;
  updateNode: (nodeId: string, updates: Partial<LibraryNode>) => void;
  getNode: (nodeId: string) => LibraryNode | undefined;
  getAllNodes: () => readonly LibraryNode[];

  // Collection Management
  createCollection: (collection: Omit<NodeCollection, 'id' | 'createdAt' | 'updatedAt'>) => NodeCollection;
  updateCollection: (collectionId: string, updates: Partial<NodeCollection>) => void;
  deleteCollection: (collectionId: string) => void;
  addNodesToCollection: (collectionId: string, nodeIds: readonly string[]) => void;
  removeNodesFromCollection: (collectionId: string, nodeIds: readonly string[]) => void;

  // Search & Filter
  searchNodes: (options: SearchOptions) => SearchResult;
  filterNodesByCategory: (category: string) => readonly LibraryNode[];
  filterNodesByTags: (tags: readonly string[]) => readonly LibraryNode[];

  // Selection
  selectNode: (nodeId: string) => void;
  selectNodes: (nodeIds: readonly string[]) => void;
  deselectNode: (nodeId: string) => void;
  deselectAllNodes: () => void;
  toggleNodeSelection: (nodeId: string) => void;

  // Import/Export
  importFromFigma: (options: ImportOptions) => Promise<ImportResult>;
  exportNodes: (nodeIds: readonly string[], options: Partial<LibraryConfig>) => Promise<Blob>;

  // Bulk Operations
  bulkUpdate: (options: BulkUpdateOptions) => Promise<BulkOperationResult>;
  bulkDelete: (options: BulkDeleteOptions) => Promise<BulkOperationResult>;

  // Index Management
  rebuildIndex: () => void;
  getIndex: () => LibraryIndex | null;

  // Configuration
  updateConfig: (updates: Partial<LibraryConfig>) => void;

  // State Management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type NodesStore = NodesStoreState & NodesStoreActions;

// ============================================================================
// Rules Store Types
// ============================================================================

export interface RulesStoreState {
  // Core State
  readonly rules: ReadonlyMap<string, MappingRule>;
  readonly ruleSets: ReadonlyMap<string, RuleSet>;
  readonly activeRuleSetId: string | null;
  readonly selectedRuleIds: readonly string[];

  // Match & Generation State
  readonly matches: ReadonlyMap<string, readonly RuleMatch[]>; // nodeId -> matches
  readonly conflicts: readonly RuleConflict[];
  readonly generatedCode: ReadonlyMap<string, GeneratedCode>; // nodeId -> code

  // Configuration
  readonly config: GeneratorConfig;
  readonly defaultConflictStrategy: ConflictStrategy;

  // Statistics
  readonly stats: RuleSetStats | null;

  // Loading & Error State
  readonly isLoading: boolean;
  readonly error: string | null;

  // Generation State
  readonly generationProgress: {
    readonly isGenerating: boolean;
    readonly total: number;
    readonly completed: number;
    readonly failed: number;
    readonly currentNode?: string;
  } | null;
}

export interface RulesStoreActions {
  // Rule Management
  addRule: (rule: MappingRule) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<MappingRule>) => void;
  enableRule: (ruleId: string) => void;
  disableRule: (ruleId: string) => void;
  getRule: (ruleId: string) => MappingRule | undefined;
  getAllRules: () => readonly MappingRule[];

  // Rule Set Management
  createRuleSet: (ruleSet: Omit<RuleSet, 'id' | 'metadata'>) => RuleSet;
  updateRuleSet: (ruleSetId: string, updates: Partial<RuleSet>) => void;
  deleteRuleSet: (ruleSetId: string) => void;
  setActiveRuleSet: (ruleSetId: string | null) => void;
  getActiveRuleSet: () => RuleSet | null;

  // Import/Export
  importRuleSet: (options: RuleSetImport) => Promise<RuleSet>;
  exportRuleSet: (ruleSetId: string, options: RuleSetExport) => Promise<void>;

  // Rule Matching
  matchNode: (node: AltNode) => readonly RuleMatch[];
  matchNodes: (nodes: readonly AltNode[]) => ReadonlyMap<string, readonly RuleMatch[]>;
  resolveConflict: (nodeId: string, strategy: ConflictStrategy) => RuleMatch | null;
  clearMatches: () => void;

  // Code Generation
  generateCode: (nodeId: string) => Promise<GenerationResult>;
  generateCodeForNodes: (nodeIds: readonly string[]) => Promise<BatchGenerationResult>;
  batchGenerate: (options: BatchGenerationOptions) => Promise<BatchGenerationResult>;
  getGeneratedCode: (nodeId: string) => GeneratedCode | undefined;
  clearGeneratedCode: (nodeId: string) => void;
  clearAllGeneratedCode: () => void;

  // Export Generated Code
  exportCode: (nodeIds: readonly string[], options: ExportOptions) => Promise<ExportResult>;

  // Selection
  selectRule: (ruleId: string) => void;
  selectRules: (ruleIds: readonly string[]) => void;
  deselectRule: (ruleId: string) => void;
  deselectAllRules: () => void;

  // Statistics
  updateStats: () => void;
  getStats: () => RuleSetStats | null;

  // Configuration
  updateConfig: (updates: Partial<GeneratorConfig>) => void;
  setDefaultConflictStrategy: (strategy: ConflictStrategy) => void;

  // State Management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type RulesStore = RulesStoreState & RulesStoreActions;

// ============================================================================
// UI Store Types
// ============================================================================

export type AppPage = 'home' | 'library' | 'node' | 'rules' | 'settings';

export type Theme = 'light' | 'dark' | 'system';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant: ToastVariant;
  readonly duration?: number;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
}

export interface Modal {
  readonly id: string;
  readonly title: string;
  readonly content: React.ReactNode;
  readonly size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  readonly onClose?: () => void;
}

export interface UIStoreState {
  // Navigation
  readonly currentPage: AppPage;
  readonly navigationHistory: readonly AppPage[];

  // Theme
  readonly theme: Theme;
  readonly systemTheme: 'light' | 'dark';

  // Layout
  readonly sidebarCollapsed: boolean;
  readonly dashboardLayout: DashboardLayout;

  // Toasts
  readonly toasts: readonly Toast[];

  // Modals
  readonly modals: readonly Modal[];

  // Notifications
  readonly notifications: readonly DashboardNotification[];
  readonly unreadNotificationCount: number;

  // Dashboard
  readonly dashboardStats: DashboardStats | null;
  readonly dashboardConfig: DashboardConfig;

  // Global Loading States
  readonly globalLoading: boolean;
  readonly loadingMessage?: string;

  // Preferences
  readonly preferences: {
    readonly autoSave: boolean;
    readonly confirmBeforeDelete: boolean;
    readonly showTooltips: boolean;
    readonly compactMode: boolean;
    readonly animationsEnabled: boolean;
  };
}

export interface UIStoreActions {
  // Navigation
  navigateTo: (page: AppPage) => void;
  goBack: () => void;
  goForward: () => void;

  // Theme
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Layout
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  updateDashboardLayout: (layout: DashboardLayout) => void;

  // Toasts
  showToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (toastId: string) => void;
  dismissAllToasts: () => void;

  // Modals
  openModal: (modal: Omit<Modal, 'id'>) => string;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;

  // Notifications
  addNotification: (notification: Omit<DashboardNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;

  // Dashboard
  updateDashboardStats: (stats: DashboardStats) => void;
  updateDashboardConfig: (config: Partial<DashboardConfig>) => void;
  refreshDashboard: () => Promise<void>;

  // Global Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;

  // Preferences
  updatePreferences: (updates: Partial<UIStoreState['preferences']>) => void;

  // State Management
  reset: () => void;
}

export type UIStore = UIStoreState & UIStoreActions;

// ============================================================================
// Combined Store Type (for potential combined store usage)
// ============================================================================

export interface RootStore {
  nodes: NodesStore;
  rules: RulesStore;
  ui: UIStore;
}
