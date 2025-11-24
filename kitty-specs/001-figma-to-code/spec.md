# Feature Specification: Figma-to-Code Rule Builder
*Path: [kitty-specs/001-figma-to-code/spec.md](kitty-specs/001-figma-to-code/spec.md)*

**Feature Branch**: `001-figma-to-code`
**Created**: 2025-11-23
**Last Updated**: 2025-11-23
**Status**: Draft
**Input**: "Build a multi-node library manager for creating, testing, and managing reusable Figma-to-Code mapping rules. Users import multiple Figma nodes, build one global rule library, and test rules against the entire library to ensure consistency across design systems."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import Figma Nodes into Library (Priority: P0)

Developer visits the homepage, pastes a Figma URL in the import field, and clicks "Import Node". The system auto-parses the file_key and node_id, fetches design data via Figma API, stores it locally with metadata and thumbnail, and adds it to the node library. The homepage dashboard updates to show the new node in recent imports.

**Why this priority**: Multi-node library management requires the ability to import and store multiple nodes. This is the foundational capability that enables all other workflows.

**Independent Test**: Paste a valid Figma URL (e.g., `https://www.figma.com/file/ABC123/...?node-id=1-2`), click Import, verify the node appears in the library grid with thumbnail, name, type, and import date. Navigate to Node Library page and confirm the new node is listed.

**Acceptance Scenarios**:

1. **Given** valid Figma URL, **When** user pastes it in import field and clicks Import, **Then** system auto-parses file_key and node_id
2. **Given** parsed URL, **When** import starts, **Then** system fetches node tree, geometry, variables, and screenshot via Figma API
3. **Given** Figma data fetched, **When** save completes, **Then** system creates `figma-data/{nodeId}/data.json`, `metadata.json`, and `screenshot.png`
4. **Given** node saved, **When** library updates, **Then** new node appears in homepage recent imports and Node Library page
5. **Given** invalid URL or missing token, **When** import attempted, **Then** system shows toast error with clear message and option to navigate to Settings

---

### User Story 2 - Browse and Manage Node Library (Priority: P0)

Developer navigates to Node Library page and sees a grid or list view of all imported nodes with thumbnails, names, types, import dates, and rule coverage percentage. Developer can search by name, filter by type or coverage, sort by various criteria, and perform bulk actions (delete multiple, export selected). Clicking a node card navigates to the Viewer page.

**Why this priority**: Library management is essential for working with multiple nodes efficiently. Without search, filter, and bulk actions, managing 20+ nodes becomes cumbersome.

**Independent Test**: Import 5 nodes, navigate to Library page, toggle between grid and list view, search for a node by name, filter by type, sort by date, select 2 nodes and delete them. Verify the library updates correctly.

**Acceptance Scenarios**:

1. **Given** imported nodes, **When** user navigates to `/nodes`, **Then** page displays all nodes in grid view with thumbnails, names, types, and dates
2. **Given** grid view active, **When** user clicks grid/list toggle, **Then** view switches to table format with additional columns (coverage, actions)
3. **Given** search input, **When** user types node name, **Then** grid filters in real-time to show matching nodes
4. **Given** filter dropdown, **When** user selects type (FRAME, TEXT, etc.), **Then** grid shows only nodes of that type
5. **Given** sort dropdown, **When** user selects "Date (newest first)", **Then** nodes reorder with most recent at top
6. **Given** multiple nodes selected, **When** user clicks "Delete Selected", **Then** confirmation dialog appears and nodes are removed after confirm
7. **Given** node card, **When** user clicks it, **Then** browser navigates to `/viewer/{nodeId}`
8. **Given** node card actions, **When** user clicks "Export", **Then** format selection dialog appears (React+CSS, React+Tailwind, HTML/CSS)

---

### User Story 3 - View Dashboard with Library Stats (Priority: P1)

Developer visits the homepage and sees a dashboard displaying key metrics: total nodes imported, total active rules, average rule coverage across all nodes, and last import date. The dashboard includes quick access to recent nodes (5 most recent with thumbnails) and a chart showing rule usage (top 5 most-matched rules). A prominent "Import Figma Node" button with URL input field is always visible.

**Why this priority**: Dashboard provides instant insight into library health and productivity. Developers can quickly assess coverage gaps and identify heavily-used rules without navigating through pages.

**Independent Test**: Import 10 nodes, create 5 rules, navigate to homepage. Verify stats show correct counts, coverage percentage is calculated, recent nodes are displayed with thumbnails, and rule usage chart shows match counts.

**Acceptance Scenarios**:

1. **Given** imported nodes and rules, **When** user visits `/`, **Then** stats cards show: total nodes, total rules, avg coverage %, last import date
2. **Given** recent imports exist, **When** dashboard renders, **Then** "Recent Nodes" section shows 5 most recent with thumbnails and names
3. **Given** rules with matches, **When** dashboard renders, **Then** "Rule Usage" chart displays top 5 rules by match count across all nodes
4. **Given** URL import field visible, **When** user pastes Figma URL and clicks Import, **Then** import flow starts and dashboard updates after completion
5. **Given** quick actions, **When** user clicks "View All Nodes" or "Manage Rules", **Then** browser navigates to respective pages

---

### User Story 4 - Inspect Individual Nodes in Viewer (Priority: P1)

Developer clicks a node in the library and navigates to the Viewer page showing read-only inspection. The Viewer has two tabs: "Code" tab displays Figma tree on the left with Applied Rules Inspector on the right (showing which rules matched, priority resolution, conflicts, coverage stats), "Render" tab shows full-width preview with format switcher (React JSX, React+Tailwind, HTML/CSS). Header includes prev/next navigation, thumbnail (expandable), re-fetch, export, and "Edit Rules" button that jumps to Rule Manager with this node pre-selected for testing.

**Why this priority**: Inspecting nodes with applied rules is critical for understanding transformation results and validating rule behavior. This is the primary debugging and verification interface.

**Independent Test**: Click a node, verify Viewer opens with two tabs. In Code tab, click nodes in Figma tree and verify Applied Rules Inspector updates showing matched rules, conflicts, and coverage. In Render tab, switch between formats and verify previews update. Click "Edit Rules" and verify Rule Manager opens with this node selected.

**Acceptance Scenarios**:

1. **Given** node selected, **When** Viewer page loads, **Then** header shows thumbnail, node name, prev/next buttons, re-fetch, export dropdown, "Edit Rules" button
2. **Given** Code tab active, **When** page renders, **Then** left panel shows Figma tree, right panel shows Applied Rules Inspector
3. **Given** node clicked in tree, **When** selection changes, **Then** Applied Rules Inspector updates to show:
   - List of matched rules ordered by priority
   - Priority resolution (which rule wins for each property)
   - Conflicts highlighted (yellow for minor, red for major)
   - Coverage stats (X/Y nodes have rules applied)
   - Unused rules warning
4. **Given** Render tab active, **When** page renders, **Then** full-width iframe shows preview with format switcher in header (React JSX, React+Tailwind, HTML/CSS)
5. **Given** format switcher, **When** user selects different format, **Then** preview re-renders with selected framework output
6. **Given** "Edit Rules" button, **When** user clicks it, **Then** browser navigates to `/rules` with this node pre-selected in test zone
7. **Given** export dropdown, **When** user selects format, **Then** code export dialog appears with copy-to-clipboard and download options

---

### User Story 5 - Manage Global Rule Library (Priority: P0)

Developer navigates to Rule Manager page showing a sidebar with searchable rule list (each rule displays name, priority, match count across all nodes, and unused warning), and a main panel with rule details (selected rule shows ID, name, priority, selector preview, transformer preview, match count, actions: Edit JSON, Duplicate, Delete). Clicking "Edit JSON" opens Monaco editor modal. Top actions include "New Rule", "Import Rules", and "Export Rules" for sharing rule libraries between projects.

**Why this priority**: Rule management is the core value proposition. Without ability to create, edit, organize, and share rules, the tool provides no utility. Global rule library (not per-node rules) is a constitutional requirement.

**Independent Test**: Navigate to `/rules`, create a new rule via Monaco modal, verify it appears in sidebar with match count. Edit the rule, duplicate it, delete it. Import a rules JSON file, verify all rules load. Export rules, verify JSON file downloads with correct format.

**Acceptance Scenarios**:

1. **Given** `/rules` page, **When** page loads, **Then** sidebar shows searchable rule list with name, priority, match count badges
2. **Given** rule list, **When** rule has 0 matches across all nodes, **Then** it displays "⚠️ Unused" warning
3. **Given** rule selected, **When** main panel updates, **Then** shows: ID, name, priority (editable), selector preview, transformer preview, match count, actions
4. **Given** "Edit JSON" button, **When** clicked, **Then** Monaco editor modal opens with rule JSON, schema validation active, autocomplete enabled
5. **Given** Monaco editor, **When** user edits rule and saves, **Then** rule updates in list and match counts re-calculate across all nodes
6. **Given** "New Rule" button, **When** clicked, **Then** Monaco modal opens with template rule JSON
7. **Given** "Import Rules" button, **When** user uploads JSON file, **Then** validation runs and rules merge into library (with conflict resolution dialog if duplicate IDs)
8. **Given** "Export Rules" button, **When** clicked, **Then** `mapping-rules.json` downloads containing complete rule library
9. **Given** "Duplicate" action, **When** clicked, **Then** new rule created with same selector/transformer but new ID and priority
10. **Given** "Delete" action, **When** clicked, **Then** confirmation dialog appears and rule is removed after confirm

---

### User Story 6 - Configure Application Settings (Priority: P2)

Developer navigates to Settings page to configure: Figma API (token with masked input, test connection button, API base URL), Export Preferences (default framework, default language TypeScript/JavaScript, code formatting options), Rule Editor (auto-save toggle, default priority for new rules), Cache Management (view cache size, clear all cache, re-fetch all nodes), and Appearance (theme: Light, Dark, System).

**Why this priority**: Settings enable personalization and workflow optimization. Not critical for initial usage, but essential for professional adoption (secure token storage, consistent export preferences, cache control).

**Independent Test**: Navigate to Settings, enter Figma token, click "Test Connection" and verify success/failure message. Change default framework to React+Tailwind, export a node from Viewer, verify it uses the default. Toggle auto-save, edit a rule in Rule Manager, verify it saves automatically. Clear cache, verify all cached data deleted.

**Acceptance Scenarios**:

1. **Given** Settings page at `/settings`, **When** page loads, **Then** displays 5 sections: Figma API, Export Preferences, Rule Editor, Cache Management, Appearance
2. **Given** Figma API section, **When** user enters token, **Then** input is masked (shows dots), "Show" button toggles visibility
3. **Given** token entered, **When** user clicks "Test Connection", **Then** system attempts API call and shows success/failure toast
4. **Given** Export Preferences, **When** user sets defaults (framework, language, formatting), **Then** future exports use these settings
5. **Given** Rule Editor section, **When** user enables auto-save, **Then** rule edits in Monaco save automatically on change
6. **Given** Cache Management, **When** user clicks "Clear All Cache", **Then** confirmation dialog appears, all `figma-data/` files deleted after confirm
7. **Given** Appearance section, **When** user selects Dark theme, **Then** entire app UI switches to dark mode immediately

---

### Edge Cases

- What happens when user imports a node that already exists in library (duplicate URL)?
- How does system handle Figma API rate limit during import of 10 nodes simultaneously?
- What happens when library index (`figma-data/library-index.json`) is corrupted or missing?
- How does system handle nodes with deeply nested structures (100+ levels) in Viewer tree?
- What happens when a rule matches zero nodes across entire library (unused rule)?
- How does system handle rule priority conflicts (two rules with same priority matching same node)?
- What happens when user deletes a node while Viewer page for that node is open in another tab?
- How does system handle export of 50 nodes simultaneously (bulk export from Library page)?
- What happens when user edits rules in Rule Manager while Viewer is open showing same node?
- How does system handle navigation (browser back/forward) between pages with state (selected node, filters, search)?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Multi-Node Import & Storage

- **FR-001**: System MUST accept Figma URL in format `https://www.figma.com/file/{fileKey}/...?node-id={nodeId}` and auto-parse file_key and node_id
- **FR-002**: System MUST fetch node tree, geometry, design tokens, and screenshot via Figma REST API during import
- **FR-003**: System MUST store each imported node in separate directory: `figma-data/{nodeId}/data.json`, `metadata.json`, `screenshot.png`
- **FR-004**: System MUST maintain library index at `figma-data/library-index.json` tracking all imported nodes with metadata (name, type, import date, thumbnail path)
- **FR-005**: System MUST support re-fetching individual nodes to update cached data
- **FR-006**: System MUST read Figma personal access token from Settings and store securely in local configuration
- **FR-007**: System MUST display toast error messages for import failures (authentication, rate limits, network issues, invalid URLs)

#### Homepage Dashboard

- **FR-008**: Homepage MUST display stats cards showing: total nodes imported, total active rules, average coverage percentage across all nodes, last import date
- **FR-009**: Homepage MUST display "Recent Nodes" section showing 5 most recently imported nodes with thumbnails and names
- **FR-010**: Homepage MUST display "Rule Usage" chart showing top 5 most-matched rules across all nodes with match counts
- **FR-011**: Homepage MUST provide visible "Import Figma Node" input field and button for quick imports
- **FR-012**: Homepage MUST provide "View All Nodes" and "Manage Rules" quick action buttons navigating to respective pages

#### Node Library Page

- **FR-013**: Node Library page MUST display all imported nodes in grid view with: thumbnail, name, type, import date, coverage percentage
- **FR-014**: Node Library page MUST support toggle between grid view and list view (table format with additional columns)
- **FR-015**: Node Library page MUST provide search input filtering nodes by name in real-time
- **FR-016**: Node Library page MUST provide filter dropdown by node type (FRAME, TEXT, GROUP, COMPONENT, etc.)
- **FR-017**: Node Library page MUST provide sort dropdown with options: name (A-Z, Z-A), date (newest first, oldest first), type, coverage (high to low)
- **FR-018**: Node Library page MUST support bulk selection with actions: delete selected, export selected
- **FR-019**: Each node card/row MUST provide individual actions: view (navigate to Viewer), rename, duplicate, export, re-fetch, delete
- **FR-020**: Clicking node card MUST navigate to `/viewer/{nodeId}`

#### Viewer Page (Read-Only Inspection)

- **FR-021**: Viewer page MUST display header with: Figma thumbnail (expandable modal on click), node name, prev/next navigation buttons, re-fetch button, export dropdown, "Edit Rules" button
- **FR-022**: Viewer page MUST provide breadcrumbs: Home > Library > NodeName
- **FR-023**: Viewer page MUST provide two tabs: "Code" and "Render"
- **FR-024**: Code tab MUST display Figma tree on left panel showing hierarchical structure with normalized CSS properties
- **FR-025**: Code tab MUST display Applied Rules Inspector on right panel showing for selected node:
  - List of matched rules ordered by priority
  - Priority resolution (which rule wins for each property)
  - Conflicts highlighted (yellow for minor, red for major)
  - Coverage stats (X/Y nodes have rules applied, Z% coverage)
  - Unused rules warning (rules that never matched this node)
- **FR-026**: Code tab MUST update Applied Rules Inspector when user clicks different nodes in tree
- **FR-027**: Code tab MUST provide "Edit Rules" button navigating to `/rules` with this node pre-selected for testing
- **FR-028**: Render tab MUST display full-width iframe showing rendered preview
- **FR-029**: Render tab MUST provide format switcher in header: React JSX, React+Tailwind, HTML/CSS
- **FR-030**: Render tab MUST update preview when user switches formats
- **FR-031**: Export dropdown MUST provide format options and open code export dialog with copy-to-clipboard and download buttons

#### Rule Manager Page

- **FR-032**: Rule Manager page MUST display sidebar with searchable rule list showing: name, priority, match count across ALL nodes, unused warning (if 0 matches)
- **FR-033**: Rule Manager page MUST display main panel with selected rule details: ID, name, priority (editable), selector preview, transformer preview, match count, actions (Edit JSON, Duplicate, Delete)
- **FR-034**: Rule Manager page MUST provide top actions: "New Rule", "Import Rules", "Export Rules"
- **FR-035**: "New Rule" button MUST open Monaco editor modal with template rule JSON
- **FR-036**: "Edit JSON" button MUST open Monaco editor modal with selected rule JSON, schema validation active, autocomplete enabled
- **FR-037**: Monaco editor MUST validate rule JSON against schema in real-time and display errors
- **FR-038**: Monaco editor MUST provide autocomplete for common rule patterns (button-rule, text-rule, container-rule)
- **FR-039**: Monaco editor save MUST update rule in library and re-calculate match counts across all nodes
- **FR-040**: "Duplicate" action MUST create new rule with same selector/transformer but new ID and incremented priority
- **FR-041**: "Delete" action MUST show confirmation dialog and remove rule after confirm
- **FR-042**: "Import Rules" MUST accept JSON file upload, validate against schema, and merge into library with conflict resolution
- **FR-043**: "Export Rules" MUST download `mapping-rules.json` containing complete rule library in portable JSON format
- **FR-044**: Rule list sidebar MUST update match count badges in real-time when rules are edited or nodes are added/removed

#### Settings Page

- **FR-045**: Settings page MUST provide 5 sections: Figma API, Export Preferences, Rule Editor, Cache Management, Appearance
- **FR-046**: Figma API section MUST provide: masked token input with show/hide toggle, "Test Connection" button, API base URL input
- **FR-047**: "Test Connection" button MUST attempt Figma API call and display success/failure toast message
- **FR-048**: Export Preferences section MUST provide: default framework dropdown (React JSX, React+Tailwind, HTML/CSS), default language dropdown (TypeScript, JavaScript), code formatting toggles (Prettier, single quotes, semicolons, tab size)
- **FR-049**: Rule Editor section MUST provide: auto-save toggle, default priority input for new rules
- **FR-050**: Cache Management section MUST display: total cache size, number of cached nodes, "Clear All Cache" button, "Re-fetch All Nodes" button
- **FR-051**: "Clear All Cache" button MUST show confirmation dialog and delete all `figma-data/` files after confirm
- **FR-052**: Appearance section MUST provide theme selector: Light, Dark, System
- **FR-053**: Theme changes MUST apply immediately to entire application UI

#### Global Navigation

- **FR-054**: Top navigation bar MUST be visible on all pages with links: [Logo] Home | Library | Rules | Settings
- **FR-055**: System MUST preserve navigation state (active page, selected filters, search terms) when navigating between pages
- **FR-056**: System MUST handle browser back/forward navigation correctly, restoring page state

#### AltNode Transformation (Unchanged from previous spec)

- **FR-057**: System MUST transform raw Figma JSON into AltNode intermediate representation
- **FR-058**: AltNode transformation MUST normalize Figma properties to CSS-familiar equivalents (layoutMode → flexbox, itemSpacing → gap, fills → background, etc.)
- **FR-059**: AltNode transformation MUST incorporate FigmaToCode learnings:
  - Filter invisible nodes (`visible: false`)
  - Inline GROUP nodes (avoid unnecessary wrappers)
  - Convert rotation (radians → degrees with cumulative tracking)
  - Detect icons (type + size + export settings)
  - Optimize empty containers
  - Generate unique component names
- **FR-060**: AltNode transformation MUST preserve original Figma properties in `originalNode` reference
- **FR-061**: AltNode transformation MUST compute on-the-fly from cached Figma JSON (not pre-computed and stored)

#### Rule Matching & Conflict Resolution (Unchanged)

- **FR-062**: System MUST evaluate all rules against each AltNode in every imported node tree
- **FR-063**: System MUST apply priority-based conflict resolution when multiple rules match same node
- **FR-064**: Higher priority rule properties MUST override lower priority properties on conflict
- **FR-065**: Non-conflicting properties from multiple rules MUST merge (compose)
- **FR-066**: System MUST track which properties came from which rule for each node (property provenance)

#### Code Generation (Enhanced for multi-format export)

- **FR-067**: System MUST generate code in three formats: React JSX (inline styles), React+Tailwind (utility classes), HTML/CSS (separate stylesheet)
- **FR-068**: Generated code MUST incorporate FigmaToCode Tailwind mappings:
  - Arbitrary value fallbacks (`gap-[13px]` when no standard class)
  - Hex-to-Tailwind color matching (use color tokens when close match)
  - Shadow pattern matching (standard Figma shadows → `shadow-sm`, `shadow-md`)
  - Context-aware sizing (`flex-1` vs `w-full` based on parent layout)
- **FR-069**: Generated code MUST be syntactically valid and renderable in preview iframes
- **FR-070**: Generated code MUST follow export preferences from Settings (TypeScript vs JavaScript, formatting options)

---

### Key Entities

- **Node Library**: Collection of all imported Figma nodes stored in `figma-data/` with metadata. Indexed in `library-index.json`. Each node has: unique ID, name, type, import date, thumbnail, cached Figma data.

- **Figma Node**: Design element from Figma file with properties like layout mode, spacing, fills, geometry. Fetched via API and cached in `figma-data/{nodeId}/data.json`.

- **AltNode**: Normalized intermediate representation of Figma node with CSS-familiar properties. Computed on-the-fly from cached Figma data. Includes `originalNode` reference for complete Figma data access.

- **Mapping Rule**: JSON definition in global rule library (`mapping-rules.json`) containing selector (pattern for matching AltNode properties), transformer (output structure for HTML/CSS/JSX), and priority (integer for conflict resolution). Rules are reusable across all nodes and projects.

- **Rule Match**: Relationship between an AltNode and the rules that apply to it. Calculated for all nodes in library. Tracks: which rules matched, which properties each rule contributes, priority resolution, conflicts. Used for Applied Rules Inspector and match count badges.

- **Rule Library**: Single global `mapping-rules.json` file containing all mapping rules. Represents the reusable knowledge base exported for use in other projects. NOT per-node rules.

- **Library Index**: `figma-data/library-index.json` file tracking all imported nodes with metadata. Enables fast library browsing without reading all node data files.

- **Preview Output**: Generated code in three formats (React JSX, React+Tailwind, HTML/CSS) produced by applying matching rules to current AltNode tree. Displayed in Viewer Render tab and available for export.

- **Dashboard Stats**: Calculated metrics displayed on homepage: total nodes (count from library index), total rules (count from rule library), average coverage (% of nodes across entire library that have at least one rule match), last import date (most recent timestamp from library index).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can import a Figma node and see it appear in library grid within 10 seconds of pasting URL
- **SC-002**: User can browse library of 50 nodes and find specific node via search within 3 seconds
- **SC-003**: User can toggle between grid and list view, and apply filters/sort within 1 second (instant UI response)
- **SC-004**: User can navigate between pages (Homepage → Library → Viewer → Rules → Settings) and return to previous state without data loss
- **SC-005**: User can create a new rule and see match counts update across all nodes within 2 seconds
- **SC-006**: User can inspect a node in Viewer, click nodes in tree, and see Applied Rules Inspector update within 200ms
- **SC-007**: User can switch between preview formats (React JSX, React+Tailwind, HTML/CSS) and see render update within 500ms
- **SC-008**: User can identify which rules matched a node and understand conflict resolution without external documentation (via Applied Rules Inspector clarity)
- **SC-009**: User can export complete rule library and re-import in another project without data loss
- **SC-010**: User can test a rule library against 10 different nodes within 5 minutes (import 10 nodes, verify coverage in dashboard)
- **SC-011**: User can perform bulk operations (delete 10 nodes, export 5 nodes) within 10 seconds
- **SC-012**: Dashboard stats (total nodes, rules, coverage) accurately reflect library state and update within 1 second of changes
- **SC-013**: System operates entirely offline after initial imports, with zero additional Figma API calls during rule editing and viewing
- **SC-014**: Rule match counts displayed in Rule Manager are accurate across all nodes in library (100% correctness)
- **SC-015**: Generated code exports are syntactically valid and can be copied/pasted into projects without modification

---

## Assumptions

- Figma personal access token is managed via Settings page (no OAuth flow needed)
- Users are familiar with JSON syntax and comfortable editing rules in Monaco editor
- Git is the primary version control mechanism for rule libraries (export JSON, commit to repo)
- Single-user, local-first architecture sufficient (no collaboration, real-time sync, or cloud storage)
- Typical Figma nodes have <1000 child elements (performance optimized for this scale)
- Users have 10-100 nodes in library (dashboard and library page optimized for this scale)
- Users validate rule quality through visual inspection and Applied Rules Inspector (no automated rule quality scoring initially)
- Standard desktop browser environment (Chrome, Firefox, Safari) with modern JavaScript support (no mobile/tablet)
- Node IDs follow Figma standard URL format: `figma.com/file/{fileKey}?node-id={nodeId}` or `figma.com/design/{fileKey}?node-id={nodeId}`
- Figma API rate limits are respected (no burst imports of 100+ nodes)

---

## Out of Scope

- User authentication and authorization beyond local Figma token storage
- Real-time collaboration or multi-user editing of rule libraries
- Cloud storage or synchronization of library data (local filesystem only)
- Automated rule quality feedback (e.g., "rule too specific", "rule conflicts likely")
- Version control UI for rules (Git integration limited to export JSON)
- Rule marketplace or community sharing platform
- Production deployment of generated code (tool generates rules, not production-ready components)
- Custom AltNode transformation logic (normalization follows FigmaToCode patterns, not user-configurable)
- Figma plugin or desktop app integration (standalone web app only)
- Mobile or tablet support (desktop-focused developer workbench)
- Batch testing across multiple nodes simultaneously in single view (sequential inspection via Viewer)
- Advanced analytics (rule effectiveness scoring, automated conflict detection, rule usage trends over time)
- Undo/redo functionality for rule edits (manual version control via export/import)
- Rule dependencies or composition (rules are independent, no "extends" or "inherits")
