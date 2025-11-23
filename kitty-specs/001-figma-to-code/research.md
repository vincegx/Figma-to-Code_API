# Research: Figma-to-Code Rule Builder
*Path: [kitty-specs/001-figma-to-code/research.md](kitty-specs/001-figma-to-code/research.md)*

**Feature**: 001-figma-to-code
**Date**: 2025-11-23
**Purpose**: Document technical decisions, alternatives considered, and rationale for implementation approach

---

## Research Summary

This document captures the research and decision-making process for building a web-based tool that transforms Figma designs into code via user-defined mapping rules. Key areas investigated:1. Figma REST API integration patterns
2. AltNode transformation strategies for normalizing Figma properties to CSS equivalents
3. Monaco Editor integration for JSON rule editing
4. Code generation approaches (template-based vs AST-based)
5. Rule pattern matching algorithms
6. Conflict resolution strategies for priority-based rule composition

---

## Decision 1: Figma REST API Integration

**Decision**: Use Figma REST API v1 with server-side proxy via Next.js API routes

**Rationale**:
- **Security**: Personal access token must not be exposed to browser (stored in `.env.local`, accessed server-side only)
- **CORS**: Figma API doesn't support CORS for browser requests; Next.js API route acts as proxy
- **Caching**: Server-side routes can directly write to filesystem (`figma-data/` folder) using Node.js `fs` module
- **Rate limiting**: Centralized API calls easier to track and throttle if needed

**Endpoints used**:
1. **GET** `/v1/files/{file_key}` - Fetch full file metadata
2. **GET** `/v1/files/{file_key}/nodes?ids={node_ids}` - Fetch specific nodes with children
3. **GET** `/v1/files/{file_key}/variables/local` - Fetch design tokens/variables
4. **GET** `/images/{file_key}?ids={node_id}&format=png` - Fetch node screenshot

**Implementation approach**:
```typescript
// app/api/figma/fetch/route.ts
export async function POST(request: Request) {
  const { fileKey, nodeId } = await request.json();
  const token = process.env.FIGMA_ACCESS_TOKEN;

  // Fetch node tree
  const nodeResponse = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`,
    { headers: { 'X-Figma-Token': token } }
  );

  // Cache to figma-data/{nodeId}.json
  await fs.writeFile(`figma-data/${nodeId}.json`, JSON.stringify(nodeData));

  return Response.json({ success: true, nodeId });
}
```

**Alternatives considered**:
- L **Browser-based fetch**: Rejected due to CORS and token exposure
- L **Figma plugin**: Rejected - requires Figma desktop app, not web-accessible
- L **Third-party Figma SDK**: Rejected - adds dependency, REST API sufficient

**Sources**: [Figma API Documentation](https://www.figma.com/developers/api), research/evidence-log.csv #001

---

## Decision 2: AltNode Transformation Strategy

**Decision**: Compute AltNode on-the-fly from cached Figma JSON using pure functions

**Rationale**:
- **Data locality**: Cached Figma JSON is source of truth; AltNode is derived view
- **Flexibility**: Transformation logic can evolve without invalidating cache
- **Performance**: Transformation is fast (<50ms for 100-node tree); no need to pre-compute
- **Simplicity**: No dual storage (Figma JSON + AltNode JSON); single cache file

**Transformation rules** (CSS-familiar normalization):

| Figma Property | AltNode Property | Transformation Logic |
|---|---|---|
| `layoutMode: "HORIZONTAL"` | `display: "flex"`, `flexDirection: "row"` | Auto-layout � Flexbox |
| `layoutMode: "VERTICAL"` | `display: "flex"`, `flexDirection: "column"` | Auto-layout � Flexbox |
| `itemSpacing: 16` | `gap: "16px"` | Spacing � CSS gap |
| `paddingLeft/Right/Top/Bottom` | `padding: "8px 16px"` | Individual values � CSS shorthand |
| `fills: [{ type: "SOLID", color: {...} }]` | `background: "#FF0000"` | Paint array � CSS color |
| `strokes: [...]` | `border: "1px solid #000"` | Stroke � CSS border |
| `effects: [{ type: "DROP_SHADOW", ... }]` | `boxShadow: "2px 2px 4px rgba(0,0,0,0.1)"` | Effects � CSS shadow |
| `fontSize: 16`, `fontFamily: "Inter"` | `fontSize: "16px"`, `fontFamily: "'Inter', sans-serif"` | Text properties � CSS |

**Edge cases handled**:
1. **Groups without explicit constraints**: Treat as `position: relative` container
2. **Absolute positioning inside auto-layout**: Set `position: absolute` with `top/left` offsets
3. **Overlapping elements**: Calculate z-index from Figma stacking order
4. **Text with multiple style runs**: Generate `<span>` elements with inline styles for each run

**Implementation approach**:
```typescript
// lib/altnode-transform.ts
export function transformToAltNode(figmaNode: FigmaNode): AltNode {
  const altNode: AltNode = {
    id: figmaNode.id,
    name: figmaNode.name,
    type: mapNodeType(figmaNode.type),
    styles: {},
    children: [],
  };

  // Normalize layout
  if (figmaNode.layoutMode === 'HORIZONTAL') {
    altNode.styles.display = 'flex';
    altNode.styles.flexDirection = 'row';
    altNode.styles.gap = `${figmaNode.itemSpacing}px`;
  }

  // Normalize fills � background
  if (figmaNode.fills?.length > 0) {
    altNode.styles.background = convertFillToCSS(figmaNode.fills[0]);
  }

  // Recursively transform children
  altNode.children = figmaNode.children?.map(transformToAltNode) || [];

  return altNode;
}
```

**Alternatives considered**:
- L **Pre-compute and store AltNode**: Rejected - dual storage complexity, cache invalidation issues
- L **Keep raw Figma properties**: Rejected - rule authors shouldn't need to learn Figma-specific naming
- L **Use CSS-in-JS library for transformation**: Rejected - adds dependency, direct mapping simpler

**Sources**: Figma API docs (node types), CSS specification, research/evidence-log.csv #002

---

## Decision 3: Monaco Editor Integration

**Decision**: Use `@monaco-editor/react` with custom JSON schema for rule validation

**Rationale**:
- **Developer familiarity**: Monaco is VSCode's editor - developers already know it
- **JSON support**: Built-in JSON language server with schema validation
- **Performance**: Efficient for 10-50 rules (typical workload)
- **Customization**: Can provide autocomplete, hover hints, error squiggles

**Integration approach**:
```typescript
// components/rule-editor.tsx
import Editor from '@monaco-editor/react';

export function RuleEditor({ value, onChange }: RuleEditorProps) {
  return (
    <Editor
      height="100%"
      language="json"
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        formatOnPaste: true,
        formatOnType: true,
      }}
      beforeMount={(monaco) => {
        // Register rule JSON schema for validation
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [{
            uri: 'https://figma-rules-builder/rule-schema.json',
            fileMatch: ['*'],
            schema: RULE_JSON_SCHEMA,
          }],
        });
      }}
    />
  );
}
```

**Rule JSON schema** (provides autocomplete + validation):
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "selector", "transformer", "priority"],
    "properties": {
      "id": { "type": "string" },
      "selector": {
        "type": "object",
        "properties": {
          "nodeType": { "enum": ["FRAME", "TEXT", "GROUP", "COMPONENT"] },
          "layoutMode": { "enum": ["HORIZONTAL", "VERTICAL", null] },
          "customProperties": { "type": "object" }
        }
      },
      "transformer": {
        "type": "object",
        "properties": {
          "htmlTag": { "type": "string" },
          "cssClasses": { "type": "array", "items": { "type": "string" } },
          "inlineStyles": { "type": "object" }
        }
      },
      "priority": { "type": "integer", "minimum": 0 }
    }
  }
}
```

**Alternatives considered**:
- L **CodeMirror**: Rejected - Monaco more feature-complete for JSON
- L **Plain textarea**: Rejected - no syntax highlighting, validation, or autocomplete
- L **Custom editor**: Rejected - massive effort, Monaco proven and maintained

**Sources**: Monaco Editor documentation, research/evidence-log.csv #003

---

## Decision 4: Code Generation Strategy

**Decision**: Template-based generation with string interpolation (not AST-based)

**Rationale**:
- **Simplicity**: Generating JSX/HTML as strings is straightforward
- **Performance**: String templates are fast for typical 10-50 node trees
- **Maintainability**: Templates are easy to read and modify (vs AST manipulation)
- **Good enough**: AST parsing only needed if we support round-trip editing (out of scope)

**Generation approach** (React JSX example):
```typescript
// lib/code-generators/react.ts
export function generateReactJSX(altNode: AltNode, ruleMatches: RuleMatch[]): string {
  const componentName = toPascalCase(altNode.name);
  const props = extractProps(altNode, ruleMatches);
  const styles = extractStyles(altNode, ruleMatches);
  const children = altNode.children.map(child => generateReactJSX(child, getRuleMatches(child)));

  return `
export function ${componentName}() {
  return (
    <${props.htmlTag} style={${JSON.stringify(styles)}}>
      ${children.join('\n')}
    </${props.htmlTag}>
  );
}`;
}
```

**Framework-specific generators**:
1. **react.ts**: JSX with inline styles (React.CSSProperties)
2. **react-tailwind.ts**: JSX with Tailwind utility classes (e.g., `className="flex gap-4"`)
3. **html-css.ts**: HTML with external CSS classes (separate `.css` file)

**Syntax highlighting**: Use Prism.js or Shiki for generated code display

**Alternatives considered**:
- L **AST-based (e.g., Babel, ts-morph)**: Rejected - overkill for one-way generation
- L **JSX runtime evaluation**: Rejected - security risk (eval), not portable
- L **Handlebars/Mustache templates**: Rejected - adds dependency, string templates sufficient

**Sources**: React documentation, Tailwind documentation, research/evidence-log.csv #004

---

## Decision 5: Rule Pattern Matching Algorithm

**Decision**: Property-based filtering with AND logic (all selector properties must match)

**Rationale**:
- **Predictable**: Developers expect AND logic (CSS selector behavior)
- **Performant**: Simple property comparison, O(n*m) where n=nodes, m=rules (acceptable for <100 nodes, <50 rules)
- **Extensible**: Can add OR logic or regex later if needed

**Matching logic**:
```typescript
// lib/rule-engine.ts
export function evaluateRules(altNode: AltNode, rules: MappingRule[]): RuleMatch[] {
  const matches: RuleMatch[] = [];

  for (const rule of rules) {
    if (selectorMatches(altNode, rule.selector)) {
      matches.push({
        ruleId: rule.id,
        priority: rule.priority,
        contributedProperties: extractProperties(rule.transformer),
      });
    }
  }

  // Sort by priority (descending)
  return matches.sort((a, b) => b.priority - a.priority);
}

function selectorMatches(altNode: AltNode, selector: Selector): boolean {
  // All selector properties must match (AND logic)
  if (selector.nodeType && altNode.type !== selector.nodeType) return false;
  if (selector.layoutMode && altNode.styles.display !== 'flex') return false;
  if (selector.customProperties) {
    for (const [key, value] of Object.entries(selector.customProperties)) {
      if (altNode.styles[key] !== value) return false;
    }
  }
  return true;
}
```

**Selector examples**:
```json
{
  "selector": {
    "nodeType": "FRAME",
    "layoutMode": "HORIZONTAL"
  }
}
// Matches all horizontal auto-layout frames

{
  "selector": {
    "nodeType": "TEXT",
    "customProperties": {
      "fontSize": "16px"
    }
  }
}
// Matches all text nodes with 16px font size
```

**Alternatives considered**:
- L **CSS selector syntax** (e.g., `FRAME.horizontal`): Rejected - requires parser, JSON properties simpler
- L **JSONPath or jq-style queries**: Rejected - adds complexity, property matching sufficient
- L **Regex on node names**: Rejected - brittle, user renames nodes and rules break

**Sources**: CSS selector specification (for AND logic precedent), research/evidence-log.csv #005

---

## Decision 6: Conflict Resolution Strategy

**Decision**: Property-level priority with explicit tracking (not rule-level override)

**Rationale**:
- **Composability**: Rules can contribute different properties to same node (layout from rule 1, colors from rule 2)
- **Transparency**: User sees which rule contributed which property (debugging)
- **Flexibility**: Higher priority wins on conflicts, but non-conflicting properties merge

**Resolution algorithm**:
```typescript
// lib/rule-engine.ts
export function resolveConflicts(matches: RuleMatch[]): ResolvedProperties {
  const resolved: ResolvedProperties = {};
  const propertyProvenance: Record<string, string> = {}; // property � ruleId

  // Matches already sorted by priority (descending)
  for (const match of matches) {
    for (const [property, value] of Object.entries(match.contributedProperties)) {
      if (!resolved[property]) {
        // Property not yet set - accept from this rule
        resolved[property] = value;
        propertyProvenance[property] = match.ruleId;
      }
      // else: property already set by higher-priority rule, skip
    }
  }

  return { resolved, propertyProvenance };
}
```

**Conflict detection** (for UI highlighting):
- **Minor conflict** (yellow): Two rules provide same property, values compatible (e.g., both set `padding`)
- **Major conflict** (red): Two rules provide incompatible properties (e.g., `display: flex` vs `display: block`)

**Alternatives considered**:
- L **Rule-level override** (highest priority rule wins entirely): Rejected - loses composability
- L **Specificity like CSS**: Rejected - complexity not justified for JSON property matching
- L **User-defined conflict resolution functions**: Rejected - violates rule portability (no code in rules)

**Sources**: CSS cascade/specificity research, research/evidence-log.csv #006

---

## Open Questions & Risks

### Open Questions
1. **Performance at scale**: How does AltNode transformation + rule matching perform for 1000+ node trees?
   - **Mitigation**: Benchmark with large Figma files during implementation, optimize if <100ms threshold exceeded

2. **Figma API rate limits**: What are the actual limits, and how should we handle throttling?
   - **Mitigation**: Implement exponential backoff + user messaging, cache aggressively to minimize API calls

3. **Monaco Editor bundle size**: Does Monaco significantly increase Next.js bundle?
   - **Mitigation**: Use dynamic import `next/dynamic` to code-split Monaco Editor

### Risks
1. **Figma API changes**: REST API v1 could introduce breaking changes
   - **Mitigation**: Pin to specific API version, monitor Figma changelog, write adapter layer

2. **Complex Figma features**: Component variants, boolean operations, masks not yet researched
   - **Mitigation**: Start with simple nodes (frames, text, groups), add advanced features incrementally

3. **Browser compatibility**: Monaco Editor requires modern browser features
   - **Mitigation**: Document browser requirements (Chrome/Firefox/Safari latest), no IE11 support

---

## Decision 7: FigmaToCode Reference Implementation Analysis

**Decision**: Study FigmaToCode repository (https://github.com/bernaferrari/FigmaToCode) to identify proven patterns and improvements for our Rule Builder

**Rationale**:
- **Similar problem domain**: FigmaToCode solves automatic Figma-to-Code transformation (same core transformation as our Rule Builder, but without user-defined rules)
- **Production-tested**: They've already solved edge cases and optimization challenges we'll encounter
- **Open source**: Can study their TypeScript implementation directly
- **Complementary approach**: Their automatic transformation insights can improve our rule-based system

**Research Areas**:

### 1. AltNode Transformation Strategy
**What to analyze**:
- Property normalization patterns (auto-layout, spacing, fills, strokes, effects)
- Edge case handling (absolute positioning in auto-layout, z-index calculation, overlapping elements, masks, constraints)
- Responsive design approach (how they handle Figma constraints)
- Text handling (multi-style text runs, font fallbacks)

**Expected learnings**:
- Comprehensive mapping tables for Figma → CSS properties
- Edge cases we haven't covered in Decision 2 (current AltNode transformation)
- Performance optimizations for large node trees

**Priority**: HIGH - Directly impacts WP04 (AltNode Transformation Engine) quality

---

### 2. Code Generation Patterns
**What to analyze**:
- React/JSX component structure and naming conventions
- Tailwind CSS utility class mapping strategy (which Figma properties → which Tailwind classes)
- Component composition logic (how they handle nested elements, prop drilling)
- Code formatting and readability optimizations

**Expected learnings**:
- Proven Tailwind class mappings (e.g., `itemSpacing: 16` → `gap-4` vs manual `gap: 16px`)
- React component patterns that produce cleaner output
- How to handle components with many children (flattening vs nesting)

**Priority**: HIGH - Directly impacts WP06 (Code Generators) completeness

---

### 3. TypeScript Data Models
**What to analyze**:
- AltNode structure (compare with our current `lib/types/altnode.ts`)
- Figma API type definitions (compare with our `lib/types/figma.ts`)
- Validation strategies and type guards
- Interface design for extensibility

**Expected learnings**:
- Missing properties in our current AltNode type
- Type-safe patterns for handling Figma API responses
- Discriminated union patterns for node types

**Priority**: MEDIUM - Could improve WP02 (TypeScript Types) if gaps found

---

### 4. Performance & Edge Cases
**What to analyze**:
- Large Figma file handling (1000+ nodes)
- Memory management strategies
- Transformation caching or memoization patterns
- Test coverage and example files (what edge cases do they test?)

**Expected learnings**:
- Performance benchmarks to compare against our targets
- Edge cases not covered in our spec (masks, boolean operations, component variants)
- Test patterns for Figma transformation logic

**Priority**: MEDIUM - Informs optimization strategies for WP04, WP05

---

**Implementation Plan**:

1. **Repository Analysis** (1-2 hours):
   - Clone FigmaToCode repo: `git clone https://github.com/bernaferrari/FigmaToCode.git`
   - Identify key source files:
     - AltNode transformation logic
     - Code generators (React, Tailwind)
     - Type definitions
     - Test files with example Figma nodes

2. **Comparative Study** (2-3 hours):
   - Compare their AltNode structure with ours (`lib/types/altnode.ts`)
   - Extract Tailwind mapping table (Figma property → Tailwind class)
   - Document edge cases they handle that we don't
   - Note performance optimizations (memoization, caching)

3. **Integration Recommendations** (1 hour):
   - List 5-10 concrete improvements to integrate before finalizing WP08-WP12
   - Prioritize by impact (HIGH: affects core transformation, MEDIUM: nice-to-have)
   - Create action items for updating affected work packages

**Expected Deliverables**:
- Updated AltNode type definition with missing properties
- Enhanced Tailwind class mapping table for `lib/code-generators/react-tailwind.ts`
- Additional edge case tests for `__tests__/unit/altnode-transform.test.ts`
- Performance optimization notes for rule engine

**Timeline**: Complete analysis before implementing WP08 (Monaco Editor Integration)

---

### Analysis Findings (Completed: 2025-11-23)

**Executive Summary**: FigmaToCode uses a sophisticated intermediate representation with extensive edge case handling and precise Tailwind conversion mappings. Most critical findings: (1) Generic wrapper pattern with metadata flags, (2) 15+ edge cases in auto-layout normalization we're missing (rotation, GROUP inlining, invisible node filtering), (3) Precise px-to-rem Tailwind conversion with arbitrary value fallbacks.

#### Critical Gaps Identified (5 items - BLOCK WP08-WP12)

1. **Missing `originalNode` property** - No reference to complete Figma data after transformation; lose access to `constraints`, `exportSettings`, `blendMode`
2. **No invisible node filtering** - Generate code for hidden elements (`visible: false`)
3. **No GROUP node inlining** - Generate unnecessary wrapper `<div>` for every GROUP
4. **No rotation handling** - Rotation property completely lost in transformation
5. **No unique name generation** - Component naming collisions possible

#### High Priority Gaps (12 items - Quality improvements)

6. Missing AltNode properties: `canBeFlattened`, `svg`, `base64`, `layoutSizingHorizontal/Vertical`, `layoutWrap`, `primaryAxisAlignItems`, `counterAxisAlignItems`
7. Missing Figma type properties: `strokeTopWeight/Bottom/Left/Right`, `visible`, `rotation`, `opacity`, `blendMode`, `exportSettings`, `styledTextSegments`
8. No icon detection (`isLikelyIcon()` with type/size/export checks)
9. No empty container optimization (empty FRAME → RECTANGLE)
10. PascalCase validation missing (numeric-leading names like "2Column" invalid React component)
11. No Tailwind arbitrary value fallback (`gap-[13px]` when no standard class matches)
12. No context-aware FILL sizing (`flex-1` vs `w-full` based on parent)
13. No individual border width support (`border-t-2 border-b-0`)
14. No hex-to-Tailwind color mapping (`bg-blue-500` instead of `bg-[#3B82F6]`)
15. No shadow pattern matching (standard Figma shadows → `shadow-sm`, `shadow-md`)
16. No blend mode conversion (`mix-blend-multiply`, etc.)
17. No layout wrap support (`flex-wrap` for `layoutWrap: "WRAP"`)

#### Medium Priority Enhancements (6 items - Nice-to-have)

18. TailwindBuilder class for progressive accumulation (cleaner than current approach)
19. Padding class optimization (consolidate `px-4` instead of `pl-4 pr-4`)
20. Opacity conversion (0-1 → Tailwind scale: 0, 25, 50, 75, 100)
21. Debug data attributes (`data-figma-id`, `data-figma-name` in dev mode)
22. Tailwind v4 optimizations (`size-X` when width===height)
23. Rotation Tailwind classes (`rotate-45`, `rotate-[47deg]`)

#### Actionable Next Steps

**Before WP08** (CRITICAL):
1. Add `originalNode: FigmaNode` to `lib/types/altnode.ts` (line 18-36)
2. Add missing properties to `lib/types/figma.ts`: `strokeTopWeight`, `strokeBottomWeight`, `strokeLeftWeight`, `strokeRightWeight`, `layoutSizingHorizontal`, `layoutSizingVertical`, `layoutWrap`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `rotation`, `visible`, `blendMode`, `opacity`
3. Implement invisible node filtering in `lib/altnode-transform.ts`: `if (figmaNode.visible === false) return null;`
4. Implement GROUP node inlining: skip GROUP wrapper, process children directly with cumulative rotation
5. Add unique name generation with suffix counters

**HIGH Priority** (improve quality):
6. Implement `isLikelyIcon()` function (type check, size check ≤64px, export settings)
7. Add rotation conversion: `-rotation * (180 / Math.PI)`
8. Optimize empty containers: convert empty FRAME/INSTANCE to RECTANGLE
9. Fix `toPascalCase()` validation: prefix numeric-leading names with "Component"
10. Add arbitrary value fallback in Tailwind converter: `gap-[13px]` when no match
11. Context-aware sizing: generate `flex-1` when parent is flex container with FILL child
12. Individual border width support for non-uniform borders

**Full Implementation Details**: See complete analysis document with code examples, comparison tables, and test patterns in research/figma-to-code-analysis.md

**Alternatives considered**:
- L **Build from scratch without reference**: Rejected - reinventing solved problems, high risk of missing edge cases
- L **Copy FigmaToCode wholesale**: Rejected - different architecture (automatic vs rule-based), violates constitution principle "Simple Before Clever"
- L **Analyze multiple Figma-to-Code tools**: Rejected - time constraint, FigmaToCode is most mature TypeScript implementation

**Sources**:
- FigmaToCode repository: https://github.com/bernaferrari/FigmaToCode
- Analysis completed: 2025-11-23 (full findings in research/figma-to-code-analysis.md)
- Evidence log: research/evidence-log.csv #007
- Source files: packages/backend/src/altNodes/jsonNodeConversion.ts, tailwindMain.ts, iconDetection.ts

**Status**: ✅ **COMPLETE** - Analysis finished. 23 actionable recommendations identified (5 CRITICAL, 12 HIGH, 6 MEDIUM). Ready to update tasks.md.

---

## Next Steps

1. ✅ Implement `lib/figma-client.ts` with basic GET `/v1/files/{key}/nodes` endpoint (WP03 - DONE)
2. ✅ Build `lib/altnode-transform.ts` with auto-layout → flexbox transformation (WP04 - DONE)
3. ✅ Create proof-of-concept rule matching in `lib/rule-engine.ts` (WP05 - DONE)
4. ✅ Implement code generators for React/Tailwind/HTML (WP06 - DONE)
5. ✅ Build main UI layout with three-panel interface (WP07 - DONE)
6. ✅ **COMPLETED**: Analyze FigmaToCode repository (Decision 7) - 23 recommendations identified
7. 🔄 **NEXT**: Update tasks.md with new work packages for FigmaToCode improvements (run `/spec-kitty.tasks`)
8. 🔜 Integrate Monaco Editor in `components/rule-editor.tsx` with JSON schema (WP08)
9. 🔜 Build live preview tabs with <100ms update requirement (WP09)

**References**: See `research/evidence-log.csv` and `research/source-register.csv` for full source list.
