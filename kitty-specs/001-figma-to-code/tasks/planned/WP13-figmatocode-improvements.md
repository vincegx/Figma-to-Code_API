---
work_package_id: "WP13"
subtasks: ["T090-T116"]
title: "FigmaToCode Improvements"
phase: "Phase 0 - Foundation Enhancement"
lane: "planned"
agent: ""
shell_pid: ""
history:
  - timestamp: "2025-11-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    action: "Prompt generated from FigmaToCode analysis findings"
---

# WP13 – FigmaToCode Improvements

## Objectives

Integrate 23 recommendations from FigmaToCode repository analysis (research.md Decision 7) to fix critical gaps and significantly improve transformation quality. This work package addresses:

1. **5 CRITICAL fixes** that block WP08-WP12 implementation
2. **12 HIGH priority** enhancements that improve code generation quality
3. **6 MEDIUM priority** optimizations for cleaner output
4. **4 testing tasks** to validate all improvements

**Why this matters**: FigmaToCode is a production-tested Figma-to-Code tool that has solved edge cases and optimization challenges we'll inevitably encounter. Adopting their proven patterns now prevents technical debt and ensures professional-quality output.

## Context

**Analysis completed**: 2025-11-23 (see research.md Decision 7 "Analysis Findings")

**Scope**: Update types (lib/types/), transformation logic (lib/altnode-transform.ts), and code generators (lib/code-generators/) based on comparative analysis of FigmaToCode's implementation.

**Dependencies**:
- WP02 (TypeScript types baseline exists)
- WP04 (AltNode transformation baseline exists)
- WP06 (Code generators baseline exists)

**Blocks**: WP08, WP09, WP10, WP11, WP12 (CRITICAL fixes must complete first)

## Key Deliverables

### Phase 1: CRITICAL Fixes (Block WP08-WP12)

**T090**: Add `originalNode: FigmaNode` property to AltNode
- **File**: `lib/types/altnode.ts` (line 18-36)
- **Why**: Preserves reference to complete Figma data after transformation; currently lose access to `constraints`, `exportSettings`, `blendMode`
- **Implementation**: Add `originalNode: FigmaNode;` to AltNode interface
- **Test**: Verify transformation assigns `originalNode` property, accessible in code generators

**T091**: Add missing Figma properties to FigmaNode type
- **File**: `lib/types/figma.ts`
- **Properties to add**:
  - `strokeTopWeight?: number;`
  - `strokeBottomWeight?: number;`
  - `strokeLeftWeight?: number;`
  - `strokeRightWeight?: number;`
  - `layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';`
  - `layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';`
  - `layoutWrap?: 'WRAP' | 'NO_WRAP';`
  - `primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';`
  - `counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';`
  - `rotation?: number;`
  - `visible?: boolean;`
  - `blendMode?: 'NORMAL' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY' | string;`
  - `opacity?: number;`
- **Why**: Figma API provides these properties; we currently ignore them
- **Test**: TypeScript compilation succeeds, no type errors

**T092**: Implement invisible node filtering
- **File**: `lib/altnode-transform.ts`
- **Implementation**: Add early return at function start:
  ```typescript
  if (figmaNode.visible === false) {
    return null;
  }
  ```
- **Why**: Generate code for hidden elements (`visible: false`) unnecessarily
- **Test**: Transform node with `visible: false`, verify returns null, not included in parent children

**T093**: Implement GROUP node inlining
- **File**: `lib/altnode-transform.ts`
- **Implementation**:
  ```typescript
  if (figmaNode.type === 'GROUP') {
    // Process children directly, passing cumulative rotation
    return figmaNode.children
      ?.map(child => transformToAltNode(child, parent, cumulativeRotation + rotation))
      .filter((child): child is AltNode => child !== null) ?? [];
  }
  ```
- **Why**: Currently generate unnecessary wrapper `<div>` for every GROUP
- **Test**: Transform GROUP node with 2 children, verify returns array of 2 AltNodes (no GROUP wrapper)

**T094**: Add unique name generation with suffix counters
- **File**: `lib/altnode-transform.ts` (new helper function)
- **Implementation**:
  ```typescript
  const nameCounters = new Map<string, number>();

  function generateUniqueName(name: string, parent?: AltNode): string {
    const key = parent ? `${parent.id}:${name}` : name;
    const count = nameCounters.get(key) ?? 0;
    nameCounters.set(key, count + 1);
    return count === 0 ? name : `${name}_${String(count).padStart(2, '0')}`;
  }
  ```
- **Why**: Component naming collisions possible (two nodes named "Button" → both generate `Button` component)
- **Test**: Transform 3 nodes named "Button", verify names are "Button", "Button_01", "Button_02"

### Phase 2: HIGH Priority Enhancements (Quality Improvements)

**T095**: Add metadata properties to AltNode
- **File**: `lib/types/altnode.ts`
- **Properties to add**:
  - `uniqueName: string;` (from T094)
  - `canBeFlattened: boolean;` (for SVG optimization)
  - `svg?: string;` (pre-rendered SVG if canBeFlattened)
  - `base64?: string;` (image data for IMAGE nodes)
  - `rotation?: number;` (degrees, converted from radians)
  - `cumulativeRotation?: number;` (inherited from GROUP parents)
  - `visible: boolean;` (visibility flag, defaults true)
  - `layoutSizingHorizontal?: 'FIXED' | 'HUG' | 'FILL';`
  - `layoutSizingVertical?: 'FIXED' | 'HUG' | 'FILL';`
  - `layoutWrap?: 'WRAP' | 'NO_WRAP';`
  - `primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';`
  - `counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';`
- **Test**: TypeScript compilation, transformation assigns all new properties

**T096**: Implement isLikelyIcon() function
- **File**: `lib/altnode-transform.ts` (new helper function)
- **Implementation**:
  ```typescript
  function isLikelyIcon(node: FigmaNode): boolean {
    const ALWAYS_ICON_TYPES = ['VECTOR', 'BOOLEAN_OPERATION', 'POLYGON', 'STAR'];
    const SIZE_CONSTRAINED_TYPES = ['ELLIPSE', 'RECTANGLE', 'LINE', 'FRAME', 'GROUP'];
    const MAX_ICON_SIZE = 64;

    if (node.exportSettings?.some(s => s.format === 'SVG')) return true;
    if (ALWAYS_ICON_TYPES.includes(node.type)) return true;

    if (SIZE_CONSTRAINED_TYPES.includes(node.type)) {
      const bounds = node.absoluteBoundingBox;
      if (bounds && bounds.width <= MAX_ICON_SIZE && bounds.height <= MAX_ICON_SIZE) {
        return true;
      }
    }
    return false;
  }
  ```
- **Why**: Treat all nodes as DOM elements; no SVG optimization for icons/vectors
- **Test**: VECTOR node → true, 32x32 RECTANGLE → true, 200x200 RECTANGLE → false

**T097**: Add rotation conversion from radians to degrees
- **File**: `lib/altnode-transform.ts`
- **Implementation**:
  ```typescript
  const rotation = figmaNode.rotation
    ? -figmaNode.rotation * (180 / Math.PI)
    : 0;
  const totalRotation = cumulativeRotation + rotation;
  ```
- **Why**: Rotation property completely lost in current transformation
- **Test**: Transform node with `rotation: Math.PI / 2` (90° in radians), verify `rotation: -90`

**T098**: Optimize empty containers
- **File**: `lib/altnode-transform.ts`
- **Implementation**:
  ```typescript
  if (
    (figmaNode.type === 'FRAME' || figmaNode.type === 'INSTANCE' || figmaNode.type === 'COMPONENT') &&
    (!figmaNode.children || figmaNode.children.length === 0)
  ) {
    figmaNode.type = 'RECTANGLE';
  }
  ```
- **Why**: Generate empty `<div>` elements with unused flex properties
- **Test**: Transform empty FRAME, verify treated as RECTANGLE (no flex properties)

**T099**: Fix toPascalCase() validation
- **File**: `lib/code-generators/helpers.ts` (line 18-25)
- **Implementation**:
  ```typescript
  export function toPascalCase(name: string): string {
    let result = name
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    if (result.length === 0) return 'Component';
    if (/^\d/.test(result)) result = 'Component' + result;
    return result;
  }
  ```
- **Why**: Node named "2-Column Layout" generates `2ColumnLayout` (invalid React component)
- **Test**: `toPascalCase("2Column")` → "Component2Column", `toPascalCase("Button")` → "Button"

**T100**: Add arbitrary value fallback for Tailwind
- **File**: `lib/code-generators/react-tailwind.ts` (line 149-191)
- **Implementation**: When no standard Tailwind class matches, generate `gap-[13px]` instead of rounding
- **Why**: Currently round to nearest standard class, losing precision (13px → gap-3 = 12px)
- **Test**: `itemSpacing: 13` → `gap-[13px]`, `itemSpacing: 16` → `gap-4` (standard match)

**T101**: Implement context-aware FILL sizing
- **File**: `lib/code-generators/react-tailwind.ts`
- **Implementation**: Check parent's layoutMode and child's layoutSizing, generate `flex-1` when FILL in flex parent
- **Why**: Generate `w-full` for FILL children; should be `flex-1` when parent is flex container
- **Test**: FILL child in horizontal flex parent → `flex-1`, FILL child in non-flex parent → `w-full`

**T102**: Add individual border width support
- **File**: `lib/code-generators/react-tailwind.ts`
- **Implementation**: Check `strokeTopWeight`, `strokeBottomWeight`, etc., generate directional classes
- **Why**: Can't represent non-uniform borders (e.g., only bottom border)
- **Test**: `strokeBottomWeight: 2, others: 0` → `border-b-2 border-t-0 border-l-0 border-r-0`

**T103**: Implement hex-to-Tailwind color mapping
- **File**: `lib/code-generators/react-tailwind.ts` (new helper function)
- **Implementation**: Calculate color distance (RGB Euclidean), map to nearest Tailwind color, fallback to arbitrary `bg-[#HEX]`
- **Why**: Generate `bg-[#3B82F6]` instead of `bg-blue-500` (cleaner, uses Tailwind tokens)
- **Test**: `#3B82F6` → `bg-blue-500`, `#3B82F7` (no close match) → `bg-[#3B82F7]`

**T104**: Add shadow pattern matching
- **File**: `lib/code-generators/react-tailwind.ts` (new helper function)
- **Implementation**: Compare shadow properties (offset, blur, spread, color) against Tailwind standard shadows with epsilon tolerance
- **Why**: No shadow conversion; lose box-shadow properties
- **Test**: Standard Figma shadow (0, 1px, 2px, rgba(0,0,0,0.1)) → `shadow-sm`

**T105**: Add blend mode conversion
- **File**: `lib/code-generators/react-tailwind.ts`
- **Implementation**: Map Figma blend modes to CSS `mix-blend-*` classes
- **Why**: No blend mode support; lose visual effects
- **Test**: `blendMode: 'MULTIPLY'` → `mix-blend-multiply`

**T106**: Add layout wrap support
- **File**: `lib/code-generators/react-tailwind.ts`
- **Implementation**: Detect `layoutWrap: "WRAP"`, generate `flex-wrap` class
- **Why**: No wrap support; flex containers always nowrap
- **Test**: `layoutWrap: 'WRAP'` → `flex-wrap`, `layoutWrap: 'NO_WRAP'` → no class

### Phase 3: MEDIUM Priority Enhancements (Nice-to-Have)

**T107**: Create TailwindBuilder class
- **File**: `lib/code-generators/tailwind-builder.ts` (new file)
- **Implementation**: Builder pattern with chained methods (`builder.size().padding().build()`)
- **Why**: Cleaner than current single-pass approach; easier to apply precedence rules
- **Test**: Builder generates deduplicated class string matching expected output

**T108**: Optimize padding classes
- **File**: `lib/code-generators/tailwind-builder.ts` (padding method)
- **Implementation**: Check if left===right, consolidate to `px-4`; same for top===bottom → `py-4`
- **Why**: Generate `pl-4 pr-4` when `px-4` is shorter
- **Test**: `paddingLeft: 16, paddingRight: 16` → `px-4` (not `pl-4 pr-4`)

**T109**: Add opacity conversion
- **File**: `lib/code-generators/react-tailwind.ts`
- **Implementation**: Map 0-1 opacity to Tailwind scale (0, 0.25→25, 0.5→50, 0.75→75, 1.0→100)
- **Why**: No opacity support
- **Test**: `opacity: 0.8` → `opacity-75` (nearest)

**T110**: Add debug data attributes
- **File**: `lib/code-generators/react-tailwind.ts` (line 45-52)
- **Implementation**: Add `data-figma-id`, `data-figma-name`, `data-figma-type` when `NODE_ENV === 'development'`
- **Why**: Hard to trace which Figma node → which DOM element in DevTools
- **Test**: Development mode: attributes present, production mode: attributes absent

**T111**: Add Tailwind v4 optimizations
- **File**: `lib/code-generators/tailwind-builder.ts` (size method)
- **Implementation**: When width===height, use `size-X` instead of `w-X h-X`
- **Why**: Tailwind v4 introduces `size-*` utility
- **Test**: `width: 48px, height: 48px` → `size-12` (not `w-12 h-12`)

**T112**: Add rotation Tailwind classes
- **File**: `lib/code-generators/react-tailwind.ts`
- **Implementation**: Map rotation degrees to `rotate-X` or arbitrary `rotate-[Xdeg]`
- **Why**: No rotation support in generated code
- **Test**: `rotation: 45` → `rotate-45`, `rotation: 47` → `rotate-[47deg]`

### Phase 4: Testing & Validation

**T113**: Add edge case tests
- **File**: `__tests__/unit/altnode-transform.test.ts`
- **Tests to add**:
  - Invisible node filtering
  - GROUP inlining with rotation
  - Rotation conversion (radians → degrees)
  - Empty container optimization
  - Icon detection (type, size, export settings)
- **Test coverage goal**: 90%+ for new edge case logic

**T114**: Update existing altnode-transform tests
- **File**: `__tests__/unit/altnode-transform.test.ts`
- **Updates**: Verify new properties (`originalNode`, `uniqueName`, `canBeFlattened`, etc.) assigned correctly
- **Test**: All existing tests pass with no regressions

**T115**: Add Tailwind generator tests
- **File**: `__tests__/unit/code-generators.test.ts`
- **Tests to add**:
  - Arbitrary value fallback (`gap-[13px]`)
  - Color mapping (hex → Tailwind color)
  - Shadow pattern matching
  - Context-aware sizing (`flex-1` vs `w-full`)
  - Individual border widths
  - Blend modes, opacity, wrap
- **Test coverage goal**: 85%+ for new Tailwind logic

**T116**: Run full test suite and verify 0 regressions
- **Command**: `npm test`
- **Expected**: All 107+ tests passing, 0 TypeScript errors
- **Regression check**: Existing WP01-WP07 functionality unaffected

## Definition of Done

- [ ] All 27 subtasks (T090-T116) completed
- [ ] CRITICAL fixes (T090-T094) verified: invisible filtering, GROUP inlining, rotation, unique names functional
- [ ] HIGH priority (T095-T106) verified: icon detection, arbitrary values, color mapping, shadow/blend modes functional
- [ ] MEDIUM priority (T107-T112) implemented (optional if time-constrained)
- [ ] Test suite passes with 0 regressions (T116)
- [ ] TypeScript compiles with 0 errors
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated: inline comments for complex edge case logic

## Implementation Guidance

### Phased Approach (Recommended)

1. **Phase 1: CRITICAL Fixes** (T090-T094) - Complete first, blocks WP08-WP12
   - Update types (T090, T091)
   - Implement edge cases (T092, T093, T094)
   - Run tests continuously to catch regressions
   - Estimated: 2-3 hours

2. **Phase 2: HIGH Priority** (T095-T106) - Improve quality significantly
   - Add metadata properties (T095)
   - Implement enhancements (T096-T106)
   - Parallel opportunities: T096-T106 can be developed concurrently (different files/concerns)
   - Estimated: 4-6 hours

3. **Phase 3: MEDIUM Priority** (T107-T112) - Optional, cleaner output
   - Create TailwindBuilder (T107-T108)
   - Add optimizations (T109-T112)
   - Estimated: 2-3 hours

4. **Phase 4: Testing** (T113-T116) - Continuous throughout, final validation
   - Write tests in parallel with implementation
   - Final regression check (T116)
   - Estimated: 1-2 hours

### Reference Materials

- **FigmaToCode Analysis**: research.md Decision 7 "Analysis Findings"
- **Code Examples**: FigmaToCode source files referenced in research.md
- **Implementation Details**: See research.md for complete code snippets, comparison tables, test patterns

### Testing Strategy

- Run tests after each phase completion
- Use FigmaToCode test patterns as reference (snapshot testing, boundary value testing, type guard testing)
- Verify no regressions in existing WP01-WP07 functionality

## Review Guidance

**Verify**:
1. CRITICAL fixes complete: invisible filtering, GROUP inlining, rotation, unique names
2. HIGH priority functional: icon detection, arbitrary values, color/shadow mapping
3. Test suite passes: 107+ tests, 0 errors
4. Build succeeds: 0 TypeScript errors
5. Code quality: inline comments for complex logic, no TODOs left

**Acceptance Criteria**:
- Transformation handles all 15+ edge cases identified in FigmaToCode analysis
- Tailwind generator produces cleaner output (arbitrary values, color tokens, optimized classes)
- 0 regressions in existing functionality
- MVP-ready: CRITICAL + HIGH priority complete (MEDIUM optional)

**Risks to flag**:
- Breaking changes in types causing cascading errors → Should be minimal with `originalNode` approach
- Test failures indicating incorrect edge case handling → Review FigmaToCode implementation
- Performance degradation from additional checks → Profile if >100ms transformation time

## Activity Log

- 2025-11-23T00:00:00Z – system – shell_pid=N/A – lane=planned – Prompt generated from FigmaToCode analysis (research.md Decision 7)
