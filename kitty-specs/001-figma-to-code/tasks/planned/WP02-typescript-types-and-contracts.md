---
work_package_id: "WP02"
subtasks:
  - "T012"
  - "T013"
  - "T014"
  - "T015"
  - "T016"
  - "T017"
  - "T018"
  - "T019"
  - "T020"
  - "T021"
title: "TypeScript Types & Contracts"
phase: "Phase 0 - Foundation"
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

# Work Package Prompt: WP02 – TypeScript Types & Contracts

## Objectives & Success Criteria

Define all TypeScript types matching data-model.md (8 entities, 3 Zustand stores) and integrate FigmaToCode improvements from research.md Decision 7. Establish complete type contracts for all modules including enhanced Figma properties and AltNode metadata for production-quality transformation.

**Success Criteria**:
- All type files compile with zero errors in TypeScript strict mode
- Can import types in test file and use with proper autocomplete
- Type guards validate runtime data correctly
- FigmaToCode enhanced properties (23 recommendations) integrated
- `npm run type-check` succeeds with zero errors

## Context & Constraints

**Architecture**: Multi-node library manager with 8 core entities (FigmaNode, AltNode, MappingRule, RuleMatch, GeneratedCode, NodeLibrary, LibraryIndex, DashboardStats)

**Key Decisions from Planning**:
- TypeScript strict mode non-negotiable (Constitution Principle V)
- FigmaToCode enhancements: 5 CRITICAL + 12 HIGH priority properties (from research.md Decision 7)
- Discriminated unions for enums (type safety over string literals)
- Type guards use `is` keyword for TypeScript narrowing
- All public APIs fully typed (no `any` types)

**Constitutional Principles**:
- Principle V: Type Safety Throughout – TypeScript strict mode, zero `any` types
- Principle X: Production Patterns First – Adopt FigmaToCode type enhancements before inventing

**Related Documents**:
- [data-model.md](../data-model.md) – Complete entity definitions
- [research.md](../research.md) – FigmaToCode analysis (Decision 7: 23 recommendations)
- [plan.md](../plan.md) – Technical architecture

## Subtasks & Detailed Guidance

### Subtask T012 – Create lib/types/figma.ts with FigmaNode, Paint, Color, Effect, Rectangle, Constraints

**Purpose**: Define base Figma API types matching official REST API v1 response structure.

**Steps**:
1. Create `lib/types/figma.ts`
2. Define `FigmaNodeType` discriminated union:
   ```typescript
   export type FigmaNodeType =
     | 'FRAME'
     | 'GROUP'
     | 'TEXT'
     | 'RECTANGLE'
     | 'ELLIPSE'
     | 'VECTOR'
     | 'COMPONENT'
     | 'INSTANCE';
   ```

3. Define `LayoutMode` type:
   ```typescript
   export type LayoutMode = 'HORIZONTAL' | 'VERTICAL' | 'NONE' | null;
   ```

4. Define `FigmaNode` interface with core properties:
   - `id: string` (format: "123:456")
   - `name: string`
   - `type: FigmaNodeType`
   - `children?: FigmaNode[]` (recursive)
   - `absoluteBoundingBox?: Rectangle`
   - `layoutMode?: LayoutMode`
   - `itemSpacing?: number`
   - `paddingLeft/Right/Top/Bottom?: number`
   - `fills?: Paint[]`
   - `strokes?: Paint[]`
   - `effects?: Effect[]`
   - `fontSize?: number` (TEXT nodes)
   - `fontFamily?: string`
   - `fontWeight?: number`
   - `characters?: string` (text content)
   - `constraints?: Constraints`

5. Define `Paint` interface:
   ```typescript
   export interface Paint {
     type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
     color?: Color;
     opacity?: number;
   }
   ```

6. Define `Color` interface (0-1 range):
   ```typescript
   export interface Color {
     r: number;
     g: number;
     b: number;
     a: number;
   }
   ```

7. Define `Effect` interface:
   ```typescript
   export interface Effect {
     type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
     color?: Color;
     offset?: { x: number; y: number };
     radius?: number;
     spread?: number;
     visible?: boolean;
   }
   ```

8. Define `Rectangle` and `Constraints`:
   ```typescript
   export interface Rectangle {
     x: number;
     y: number;
     width: number;
     height: number;
   }

   export interface Constraints {
     horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
     vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
   }
   ```

**Files**: `lib/types/figma.ts`

**Parallel?**: Yes (can develop concurrently with T014, T016, T017, T018, T019)

**Notes**:
- Match Figma REST API v1 response structure exactly
- Use optional properties (`?`) for nullable fields
- Document Figma API version in file header: `// Figma REST API v1, updated 2025-11-23`

---

### Subtask T013 – Add FigmaToCode enhanced properties to FigmaNode

**Purpose**: Integrate 23 FigmaToCode recommendations from research.md Decision 7 (5 CRITICAL + 12 HIGH priority).

**Steps**:
1. Add CRITICAL properties to `FigmaNode` interface:
   - `visible?: boolean` (default true, filter if false)
   - `rotation?: number` (radians, convert to degrees in AltNode)
   - `opacity?: number` (0-1 range)
   - `blendMode?: string` (e.g., "NORMAL", "MULTIPLY")

2. Add HIGH priority layout properties:
   - `strokeTopWeight?: number`
   - `strokeBottomWeight?: number`
   - `strokeLeftWeight?: number`
   - `strokeRightWeight?: number`
   - `layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL'`
   - `layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL'`
   - `layoutWrap?: 'NO_WRAP' | 'WRAP'`
   - `primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN'`
   - `counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE'`

3. Add export settings property:
   ```typescript
   export interface ExportSettings {
     suffix?: string;
     format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
     constraint?: { type: 'SCALE' | 'WIDTH' | 'HEIGHT'; value: number };
   }
   ```
   - Add to FigmaNode: `exportSettings?: ExportSettings[]`

4. Add text styling properties:
   - `textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'`
   - `textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM'`
   - `letterSpacing?: number`
   - `lineHeightPx?: number`

5. Document each property with JSDoc comments:
   ```typescript
   /**
    * Visibility flag. If false, node and descendants should be filtered.
    * @see research.md Decision 7, Recommendation #2
    */
   visible?: boolean;
   ```

**Files**: `lib/types/figma.ts`

**Parallel?**: No (depends on T012)

**Notes**:
- Reference research.md Decision 7 recommendations in JSDoc
- All FigmaToCode properties optional (not present in all Figma versions)
- Mark CRITICAL properties with `@critical` JSDoc tag

---

### Subtask T014 – Create lib/types/altnode.ts with AltNode, CSSProperties, originalNode reference

**Purpose**: Define normalized AltNode intermediate representation with CSS-familiar properties.

**Steps**:
1. Create `lib/types/altnode.ts`

2. Define `AltNodeType` discriminated union:
   ```typescript
   export type AltNodeType = 'container' | 'text' | 'image' | 'group';
   ```

3. Define `CSSProperties` interface (CSS-familiar naming):
   ```typescript
   export interface CSSProperties {
     display?: 'flex' | 'block' | 'inline' | 'inline-block' | 'none';
     flexDirection?: 'row' | 'column';
     gap?: string;
     padding?: string;
     margin?: string;
     background?: string;
     color?: string;
     border?: string;
     borderRadius?: string;
     boxShadow?: string;
     fontSize?: string;
     fontFamily?: string;
     fontWeight?: string | number;
     lineHeight?: string | number;
     textAlign?: 'left' | 'center' | 'right' | 'justify';
     position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
     top?: string;
     left?: string;
     right?: string;
     bottom?: string;
     width?: string;
     height?: string;
     minWidth?: string;
     minHeight?: string;
     maxWidth?: string;
     maxHeight?: string;
     zIndex?: number;
     opacity?: number;
     transform?: string;
     [key: string]: string | number | undefined; // Allow additional CSS properties
   }
   ```

4. Define `AltNode` interface with originalNode reference:
   ```typescript
   import type { FigmaNode } from './figma';

   export interface AltNode {
     id: string;
     name: string;
     uniqueName: string; // Unique component name with suffix counters
     type: AltNodeType;
     styles: CSSProperties;
     children: AltNode[];
     originalNode: FigmaNode; // CRITICAL: Reference to complete Figma data
   }
   ```

**Files**: `lib/types/altnode.ts`

**Parallel?**: Yes (can develop concurrently with T012, T016, T017, T018, T019)

**Notes**:
- `originalNode` is CRITICAL per research.md Decision 7, Recommendation #1
- `uniqueName` for React component naming (handles duplicates with suffix counters)
- `CSSProperties[key: string]` allows arbitrary CSS properties not explicitly typed

---

### Subtask T015 – Add FigmaToCode metadata to AltNode

**Purpose**: Add production-quality metadata properties from FigmaToCode analysis.

**Steps**:
1. Add metadata properties to `AltNode` interface:
   ```typescript
   export interface AltNode {
     // ... existing properties
     visible: boolean; // Inherited from FigmaNode.visible (default true)
     rotation?: number; // Rotation in degrees (converted from radians)
     cumulativeRotation?: number; // Inherited rotation from GROUP parents
     canBeFlattened: boolean; // Icon detection flag (for SVG optimization)
     svg?: string; // SVG data if node can be flattened
     base64?: string; // Base64 image data if applicable
     layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';
     layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';
   }
   ```

2. Document each metadata property:
   ```typescript
   /**
    * Whether node can be flattened to SVG for optimization.
    * Detected via isLikelyIcon() (type check, size ≤64px, export settings).
    * @see research.md Decision 7, Recommendation #8
    */
   canBeFlattened: boolean;

   /**
    * Cumulative rotation inherited from GROUP parents (degrees).
    * GROUP nodes inline their children with rotation accumulation.
    * @see research.md Decision 7, Recommendation #4
    */
   cumulativeRotation?: number;
   ```

3. Add helper type for layout sizing context:
   ```typescript
   export type LayoutSizing = 'FIXED' | 'HUG' | 'FILL';
   ```

**Files**: `lib/types/altnode.ts`

**Parallel?**: No (depends on T014)

**Notes**:
- `canBeFlattened` used by icon detection logic in WP04
- `cumulativeRotation` critical for GROUP inlining (research.md Recommendation #4)
- All metadata properties documented with research.md reference

---

### Subtask T016 – Create lib/types/rule.ts with MappingRule, Selector, Transformer, RuleMatch, RuleLibrary

**Purpose**: Define rule engine types for user-defined mapping rules and match results.

**Steps**:
1. Create `lib/types/rule.ts`

2. Define `Selector` interface (AND-logic pattern matching):
   ```typescript
   export interface Selector {
     nodeType?: AltNodeType; // Match specific node type
     layoutMode?: 'horizontal' | 'vertical'; // Match layout direction
     hasChildren?: boolean; // Match nodes with/without children
     customProperties?: Record<string, unknown>; // Match specific CSS properties
   }
   ```

3. Define `Transformer` interface (output structure):
   ```typescript
   export interface Transformer {
     htmlTag: string; // HTML tag (div, button, span, etc.)
     cssClasses?: string[]; // Tailwind or CSS class names
     inlineStyles?: Record<string, string>; // Inline CSS properties
     attributes?: Record<string, string>; // HTML attributes (aria-*, data-*)
   }
   ```

4. Define `MappingRule` interface:
   ```typescript
   export interface MappingRule {
     id: string; // Unique rule ID (kebab-case)
     name: string; // Human-readable name
     selector: Selector;
     transformer: Transformer;
     priority: number; // Conflict resolution order (0-1000, higher wins)
     enabled?: boolean; // Whether rule is active (default true)
     description?: string; // Documentation
   }
   ```

5. Define `RuleMatch` interface (match result):
   ```typescript
   export interface RuleMatch {
     ruleId: string;
     priority: number;
     contributedProperties: Record<string, string>; // CSS properties from this rule
     conflicts?: Conflict[];
   }

   export interface Conflict {
     property: string; // Conflicting property (e.g., "htmlTag")
     thisValue: unknown; // Value from this rule
     otherRuleId: string; // Conflicting rule ID
     otherValue: unknown; // Value from other rule
     resolved: boolean; // Whether priority resolved it
     severity: 'minor' | 'major'; // Yellow or red highlight
   }
   ```

6. Define `RuleLibrary` interface (mapping-rules.json structure):
   ```typescript
   export interface RuleLibrary {
     version: string; // Semantic version (e.g., "1.0.0")
     rules: MappingRule[];
     metadata: {
       createdAt: string; // ISO timestamp
       lastModified: string; // ISO timestamp
     };
   }
   ```

7. Define helper types:
   ```typescript
   export type ConflictSeverity = 'minor' | 'major';

   export interface ResolvedProperties {
     resolved: Record<string, string>; // Final CSS properties
     propertyProvenance: Record<string, string>; // property → ruleId mapping
   }
   ```

**Files**: `lib/types/rule.ts`

**Parallel?**: Yes (can develop concurrently with T012, T014, T017, T018, T019)

**Notes**:
- Selector uses AND logic: all properties must match
- Priority sorting: descending (highest first)
- Conflict severity: minor (compatible values) vs major (incompatible)

---

### Subtask T017 – Create lib/types/generated-code.ts with GeneratedCode, CodeFormat, CodeMetadata

**Purpose**: Define types for code generation output (React JSX, React+Tailwind, HTML/CSS).

**Steps**:
1. Create `lib/types/generated-code.ts`

2. Define `CodeFormat` discriminated union:
   ```typescript
   export type CodeFormat = 'react-jsx' | 'react-tailwind' | 'html-css';
   ```

3. Define `CodeMetadata` interface:
   ```typescript
   export interface CodeMetadata {
     nodeCount: number; // Number of AltNodes processed
     ruleCount: number; // Number of rules matched
     generatedAt: string; // ISO timestamp
     format: CodeFormat;
   }
   ```

4. Define `GeneratedCode` interface:
   ```typescript
   export interface GeneratedCode {
     format: CodeFormat;
     code: string; // Generated source code (JSX/HTML)
     styles?: string; // Separate CSS file (for HTML/CSS format)
     language: string; // Language for syntax highlighting ("jsx", "html", "css")
     metadata?: CodeMetadata;
   }
   ```

5. Define helper types for code generation:
   ```typescript
   export interface CodeGenerationOptions {
     format: CodeFormat;
     useTypeScript?: boolean; // Default true
     useSingleQuotes?: boolean; // Default false
     tabSize?: number; // Default 2
     semicolons?: boolean; // Default true
   }
   ```

**Files**: `lib/types/generated-code.ts`

**Parallel?**: Yes (can develop concurrently with T012, T014, T016, T018, T019)

**Notes**:
- `styles` field only used for HTML/CSS format (separate stylesheet)
- `language` field matches Prism.js/Shiki syntax highlighting identifiers
- Generation options passed from Settings page preferences

---

### Subtask T018 – Create lib/types/library.ts with NodeLibrary, NodeMetadata, LibraryIndex, DashboardStats

**Purpose**: Define types for multi-node library management and dashboard metrics.

**Steps**:
1. Create `lib/types/library.ts`

2. Define `NodeMetadata` interface (library index entry):
   ```typescript
   export interface NodeMetadata {
     id: string; // Figma node ID (format: "123:456")
     name: string; // Node name from Figma
     type: FigmaNodeType; // Node type
     importDate: string; // ISO timestamp
     thumbnailPath: string; // Relative path to screenshot
     dataPath: string; // Relative path to data.json
     fileKey: string; // Figma file key for re-fetching
     coverage?: number; // Percentage of nodes with at least one rule match (calculated)
   }
   ```

3. Define `LibraryIndex` interface (figma-data/library-index.json):
   ```typescript
   export interface LibraryIndex {
     version: string; // Schema version (e.g., "1.0.0")
     lastUpdated: string; // ISO timestamp
     nodes: NodeMetadata[];
   }
   ```

4. Define `NodeLibrary` interface (aggregated collection):
   ```typescript
   export interface NodeLibrary {
     nodes: NodeMetadata[];
     totalNodes: number;
     lastImportDate: string; // Most recent import timestamp
   }
   ```

5. Define `DashboardStats` interface (computed metrics):
   ```typescript
   export interface DashboardStats {
     totalNodes: number; // Count from library index
     totalRules: number; // Count from mapping-rules.json
     averageCoverage: number; // % of nodes with at least one rule match
     lastImportDate: string; // Most recent import timestamp
     recentNodes: NodeMetadata[]; // 5 most recent imports
     topRules: RuleUsageStat[]; // Top 5 most-matched rules
   }

   export interface RuleUsageStat {
     ruleId: string;
     name: string;
     matchCount: number; // Total matches across all nodes
   }
   ```

6. Define search/filter/sort types:
   ```typescript
   export interface LibraryFilters {
     type?: FigmaNodeType; // Filter by node type
     coverage?: 'all' | 'with-rules' | 'without-rules'; // Coverage filter
   }

   export type LibrarySortCriteria = 'name' | 'date' | 'type' | 'coverage';
   export type SortOrder = 'asc' | 'desc';
   ```

**Files**: `lib/types/library.ts`

**Parallel?**: Yes (can develop concurrently with T012, T014, T016, T017, T019)

**Notes**:
- `coverage` calculated by rule engine: (nodes with ≥1 match) / total nodes * 100
- `recentNodes` sorted by importDate descending, limited to 5
- `topRules` sorted by matchCount descending

---

### Subtask T019 – Create lib/types/store.ts with NodesState, RulesState, UIState (Zustand store interfaces)

**Purpose**: Define Zustand store types for global state management (3 stores).

**Steps**:
1. Create `lib/types/store.ts`

2. Define `NodesState` interface (nodes-store):
   ```typescript
   import type { NodeMetadata } from './library';

   export interface NodesState {
     // Data
     nodes: NodeMetadata[];
     selectedNodeId: string | null;

     // UI State
     viewMode: 'grid' | 'list';
     searchTerm: string;
     filters: {
       type?: FigmaNodeType;
       coverage?: 'all' | 'with-rules' | 'without-rules';
     };
     sortCriteria: 'name' | 'date' | 'type' | 'coverage';
     sortOrder: 'asc' | 'desc';

     // Actions
     loadLibrary: () => Promise<void>;
     importNode: (url: string) => Promise<void>;
     deleteNode: (nodeId: string) => Promise<void>;
     selectNode: (nodeId: string | null) => void;
     setViewMode: (mode: 'grid' | 'list') => void;
     setSearchTerm: (term: string) => void;
     setFilters: (filters: Partial<NodesState['filters']>) => void;
     setSortCriteria: (criteria: NodesState['sortCriteria']) => void;
   }
   ```

3. Define `RulesState` interface (rules-store):
   ```typescript
   import type { MappingRule, RuleMatch } from './rule';

   export interface RulesState {
     // Data
     rules: MappingRule[];
     selectedRuleId: string | null;
     ruleMatches: Map<string, RuleMatch[]>; // nodeId → matches

     // Actions
     loadRules: () => Promise<void>;
     saveRules: () => Promise<void>;
     createRule: (rule: MappingRule) => Promise<void>;
     updateRule: (ruleId: string, updates: Partial<MappingRule>) => Promise<void>;
     deleteRule: (ruleId: string) => Promise<void>;
     duplicateRule: (ruleId: string) => Promise<void>;
     importRules: (file: File) => Promise<void>;
     exportRules: () => Promise<void>;
     selectRule: (ruleId: string | null) => void;
     evaluateRules: (nodeId: string) => RuleMatch[];
   }
   ```

4. Define `UIState` interface (ui-store):
   ```typescript
   import type { DashboardStats } from './library';

   export interface UIState {
     // Theme
     theme: 'light' | 'dark' | 'system';

     // Loading States
     isImporting: boolean;
     isLoadingRules: boolean;
     isCalculatingStats: boolean;

     // Dashboard Stats (cached)
     stats: DashboardStats | null;
     statsLastUpdated: number | null; // Unix timestamp

     // Actions
     setTheme: (theme: UIState['theme']) => void;
     setImporting: (isImporting: boolean) => void;
     loadStats: () => Promise<void>;
     invalidateStats: () => void;
   }
   ```

5. Document store persistence strategy:
   ```typescript
   /**
    * Zustand Store Persistence Strategy:
    * - NodesState: UI preferences (viewMode, filters, search) in localStorage
    * - RulesState: NOT persisted (loaded from mapping-rules.json on mount)
    * - UIState: theme in localStorage, stats in memory (5-minute TTL)
    */
   ```

**Files**: `lib/types/store.ts`

**Parallel?**: Yes (can develop concurrently with T012, T014, T016, T017, T018)

**Notes**:
- Store actions return `Promise<void>` for async operations
- `ruleMatches` Map for O(1) lookup by nodeId
- Stats cached with 5-minute TTL to avoid recalculating on every render

---

### Subtask T020 – Create type guard functions in lib/utils/validation.ts

**Purpose**: Implement runtime validation with TypeScript type guards for safe data handling.

**Steps**:
1. Create `lib/utils/validation.ts`

2. Implement `isFigmaNode` type guard:
   ```typescript
   import type { FigmaNode, FigmaNodeType } from '../types/figma';

   const VALID_NODE_TYPES: FigmaNodeType[] = [
     'FRAME', 'GROUP', 'TEXT', 'RECTANGLE', 'ELLIPSE',
     'VECTOR', 'COMPONENT', 'INSTANCE'
   ];

   export function isFigmaNode(data: unknown): data is FigmaNode {
     if (typeof data !== 'object' || data === null) return false;

     const node = data as Record<string, unknown>;

     return (
       typeof node.id === 'string' &&
       typeof node.name === 'string' &&
       typeof node.type === 'string' &&
       VALID_NODE_TYPES.includes(node.type as FigmaNodeType)
     );
   }
   ```

3. Implement `isAltNode` type guard:
   ```typescript
   import type { AltNode, AltNodeType } from '../types/altnode';

   const VALID_ALT_NODE_TYPES: AltNodeType[] = [
     'container', 'text', 'image', 'group'
   ];

   export function isAltNode(data: unknown): data is AltNode {
     if (typeof data !== 'object' || data === null) return false;

     const node = data as Record<string, unknown>;

     return (
       typeof node.id === 'string' &&
       typeof node.name === 'string' &&
       typeof node.uniqueName === 'string' &&
       typeof node.type === 'string' &&
       VALID_ALT_NODE_TYPES.includes(node.type as AltNodeType) &&
       typeof node.styles === 'object' &&
       node.styles !== null &&
       Array.isArray(node.children) &&
       typeof node.visible === 'boolean' &&
       typeof node.canBeFlattened === 'boolean'
     );
   }
   ```

4. Implement `isValidRule` type guard:
   ```typescript
   import type { MappingRule } from '../types/rule';

   export function isValidRule(data: unknown): data is MappingRule {
     if (typeof data !== 'object' || data === null) return false;

     const rule = data as Record<string, unknown>;

     return (
       typeof rule.id === 'string' &&
       rule.id.length > 0 &&
       typeof rule.name === 'string' &&
       typeof rule.selector === 'object' &&
       rule.selector !== null &&
       typeof rule.transformer === 'object' &&
       rule.transformer !== null &&
       typeof (rule.transformer as Record<string, unknown>).htmlTag === 'string' &&
       typeof rule.priority === 'number' &&
       rule.priority >= 0
     );
   }
   ```

5. Implement `isValidRuleLibrary` type guard:
   ```typescript
   import type { RuleLibrary } from '../types/rule';

   export function isValidRuleLibrary(data: unknown): data is RuleLibrary {
     if (typeof data !== 'object' || data === null) return false;

     const lib = data as Record<string, unknown>;

     return (
       typeof lib.version === 'string' &&
       Array.isArray(lib.rules) &&
       lib.rules.every(isValidRule) &&
       typeof lib.metadata === 'object' &&
       lib.metadata !== null
     );
   }
   ```

6. Implement `isValidLibraryIndex` type guard:
   ```typescript
   import type { LibraryIndex } from '../types/library';

   export function isValidLibraryIndex(data: unknown): data is LibraryIndex {
     if (typeof data !== 'object' || data === null) return false;

     const index = data as Record<string, unknown>;

     return (
       typeof index.version === 'string' &&
       typeof index.lastUpdated === 'string' &&
       Array.isArray(index.nodes) &&
       index.nodes.every(node =>
         typeof (node as Record<string, unknown>).id === 'string' &&
         typeof (node as Record<string, unknown>).name === 'string'
       )
     );
   }
   ```

7. Export all type guards with JSDoc:
   ```typescript
   /**
    * Runtime type validation functions with TypeScript type narrowing.
    *
    * Usage:
    *   const data = await loadFromFile();
    *   if (isFigmaNode(data)) {
    *     // data is now typed as FigmaNode
    *     console.log(data.name);
    *   }
    */
   ```

**Files**: `lib/utils/validation.ts`

**Parallel?**: No (depends on T012-T019 types)

**Notes**:
- Type guards enable safe JSON parsing (Figma API responses, cached files)
- Use in API routes to validate external data before processing
- All guards return `data is Type` for TypeScript narrowing

---

### Subtask T021 – Verify all types compile with TypeScript strict mode

**Purpose**: Final validation that all types are complete and error-free.

**Steps**:
1. Run TypeScript compiler:
   ```bash
   npx tsc --noEmit
   ```

2. Verify zero errors in output

3. Create test file `__tests__/unit/types.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import type { FigmaNode, AltNode, MappingRule, RuleMatch, GeneratedCode } from '@/lib/types';
   import { isFigmaNode, isAltNode, isValidRule } from '@/lib/utils/validation';

   describe('Type System', () => {
     it('FigmaNode type compiles', () => {
       const node: FigmaNode = {
         id: '123:456',
         name: 'Test Node',
         type: 'FRAME',
       };
       expect(isFigmaNode(node)).toBe(true);
     });

     it('AltNode type compiles with all required fields', () => {
       const altNode: AltNode = {
         id: '123:456',
         name: 'Test Node',
         uniqueName: 'TestNode',
         type: 'container',
         styles: {},
         children: [],
         visible: true,
         canBeFlattened: false,
         originalNode: { id: '123:456', name: 'Test', type: 'FRAME' },
       };
       expect(isAltNode(altNode)).toBe(true);
     });

     it('MappingRule type compiles', () => {
       const rule: MappingRule = {
         id: 'test-rule',
         name: 'Test Rule',
         selector: { nodeType: 'container' },
         transformer: { htmlTag: 'div' },
         priority: 10,
       };
       expect(isValidRule(rule)).toBe(true);
     });
   });
   ```

4. Run test suite:
   ```bash
   npm test __tests__/unit/types.test.ts
   ```

5. Add `type-check` script to `package.json`:
   ```json
   {
     "scripts": {
       "type-check": "tsc --noEmit"
     }
   }
   ```

6. Verify in CI workflow (create `.github/workflows/type-check.yml` if using GitHub):
   ```yaml
   name: Type Check
   on: [push, pull_request]
   jobs:
     type-check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm install
         - run: npm run type-check
   ```

**Files**: `__tests__/unit/types.test.ts`, `package.json`, `.github/workflows/type-check.yml` (optional)

**Parallel?**: No (final step after all types created)

**Notes**:
- TypeScript strict mode must pass with zero errors (Constitution Principle V)
- If errors found, fix types in previous subtasks before proceeding
- Type tests lock down type definitions for future changes

## Definition of Done Checklist

- [ ] All 8 type files created: figma.ts, altnode.ts, rule.ts, generated-code.ts, library.ts, store.ts
- [ ] FigmaToCode enhanced properties integrated (23 recommendations)
- [ ] `originalNode` reference in AltNode (CRITICAL per research.md)
- [ ] Type guards implemented with `is` keyword for all core entities
- [ ] `npx tsc --noEmit` runs with zero errors
- [ ] Type test file passes all assertions
- [ ] All types documented with JSDoc comments
- [ ] Research.md Decision 7 recommendations referenced in JSDoc
- [ ] `npm run type-check` script added to package.json
- [ ] No `any` types in codebase (search with `grep -r "any" lib/types/`)

## Review Guidance

**Key Acceptance Checkpoints**:
1. TypeScript strict mode active (`tsconfig.json` has `strict: true`)
2. All FigmaToCode enhanced properties present (5 CRITICAL + 12 HIGH)
3. `AltNode.originalNode: FigmaNode` reference exists (research.md Recommendation #1)
4. Type guards use `data is Type` syntax for TypeScript narrowing
5. Zero `any` types in `lib/types/` directory
6. All public interfaces fully typed with JSDoc documentation

**Reviewers should verify**:
- No `any` types introduced (run `grep -r "any" lib/types/`)
- FigmaToCode properties match research.md Decision 7 (23 items)
- Type guards validate all required fields for each entity
- Discriminated unions used for enums (not string literals)

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
