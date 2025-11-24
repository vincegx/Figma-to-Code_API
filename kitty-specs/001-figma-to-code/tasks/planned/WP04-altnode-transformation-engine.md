---
work_package_id: "WP04"
subtasks:
  - "T033"
  - "T034"
  - "T035"
  - "T036"
  - "T037"
  - "T038"
  - "T039"
  - "T040"
  - "T041"
  - "T042"
title: "AltNode Transformation Engine"
phase: "Phase 1 - Core Engine"
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

# Work Package Prompt: WP04 – AltNode Transformation Engine

## Objectives & Success Criteria

Transform cached Figma JSON to normalized AltNode representation with FigmaToCode production patterns: invisible node filtering, GROUP inlining, rotation conversion, icon detection, unique name generation.

**Success Criteria**:
- Invisible nodes (`visible: false`) filtered out completely
- GROUP nodes inlined (children promoted, no wrapper div)
- Rotation converted from radians to degrees
- Unique names generated with suffix counters (Button, Button_01, Button_02)
- `originalNode` reference preserved for complete Figma data access
- Performance: <50ms for 100-node tree
- All 23 FigmaToCode recommendations integrated

## Context & Constraints

**Architecture**: FigmaNode (Figma API) → AltNode (CSS-normalized) → Rule Matching → Code Generation

**FigmaToCode Integration** (research.md Decision 7):
- **5 CRITICAL** fixes: originalNode, invisible filtering, GROUP inlining, rotation, unique names
- **12 HIGH** priority: icon detection, empty container optimization, layout wrap, etc.

**Constitutional Principles**:
- Principle III: Data Locality – Compute AltNode on-the-fly, don't persist
- Principle X: Production Patterns First – Adopt FigmaToCode learnings

**Related Documents**:
- [research.md](../research.md) – FigmaToCode Decision 7 (23 recommendations)
- [data-model.md](../data-model.md) – AltNode entity specification
- [plan.md](../plan.md) – Transformation rules table

## Subtasks & Detailed Guidance

### T033 – Create lib/altnode-transform.ts with transformToAltNode()

**Purpose**: Entry point function for Figma → AltNode transformation.

**Steps**:
1. Create `lib/altnode-transform.ts`
2. Implement entry function:
   ```typescript
   import type { FigmaNode } from './types/figma';
   import type { AltNode } from './types/altnode';

   export function transformToAltNode(
     figmaNode: FigmaNode,
     cumulativeRotation: number = 0
   ): AltNode | null {
     // T034: Invisible node filtering
     if (figmaNode.visible === false) {
       return null;
     }

     // T034: GROUP node inlining
     if (figmaNode.type === 'GROUP' && figmaNode.children) {
       return handleGroupInlining(figmaNode, cumulativeRotation);
     }

     // T034: Unique name generation
     const uniqueName = generateUniqueName(figmaNode.name);

     const altNode: AltNode = {
       id: figmaNode.id,
       name: figmaNode.name,
       uniqueName,
       type: mapNodeType(figmaNode.type),
       styles: {},
       children: [],
       originalNode: figmaNode, // CRITICAL: preserve complete Figma data
       visible: figmaNode.visible ?? true,
       canBeFlattened: false,
       cumulativeRotation,
     };

     // T035-T039: Normalize properties
     normalizeLayout(figmaNode, altNode);
     normalizeFills(figmaNode, altNode);
     normalizeStrokes(figmaNode, altNode);
     normalizeEffects(figmaNode, altNode);
     normalizeText(figmaNode, altNode);

     // T040: FigmaToCode HIGH priority improvements
     applyHighPriorityImprovements(figmaNode, altNode, cumulativeRotation);

     // Transform children recursively
     if (figmaNode.children) {
       altNode.children = figmaNode.children
         .map(child => transformToAltNode(child, cumulativeRotation))
         .filter((node): node is AltNode => node !== null);
     }

     return altNode;
   }
   ```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: No (entry point for other subtasks)

---

### T034 – Implement FigmaToCode CRITICAL improvements

**Purpose**: Fix 5 critical gaps from production tool analysis.

**Steps**:

**1. Invisible node filtering**:
```typescript
// Early return in transformToAltNode()
if (figmaNode.visible === false) {
  return null; // Don't generate code for hidden elements
}
```

**2. GROUP node inlining**:
```typescript
function handleGroupInlining(
  groupNode: FigmaNode,
  cumulativeRotation: number
): AltNode | null {
  if (!groupNode.children || groupNode.children.length === 0) {
    return null; // Empty GROUP, skip entirely
  }

  // Calculate cumulative rotation for children
  const groupRotation = groupNode.rotation || 0;
  const newCumulativeRotation = cumulativeRotation + (groupRotation * 180 / Math.PI);

  // If GROUP has only 1 child, return child directly
  if (groupNode.children.length === 1) {
    return transformToAltNode(groupNode.children[0], newCumulativeRotation);
  }

  // Multiple children: create container but mark as GROUP
  const container: AltNode = {
    id: groupNode.id,
    name: groupNode.name,
    uniqueName: generateUniqueName(groupNode.name),
    type: 'group',
    styles: {},
    children: groupNode.children
      .map(child => transformToAltNode(child, newCumulativeRotation))
      .filter((node): node is AltNode => node !== null),
    originalNode: groupNode,
    visible: true,
    canBeFlattened: false,
    cumulativeRotation: newCumulativeRotation,
  };

  return container;
}
```

**3. Unique name generation**:
```typescript
const nameCounters: Map<string, number> = new Map();

function generateUniqueName(baseName: string): string {
  // Sanitize name for component usage
  let sanitized = baseName.replace(/[^a-zA-Z0-9]/g, '');

  // Handle numeric-leading names
  if (/^[0-9]/.test(sanitized)) {
    sanitized = 'Component' + sanitized;
  }

  const count = nameCounters.get(sanitized) || 0;
  nameCounters.set(sanitized, count + 1);

  return count === 0 ? sanitized : `${sanitized}_${count.toString().padStart(2, '0')}`;
}
```

**4. originalNode reference**:
```typescript
// Already included in main transform (line: originalNode: figmaNode)
// Provides access to ALL Figma properties (constraints, exportSettings, blendMode, etc.)
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: No (core to T033)

---

### T035 – Implement normalizeLayout()

**Purpose**: Convert Figma auto-layout to CSS flexbox.

**Steps**:
```typescript
function normalizeLayout(figmaNode: FigmaNode, altNode: AltNode): void {
  if (figmaNode.layoutMode === 'HORIZONTAL') {
    altNode.styles.display = 'flex';
    altNode.styles.flexDirection = 'row';
    if (figmaNode.itemSpacing) {
      altNode.styles.gap = `${figmaNode.itemSpacing}px`;
    }
  } else if (figmaNode.layoutMode === 'VERTICAL') {
    altNode.styles.display = 'flex';
    altNode.styles.flexDirection = 'column';
    if (figmaNode.itemSpacing) {
      altNode.styles.gap = `${figmaNode.itemSpacing}px`;
    }
  }

  // Padding
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = figmaNode;
  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    const t = paddingTop || 0;
    const r = paddingRight || 0;
    const b = paddingBottom || 0;
    const l = paddingLeft || 0;

    if (t === b && l === r) {
      if (t === l) {
        altNode.styles.padding = `${t}px`;
      } else {
        altNode.styles.padding = `${t}px ${l}px`;
      }
    } else {
      altNode.styles.padding = `${t}px ${r}px ${b}px ${l}px`;
    }
  }

  // Alignment
  if (figmaNode.primaryAxisAlignItems) {
    const alignment = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'STRETCH': 'stretch',
    }[figmaNode.primaryAxisAlignItems];

    altNode.styles.justifyContent = alignment;
  }

  if (figmaNode.counterAxisAlignItems) {
    const alignment = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'STRETCH': 'stretch',
    }[figmaNode.counterAxisAlignItems];

    altNode.styles.alignItems = alignment;
  }
}
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: Yes (can develop alongside T036-T039)

---

### T036 – Implement normalizeFills()

**Purpose**: Convert Figma fills to CSS background.

**Steps**:
```typescript
function normalizeFills(figmaNode: FigmaNode, altNode: AltNode): void {
  if (!figmaNode.fills || figmaNode.fills.length === 0) return;

  const visibleFills = figmaNode.fills.filter(fill => fill.visible !== false);
  if (visibleFills.length === 0) return;

  const fill = visibleFills[0]; // Use first visible fill

  if (fill.type === 'SOLID' && fill.color) {
    altNode.styles.background = rgbaToHex(fill.color, fill.opacity);
  } else if (fill.type === 'IMAGE') {
    // Handle image fills (base64 in altNode.base64)
    altNode.styles.backgroundImage = 'url(...)'; // Placeholder
  }
}

function rgbaToHex(color: { r: number; g: number; b: number; a: number }, opacity?: number): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = opacity ?? color.a;

  if (a === 1) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  } else {
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }
}
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: Yes

---

### T037 – Implement normalizeStrokes()

**Purpose**: Convert Figma strokes to CSS border.

**Steps**:
```typescript
function normalizeStrokes(figmaNode: FigmaNode, altNode: AltNode): void {
  if (!figmaNode.strokes || figmaNode.strokes.length === 0) return;

  const visibleStrokes = figmaNode.strokes.filter(stroke => stroke.visible !== false);
  if (visibleStrokes.length === 0) return;

  const stroke = visibleStrokes[0];
  const weight = figmaNode.strokeWeight || 1;

  if (stroke.type === 'SOLID' && stroke.color) {
    const color = rgbaToHex(stroke.color, stroke.opacity);
    altNode.styles.border = `${weight}px solid ${color}`;
  }

  // Individual border weights (FigmaToCode enhancement)
  const { strokeTopWeight, strokeBottomWeight, strokeLeftWeight, strokeRightWeight } = figmaNode;
  if (strokeTopWeight || strokeBottomWeight || strokeLeftWeight || strokeRightWeight) {
    const t = strokeTopWeight || weight;
    const r = strokeRightWeight || weight;
    const b = strokeBottomWeight || weight;
    const l = strokeLeftWeight || weight;

    if (t !== weight || r !== weight || b !== weight || l !== weight) {
      altNode.styles.borderWidth = `${t}px ${r}px ${b}px ${l}px`;
    }
  }
}
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: Yes

---

### T038 – Implement normalizeEffects()

**Purpose**: Convert Figma effects to CSS box-shadow.

**Steps**:
```typescript
function normalizeEffects(figmaNode: FigmaNode, altNode: AltNode): void {
  if (!figmaNode.effects || figmaNode.effects.length === 0) return;

  const shadows = figmaNode.effects
    .filter(effect =>
      (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') &&
      effect.visible !== false
    );

  if (shadows.length === 0) return;

  const shadowStrings = shadows.map(shadow => {
    const x = shadow.offset?.x || 0;
    const y = shadow.offset?.y || 0;
    const blur = shadow.radius || 0;
    const spread = shadow.spread || 0;
    const color = shadow.color ? rgbaToHex(shadow.color, shadow.color.a) : 'rgba(0,0,0,0.1)';
    const inset = shadow.type === 'INNER_SHADOW' ? 'inset ' : '';

    return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  });

  altNode.styles.boxShadow = shadowStrings.join(', ');
}
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: Yes

---

### T039 – Implement normalizeText()

**Purpose**: Convert text properties to CSS font properties.

**Steps**:
```typescript
function normalizeText(figmaNode: FigmaNode, altNode: AltNode): void {
  if (figmaNode.type !== 'TEXT') return;

  if (figmaNode.fontSize) {
    altNode.styles.fontSize = `${figmaNode.fontSize}px`;
  }

  if (figmaNode.fontFamily) {
    altNode.styles.fontFamily = `'${figmaNode.fontFamily}', sans-serif`;
  }

  if (figmaNode.fontWeight) {
    altNode.styles.fontWeight = figmaNode.fontWeight.toString();
  }

  if (figmaNode.characters) {
    // Store text content in altNode (not in styles)
    (altNode as any).textContent = figmaNode.characters;
  }
}
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: Yes

---

### T040 – Implement FigmaToCode HIGH priority improvements

**Purpose**: Add production-tested edge case handling.

**Steps**:

**1. Rotation conversion**:
```typescript
function applyHighPriorityImprovements(
  figmaNode: FigmaNode,
  altNode: AltNode,
  cumulativeRotation: number
): void {
  // Rotation (radians → degrees)
  if (figmaNode.rotation) {
    const rotationDegrees = -(figmaNode.rotation * (180 / Math.PI));
    const totalRotation = cumulativeRotation + rotationDegrees;
    altNode.cumulativeRotation = totalRotation;

    if (totalRotation !== 0) {
      altNode.styles.transform = `rotate(${totalRotation.toFixed(2)}deg)`;
    }
  }

  // Icon detection
  altNode.canBeFlattened = isLikelyIcon(figmaNode);

  // Empty container optimization
  if (isEmptyContainer(figmaNode)) {
    optimizeEmptyContainer(figmaNode, altNode);
  }

  // Layout wrap support
  if (figmaNode.layoutWrap === 'WRAP') {
    altNode.styles.flexWrap = 'wrap';
  }

  // Opacity
  if (figmaNode.opacity !== undefined && figmaNode.opacity !== 1) {
    altNode.styles.opacity = figmaNode.opacity.toFixed(2);
  }
}
```

**2. Icon detection**:
```typescript
function isLikelyIcon(figmaNode: FigmaNode): boolean {
  // Type check: VECTOR, BOOLEAN_OPERATION, etc.
  if (!['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON'].includes(figmaNode.type)) {
    return false;
  }

  // Size check: ≤64px
  const bbox = figmaNode.absoluteBoundingBox;
  if (bbox && (bbox.width > 64 || bbox.height > 64)) {
    return false;
  }

  // Export settings check
  if (figmaNode.exportSettings && figmaNode.exportSettings.some(s => s.format === 'SVG')) {
    return true;
  }

  return true; // Likely an icon
}
```

**3. Empty container optimization**:
```typescript
function isEmptyContainer(figmaNode: FigmaNode): boolean {
  return (
    (figmaNode.type === 'FRAME' || figmaNode.type === 'INSTANCE' || figmaNode.type === 'COMPONENT') &&
    (!figmaNode.children || figmaNode.children.length === 0)
  );
}

function optimizeEmptyContainer(figmaNode: FigmaNode, altNode: AltNode): void {
  // Convert empty FRAME/INSTANCE to simple container
  altNode.type = 'container';

  // Add dimensions from bounding box
  const bbox = figmaNode.absoluteBoundingBox;
  if (bbox) {
    altNode.styles.width = `${bbox.width}px`;
    altNode.styles.height = `${bbox.height}px`;
  }
}
```

**Files**: `lib/altnode-transform.ts`

**Parallel?**: No (extends transformation logic)

---

### T041 – Test transformation with diverse samples

**Purpose**: Validate all edge cases with real Figma data.

**Steps**:
1. Create test file `__tests__/unit/altnode-transform.test.ts`
2. Test cases:
   ```typescript
   import { transformToAltNode } from '@/lib/altnode-transform';
   import type { FigmaNode } from '@/lib/types/figma';

   describe('AltNode Transformation', () => {
     test('filters invisible nodes', () => {
       const invisibleNode: FigmaNode = {
         id: '1:1',
         name: 'Hidden',
         type: 'FRAME',
         visible: false,
       };

       const result = transformToAltNode(invisibleNode);
       expect(result).toBeNull();
     });

     test('inlines GROUP nodes', () => {
       const groupNode: FigmaNode = {
         id: '1:2',
         name: 'Group',
         type: 'GROUP',
         children: [
           { id: '1:3', name: 'Child', type: 'FRAME' },
         ],
       };

       const result = transformToAltNode(groupNode);
       expect(result).not.toBeNull();
       // Should return child directly, not GROUP wrapper
     });

     test('converts rotation radians to degrees', () => {
       const rotatedNode: FigmaNode = {
         id: '1:4',
         name: 'Rotated',
         type: 'FRAME',
         rotation: Math.PI / 4, // 45 degrees
       };

       const result = transformToAltNode(rotatedNode);
       expect(result?.cumulativeRotation).toBeCloseTo(-45, 1);
     });

     test('generates unique names with suffix', () => {
       const node1: FigmaNode = { id: '1:5', name: 'Button', type: 'FRAME' };
       const node2: FigmaNode = { id: '1:6', name: 'Button', type: 'FRAME' };

       const result1 = transformToAltNode(node1);
       const result2 = transformToAltNode(node2);

       expect(result1?.uniqueName).toBe('Button');
       expect(result2?.uniqueName).toBe('Button_01');
     });

     test('preserves originalNode reference', () => {
       const node: FigmaNode = {
         id: '1:7',
         name: 'Test',
         type: 'FRAME',
         constraints: { horizontal: 'LEFT', vertical: 'TOP' },
       };

       const result = transformToAltNode(node);
       expect(result?.originalNode).toEqual(node);
       expect(result?.originalNode.constraints).toBeDefined();
     });

     test('detects icons correctly', () => {
       const iconNode: FigmaNode = {
         id: '1:8',
         name: 'Icon',
         type: 'VECTOR',
         absoluteBoundingBox: { x: 0, y: 0, width: 24, height: 24 },
       };

       const result = transformToAltNode(iconNode);
       expect(result?.canBeFlattened).toBe(true);
     });
   });
   ```

**Files**: `__tests__/unit/altnode-transform.test.ts`

**Parallel?**: No (final validation)

---

### T042 – Verify performance <50ms for 100-node tree

**Purpose**: Ensure transformation meets performance requirements.

**Steps**:
1. Create benchmark test:
   ```typescript
   import { transformToAltNode } from '@/lib/altnode-transform';
   import type { FigmaNode } from '@/lib/types/figma';

   function generateLargeTree(depth: number, breadth: number): FigmaNode {
     const node: FigmaNode = {
       id: `${depth}:${Math.random()}`,
       name: `Node_${depth}`,
       type: 'FRAME',
       layoutMode: 'VERTICAL',
       children: [],
     };

     if (depth > 0) {
       for (let i = 0; i < breadth; i++) {
         node.children!.push(generateLargeTree(depth - 1, breadth));
       }
     }

     return node;
   }

   test('transformation performance for 100-node tree', () => {
     const largeTree = generateLargeTree(3, 5); // ~125 nodes

     const start = performance.now();
     const result = transformToAltNode(largeTree);
     const end = performance.now();

     const duration = end - start;

     console.log(`Transformation took ${duration.toFixed(2)}ms`);
     expect(duration).toBeLessThan(50); // SUCCESS CRITERIA
     expect(result).not.toBeNull();
   });
   ```

2. Run benchmark: `npm test altnode-transform.test.ts`

**Files**: `__tests__/unit/altnode-transform.test.ts`

**Parallel?**: No (final validation)

## Definition of Done Checklist

- [ ] `lib/altnode-transform.ts` created with transformToAltNode() entry function
- [ ] Invisible nodes filtered (visible: false → null)
- [ ] GROUP nodes inlined correctly (children promoted)
- [ ] Unique names generated with suffix counters
- [ ] originalNode reference preserved in all AltNodes
- [ ] normalizeLayout(), normalizeFills(), normalizeStrokes(), normalizeEffects(), normalizeText() implemented
- [ ] Rotation converted radians → degrees with cumulative tracking
- [ ] Icon detection (isLikelyIcon) functional
- [ ] Empty container optimization working
- [ ] Layout wrap support (flexWrap)
- [ ] All tests pass (__tests__/unit/altnode-transform.test.ts)
- [ ] Performance <50ms for 100-node tree verified
- [ ] All 23 FigmaToCode recommendations integrated (5 CRITICAL + 12 HIGH)

## Review Guidance

**Verify**:
- Invisible nodes completely filtered (check with visible: false test)
- GROUP nodes produce no wrapper div (check generated tree structure)
- Unique names have suffix counters (Button, Button_01, Button_02)
- originalNode accessible (check constraints, exportSettings, blendMode)
- Performance benchmark passes (<50ms)

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created
