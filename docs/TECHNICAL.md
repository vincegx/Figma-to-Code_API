# Technical Documentation

Architecture, APIs, and implementation details for developers.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Data Flow](#data-flow)
- [API Reference](#api-reference)
- [Code Generation Pipeline](#code-generation-pipeline)
- [Merge Algorithm](#merge-algorithm)
- [Extending the App](#extending-the-app)
- [Testing](#testing)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                              │
├─────────────────────────────────────────────────────────────────┤
│  Pages (App Router)                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │Dashboard│ │  Nodes  │ │ Viewer  │ │ Merges  │ │  Rules  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │           │           │         │
├───────┴───────────┴───────────┴───────────┴───────────┴─────────┤
│  API Routes (/api)                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  /figma  │ │ /merges  │ │  /rules  │ │ /export  │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │
├───────┴────────────┴────────────┴────────────┴──────────────────┤
│  Core Libraries (/lib)                                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │ altnode-       │ │ code-          │ │ merge/         │       │
│  │ transform      │ │ generators     │ │ merge-engine   │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  Storage (File System)                                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │  figma-data/   │ │  merges-data/  │ │    rules/      │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Figma API     │
                    │   (External)    │
                    └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3+ (strict mode) |
| Styling | Tailwind CSS 3.4+ |
| UI Components | Radix UI + shadcn/ui |
| State Management | Zustand |
| Code Editor | Monaco Editor |
| HTTP Client | Native fetch |
| Storage | File system (JSON) |

---

## Project Structure

```
figma-rules-builder/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── figma/                # Figma import/fetch
│   │   ├── merges/               # Merge CRUD
│   │   ├── rules/                # Rules management
│   │   └── export/               # Code export
│   ├── node/[nodeId]/            # Node viewer page
│   ├── nodes/                    # Node library page
│   ├── merge/[id]/               # Merge viewer page
│   ├── merges/                   # Merges library page
│   ├── rules/                    # Rules manager page
│   ├── settings/                 # Settings page
│   └── page.tsx                  # Dashboard
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── merge/                    # Merge-specific components
│   └── library/                  # Library components
│
├── lib/                          # Core libraries
│   ├── altnode-transform/        # Figma → AltNode transform
│   ├── code-generators/          # AltNode → Code generators
│   │   ├── react-tailwind/       # React + Tailwind generator
│   │   ├── html-tailwind-css.ts  # HTML + CSS generator
│   │   └── helpers/              # Shared helpers
│   ├── merge/                    # Responsive merge engine
│   │   ├── merge-engine.ts       # Main merge orchestrator
│   │   ├── alt-nodes/            # AltNode matching/diffing
│   │   └── visibility-mapper.ts  # Breakpoint visibility
│   ├── store/                    # Zustand stores
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
│
├── figma-data/                   # Imported nodes (gitignored)
│   ├── [nodeId]/                 # Per-node folder
│   │   ├── metadata.json         # Node metadata
│   │   ├── raw-node.json         # Raw Figma response
│   │   ├── alt-node.json         # Transformed AltNode
│   │   └── images/               # Downloaded images
│   └── rules/                    # Transformation rules
│
├── merges-data/                  # Saved merges (gitignored)
│   └── [mergeId].json            # Merge definition + result
│
└── __tests__/                    # Test files
    ├── golden/                   # Golden/snapshot tests
    └── unit/                     # Unit tests
```

---

## Data Flow

### Import Flow

```
Figma URL
    │
    ▼
┌─────────────────┐
│ Parse URL       │  Extract fileKey, nodeId
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Figma API       │  GET /v1/files/{fileKey}/nodes?ids={nodeId}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Raw Node JSON   │  Figma's native format
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AltNode         │  Transformed internal format
│ Transform       │  (altnode-transform/)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to Disk    │  figma-data/[nodeId]/
└─────────────────┘
```

### Code Generation Flow

```
AltNode
    │
    ▼
┌─────────────────┐
│ Apply Rules     │  Match rules, override defaults
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Generator  │  Framework-specific generator
└────────┬────────┘
         │
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
┌───────┐ ┌───────┐ ┌──────────┐
│ React │ │ React │ │ HTML+CSS │
│ + TW  │ │ + TWv4│ │          │
└───────┘ └───────┘ └──────────┘
```

---

## API Reference

### Figma Routes

#### POST `/api/figma/import`

Import a Figma node by URL.

**Request:**
```json
{
  "url": "https://www.figma.com/file/ABC123/File?node-id=123:456"
}
```

**Response:**
```json
{
  "success": true,
  "nodeId": "123-456",
  "metadata": {
    "name": "Component Name",
    "type": "FRAME",
    "fileKey": "ABC123"
  }
}
```

#### GET `/api/figma/library`

List all imported nodes.

**Query params:**
- `search` - Filter by name
- `type` - Filter by node type
- `sortBy` - Sort field (name, date, size)
- `sortOrder` - asc or desc

**Response:**
```json
{
  "success": true,
  "nodes": [...],
  "totalNodes": 42
}
```

#### GET `/api/figma/node/[id]`

Get a specific node's data.

**Response:**
```json
{
  "success": true,
  "metadata": {...},
  "altNode": {...},
  "rawNode": {...}
}
```

### Merge Routes

#### POST `/api/merges`

Create a new responsive merge.

**Request:**
```json
{
  "name": "Hero Section",
  "sources": [
    { "nodeId": "123-456", "breakpoint": "mobile" },
    { "nodeId": "123-789", "breakpoint": "tablet" },
    { "nodeId": "123-012", "breakpoint": "desktop" }
  ]
}
```

#### GET `/api/merges/[id]`

Get a merge by ID.

#### GET `/api/merges/[id]/export`

Export merged code.

**Query params:**
- `framework` - react-tailwind, react-tailwind-v4, html-css

---

## Code Generation Pipeline

### AltNode Structure

The internal representation used for code generation:

```typescript
interface AltNode {
  id: string;
  name: string;
  type: AltNodeType;

  // Layout
  width: number;
  height: number;
  x: number;
  y: number;

  // Auto-layout (flexbox)
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  gap?: number;
  padding?: { top, right, bottom, left };

  // Styles
  fills?: Fill[];
  strokes?: Stroke[];
  effects?: Effect[];
  cornerRadius?: number | number[];
  opacity?: number;

  // Typography (for TEXT nodes)
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT';

  // Children
  children?: AltNode[];
}
```

### Generator Interface

All code generators implement:

```typescript
interface CodeGenerator {
  generate(node: AltNode, options?: GeneratorOptions): GeneratedCode;
}

interface GeneratedCode {
  code: string;
  css?: string;  // For HTML+CSS generator
  dependencies?: string[];
}
```

### Adding a New Generator

1. Create file in `lib/code-generators/`
2. Implement the generator interface
3. Register in `lib/code-generators/index.ts`
4. Add to framework selector UI

---

## Merge Algorithm

### Overview

The merge algorithm combines multiple AltNode trees into one responsive tree.

### Step 1: Element Matching

Match elements across breakpoints by layer name:

```typescript
function matchElements(
  mobile: AltNode,
  tablet: AltNode,
  desktop: AltNode
): MatchedElement[] {
  // Build index by name for each breakpoint
  const mobileIndex = buildNameIndex(mobile);
  const tabletIndex = buildNameIndex(tablet);
  const desktopIndex = buildNameIndex(desktop);

  // Find matches
  const allNames = union(
    Object.keys(mobileIndex),
    Object.keys(tabletIndex),
    Object.keys(desktopIndex)
  );

  return allNames.map(name => ({
    name,
    mobile: mobileIndex[name],
    tablet: tabletIndex[name],
    desktop: desktopIndex[name],
  }));
}
```

### Step 2: Style Diffing

Compare styles across breakpoints:

```typescript
function diffStyles(matched: MatchedElement): ResponsiveStyles {
  const base = matched.mobile?.styles || {};
  const md = diffFrom(base, matched.tablet?.styles || {});
  const lg = diffFrom(matched.tablet?.styles || base, matched.desktop?.styles || {});

  return { base, md, lg };
}
```

### Step 3: Visibility Mapping

Generate visibility classes for breakpoint-specific elements:

```typescript
function mapVisibility(matched: MatchedElement): string[] {
  const present = {
    mobile: !!matched.mobile,
    tablet: !!matched.tablet,
    desktop: !!matched.desktop,
  };

  // Mobile only: block md:hidden
  // Tablet only: hidden md:block lg:hidden
  // Desktop only: hidden lg:block
  // etc.

  return generateVisibilityClasses(present);
}
```

### Step 4: Code Generation

Generate responsive Tailwind classes:

```typescript
function generateResponsiveClasses(styles: ResponsiveStyles): string {
  const classes: string[] = [];

  // Base classes (mobile)
  classes.push(...stylesToClasses(styles.base));

  // Tablet overrides (md:)
  classes.push(...stylesToClasses(styles.md).map(c => `md:${c}`));

  // Desktop overrides (lg:)
  classes.push(...stylesToClasses(styles.lg).map(c => `lg:${c}`));

  return classes.join(' ');
}
```

---

## Extending the App

### Adding a New Export Format

1. **Create the generator:**

```typescript
// lib/code-generators/vue-tailwind.ts
export function generateVueTailwind(node: AltNode): GeneratedCode {
  // Implementation
}
```

2. **Register it:**

```typescript
// lib/code-generators/index.ts
export const generators = {
  'react-tailwind': generateReactTailwind,
  'html-css': generateHtmlCss,
  'vue-tailwind': generateVueTailwind,  // Add here
};
```

3. **Add to UI:**

Update framework selector in viewer components.

### Adding Custom Rules

Rules are stored in `figma-data/rules/`:

```json
{
  "id": "custom-brand-color",
  "name": "Brand Primary",
  "enabled": true,
  "match": {
    "property": "fills",
    "condition": "equals",
    "value": { "r": 1, "g": 0.34, "b": 0.2 }
  },
  "output": {
    "type": "class",
    "value": "bg-brand-primary"
  }
}
```

---

## Testing

### Unit Tests

```bash
npm test              # Watch mode
npm run test:coverage # With coverage
```

### Golden Tests

Snapshot tests for code generation:

```bash
npm run golden:capture  # Update snapshots
npm run golden:verify   # Verify against snapshots
```

### E2E Tests

```bash
npm run test:e2e     # Run Playwright tests
npm run test:e2e:ui  # With UI
```

---

## Performance Considerations

### Large Files

- Nodes are processed lazily
- Images are downloaded on-demand
- Tree virtualization for large hierarchies

### Caching

- Imported nodes cached on disk
- Generated code cached in memory (per session)
- API responses cached (5 min TTL)

---

## Next Steps

- [FAQ](FAQ.md) — Common questions
- [Back to README](../README.md)
