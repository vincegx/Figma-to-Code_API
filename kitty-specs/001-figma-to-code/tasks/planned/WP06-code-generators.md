---
work_package_id: "WP06"
subtasks: ["T040", "T041", "T042", "T043", "T044", "T045", "T046"]
title: "Code Generators"
phase: "Phase 1 - Core Library"
lane: "planned"
history:
  - timestamp: "2025-11-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    action: "Prompt generated"
---

# WP06 – Code Generators

## Objectives
Generate React JSX, React+Tailwind, HTML/CSS from AltNode + resolved properties.

## Subtasks
- T040: lib/code-generators/react.ts - JSX with inline styles
- T041: lib/code-generators/react-tailwind.ts - Tailwind classes
- T042: lib/code-generators/html-css.ts - HTML + separate CSS
- T043: Helpers: toPascalCase(), cssObjectToString(), convertToTailwindClasses()
- T044: Syntax highlighting research (Prism.js/Shiki)
- T045: Test generated code compiles
- T046: Verify code readability

## Implementation Strategy
- Template-based (string interpolation, not AST)
- React JSX: Export function components
- React+Tailwind: Map CSS → Tailwind (display:flex → className="flex")
- HTML/CSS: Separate .css file with class selectors
- Recursive generation for children

## Definition of Done
- [ ] All three generators implemented
- [ ] Generated code is syntactically valid
- [ ] Code is human-readable (proper indentation)
- [ ] Unit tests verify output correctness
