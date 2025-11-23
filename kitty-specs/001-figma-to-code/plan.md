# Implementation Plan: Figma-to-Code Rule Builder
*Path: [kitty-specs/001-figma-to-code/plan.md](kitty-specs/001-figma-to-code/plan.md)*

**Branch**: `001-figma-to-code` | **Date**: 2025-11-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/001-figma-to-code/spec.md`

## Summary

Build a web-based developer workbench for creating and testing reusable mapping rules that transform Figma design properties into code. The tool fetches Figma data once via API, caches it locally, transforms it into a normalized AltNode representation, and provides a three-panel interface: left panel for AltNode tree navigation, center panel for JSON rule editing with Monaco Editor, and right panel with live previews (React JSX, React+Tailwind, HTML/CSS) that update within 100ms of rule changes. Rules use priority-based composition to resolve conflicts. The complete rule library exports as framework-agnostic JSON for use in production tools.

**Technical approach**: Next.js 14+ App Router with TypeScript strict mode, React 18+ UI, Shadcn/ui components, Tailwind CSS styling. Clean separation into lib modules (figma-client, altnode-transform, rule-engine, code-generators). File-based storage in figma-data/ folder and mapping-rules.json at root. Local dev primary deployment with optional Vercel for team sharing.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), Node.js 18+ for runtime
**Primary Dependencies**:
- Next.js 14+ (App Router, API routes, file system operations)
- React 18+ (UI, state management, concurrent rendering)
- Monaco Editor (rule editor with JSON syntax highlighting)
- Shadcn/ui (component library for UI chrome)
- Tailwind CSS (utility-first styling)
- Figma REST API client

**Storage**: File-based local storage (no database)
- Cached Figma data: `figma-data/{node-id}.json`, `{node-id}-variables.json`, `{node-id}-screenshot.png`
- Rule library: `mapping-rules.json` at project root
- Configuration: `.env.local` with `FIGMA_ACCESS_TOKEN`

**Testing**: Vitest for unit tests, React Testing Library for component tests, Playwright for E2E tests
- Unit: lib modules (figma-client, altnode-transform, rule-engine, code-generators)
- Integration: API routes, file operations, Figma API mocking
- E2E: Full workflow from fetch to preview updates

**Target Platform**: Modern web browsers (Chrome, Firefox, Safari) on desktop
**Project Type**: Web application (Next.js single-page app with API routes)
**Performance Goals**:
- Preview updates: <100ms after rule change (constitution requirement)
- Rule validation: <50ms (instant feel)
- Initial Figma fetch: <5 seconds (spec requirement)
- Cache load on startup: <200ms

**Constraints**:
- Offline-first after initial fetch (zero API calls during rule editing)
- Memory: <500MB for typical 50-component Figma file
- Disk: <100MB cache per project
- CPU: <10% steady state during file watching

**Scale/Scope**:
- Target: Single developer workbench, local-first
- Typical workload: 1-5 Figma nodes loaded, 10-50 mapping rules
- Tree depth: Up to 100 levels (deeply nested Figma frames)
- Optional: Vercel deployment for team sharing (still dev tool, not production)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Developer Experience First ✅

**Compliance**: PASS
- Zero-config startup: `npm run dev` + `.env.local` token = ready
- Real-time rule validation: Monaco editor with JSON schema
- Instant feedback: <100ms preview updates (React state + debouncing)
- Clear errors: Figma API failures, rule syntax errors with line numbers
- Single command flow: Paste URL → Fetch → Edit rules → See previews

**Evidence**:
- FR-016: Real-time syntax validation
- FR-036: 100ms preview update requirement
- SC-002: Create rule and see applied within 100ms

### II. Clear Separation of Concerns ✅

**Compliance**: PASS
- **Data fetching**: `lib/figma-client.ts` - API calls, caching, error handling
- **Transformation**: `lib/altnode-transform.ts` - Figma JSON → AltNode normalization
- **Rule engine**: `lib/rule-engine.ts` - Pattern matching, priority resolution, conflict tracking
- **Code generation**: `lib/code-generators/{react,react-tailwind,html-css}.ts` - Framework-specific output

**Evidence**:
- User provided explicit file structure matching constitution layers
- FR-008 to FR-011: AltNode transformation isolated
- FR-020 to FR-028: Rule engine logic separate
- Each layer exports TypeScript interfaces for inter-layer contracts

### III. Data Locality (NON-NEGOTIABLE) ✅

**Compliance**: PASS
- Single fetch on initial load: Next.js API route calls Figma REST API once
- All data cached in `figma-data/` folder via Node.js fs module
- Subsequent operations read from cache: AltNode computed on-the-fly from cached JSON
- Explicit refresh: User action triggers new API call (FR-005)
- Offline mode identical to online after fetch

**Evidence**:
- FR-003: Store all fetched data in local filesystem cache
- FR-004: Operate entirely from cached data after initial fetch
- SC-009: Zero additional API calls during rule editing
- User confirmed offline-first as core requirement

### IV. Rule Portability ✅

**Compliance**: PASS
- Rules stored as pure JSON: `mapping-rules.json` at root
- Framework-agnostic schema: Selector (AltNode patterns) + Transformer (output structure)
- No code in rules: JSON only, no DSL or embedded functions
- Import/export: Load existing JSON, export current library
- Git-friendly: Human-readable formatting, clean diffs (FR-042)

**Evidence**:
- FR-040: Exported rules JSON MUST be framework-agnostic
- FR-039: Export as valid, portable JSON file
- User specified "rules = simple JSON" and "mapping-rules.json at project root"

### V. Type Safety Throughout ✅

**Compliance**: PASS
- TypeScript strict mode enabled in tsconfig.json
- No `any` types: Use `unknown` or explicit types (e.g., `FigmaNode`, `AltNode`, `MappingRule`)
- All public APIs typed: lib module exports, API route handlers, React component props
- Runtime validation at boundaries: Figma API responses, loaded JSON rules, user input
- Discriminated unions: Rule selector types, AltNode variants, conflict severity levels

**Evidence**:
- User specified "TypeScript throughout" and "TypeScript strict mode"
- Constitution mandates compilation with zero TypeScript errors
- All lib modules in TypeScript (.ts), React components (.tsx)

### VI. Simple Before Clever ✅

**Compliance**: PASS
- Core workflow first: Fetch → Transform → Apply rules → Generate code
- No premature optimization: Direct React state updates, simple debounce for 100ms
- No unnecessary abstractions: Flat lib/ structure, explicit function calls
- Features require user story: All 6 user stories mapped to requirements
- Measure before optimize: Performance targets guide, not prescribe implementation

**Evidence**:
- User rejected batch testing, automated rule analysis (out of scope - keep simple)
- File-based storage over database (simpler)
- Direct Monaco Editor integration (no custom DSL)
- Constitution: "Working software beats elegant architecture"

### VII. Live Feedback ✅

**Compliance**: PASS
- File watcher not needed (in-memory rule editing in browser)
- Rule changes trigger React state update → immediate re-render
- Preview updates within 100ms: React concurrent rendering + debounced rule engine execution
- Syntax highlighting: Monaco for rules, Prism/Shiki for generated code
- Error highlighting: Monaco language server for JSON validation
- Real-time match indicators: Tree nodes show badge count, update on rule change

**Evidence**:
- FR-036: System MUST update all previews within 100ms
- FR-037: Preview updates MUST not require page refresh
- SC-003: Modify rule and observe previews update within 100ms
- User confirmed "instant updates" as core requirement

### Additional Checks

**Testing Standards**: PASS
- Unit tests: Core logic (rule engine 90%+, transformations 80%+)
- Integration tests: API routes, file operations, caching
- Contract tests: Rule JSON schema validation, code generation outputs
- Manual test: quickstart.md workflow documentation

**Documentation Requirements**: PASS
- README: Setup, quickstart, concepts
- Rule schema docs: Field explanations with examples
- Troubleshooting: Common errors (API auth, invalid JSON, rate limits)
- Module docs: Each lib file includes purpose, usage, examples

**Performance Standards**: PASS
- All targets documented in Technical Context
- Aligned with constitution requirements (<100ms preview, <5s fetch)

**Overall Constitutional Compliance**: ✅ PASS - No violations, proceed to Phase 0

## Project Structure

### Documentation (this feature)

```
kitty-specs/001-figma-to-code/
├── plan.md              # This file (/spec-kitty.plan command output)
├── spec.md              # Feature specification (completed)
├── research.md          # Phase 0 output (next step)
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API schemas)
│   ├── figma-api.yaml   # Figma REST API endpoints used
│   ├── rule-schema.json # Mapping rule JSON schema
│   └── altnode-schema.json # AltNode structure definition
└── tasks.md             # Phase 2 output (/spec-kitty.tasks command)
```

### Source Code (repository root)

Next.js 14+ App Router structure:

```
figma-rules-builder/
├── .env.local                    # Config: FIGMA_ACCESS_TOKEN
├── .gitignore                    # Excludes: .env.local, figma-data/, node_modules/
├── package.json                  # Dependencies: next, react, monaco-editor, etc.
├── tsconfig.json                 # TypeScript strict mode configuration
├── tailwind.config.ts            # Tailwind + Shadcn/ui setup
├── next.config.js                # Next.js configuration
│
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout, fonts, providers
│   ├── page.tsx                  # Main workbench (3-panel interface)
│   ├── globals.css               # Tailwind directives, global styles
│   │
│   └── api/                      # API routes
│       ├── figma/
│       │   ├── fetch/route.ts    # POST: Fetch Figma node, save to figma-data/
│       │   └── refresh/route.ts  # POST: Re-fetch (explicit refresh)
│       ├── rules/
│       │   ├── save/route.ts     # POST: Save mapping-rules.json
│       │   └── load/route.ts     # GET: Load mapping-rules.json
│       └── preview/
│           └── render/route.ts   # POST: Generate code for iframe preview
│
├── components/                   # React components (Shadcn/ui + custom)
│   ├── ui/                       # Shadcn/ui primitives (button, tabs, etc.)
│   ├── figma-tree-view.tsx       # Left panel: Recursive AltNode tree
│   ├── rule-editor.tsx           # Center panel: Monaco Editor wrapper
│   ├── preview-tabs.tsx          # Right panel: 3 tabs (React JSX, React+TW, HTML/CSS)
│   ├── preview-iframe.tsx        # Iframe for rendered output
│   ├── code-display.tsx          # Syntax-highlighted code viewer
│   └── node-match-sidebar.tsx    # Sidebar showing rules matching clicked node
│
├── lib/                          # Core logic (TypeScript modules)
│   ├── figma-client.ts           # Figma REST API wrapper
│   │   # Functions: fetchNode(fileKey, nodeId), fetchVariables(fileKey)
│   │   # Handles: Auth (token from env), rate limits, errors, caching to fs
│   │
│   ├── altnode-transform.ts      # Figma JSON → AltNode normalization
│   │   # Functions: transformToAltNode(figmaNode), normalizeLayout(), normalizeFills()
│   │   # Handles: Auto-layout→flexbox, spacing→gap, fills→background, constraints, etc.
│   │
│   ├── rule-engine.ts            # Rule matching & conflict resolution
│   │   # Functions: evaluateRules(altNode, rules), resolveConflicts(matches)
│   │   # Handles: Pattern matching, priority sorting, property composition/override
│   │
│   ├── code-generators/          # Framework-specific code generation
│   │   ├── react.ts              # Generate React JSX components
│   │   ├── react-tailwind.ts     # Generate React with Tailwind classes
│   │   └── html-css.ts           # Generate HTML + CSS
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── figma.ts              # Figma API response types
│   │   ├── altnode.ts            # AltNode structure types
│   │   ├── rule.ts               # MappingRule, Selector, Transformer types
│   │   └── generated-code.ts     # Code generation output types
│   │
│   └── utils/                    # Shared utilities
│       ├── file-storage.ts       # fs operations for cache & rules
│       ├── debounce.ts           # Debouncing for preview updates
│       └── validation.ts         # JSON schema validation
│
├── public/                       # Static assets
│   └── examples/                 # Example rule libraries for onboarding
│       └── basic-buttons.json
│
├── figma-data/                   # Local cache (gitignored)
│   # Runtime generated:
│   # - {node-id}.json             # Cached Figma node tree
│   # - {node-id}-variables.json   # Design tokens/variables
│   # - {node-id}-screenshot.png   # Reference screenshot
│
├── mapping-rules.json            # Rule library (gitignored by default, user can commit)
│
└── __tests__/                    # Test suites
    ├── unit/                     # Vitest unit tests
    │   ├── figma-client.test.ts
    │   ├── altnode-transform.test.ts
    │   ├── rule-engine.test.ts
    │   └── code-generators.test.ts
    ├── integration/              # Integration tests (API routes, file ops)
    │   ├── api-fetch.test.ts
    │   └── rules-persistence.test.ts
    └── e2e/                      # Playwright E2E tests
        └── full-workflow.spec.ts
```

**Structure Decision**: Next.js App Router web application with clean lib/ separation. No backend/frontend split needed since Next.js API routes handle server logic. File-based storage eliminates database complexity. Shadcn/ui provides accessible component primitives. Monaco Editor embedded directly in center panel. Three code generators in lib/code-generators/ for framework-specific output.

## Complexity Tracking

*No constitutional violations - this section intentionally empty.*

All architecture choices align with the seven core principles:
- Developer Experience: Zero-config, instant feedback, clear errors
- Separation of Concerns: Explicit lib modules per layer
- Data Locality: File-based cache, offline-first
- Rule Portability: Framework-agnostic JSON
- Type Safety: TypeScript strict throughout
- Simple Before Clever: Direct implementations, no premature abstraction
- Live Feedback: React state + debouncing for <100ms updates

No complexity justification required.

## Phase 0: Research (Next Step)

After constitutional validation, proceed with:
1. Run `/spec-kitty.research` to scaffold research.md and data-model.md
2. Research decisions to document:
   - Figma REST API endpoints and response formats (GET /v1/files/:key, GET /v1/files/:key/nodes)
   - AltNode transformation edge cases (absolute positioning in auto-layout, overlapping z-index, multi-style text)
   - Monaco Editor integration patterns (language server setup, JSON schema validation)
   - Code generation strategies (AST vs template-based, syntax highlighting libraries)
   - Rule selector pattern matching algorithms (CSS-like selectors vs property filters)
   - Conflict resolution precedence rules (property-level vs rule-level priority)
3. Data model to define:
   - FigmaNode structure (from API responses)
   - AltNode normalized representation
   - MappingRule schema (selector, transformer, priority)
   - RuleMatch tracking (which rule contributes which property)
   - GeneratedCode output formats

## Phase 1: Design & Contracts (After Research)

1. Generate data-model.md with entities and relationships
2. Create API contracts:
   - `contracts/figma-api.yaml`: Figma REST API endpoints
   - `contracts/rule-schema.json`: Mapping rule JSON schema (for validation)
   - `contracts/altnode-schema.json`: AltNode structure definition
3. Write quickstart.md with setup instructions:
   - Clone repo, `npm install`
   - Create `.env.local` with `FIGMA_ACCESS_TOKEN`
   - `npm run dev` → http://localhost:3000
   - Paste Figma URL → Fetch → Create rule → See preview
4. Update agent context (.claude.md or equivalent)

## Next Steps

1. ✅ **Constitution Check PASSED** - Proceed to Phase 0
2. Run `/spec-kitty.research` to scaffold research artifacts
3. Fill research.md with Figma API investigation, AltNode normalization decisions, Monaco setup
4. Complete data-model.md with entity definitions
5. Generate contracts/ schemas
6. Write quickstart.md
7. Proceed to `/spec-kitty.tasks` to break down into work packages
