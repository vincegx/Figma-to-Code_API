# Feature Specification: Figma-to-Code Rule Builder
*Path: [kitty-specs/001-figma-to-code/spec.md](kitty-specs/001-figma-to-code/spec.md)*

**Feature Branch**: `001-figma-to-code`
**Created**: 2025-11-23
**Status**: Draft
**Input**: User description: "Build a web-based Figma-to-Code Mapping Rule Builder. This is a developer workbench for creating and testing transformation rules that map Figma design properties to code."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Load Figma Node and See Normalized Structure (Priority: P1)

Developer provides a Figma file URL and node ID. The system fetches the design data via Figma API, stores it locally, transforms it into the AltNode intermediate representation, and displays the normalized tree structure.

**Why this priority**: Without the ability to load and visualize Figma data, no other functionality is possible. This is the foundational capability that enables all rule creation and testing.

**Independent Test**: Can be fully tested by entering a valid Figma URL and node ID, confirming the fetch completes successfully, and verifying the left panel displays the AltNode tree with CSS-familiar properties (e.g., `display: flex`, `gap`, `background`).

**Acceptance Scenarios**:

1. **Given** valid Figma file URL and node ID, **When** user submits the fetch request, **Then** system retrieves node tree, geometry, design tokens, and screenshot via Figma API
2. **Given** Figma data retrieved, **When** transformation completes, **Then** left panel displays AltNode tree with normalized CSS-equivalent properties
3. **Given** Figma data fetched once, **When** user works offline, **Then** all operations use cached local data without additional API calls
4. **Given** invalid Figma URL or unauthorized access, **When** fetch attempted, **Then** system displays clear error message explaining the issue

---

### User Story 2 - Create and Edit Mapping Rules (Priority: P1)

Developer writes mapping rules in JSON format in the center panel editor. Each rule defines a selector (pattern matching AltNode properties) and a transformer (output structure with HTML tag, CSS classes, styles). Rules have explicit priorities for conflict resolution.

**Why this priority**: Rule authoring is the core value proposition. Without the ability to create and edit rules, the tool provides no utility beyond viewing Figma data.

**Independent Test**: Can be fully tested by typing a valid JSON rule in the editor, saving it, and confirming it appears in the rule library and can be applied to matching nodes.

**Acceptance Scenarios**:

1. **Given** empty rule editor, **When** user writes valid JSON rule with selector and transformer, **Then** system validates syntax in real-time
2. **Given** rule with syntax errors, **When** user attempts to save, **Then** editor highlights errors with specific line numbers and clear error messages
3. **Given** multiple rules created, **When** user assigns priorities, **Then** system stores priority metadata with each rule
4. **Given** saved rules, **When** user edits rule selector or transformer, **Then** changes persist to local storage immediately
5. **Given** rule library, **When** user deletes a rule, **Then** rule is removed from library and no longer applied to nodes

---

### User Story 3 - See Live Preview with Instant Updates (Priority: P1)

When user edits rules in the center panel, the right panel updates instantly (within 100ms) showing three preview tabs: React JSX, React with Tailwind, and HTML/CSS. Each tab displays both the rendered result in an iframe and the generated code with syntax highlighting.

**Why this priority**: Instant feedback is essential for productive rule iteration. Without live previews, users must manually test rules elsewhere, destroying the development workflow.

**Independent Test**: Can be fully tested by modifying a rule property (e.g., changing HTML tag from `div` to `button`), observing the preview update within 100ms, and confirming all three tabs reflect the change.

**Acceptance Scenarios**:

1. **Given** rule that matches current node, **When** user edits rule transformer, **Then** all three preview tabs update within 100ms
2. **Given** preview tabs, **When** user switches between React JSX, React+Tailwind, and HTML/CSS, **Then** each shows appropriate syntax and rendering for that framework
3. **Given** generated code, **When** displayed in preview, **Then** syntax highlighting makes structure clear and readable
4. **Given** complex component tree, **When** rendered in iframe, **Then** visual output matches expected layout and styling
5. **Given** rule that produces invalid code, **When** preview attempts to render, **Then** iframe shows clear error message without crashing

---

### User Story 4 - Understand Rule Matching and Conflicts (Priority: P2)

When user clicks a node in the left panel AltNode tree, the system displays all matching rules ordered by priority, shows which properties each rule contributes, and highlights conflicts in yellow/red. Visual indicators (colored badges) on tree nodes show match count.

**Why this priority**: Understanding why code is generated a certain way is critical for debugging rules and building confidence in the rule library. Without visibility into matching and conflicts, rule creation becomes trial-and-error.

**Independent Test**: Can be fully tested by creating two rules that match the same node with conflicting properties, clicking the node, and verifying the sidebar shows both rules with conflict highlighting and priority resolution.

**Acceptance Scenarios**:

1. **Given** node in AltNode tree, **When** user clicks it, **Then** sidebar displays all rules that match the node ordered by priority
2. **Given** multiple matching rules, **When** displayed in sidebar, **Then** each rule shows which properties it contributes (layout, colors, spacing, etc.)
3. **Given** rules with conflicting properties, **When** displayed, **Then** conflicts are highlighted in yellow (minor) or red (major) with explanation
4. **Given** priority-based resolution, **When** conflicts exist, **Then** sidebar clearly indicates which rule wins for each property
5. **Given** tree nodes with matching rules, **When** viewed, **Then** colored badges show match count (e.g., green dot with "3" means 3 rules match)
6. **Given** user edits rule, **When** matching changes, **Then** tree node badges update in real-time

---

### User Story 5 - Test Rule Generality Across Multiple Nodes (Priority: P2)

User enters a different Figma node ID in the input field. System fetches the new node, applies the existing rule library, and updates all previews. User manually verifies if rules behave as expected on the new test case.

**Why this priority**: Reusable rules must work across multiple examples. Testing on diverse nodes validates that rules match patterns (e.g., "all horizontal layouts") rather than specific instances.

**Independent Test**: Can be fully tested by loading one node, creating rules, then loading a different node and confirming the same rules apply correctly with updated previews.

**Acceptance Scenarios**:

1. **Given** rules created for initial node, **When** user enters different node ID, **Then** system fetches new node data and stores it locally
2. **Given** new node loaded, **When** transformation completes, **Then** AltNode tree updates with new structure
3. **Given** existing rule library, **When** applied to new node, **Then** previews update showing generated code for new test case
4. **Given** rules that matched previous node, **When** applied to new node with different structure, **Then** matching indicators update to reflect new matches/mismatches
5. **Given** new node that breaks rule assumptions, **When** rendered, **Then** user can identify issues through preview and matching feedback

---

### User Story 6 - Save and Load Rule Libraries (Priority: P2)

User can save the complete rule library to a local JSON file (`mapping-rules.json`) and load previously saved rule sets. This enables version control via Git and sharing rule libraries across projects.

**Why this priority**: Rule libraries represent significant investment. Persistence and portability are essential for professional use, but the tool can function without this for initial prototyping.

**Independent Test**: Can be fully tested by creating several rules, saving to JSON file, clearing the workspace, loading the same file, and confirming all rules are restored with correct priorities and definitions.

**Acceptance Scenarios**:

1. **Given** rules in the editor, **When** user triggers save, **Then** system exports complete rule library as valid JSON to local filesystem
2. **Given** saved JSON file, **When** user loads it, **Then** all rules populate the editor with original selectors, transformers, and priorities
3. **Given** rule library as JSON, **When** committed to Git, **Then** file format is human-readable and produces clean diffs
4. **Given** malformed JSON file, **When** user attempts to load, **Then** system displays validation errors without corrupting workspace

---

### Edge Cases

- What happens when Figma API rate limit is hit during fetch?
- How does system handle Figma nodes with deeply nested structures (100+ levels)?
- What happens when a rule selector matches zero nodes across multiple test cases?
- How does system handle rules that produce framework-specific code incompatible with one preview tab (e.g., React-only features)?
- What happens when user edits rules faster than the 100ms preview update throttle?
- How does system handle Figma design tokens that don't map cleanly to CSS properties?
- What happens when user loads a node that requires authentication to a Figma file they don't have access to?
- How does system handle concurrent edits when user modifies rules while preview is still rendering previous change?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Data Fetching & Storage

- **FR-001**: System MUST accept Figma file URL and node ID as input
- **FR-002**: System MUST fetch node tree, geometry data, design tokens/variables, and reference screenshot via Figma REST API
- **FR-003**: System MUST store all fetched Figma data in local filesystem cache
- **FR-004**: System MUST operate entirely from cached data after initial fetch without additional API calls
- **FR-005**: System MUST provide explicit refresh command to re-fetch from Figma API
- **FR-006**: System MUST read Figma personal access token from local configuration file
- **FR-007**: System MUST display clear error messages for API failures (authentication, rate limits, network issues, invalid URLs)

#### AltNode Transformation

- **FR-008**: System MUST transform raw Figma JSON into AltNode intermediate representation
- **FR-009**: AltNode transformation MUST normalize Figma properties to CSS-familiar equivalents:
  - `layoutMode: HORIZONTAL` → `display: flex; flex-direction: row`
  - `layoutMode: VERTICAL` → `display: flex; flex-direction: column`
  - `itemSpacing` → `gap`
  - `fills` → `background` colors
  - `paddingLeft/Right/Top/Bottom` → CSS padding properties
- **FR-010**: AltNode transformation MUST compute on-the-fly from cached Figma JSON (not pre-computed and stored)
- **FR-011**: System MUST preserve original Figma property names in AltNode for reference

#### Rule Authoring

- **FR-012**: System MUST provide code editor for writing mapping rules in JSON format
- **FR-013**: Each rule MUST support selector that matches AltNode properties via pattern matching
- **FR-014**: Each rule MUST support transformer that defines output structure (HTML tag, CSS classes, inline styles)
- **FR-015**: Each rule MUST support explicit priority value for conflict resolution
- **FR-016**: System MUST validate rule JSON syntax in real-time as user types
- **FR-017**: System MUST highlight syntax errors with line numbers and descriptive messages
- **FR-018**: System MUST persist rules to local storage immediately on save
- **FR-019**: System MUST support creating, editing, and deleting rules

#### Rule Matching & Conflict Resolution

- **FR-020**: System MUST evaluate all rules against each AltNode in the tree
- **FR-021**: System MUST apply priority-based conflict resolution when multiple rules match same node
- **FR-022**: Higher priority rule properties MUST override lower priority properties on conflict
- **FR-023**: Non-conflicting properties from multiple rules MUST merge (compose)
- **FR-024**: System MUST track which properties came from which rule for each node
- **FR-025**: System MUST display visual indicators (colored badges) on tree nodes showing match count
- **FR-026**: When user clicks node, system MUST display all matching rules ordered by priority
- **FR-027**: System MUST highlight conflicting properties in yellow (minor conflicts) or red (major conflicts)
- **FR-028**: System MUST show which rule wins for each conflicting property

#### User Interface

- **FR-029**: Interface MUST provide three-panel layout:
  - Left panel: AltNode tree navigation
  - Center panel: Rule editor
  - Right panel: Live previews
- **FR-030**: Left panel MUST display hierarchical AltNode tree with normalized CSS properties
- **FR-031**: Left panel MUST support clicking nodes to show matching rules and conflict details
- **FR-032**: Center panel MUST provide code editor with JSON syntax highlighting
- **FR-033**: Right panel MUST provide three tabs: React JSX, React with Tailwind, HTML/CSS
- **FR-034**: Each preview tab MUST display both rendered result (in iframe) and generated code
- **FR-035**: Generated code MUST include syntax highlighting appropriate to each framework
- **FR-036**: System MUST update all three preview tabs within 100ms of rule changes
- **FR-037**: Preview updates MUST not require page refresh or manual action

#### Data Persistence & Export

- **FR-038**: System MUST persist two data types locally: raw Figma data and mapping rules JSON
- **FR-039**: System MUST export mapping rules as valid, portable JSON file
- **FR-040**: Exported rules JSON MUST be framework-agnostic (no implementation-specific constructs)
- **FR-041**: System MUST support loading previously saved rule libraries from JSON files
- **FR-042**: Rule JSON format MUST be human-readable and Git-friendly (clean diffs)

---

### Key Entities

- **Figma Node**: Design element from Figma file with properties like layout mode, spacing, fills, geometry. Fetched via API and cached locally.

- **AltNode**: Normalized intermediate representation of Figma node with CSS-familiar properties. Computed on-the-fly from cached Figma data.

- **Mapping Rule**: JSON definition containing selector (pattern for matching AltNode properties), transformer (output structure for HTML/CSS/JSX), and priority (integer for conflict resolution). Rules are reusable across multiple nodes and projects.

- **Rule Match**: Relationship between an AltNode and the rules that apply to it. Tracks which properties each rule contributes and identifies conflicts.

- **Preview Output**: Generated code in three formats (React JSX, React+Tailwind, HTML/CSS) produced by applying matching rules to the current AltNode tree. Includes both rendered iframe and syntax-highlighted code.

- **Rule Library**: Complete collection of mapping rules persisted as JSON. Represents the reusable knowledge base exported for production use.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can load a Figma node and see the normalized AltNode tree within 5 seconds of submitting the URL
- **SC-002**: User can create a new mapping rule and see it applied in live previews within 100ms of saving
- **SC-003**: User can modify an existing rule and observe all three preview tabs update within 100ms
- **SC-004**: User can identify which rules match a selected node within 2 clicks
- **SC-005**: User can resolve rule conflicts by understanding priority and property contribution without external documentation
- **SC-006**: User can test a rule library on 5 different Figma nodes within 10 minutes
- **SC-007**: User can export a complete rule library and re-import it without data loss
- **SC-008**: 90% of rule syntax errors are caught with clear, actionable error messages before save attempt
- **SC-009**: System operates entirely offline after initial Figma fetch, with zero additional API calls during rule editing
- **SC-010**: Generated code previews are syntactically valid and renderable in all three framework tabs (React JSX, React+Tailwind, HTML/CSS)

---

## Assumptions

- Figma personal access token is managed outside the application (no built-in auth UI)
- Users are familiar with JSON syntax and comfortable editing structured data
- Git is the primary version control mechanism for rule libraries (no integrated VCS needed)
- Single-user, local-first architecture sufficient (no collaboration features required)
- Typical Figma nodes have <1000 child elements (performance not optimized for massive trees)
- Users validate rule quality through visual inspection (no automated rule quality analysis initially)
- Standard web browser environment (Chrome, Firefox, Safari) with modern JavaScript support
- Node ID format follows Figma's standard URL structure (`figma.com/file/{fileKey}?node-id={nodeId}`)

---

## Out of Scope

- User authentication and authorization (token stored in config file)
- Batch testing across multiple nodes simultaneously (manual per-node verification)
- Automated rule quality feedback (e.g., "rule too specific", "rule never matched")
- Version control integration beyond exporting JSON (no Git UI, history, diffing)
- Collaboration features (real-time editing, sharing, comments)
- Rule marketplace or sharing platform
- Production code export tool (this generates rules, not final code)
- Custom AltNode transformation logic (normalization is fixed)
- Plugin or Figma integration (standalone web app)
- Mobile or tablet support (desktop-focused developer workbench)
