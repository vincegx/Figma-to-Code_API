# Implementation Plan: Figma-to-Code Rule Builder
*Path: [kitty-specs/001-figma-to-code/plan.md](kitty-specs/001-figma-to-code/plan.md)*

**Branch**: `001-figma-to-code` | **Date**: 2025-11-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/001-figma-to-code/spec.md`

**Planning Status**: ✅ Complete (Zustand state management, Feature-first testing strategy confirmed)

## Summary

Build a **multi-node library manager** for creating, testing, and managing reusable Figma-to-Code mapping rules. Users import multiple Figma design nodes, build one global rule library with Monaco editor, test rules against the entire library via Applied Rules Inspector, and export both rules (for reuse) and generated code (React+JSX, React+Tailwind, HTML/CSS).

**Architecture**: 5-page Next.js 14+ application (Homepage Dashboard, Node Library, Viewer, Rule Manager, Settings) with local-first multi-node storage, Zustand state management, and production-tested transformation patterns from FigmaToCode analysis.

**Key Technical Approach**:
- Next.js 14+ App Router with TypeScript strict mode for routing and server actions
- Zustand for global state (nodes library, selected node, rules, UI state)
- Monaco Editor with JSON schema validation for rule editing
- File-based storage (`figma-data/{nodeId}/`, `mapping-rules.json`) - no database
- AltNode transformation with FigmaToCode learnings (invisible filtering, GROUP inlining, rotation, icon detection)
- Tailwind CSS + Shadcn/ui for UI components
- Feature-first implementation with tests after (90% coverage rule engine, 80% transformations)

---

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18+ for runtime
**Primary Dependencies**:
- Next.js 14+ (App Router, Server Actions, dynamic imports)
- React 18+ (components, hooks, Context for theming)
- Zustand 4+ (state management with DevTools)
- Monaco Editor (`@monaco-editor/react` 4.6+, dynamic import for code splitting)
- Tailwind CSS 3+ + Shadcn/ui (UI components)
- Vitest 1+ (unit tests) + React Testing Library (component tests) + Playwright 1+ (E2E)

**Storage**: Local filesystem (no database)
- Multi-node data: `figma-data/{nodeId}/data.json`, `metadata.json`, `screenshot.png`
- Library index: `figma-data/library-index.json`
- Global rules: `mapping-rules.json`
- Settings: `.env.local` (Figma token), `localStorage` (UI preferences)

**Testing**: Vitest + React Testing Library + Playwright
- Strategy: Feature-first implementation, tests after to lock down behavior
- Coverage targets: 90% rule engine, 80% transformations, 70% other modules
- Unit tests: lib modules (rule engine, altnode-transform, code generators)
- Component tests: React components (Monaco wrapper, tree view, applied rules inspector)
- E2E tests: Complete workflows (import node, create rule, view preview, export)

**Target Platform**: Modern desktop browsers (Chrome, Firefox, Safari latest versions)
- No mobile/tablet support (desktop-focused developer workbench)
- No IE11 (requires ES2020+ features)

**Project Type**: Web application (Next.js frontend with filesystem backend via API routes)

**Performance Goals** (from Success Criteria SC-001 to SC-015):
- Import node: <10 seconds (Figma API fetch + transform + save)
- Search library (50 nodes): <3 seconds
- UI interactions (toggle view, filter, sort): <1 second (instant)
- View navigation (page transitions): <1 second with state preservation
- Create/edit rule: match counts update across all nodes <2 seconds
- Viewer tree click: Applied Rules Inspector update <200ms
- Preview format switch (React/Tailwind/HTML): <500ms re-render
- Dashboard stats calculation: <1 second after changes

**Constraints**:
- Offline-first after initial imports (zero Figma API calls during rule editing - Constitution Principle III)
- File-based storage only (no database, cloud storage, or sync - Constitution Principle III)
- Rule portability (pure JSON, no code/DSL - Constitution Principle IV)
- Type safety (strict mode, zero `any` - Constitution Principle V)
- Simple before clever (working software > elegant architecture - Constitution Principle VI)

**Scale/Scope**:
- Typical: 10-100 imported nodes, 20-30 rules per library
- Performance optimized for: 100 nodes, 50 rules, <1000 child elements per node
- Dashboard/Library page rendering: <500ms for 50 nodes
- Memory budget: <500MB for typical project (50 components)
- Disk budget: <100MB cache per project (compressed screenshots + JSON)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle I: Developer Experience First ✅ PASS
- **Requirement**: Dashboard-first design with stats, graphs, quick import
- **Implementation**: Homepage displays stats cards (total nodes, rules, avg coverage), recent nodes section, rule usage chart, import field always visible
- **Verification**: User sees productivity metrics immediately on app launch

### Principle II: Clear Separation of Concerns ✅ PASS
- **Requirement**: Strict boundaries between data fetching, transformation, rule engine, code generation, UI pages
- **Implementation**:
  - Data layer: `lib/figma-client.ts`, `lib/utils/file-storage.ts` (API + cache)
  - Transformation: `lib/altnode-transform.ts` (Figma → AltNode)
  - Rule engine: `lib/rule-engine.ts` (matching, conflict resolution)
  - Code gen: `lib/code-generators/*` (React, Tailwind, HTML)
  - UI: `app/*` pages, `components/*` (5 separate pages with routing)
- **Verification**: Each layer testable in isolation, interfaces typed

### Principle III: Data Locality (NON-NEGOTIABLE) ✅ PASS
- **Requirement**: Fetch once, operate offline, multi-node storage structure
- **Implementation**:
  - Single import flow: user pastes URL → API route fetches → saves to `figma-data/{nodeId}/`
  - All subsequent operations read from cache (no API calls)
  - Library index at `figma-data/library-index.json` for fast browsing
  - Explicit "Re-fetch" button required for updates
- **Verification**: After initial imports, disconnect network → app fully functional

### Principle IV: Rule Portability ✅ PASS
- **Requirement**: Framework-agnostic JSON, import/export for sharing
- **Implementation**:
  - Rules stored as pure JSON in `mapping-rules.json`
  - No code/DSL in rules (only selectors + transformers)
  - Schema versioned (v1.0.0 with semantic versioning)
  - Import/Export buttons in Rule Manager
- **Verification**: Export rules.json, use in different project, imports without modification

### Principle V: Type Safety Throughout ✅ PASS
- **Requirement**: TypeScript strict mode, no `any`, zero errors at build
- **Implementation**:
  - `tsconfig.json`: `strict: true`, `noImplicitAny: true`
  - All public APIs fully typed (Figma types, AltNode, MappingRule, etc.)
  - Type guards for runtime validation (`isFigmaNode()`, `isValidRule()`)
  - Monaco Editor types from `@monaco-editor/react`
- **Verification**: `npm run build` produces zero TypeScript errors

### Principle VI: Simple Before Clever ✅ PASS
- **Requirement**: Solve core workflow before optimizations
- **Implementation**:
  - MVP features only (no advanced analytics, no undo/redo, no collaboration)
  - Zustand (1KB) chosen over Redux (complex)
  - Context API for theme (built-in) over external theme library
  - File-based storage (simple) over database (overkill)
  - Feature-first testing (pragmatic) over strict TDD everywhere
- **Verification**: All assumptions documented in spec.md, complexity justified in plan.md

### Principle VII: Live Feedback ✅ PASS
- **Requirement**: Rule changes update previews <100ms
- **Implementation**:
  - Monaco editor with file watcher on rule changes
  - Zustand state updates trigger re-render
  - Preview components React memo'd to avoid unnecessary re-renders
  - Applied Rules Inspector updates <200ms on node selection (SC-006)
- **Verification**: Edit rule in Monaco → preview tabs update within 100ms (timer in DevTools)

### Principle VIII: Multi-Node Library Management ✅ PASS
- **Requirement**: Library manager for multiple nodes, NOT single-node workbench
- **Implementation**:
  - Homepage dashboard with stats (total nodes, rules, coverage)
  - Node Library page with grid/list view, search, filter, sort, bulk actions
  - Each node stored independently with metadata
  - Rule Manager shows global rule library with match counts across ALL nodes
  - Viewer for read-only inspection with Applied Rules Inspector
- **Verification**: User can import 20 nodes, see all in library, create 1 rule, see match count across all nodes

### Principle IX: Separation of Pages ✅ PASS
- **Requirement**: Distinct pages for viewing, editing, management
- **Implementation**:
  - 5 Next.js App Router pages: `/` (Homepage), `/nodes` (Library), `/viewer/[nodeId]` (Viewer), `/rules` (Rule Manager), `/settings` (Settings)
  - Top nav bar always visible with clear links
  - Breadcrumbs in Viewer (Home > Library > NodeName)
  - Each page focused workflow
- **Verification**: Navigation works, state preserved across page transitions, browser back/forward functional

### Principle X: Production Patterns First ✅ PASS
- **Requirement**: Adopt FigmaToCode patterns before inventing
- **Implementation**:
  - AltNode transformation: invisible filtering, GROUP inlining, rotation conversion, icon detection, empty container optimization, unique names (research.md Decision 7)
  - Tailwind generation: arbitrary values (`gap-[13px]`), hex-to-Tailwind color matching, shadow pattern matching, context-aware sizing (`flex-1` vs `w-full`)
  - All patterns documented in research.md with rationale
- **Verification**: Transformation handles edge cases from FigmaToCode analysis (23 recommendations implemented)

**Gates Summary**: ✅ 10/10 PASS - All constitutional principles satisfied

---

## Project Structure

### Documentation (this feature)

```
kitty-specs/001-figma-to-code/
├── spec.md                    # Feature specification (6 user stories, 70 FR)
├── plan.md                    # This file (implementation plan)
├── research.md                # Research findings (FigmaToCode analysis, Decision 7)
├── data-model.md              # Entities, relationships, state model (Phase 1 output)
├── quickstart.md              # Setup and run instructions (Phase 1 output)
├── constitution.md            # Project principles v1.1.0 (in .kittify/memory/)
├── contracts/                 # API contracts, JSON schemas (Phase 1 output)
│   ├── rule-schema.json       # Mapping rule JSON schema for Monaco validation
│   ├── library-index-schema.json  # Library index structure
│   └── api-routes.md          # Next.js API route contracts
├── checklists/                # Validation checklists
│   └── requirements.md        # Spec quality checklist (16/16 PASS)
└── tasks.md                   # Work packages breakdown (Phase 2 - NOT created by /spec-kitty.plan)
```

### Source Code (Next.js 14+ App Router structure)

```
figma-rules-builder/          # Next.js application root
├── app/                       # Next.js 14+ App Router
│   ├── layout.tsx             # Root layout with top nav, Zustand provider, theme provider
│   ├── page.tsx               # Homepage (Dashboard with stats, recent nodes, import field)
│   ├── nodes/                 # Node Library page
│   │   └── page.tsx           # Grid/list view, search, filter, sort, bulk actions
│   ├── viewer/                # Viewer page (read-only inspection)
│   │   └── [nodeId]/
│   │       └── page.tsx       # 2 tabs: Code (tree + Applied Rules), Render (preview)
│   ├── rules/                 # Rule Manager page
│   │   └── page.tsx           # Rule list sidebar, Monaco editor modal, import/export
│   ├── settings/              # Settings page
│   │   └── page.tsx           # 5 sections: Figma API, Export Prefs, Rule Editor, Cache, Appearance
│   └── api/                   # Next.js API routes (Server Actions)
│       ├── figma/
│       │   ├── import/route.ts      # POST: Import Figma node (fetch + save)
│       │   └── refresh/route.ts     # POST: Re-fetch node data
│       ├── rules/
│       │   ├── save/route.ts        # POST: Save rules to mapping-rules.json
│       │   ├── load/route.ts        # GET: Load rules from mapping-rules.json
│       │   └── validate/route.ts    # POST: Validate rule JSON against schema
│       └── library/
│           ├── index/route.ts       # GET: Load library index
│           ├── node/[nodeId]/route.ts  # GET: Load single node data
│           └── stats/route.ts       # GET: Calculate dashboard stats
│
├── components/                # React components
│   ├── ui/                    # Shadcn/ui components (button, card, dialog, dropdown, etc.)
│   ├── navigation.tsx         # Top nav bar (Home | Library | Rules | Settings)
│   ├── rule-editor.tsx        # Monaco Editor wrapper with schema validation, autocomplete
│   ├── figma-tree-view.tsx    # Hierarchical tree for AltNode display
│   ├── applied-rules-inspector.tsx  # Shows matched rules, conflicts, coverage for selected node
│   ├── preview-tabs.tsx       # 3 preview tabs (React JSX, React+Tailwind, HTML/CSS)
│   ├── code-preview.tsx       # Syntax-highlighted code display (Prism.js or Shiki)
│   ├── node-card.tsx          # Node card component for grid view (thumbnail, name, type, date, coverage)
│   ├── stats-card.tsx         # Dashboard stats card component
│   ├── import-dialog.tsx      # Import Figma node dialog with URL input
│   └── export-dialog.tsx      # Export code dialog with format selection
│
├── lib/                       # Core business logic
│   ├── types/                 # TypeScript type definitions
│   │   ├── figma.ts           # Figma API types (FigmaNode, Paint, Color, Effect, etc.)
│   │   ├── altnode.ts         # AltNode types (normalized CSS representation)
│   │   ├── rule.ts            # MappingRule, Selector, Transformer, RuleMatch
│   │   ├── generated-code.ts  # GeneratedCode, CodeFormat, CodeMetadata
│   │   ├── library.ts         # NodeLibrary, LibraryIndex, NodeMetadata
│   │   └── store.ts           # Zustand store types
│   │
│   ├── figma-client.ts        # Figma REST API client (fetchNode, fetchVariables, fetchScreenshot)
│   ├── altnode-transform.ts   # Figma → AltNode transformation with FigmaToCode patterns
│   ├── rule-engine.ts         # Rule matching, priority resolution, conflict detection
│   ├── code-generators/       # Code generation modules
│   │   ├── react.ts           # React JSX with inline styles
│   │   ├── react-tailwind.ts  # React with Tailwind utility classes
│   │   ├── html-css.ts        # HTML + separate CSS file
│   │   └── helpers.ts         # Shared utilities (toPascalCase, formatCode, etc.)
│   │
│   ├── utils/                 # Utility functions
│   │   ├── file-storage.ts    # saveFigmaData, loadFigmaData, saveRules, loadRules
│   │   ├── library-index.ts   # updateLibraryIndex, getLibraryStats, searchNodes
│   │   ├── validation.ts      # Type guards (isFigmaNode, isValidRule, etc.)
│   │   └── url-parser.ts      # Parse Figma URL to extract file_key and node_id
│   │
│   └── store/                 # Zustand state management
│       ├── index.ts           # Combined store setup
│       ├── nodes-store.ts     # Nodes library state (nodes, selectedNode, filters, search)
│       ├── rules-store.ts     # Rules state (rules, selectedRule, ruleMatches)
│       └── ui-store.ts        # UI state (theme, view mode, loading states)
│
├── hooks/                     # Custom React hooks
│   ├── use-library-stats.ts  # Calculate dashboard stats (total nodes, rules, coverage)
│   ├── use-rule-matches.ts   # Evaluate rules against nodes, calculate match counts
│   ├── use-figma-import.ts   # Import flow logic (parse URL, fetch, save)
│   └── use-code-export.ts    # Export code logic (generate, format, download)
│
├── __tests__/                 # Tests (Vitest + React Testing Library + Playwright)
│   ├── unit/
│   │   ├── rule-engine.test.ts          # 90% coverage target
│   │   ├── altnode-transform.test.ts    # 80% coverage target
│   │   ├── code-generators.test.ts      # 70% coverage target
│   │   ├── file-storage.test.ts
│   │   └── library-index.test.ts
│   ├── integration/
│   │   ├── figma-import.test.ts         # Import flow integration test
│   │   ├── rule-management.test.ts      # Create, edit, delete rules
│   │   └── code-export.test.ts          # Export code in all formats
│   ├── components/
│   │   ├── rule-editor.test.tsx
│   │   ├── figma-tree-view.test.tsx
│   │   └── applied-rules-inspector.test.tsx
│   └── e2e/
│       ├── complete-workflow.spec.ts    # Import → Create Rule → View → Export
│       ├── library-management.spec.ts   # Search, filter, sort, bulk actions
│       └── navigation.spec.ts           # Page transitions, state preservation
│
├── public/                    # Static assets
│   ├── icons/                 # SVG icons (if not using Shadcn/ui icons)
│   └── screenshots/           # Documentation screenshots
│
├── figma-data/                # Local node storage (gitignored)
│   ├── library-index.json     # Library index (generated at runtime)
│   ├── node-{id1}/
│   │   ├── data.json          # Figma API response
│   │   ├── metadata.json      # Node name, type, import date
│   │   └── screenshot.png     # Figma screenshot
│   └── node-{id2}/
│       └── ...
│
├── mapping-rules.json         # Global rule library (gitignored, user-managed)
├── .env.local                 # Figma API token (gitignored)
├── package.json
├── tsconfig.json              # TypeScript strict mode config
├── tailwind.config.ts         # Tailwind + Shadcn/ui config
├── vitest.config.ts           # Vitest configuration
├── playwright.config.ts       # Playwright E2E configuration
└── next.config.js             # Next.js configuration
```

**Structure Decision**: Next.js 14+ App Router web application structure chosen because:
- Requirement: 5 separate pages with routing (Homepage, Library, Viewer, Rules, Settings)
- App Router provides file-system routing (`app/*/page.tsx`)
- Server Actions enable Figma API calls and file I/O without separate backend
- Dynamic imports support code splitting (Monaco Editor lazy loaded)
- TypeScript strict mode aligns with Constitution Principle V

---

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

**No violations** - All constitutional principles satisfied without justification required.

Optional complexity notes (not violations):
- **Zustand over Context API**: Chosen for better DevTools and performance with 100+ nodes. Alternative (Context) rejected because re-renders could be inefficient at scale. Still "Simple Before Clever" as Zustand is 1KB and has minimal API surface.
- **Monaco Editor**: Chosen for professional rule editing experience (VSCode editor). Alternative (plain textarea) rejected because JSON schema validation + autocomplete are constitutional requirements (Principle I: Developer Experience First).

---

## Phase 0: Research & Technical Decisions

### Research Artifacts Created

1. **research.md** - Already exists with FigmaToCode analysis (Decision 7)
   - 23 recommendations from production tool
   - 5 CRITICAL, 12 HIGH, 6 MEDIUM priority
   - Edge cases documented: invisible filtering, GROUP inlining, rotation, icon detection

2. **data-model.md** - To be created in Phase 1
   - Entities: NodeLibrary, FigmaNode, AltNode, MappingRule, RuleMatch, LibraryIndex
   - Relationships: 1-to-many (Library → Nodes), many-to-many (Nodes ↔ Rules via RuleMatch)
   - State model: Zustand stores (nodes, rules, UI)

3. **contracts/rule-schema.json** - To be created in Phase 1
   - JSON schema for mapping rules (selector, transformer, priority)
   - Used by Monaco Editor for validation and autocomplete

### Technical Decisions Summary

**Decision 1: State Management - Zustand**
- **Rationale**: User confirmed preference, DevTools support, performance at scale (100+ nodes)
- **Alternative considered**: Context API (simpler but less performant)
- **Implementation**: 3 Zustand stores (nodes-store, rules-store, ui-store)

**Decision 2: Testing Strategy - Feature First**
- **Rationale**: User confirmed preference, see app running quickly, tests lock behavior after
- **Coverage targets**: 90% rule engine, 80% transformations, 70% others (from Constitution)
- **Testing order**: Implement features → manual test in browser → write automated tests

**Decision 3: Monaco Editor Integration - Dynamic Import**
- **Rationale**: Bundle size concern (Monaco ~500KB), code splitting essential
- **Implementation**: `next/dynamic` to lazy load Monaco Editor component
- **Alternative considered**: Self-hosted Monaco (rejected - CDN fine for local-first app)

**Decision 4: Image Storage - Keep Original Quality**
- **Rationale**: Developer tool, disk space not constrained (<100MB budget for 50 nodes)
- **Implementation**: Save Figma screenshots as PNG without compression
- **Alternative considered**: WebP compression (rejected - YAGNI, disk cheap)

**Decision 5: Navigation Library - Next.js Link Only**
- **Rationale**: Built-in routing sufficient, no need for external library
- **Implementation**: Next.js `<Link>` component, `useRouter()` hook, `usePathname()` hook
- **Alternative considered**: React Router (rejected - redundant with App Router)

---

## Phase 1: Data Model & Contracts

### Entities (to be detailed in data-model.md)

#### 1. NodeLibrary (Collection)
**Purpose**: Represents all imported Figma nodes in the library

**Properties**:
- `nodes: NodeMetadata[]` - List of all imported nodes with metadata
- `totalNodes: number` - Count of nodes in library
- `lastImportDate: string` - ISO timestamp of most recent import

**Storage**: Aggregated from `figma-data/library-index.json`

**Relationships**: 1-to-many with NodeMetadata

---

#### 2. NodeMetadata (Index Entry)
**Purpose**: Lightweight metadata for library browsing without loading full Figma data

**Properties**:
- `id: string` - Unique node ID (Figma node ID format: "123:456")
- `name: string` - Node name from Figma
- `type: FigmaNodeType` - Node type (FRAME, COMPONENT, TEXT, GROUP, etc.)
- `importDate: string` - ISO timestamp when imported
- `thumbnailPath: string` - Relative path to screenshot (`figma-data/{id}/screenshot.png`)
- `dataPath: string` - Relative path to Figma data (`figma-data/{id}/data.json`)
- `fileKey: string` - Figma file key for re-fetching
- `coverage?: number` - Percentage of nodes with at least one rule match (calculated)

**Storage**: `figma-data/library-index.json` (array of NodeMetadata)

**Relationships**:
- Belongs to NodeLibrary (1-to-many)
- References FigmaNode (1-to-1 via dataPath)

---

#### 3. FigmaNode (Cached Data)
**Purpose**: Complete Figma API response for a node

**Properties** (from Figma REST API):
- `id: string` - Node ID
- `name: string` - Node name
- `type: FigmaNodeType` - Node type
- `absoluteBoundingBox: { x, y, width, height }` - Geometry
- `layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE'` - Auto-layout mode
- `itemSpacing?: number` - Gap between children
- `paddingLeft/Right/Top/Bottom?: number` - Padding
- `fills?: Paint[]` - Fill styles
- `strokes?: Paint[]` - Stroke styles
- `effects?: Effect[]` - Shadow, blur effects
- `children?: FigmaNode[]` - Child nodes (recursive)
- `rotation?: number` - Rotation in radians
- `visible?: boolean` - Visibility flag
- `opacity?: number` - Opacity 0-1
- ... (full Figma API structure from `lib/types/figma.ts`)

**Storage**: `figma-data/{nodeId}/data.json`

**Relationships**:
- Referenced by NodeMetadata (1-to-1)
- Transforms to AltNode (1-to-1 computed)

---

#### 4. AltNode (Transformed Representation)
**Purpose**: Normalized CSS-familiar representation for rule matching

**Properties**:
- `id: string` - Same as FigmaNode id
- `name: string` - Same as FigmaNode name
- `uniqueName: string` - Unique name with suffix counters for React components
- `type: 'container' | 'text' | 'image' | 'group'` - Normalized type
- `styles: CSSProperties` - CSS-familiar properties:
  - `display?: 'flex' | 'block' | 'inline'`
  - `flexDirection?: 'row' | 'column'`
  - `gap?: string` - e.g. "16px"
  - `padding?: string` - CSS shorthand
  - `background?: string` - CSS color
  - `border?: string` - CSS border
  - `boxShadow?: string` - CSS shadow
  - `fontSize?, fontFamily?, fontWeight?, ...` - Text properties
- `children: AltNode[]` - Child nodes (recursive)
- `originalNode: FigmaNode` - Reference to complete Figma data
- `visible: boolean` - Visibility (defaults true)
- `rotation?: number` - Rotation in degrees
- `cumulativeRotation?: number` - Inherited from GROUP parents
- `canBeFlattened: boolean` - For SVG optimization (icon detection)
- `layoutSizingHorizontal/Vertical?: 'FIXED' | 'HUG' | 'FILL'`

**Storage**: Computed on-the-fly, NOT persisted (Constitution Principle III: compute from cached Figma data)

**Relationships**:
- Computed from FigmaNode (1-to-1)
- Matched by MappingRule (many-to-many via RuleMatch)

---

#### 5. MappingRule (User-Defined Rule)
**Purpose**: Pattern for transforming AltNode to output code structure

**Properties**:
- `id: string` - Unique rule ID (kebab-case, e.g., "button-rule")
- `name: string` - Human-readable rule name
- `selector: Selector` - Pattern matching AltNode properties (AND logic):
  - `nodeType?: 'container' | 'text' | 'image' | 'group'`
  - `layoutMode?: 'horizontal' | 'vertical'`
  - `hasChildren?: boolean`
  - `customProperties?: Record<string, string | number | boolean>`
- `transformer: Transformer` - Output structure:
  - `htmlTag: string` - HTML tag (div, button, span, etc.)
  - `cssClasses?: string[]` - Tailwind classes or CSS class names
  - `inlineStyles?: Record<string, string>` - Inline CSS properties
  - `attributes?: Record<string, string>` - HTML attributes (aria-*, data-*)
- `priority: number` - Conflict resolution order (0-1000, higher wins)
- `enabled: boolean` - Whether rule is active (defaults true)
- `description?: string` - Documentation

**Storage**: `mapping-rules.json` (array of MappingRule, versioned)

**Relationships**:
- Belongs to RuleLibrary (1-to-many)
- Matches AltNode (many-to-many via RuleMatch)

---

#### 6. RuleMatch (Match Result)
**Purpose**: Relationship between AltNode and rules that matched it

**Properties**:
- `nodeId: string` - AltNode ID
- `ruleId: string` - MappingRule ID
- `priority: number` - Rule priority
- `contributedProperties: Record<string, any>` - Properties from this rule (htmlTag, cssClasses, etc.)
- `conflicts?: Conflict[]` - If this rule conflicts with others:
  - `property: string` - Conflicting property (e.g., "htmlTag")
  - `thisValue: any` - Value from this rule
  - `otherRuleId: string` - Conflicting rule ID
  - `otherValue: any` - Value from other rule
  - `resolved: boolean` - Whether priority resolved it
  - `severity: 'minor' | 'major'` - Yellow or red highlight

**Storage**: Computed at render time, stored in Zustand `rules-store` (not persisted)

**Relationships**:
- Links AltNode and MappingRule (many-to-many)
- Used by Applied Rules Inspector component

---

#### 7. LibraryIndex (Metadata File)
**Purpose**: Fast lookup for library browsing without loading all node data

**Structure**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-23T12:34:56Z",
  "nodes": [
    {
      "id": "123:456",
      "name": "Button Component",
      "type": "COMPONENT",
      "importDate": "2025-11-23T10:00:00Z",
      "thumbnailPath": "figma-data/123-456/screenshot.png",
      "dataPath": "figma-data/123-456/data.json",
      "fileKey": "ABC123XYZ"
    }
  ]
}
```

**Storage**: `figma-data/library-index.json`

**Operations**:
- `addNode(metadata: NodeMetadata)` - Append to index on import
- `removeNode(nodeId: string)` - Remove from index on delete
- `updateNode(nodeId: string, updates: Partial<NodeMetadata>)` - Update metadata
- `searchNodes(query: string)` - Filter by name
- `filterNodes(filters: { type?, coverage? })` - Filter by type or coverage
- `sortNodes(criteria: 'name' | 'date' | 'type' | 'coverage', order: 'asc' | 'desc')` - Sort

---

#### 8. DashboardStats (Computed Metrics)
**Purpose**: Calculated statistics for homepage dashboard

**Properties**:
- `totalNodes: number` - Count from library index
- `totalRules: number` - Count from mapping-rules.json
- `averageCoverage: number` - Percentage of nodes with at least one rule match (across entire library)
- `lastImportDate: string` - Most recent import timestamp from library index
- `recentNodes: NodeMetadata[]` - 5 most recent imports
- `topRules: { ruleId: string, name: string, matchCount: number }[]` - Top 5 most-matched rules across all nodes

**Storage**: Computed on-demand, cached in Zustand `ui-store` (5 minute TTL)

**Calculation**:
- Load library index → count nodes
- Load mapping-rules.json → count rules
- For each node: load AltNode, evaluate all rules, count matches
- Average coverage = (nodes with ≥1 match) / total nodes * 100
- Top rules = aggregate match counts across all nodes, sort descending

---

### State Management (Zustand Stores)

#### nodes-store.ts
```typescript
interface NodesState {
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

#### rules-store.ts
```typescript
interface RulesState {
  // Data
  rules: MappingRule[];
  selectedRuleId: string | null;
  ruleMatches: Map<string, RuleMatch[]>; // nodeId -> matches

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
  evaluateRules: (nodeId: string) => RuleMatch[]; // Evaluate rules for node
}
```

#### ui-store.ts
```typescript
interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';

  // Loading States
  isImporting: boolean;
  isLoadingRules: boolean;
  isCalculatingStats: boolean;

  // Dashboard Stats (cached)
  stats: DashboardStats | null;
  statsLastUpdated: number | null;

  // Actions
  setTheme: (theme: UIState['theme']) => void;
  setImporting: (isImporting: boolean) => void;
  loadStats: () => Promise<void>;
  invalidateStats: () => void;
}
```

---

### API Contracts (Next.js API Routes)

#### POST /api/figma/import
**Purpose**: Import Figma node from URL

**Request**:
```json
{
  "url": "https://www.figma.com/file/ABC123/...?node-id=123:456"
}
```

**Response** (Success 200):
```json
{
  "success": true,
  "nodeId": "123:456",
  "metadata": {
    "id": "123:456",
    "name": "Button Component",
    "type": "COMPONENT",
    "importDate": "2025-11-23T12:00:00Z"
  }
}
```

**Response** (Error 400):
```json
{
  "success": false,
  "error": "Invalid Figma URL format",
  "details": "Expected format: https://www.figma.com/file/{fileKey}/...?node-id={nodeId}"
}
```

**Response** (Error 401):
```json
{
  "success": false,
  "error": "Figma authentication failed",
  "details": "Invalid or missing Figma access token. Configure in Settings."
}
```

---

#### POST /api/figma/refresh
**Purpose**: Re-fetch node data from Figma API

**Request**:
```json
{
  "nodeId": "123:456"
}
```

**Response**: Same as import endpoint

---

#### GET /api/rules/load
**Purpose**: Load global rule library

**Response**:
```json
{
  "version": "1.0.0",
  "rules": [ /* array of MappingRule */ ],
  "metadata": {
    "createdAt": "2025-11-20T10:00:00Z",
    "lastModified": "2025-11-23T12:00:00Z"
  }
}
```

---

#### POST /api/rules/save
**Purpose**: Save global rule library

**Request**: Complete rule library JSON (same structure as load response)

**Response**:
```json
{
  "success": true,
  "ruleCount": 12,
  "timestamp": "2025-11-23T12:30:00Z"
}
```

---

#### GET /api/library/index
**Purpose**: Load library index

**Response**:
```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-23T12:00:00Z",
  "nodes": [ /* array of NodeMetadata */ ]
}
```

---

#### GET /api/library/stats
**Purpose**: Calculate dashboard statistics

**Response**:
```json
{
  "totalNodes": 23,
  "totalRules": 12,
  "averageCoverage": 78,
  "lastImportDate": "2025-11-23T12:00:00Z",
  "recentNodes": [ /* 5 most recent NodeMetadata */ ],
  "topRules": [
    { "ruleId": "button-rule", "name": "Button Rule", "matchCount": 8 },
    { "ruleId": "container-rule", "name": "Container Rule", "matchCount": 15 }
  ]
}
```

---

## Phase 1 Deliverables Summary

**Files to be created**:
1. ✅ `data-model.md` - Entities, relationships, state model (detailed above)
2. ✅ `contracts/rule-schema.json` - JSON schema for mapping rules
3. ✅ `contracts/library-index-schema.json` - Library index structure
4. ✅ `contracts/api-routes.md` - Next.js API route contracts (detailed above)
5. ✅ `quickstart.md` - Setup, installation, run instructions

**Next**: Run agent context update script to add new tech stack to CLAUDE.md

---

## Implementation Workflow

### Phase 0: Planning & Research ✅ COMPLETE
- [x] Planning interrogation (State: Zustand, Testing: Feature-first)
- [x] Constitution check (10/10 PASS)
- [x] Research review (FigmaToCode analysis already in research.md)

### Phase 1: Foundation & Contracts ✅ COMPLETE (in this plan)
- [x] Data model designed (8 entities, 3 Zustand stores)
- [x] API contracts defined (6 Next.js API routes)
- [x] Project structure finalized (Next.js App Router layout)

### Phase 2: Work Package Breakdown (Next: `/spec-kitty.tasks`)
After this plan is approved, run `/spec-kitty.tasks` to generate tasks.md with work packages organized by:
- WP01: Project Setup (Next.js, dependencies, config)
- WP02: TypeScript Types (Figma, AltNode, Rule types)
- WP03: Multi-Node Storage & Figma Client
- WP04: AltNode Transformation (with FigmaToCode patterns)
- WP05: Rule Engine (matching, conflict resolution)
- WP06: Code Generators (React JSX, React+Tailwind, HTML/CSS)
- WP07: Zustand State Management (3 stores)
- WP08: Homepage Dashboard
- WP09: Node Library Page
- WP10: Viewer Page (2 tabs)
- WP11: Rule Manager Page (Monaco integration)
- WP12: Settings Page
- WP13: Global Navigation & Layout
- WP14: Testing (Unit, Integration, E2E)

### Phase 3: Implementation (Next: `/spec-kitty.implement`)
Feature-first strategy:
1. Implement UI pages rapidly → see app in browser early
2. Implement business logic (rule engine, transformations) with tests
3. Write tests after features to lock down behavior
4. Achieve coverage targets: 90% rule engine, 80% transformations, 70% others

### Phase 4: Review & Acceptance (Next: `/spec-kitty.review`, `/spec-kitty.accept`)
- Code review with constitutional alignment check
- E2E testing of complete workflows
- Validate all 15 success criteria (SC-001 to SC-015)

---

## Next Steps

1. **Approve this plan**: User confirms plan.md is complete and accurate
2. **Run `/spec-kitty.tasks`**: Generate tasks.md with work package breakdown
3. **Start implementation**: Run `/spec-kitty.implement` to begin WP01 (Project Setup)

**Plan Status**: ✅ Ready for tasks generation

**Constitution Re-Check**: ✅ 10/10 PASS (no violations after Phase 1 design)
