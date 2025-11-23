---
work_package_id: "WP04"
subtasks: ["T024", "T025", "T026", "T027", "T028", "T029", "T030", "T031", "T032"]
title: "AltNode Transformation Engine"
phase: "Phase 1 - Core Library"
lane: "doing"
agent: "claude"
shell_pid: "82299"
history:
  - timestamp: "2025-11-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    action: "Prompt generated"
---

# WP04 – AltNode Transformation Engine

## Objectives
Transform Figma JSON to normalized AltNode with CSS-familiar properties. Handle edge cases per research.md.

## Subtasks
- T024: lib/altnode-transform.ts - transformToAltNode() entry point
- T025: normalizeLayout() - auto-layout → flexbox
- T026: normalizeFills() - fills → background
- T027: normalizeStrokes() - strokes → border
- T028: normalizeEffects() - effects → box-shadow
- T029: normalizeText() - font properties
- T030: Edge cases: absolute positioning, z-index, multi-style text
- T031: Test with sample Figma JSON
- T032: Performance benchmark (<50ms for 100-node tree)

## Transformation Rules (from research.md)
- layoutMode HORIZONTAL → display: flex, flexDirection: row
- itemSpacing → gap
- fills → background (RGBA to hex)
- Preserve original in altNode.figmaProperties

## Definition of Done
- [ ] All normalization functions implemented
- [ ] Edge cases handled gracefully
- [ ] Performance < 50ms for 100 nodes
- [ ] Unit tests pass

## Activity Log

- 2025-11-23T18:32:45Z – claude – shell_pid=82299 – lane=doing – Started WP04: AltNode Transformation Engine implementation
