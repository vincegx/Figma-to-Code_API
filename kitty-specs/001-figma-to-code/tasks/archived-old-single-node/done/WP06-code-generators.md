---
work_package_id: "WP06"
subtasks: ["T040", "T041", "T042", "T043", "T044", "T045", "T046"]
title: "Code Generators"
phase: "Phase 1 - Core Library"
lane: "done"
agent: "claude"
shell_pid: "23034"
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

## Activity Log

- 2025-11-23T19:17:40Z – claude – shell_pid=13118 – lane=doing – Started WP06: Code Generators implementation
- 2025-11-23T19:25:42Z – claude – shell_pid=18748 – lane=for_review – Completed WP06: All 7 subtasks done. Implemented three code generators (React JSX, React+Tailwind, HTML/CSS) with comprehensive helper functions. Created 31 unit tests covering all generators and helpers. Build passes (0 TypeScript errors). All 107 tests passing. Code generation produces syntactically valid, human-readable output with proper indentation.
- 2025-11-23T19:31:13Z – claude – shell_pid=23034 – lane=done – ✅ Code review approved with minor fix. All 3 generators implemented correctly. 31 unit tests pass. Build passes with 0 TypeScript errors. Fixed unused 'hasChildren' variable in html-css.ts:92. Code is syntactically valid and human-readable with proper indentation.
