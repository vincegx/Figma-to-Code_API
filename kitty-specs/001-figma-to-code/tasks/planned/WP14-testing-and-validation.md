---
work_package_id: "WP14"
subtasks:
  - "T132"
  - "T133"
  - "T134"
  - "T135"
  - "T136"
  - "T137"
  - "T138"
  - "T139"
  - "T140"
  - "T141"
  - "T142"
title: "Testing & Validation"
phase: "Phase 3 - Polish"
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

# Work Package Prompt: WP14 – Testing & Validation

## Objectives & Success Criteria

Write comprehensive tests (unit, integration, E2E) to lock down behavior and validate all 15 Success Criteria. This ensures code quality, catches regressions, and validates user stories.

**Success Criteria**:
- Unit tests: 90% coverage rule engine, 80% transformations, 70% other modules (Constitution requirement)
- Integration tests: Multi-node import flow, rule creation flow
- Component tests: Monaco editor, tree view, rules inspector
- E2E tests: Complete workflows (import → rule → export)
- Performance tests: Import time, rule evaluation, preview updates
- All 15 Success Criteria validated with explicit tests
- Test suite passes: `npm test` (Vitest), `npm run test:e2e` (Playwright)

## Subtasks Summary

### T132 – Unit tests: rule-engine.ts (90% coverage)
Test selector matching (AND logic), priority resolution, conflict detection, property provenance.

### T133 – Unit tests: altnode-transform.ts (80% coverage)
Test invisible filtering, GROUP inlining, rotation conversion, icon detection, empty container optimization.

### T134 – Unit tests: code-generators/ (70% coverage)
Test React JSX generation, React+Tailwind arbitrary values, HTML/CSS separation, rotation classes, opacity conversion.

### T135 – Unit tests: file-storage.ts, library-index.ts (70% coverage)
Test multi-node storage operations, library index management.

### T136 – Integration tests: multi-node import flow
Test complete flow: fetch Figma API → transform → save → library index update.

### T137 – Integration tests: rule creation flow
Test flow: create rule → evaluate → match counts update across all nodes.

### T138 – Component tests: key React components
Test Monaco editor integration, tree view rendering, rules inspector display.

### T139 – E2E tests: complete workflows (Playwright)
Test end-to-end: import node → create rule → view preview → export code.

### T140 – Validate all 15 Success Criteria (SC-001 to SC-015)
Explicit tests for each success criteria from spec.md.

### T141 – Run full test suite: verify coverage targets
Execute `npm test` and verify 90% rule engine, 80% transformations, 70% other modules.

### T142 – Performance tests: import, evaluation, preview times
Measure and validate: import <10s, rule evaluation <2s, preview updates <500ms.

## Implementation Notes

- Feature-first testing: Tests written AFTER features implemented (planning decision)
- Coverage targets: 90% rule engine, 80% transformations, 70% other
- E2E tests validate user stories end-to-end
- Performance tests verify Success Criteria timing requirements

## Success Criteria Tests

**SC-001**: Import node <10 seconds
**SC-002**: Search within 3 seconds (50 nodes)
**SC-003**: UI interactions <1 second
**SC-004**: Navigate pages, state preserved
**SC-005**: Rule creation → match counts <2s
**SC-006**: Tree click → inspector <200ms
**SC-007**: Format switch → preview <500ms
**SC-008**: Inspector clarity (no external docs)
**SC-009**: Export/import no data loss
**SC-012**: Stats update <1s
**SC-013**: Offline mode functional
**SC-014**: Match counts 100% accurate
**SC-015**: All workflows complete successfully

## Definition of Done

- [ ] Unit tests written: rule-engine (90%), altnode-transform (80%), code-generators (70%), storage/library (70%)
- [ ] Integration tests: import flow, rule creation flow
- [ ] Component tests: Monaco, tree view, rules inspector
- [ ] E2E tests: complete workflows (import, rule, preview, export)
- [ ] All 15 Success Criteria validated with tests
- [ ] Full test suite passes: `npm test`, `npm run test:e2e`
- [ ] Coverage targets met: 90%/80%/70% as specified
- [ ] Performance tests pass: import <10s, evaluation <2s, preview <500ms

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
