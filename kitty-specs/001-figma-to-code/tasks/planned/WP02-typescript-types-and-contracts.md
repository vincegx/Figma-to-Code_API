---
work_package_id: "WP02"
subtasks: ["T011", "T012", "T013", "T014", "T015", "T016"]
title: "TypeScript Types & Contracts"
phase: "Phase 0 - Foundation"
lane: "planned"
history:
  - timestamp: "2025-11-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    action: "Prompt generated via /spec-kitty.tasks"
---

# WP02 – TypeScript Types & Contracts

## Objectives
Define all TypeScript types matching data-model.md. Enable type-safe development across lib modules.

## Context
- Depends on WP01 (project structure)
- References: data-model.md, contracts/*.json
- Constitution Principle V: TypeScript strict, no `any` types

## Subtasks

### T011 – lib/types/figma.ts
Create FigmaNode, Paint, Color, Effect, Rectangle, Constraints interfaces per data-model.md.

### T012 – lib/types/altnode.ts
Create AltNode, CSSProperties interfaces with CSS-familiar property names.

### T013 – lib/types/rule.ts
Create MappingRule, Selector, Transformer, RuleMatch, ResolvedProperties interfaces.

### T014 – lib/types/generated-code.ts
Create GeneratedCode, CodeFormat, CodeMetadata types.

### T015 – Verify compilation
Run `npm run build`, ensure zero TypeScript errors.

### T016 – lib/utils/validation.ts
Create type guards: isFigmaNode, isAltNode, isMappingRule using `is` keyword.

## Definition of Done
- [ ] All type files created and compile without errors
- [ ] Type guards implemented and tested
- [ ] JSDoc comments added to complex types
- [ ] Export all types from lib/types/index.ts
