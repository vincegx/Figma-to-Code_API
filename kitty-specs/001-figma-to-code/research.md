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
| `layoutMode: "HORIZONTAL"` | `display: "flex"`, `flexDirection: "row"` | Auto-layout ’ Flexbox |
| `layoutMode: "VERTICAL"` | `display: "flex"`, `flexDirection: "column"` | Auto-layout ’ Flexbox |
| `itemSpacing: 16` | `gap: "16px"` | Spacing ’ CSS gap |
| `paddingLeft/Right/Top/Bottom` | `padding: "8px 16px"` | Individual values ’ CSS shorthand |
| `fills: [{ type: "SOLID", color: {...} }]` | `background: "#FF0000"` | Paint array ’ CSS color |
| `strokes: [...]` | `border: "1px solid #000"` | Stroke ’ CSS border |
| `effects: [{ type: "DROP_SHADOW", ... }]` | `boxShadow: "2px 2px 4px rgba(0,0,0,0.1)"` | Effects ’ CSS shadow |
| `fontSize: 16`, `fontFamily: "Inter"` | `fontSize: "16px"`, `fontFamily: "'Inter', sans-serif"` | Text properties ’ CSS |

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

  // Normalize fills ’ background
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
  const propertyProvenance: Record<string, string> = {}; // property ’ ruleId

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

## Next Steps

1. Implement `lib/figma-client.ts` with basic GET `/v1/files/{key}/nodes` endpoint
2. Build `lib/altnode-transform.ts` with auto-layout ’ flexbox transformation
3. Integrate Monaco Editor in `components/rule-editor.tsx` with JSON schema
4. Create proof-of-concept rule matching in `lib/rule-engine.ts`
5. Benchmark performance with realistic Figma file (50-100 nodes)
6. Iterate on transformation edge cases (absolute positioning, z-index, text runs)

**References**: See `research/evidence-log.csv` and `research/source-register.csv` for full source list.
