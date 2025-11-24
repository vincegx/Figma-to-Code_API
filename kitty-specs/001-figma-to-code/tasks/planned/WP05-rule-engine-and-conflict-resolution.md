---
work_package_id: "WP05"
subtasks:
  - "T043"
  - "T044"
  - "T045"
  - "T046"
  - "T047"
  - "T048"
  - "T049"
title: "Rule Engine & Conflict Resolution"
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

# Work Package Prompt: WP05 – Rule Engine & Conflict Resolution

## Objectives & Success Criteria

Implement rule matching engine with AND-logic selectors, priority-based conflict resolution, and property provenance tracking. This is the core logic that evaluates which rules apply to each AltNode and resolves conflicts when multiple rules target the same properties.

**Success Criteria**:
- Selector matching: ALL selector properties must match (AND logic, not OR)
- Priority resolution: Higher priority wins on conflicting properties
- Property provenance: Track which rule contributed each CSS property
- Conflict detection: Identify minor (yellow) vs major (red) conflicts
- Performance: <2 seconds for 50 rules × 100 nodes (Success Criteria SC-005)
- Match accuracy: 100% across all nodes in library (Success Criteria SC-014)

## Context & Constraints

**Architecture**: Rule engine is the decision layer between AltNode transformation (WP04) and code generation (WP06). It determines which properties from which rules apply to each node.

**Key Decisions from Planning**:
- AND-logic selector matching (all properties must match, not OR)
- Property-level composition (not rule-level override) - higher priority wins per property
- Provenance tracking for debugging and transparency (Applied Rules Inspector shows "this property came from Rule X")
- Constitution Principle VI: Simple Before Clever - property matching sufficient, no CSS selector parser needed

**Constitutional Principles**:
- Principle V: Type Safety Throughout – RuleMatch structure fully typed, no `any`
- Principle VI: Simple Before Clever – Start with working property matching, not complex CSS selectors
- Principle VII: Live Feedback – Rule changes update match counts <2s (SC-005)

**Related Documents**:
- [plan.md](../plan.md) – Rule engine architecture (Section: Technical Architecture)
- [spec.md](../spec.md) – User Story 5 (Rule Manager requirements)
- [data-model.md](../data-model.md) – MappingRule, RuleMatch types
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T043 – Create rule-engine.ts with evaluateRules() entry function

**Purpose**: Establish core rule engine module with main evaluation function.

**Steps**:
1. Create `lib/rule-engine.ts`:
   ```typescript
   import { AltNode } from './types/altnode';
   import { MappingRule, RuleMatch } from './types/rule';

   /**
    * Evaluate all rules against a single AltNode
    * Returns array of matches ordered by priority (highest first)
    *
    * @param altNode - The node to evaluate rules against
    * @param rules - All available rules from rule library
    * @returns Array of RuleMatch objects with resolved properties
    */
   export function evaluateRules(
     altNode: AltNode,
     rules: MappingRule[]
   ): RuleMatch[] {
     // Filter to matching rules
     const matchingRules = rules.filter(rule =>
       selectorMatches(altNode, rule.selector)
     );

     // Sort by priority (descending - highest first)
     const sortedMatches = matchingRules.sort((a, b) => b.priority - a.priority);

     // Resolve conflicts and build RuleMatch objects
     const resolvedMatches = resolveConflicts(sortedMatches, altNode);

     return resolvedMatches;
   }
   ```

2. Verify file compiles with TypeScript strict mode

**Files**: `lib/rule-engine.ts`

**Parallel?**: No (depends on T044-T047)

**Notes**:
- evaluateRules() is called by Applied Rules Inspector (WP10) and rule match counters (WP11)
- Performance critical: must handle 50 rules × 100 nodes in <2s
- Return value ordered by priority for inspector display

---

### Subtask T044 – Implement selectorMatches(): AND-logic pattern matching

**Purpose**: Match AltNode against rule selector using AND logic (ALL selector properties must match).

**Steps**:
1. Add selectorMatches() function to `lib/rule-engine.ts`:
   ```typescript
   import { Selector } from './types/rule';

   /**
    * Check if AltNode matches selector criteria (AND logic)
    * Returns true only if ALL selector properties match
    *
    * Examples:
    *   selector: { type: "FRAME", name: "Button" }
    *   → matches FRAME nodes with name "Button" only
    *
    *   selector: { type: "TEXT" }
    *   → matches all TEXT nodes
    *
    *   selector: { name: "Icon", width: { min: 16, max: 64 } }
    *   → matches nodes named "Icon" with width 16-64px
    *
    * @param altNode - The node to match against
    * @param selector - The selector criteria from rule
    * @returns true if ALL selector properties match
    */
   export function selectorMatches(
     altNode: AltNode,
     selector: Selector
   ): boolean {
     // Type matching
     if (selector.type !== undefined && altNode.type !== selector.type) {
       return false;
     }

     // Name matching (exact match or regex)
     if (selector.name !== undefined) {
       if (typeof selector.name === 'string') {
         if (altNode.name !== selector.name) {
           return false;
         }
       } else if (selector.name instanceof RegExp) {
         if (!selector.name.test(altNode.name)) {
           return false;
         }
       }
     }

     // Width range matching
     if (selector.width !== undefined) {
       const nodeWidth = altNode.styles.width;
       if (typeof nodeWidth !== 'number') {
         return false;
       }
       if (selector.width.min !== undefined && nodeWidth < selector.width.min) {
         return false;
       }
       if (selector.width.max !== undefined && nodeWidth > selector.width.max) {
         return false;
       }
     }

     // Height range matching
     if (selector.height !== undefined) {
       const nodeHeight = altNode.styles.height;
       if (typeof nodeHeight !== 'number') {
         return false;
       }
       if (selector.height.min !== undefined && nodeHeight < selector.height.min) {
         return false;
       }
       if (selector.height.max !== undefined && nodeHeight > selector.height.max) {
         return false;
       }
     }

     // Children count matching
     if (selector.hasChildren !== undefined) {
       const hasChildren = altNode.children.length > 0;
       if (selector.hasChildren !== hasChildren) {
         return false;
       }
     }

     // Parent type matching (if available in AltNode)
     if (selector.parentType !== undefined && altNode.parent) {
       if (altNode.parent.type !== selector.parentType) {
         return false;
       }
     }

     // All checks passed - selector matches
     return true;
   }
   ```

2. Test with sample nodes:
   - FRAME with name "Button" → matches selector `{ type: "FRAME", name: "Button" }`
   - TEXT with width 100px → matches selector `{ type: "TEXT", width: { min: 50, max: 150 } }`
   - FRAME with no children → DOES NOT match selector `{ type: "FRAME", hasChildren: true }`

**Files**: `lib/rule-engine.ts`

**Parallel?**: Yes (can develop concurrently with T045-T046)

**Notes**:
- AND logic is CRITICAL: all selector properties must match for rule to apply
- Regex support for name patterns: `selector.name: /^Button/` matches "Button", "ButtonPrimary", "ButtonSecondary"
- Width/height ranges support min, max, or both
- Constitution Principle VI: Simple property matching, no need for CSS selector parser like ".class > div[data-foo]"

---

### Subtask T045 – Implement resolveConflicts(): priority-based property composition

**Purpose**: Resolve conflicts when multiple rules target the same CSS properties, composing final property set based on priority.

**Steps**:
1. Add resolveConflicts() function to `lib/rule-engine.ts`:
   ```typescript
   /**
    * Resolve conflicts between multiple matching rules
    * Returns array of RuleMatch objects with property provenance
    *
    * Logic:
    * - Rules already sorted by priority (highest first)
    * - For each property, highest priority rule wins
    * - Track provenance (which rule contributed each property)
    * - Detect conflicts (multiple rules targeting same property)
    *
    * @param matchedRules - Array of rules that matched, sorted by priority
    * @param altNode - The node being evaluated (for context)
    * @returns Array of RuleMatch objects with resolved properties
    */
   export function resolveConflicts(
     matchedRules: MappingRule[],
     altNode: AltNode
   ): RuleMatch[] {
     const ruleMatches: RuleMatch[] = [];
     const propertyOwnership: Map<string, string> = new Map(); // property name → rule ID
     const conflicts: Array<{ property: string; rules: string[] }> = [];

     // Process rules in priority order (highest first)
     for (const rule of matchedRules) {
       const contributedProperties: string[] = [];
       const ruleConflicts: string[] = [];

       // Check each transformer property
       for (const [propName, propValue] of Object.entries(rule.transformer)) {
         const existingOwner = propertyOwnership.get(propName);

         if (existingOwner === undefined) {
           // No conflict - this rule owns the property
           propertyOwnership.set(propName, rule.id);
           contributedProperties.push(propName);
         } else {
           // Conflict detected - higher priority rule already owns this property
           ruleConflicts.push(propName);
           conflicts.push({
             property: propName,
             rules: [existingOwner, rule.id],
           });
         }
       }

       // Build RuleMatch object
       const ruleMatch: RuleMatch = {
         ruleId: rule.id,
         ruleName: rule.name,
         priority: rule.priority,
         contributedProperties,
         conflicts: ruleConflicts,
         severity: ruleConflicts.length > 0 ? detectConflictSeverity(ruleConflicts) : 'none',
       };

       ruleMatches.push(ruleMatch);
     }

     return ruleMatches;
   }

   /**
    * Detect conflict severity based on property types
    *
    * MAJOR conflicts (red): Layout-critical properties
    *   - width, height, display, position, flexDirection
    *
    * MINOR conflicts (yellow): Visual properties
    *   - color, background, border, fontSize
    *
    * @param conflictedProperties - Array of property names in conflict
    * @returns 'major' | 'minor' | 'none'
    */
   function detectConflictSeverity(
     conflictedProperties: string[]
   ): 'major' | 'minor' | 'none' {
     const majorProperties = new Set([
       'width', 'height', 'display', 'position', 'flexDirection',
       'flex', 'grid', 'gap', 'padding', 'margin',
     ]);

     const hasMajorConflict = conflictedProperties.some(prop =>
       majorProperties.has(prop)
     );

     return hasMajorConflict ? 'major' : 'minor';
   }
   ```

2. Test conflict resolution:
   - Rule A (priority 10): `{ backgroundColor: 'red', padding: '16px' }`
   - Rule B (priority 5): `{ backgroundColor: 'blue', color: 'white' }`
   - Expected: backgroundColor from Rule A (higher priority), padding from Rule A, color from Rule B
   - Conflict: backgroundColor (Rule B loses)

**Files**: `lib/rule-engine.ts`

**Parallel?**: Yes (can develop concurrently with T044, T046)

**Notes**:
- Property-level composition (NOT rule-level override) - higher priority wins per property, other properties from lower priority rules still apply
- Provenance tracking: contributedProperties array shows which properties came from this rule
- Conflict severity: major (red) = layout-breaking, minor (yellow) = visual only
- Applied Rules Inspector (WP10) will display conflicts with severity colors

---

### Subtask T046 – Add conflict detection: minor (yellow) vs major (red) conflicts

**Purpose**: Classify conflicts by severity to help users prioritize fixes.

**Steps**:
1. Expand detectConflictSeverity() from T045 with comprehensive property classification:
   ```typescript
   /**
    * Classify CSS properties by conflict severity
    *
    * MAJOR conflicts (red - layout-breaking):
    *   Layout: width, height, display, position, flexDirection, flex, grid
    *   Spacing: gap, padding, margin, top, right, bottom, left
    *   Auto-layout: alignItems, justifyContent, flexWrap
    *
    * MINOR conflicts (yellow - visual only):
    *   Colors: color, backgroundColor, borderColor
    *   Typography: fontSize, fontWeight, fontFamily, lineHeight
    *   Effects: boxShadow, opacity, transform, filter
    *   Borders: border, borderRadius, borderWidth
    */
   const MAJOR_PROPERTIES = new Set([
     // Layout
     'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
     'display', 'position', 'flexDirection', 'flex', 'flexGrow', 'flexShrink',
     'grid', 'gridTemplateColumns', 'gridTemplateRows',

     // Spacing
     'gap', 'rowGap', 'columnGap',
     'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
     'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
     'top', 'right', 'bottom', 'left',

     // Auto-layout
     'alignItems', 'justifyContent', 'alignContent', 'flexWrap',
   ]);

   const MINOR_PROPERTIES = new Set([
     // Colors
     'color', 'backgroundColor', 'borderColor',

     // Typography
     'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
     'textAlign', 'textDecoration', 'textTransform',

     // Effects
     'boxShadow', 'opacity', 'transform', 'filter', 'backdropFilter',

     // Borders
     'border', 'borderRadius', 'borderWidth', 'borderStyle',
     'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
   ]);

   function detectConflictSeverity(
     conflictedProperties: string[]
   ): 'major' | 'minor' | 'none' {
     if (conflictedProperties.length === 0) {
       return 'none';
     }

     const hasMajorConflict = conflictedProperties.some(prop =>
       MAJOR_PROPERTIES.has(prop)
     );

     return hasMajorConflict ? 'major' : 'minor';
   }
   ```

2. Add visual examples to documentation:
   - **MAJOR conflict example**: Two rules set different `width` values → layout breaks
   - **MINOR conflict example**: Two rules set different `color` values → visual inconsistency only

**Files**: `lib/rule-engine.ts`

**Parallel?**: Yes (can develop concurrently with T044-T045)

**Notes**:
- Applied Rules Inspector (WP10) will display conflicts with color coding:
  - Red badge: "⚠️ MAJOR conflict on width, padding" (layout-breaking)
  - Yellow badge: "⚠️ Minor conflict on color" (visual only)
- Users should prioritize fixing major conflicts first
- Constitution Principle VII: Live Feedback - conflict highlighting provides immediate visual feedback

---

### Subtask T047 – Track property provenance: record which rule contributed each CSS property

**Purpose**: Enable Applied Rules Inspector to show "Property X came from Rule Y" for transparency and debugging.

**Steps**:
1. Add property provenance to RuleMatch type (already defined in T045, document usage):
   ```typescript
   // RuleMatch structure (from lib/types/rule.ts)
   export interface RuleMatch {
     ruleId: string;
     ruleName: string;
     priority: number;
     contributedProperties: string[];  // PROVENANCE: properties from this rule
     conflicts: string[];               // Properties where this rule lost to higher priority
     severity: 'major' | 'minor' | 'none';
   }
   ```

2. Create helper function to get property provenance for entire node:
   ```typescript
   /**
    * Build complete property provenance map for Applied Rules Inspector
    *
    * Returns map of CSS property → rule that contributed it
    * Example: { "backgroundColor": "rule-123", "padding": "rule-456" }
    *
    * @param ruleMatches - Array of RuleMatch objects from evaluateRules()
    * @returns Map of property name → rule ID
    */
   export function getPropertyProvenance(
     ruleMatches: RuleMatch[]
   ): Map<string, string> {
     const provenance = new Map<string, string>();

     for (const match of ruleMatches) {
       for (const property of match.contributedProperties) {
         provenance.set(property, match.ruleId);
       }
     }

     return provenance;
   }
   ```

3. Test provenance tracking:
   - Rule A (priority 10): contributes `backgroundColor`, `padding`
   - Rule B (priority 5): contributes `color` (backgroundColor conflict lost)
   - Expected provenance map: `{ backgroundColor: 'A', padding: 'A', color: 'B' }`

**Files**: `lib/rule-engine.ts`

**Parallel?**: No (depends on T045 conflict resolution)

**Notes**:
- Applied Rules Inspector (WP10) will display provenance inline:
  ```
  backgroundColor: #FF0000 (from Rule A - Priority 10)
  padding: 16px (from Rule A - Priority 10)
  color: white (from Rule B - Priority 5)
  ```
- Provenance tracking is CRITICAL for debugging multi-rule scenarios
- Success Criteria SC-008: Inspector clarity allows understanding conflicts without external docs

---

### Subtask T048 – Test rule matching: multiple rules, overlapping selectors, priority override

**Purpose**: Validate rule engine correctness with comprehensive test cases.

**Steps**:
1. Create `__tests__/unit/rule-engine.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { evaluateRules, selectorMatches, resolveConflicts } from '@/lib/rule-engine';
   import { AltNode } from '@/lib/types/altnode';
   import { MappingRule } from '@/lib/types/rule';

   describe('Rule Engine - Selector Matching (AND logic)', () => {
     it('should match when all selector properties match', () => {
       const node: AltNode = {
         id: '1',
         name: 'Button',
         type: 'FRAME',
         styles: { width: 100, height: 40 },
         children: [],
       };

       const selector = { type: 'FRAME', name: 'Button' };
       expect(selectorMatches(node, selector)).toBe(true);
     });

     it('should NOT match when any selector property fails', () => {
       const node: AltNode = {
         id: '1',
         name: 'Button',
         type: 'FRAME',
         styles: { width: 100, height: 40 },
         children: [],
       };

       const selector = { type: 'TEXT', name: 'Button' }; // type mismatch
       expect(selectorMatches(node, selector)).toBe(false);
     });

     it('should match width range', () => {
       const node: AltNode = {
         id: '1',
         name: 'Icon',
         type: 'FRAME',
         styles: { width: 32, height: 32 },
         children: [],
       };

       const selector = { width: { min: 16, max: 64 } };
       expect(selectorMatches(node, selector)).toBe(true);
     });

     it('should NOT match width outside range', () => {
       const node: AltNode = {
         id: '1',
         name: 'Icon',
         type: 'FRAME',
         styles: { width: 100, height: 32 },
         children: [],
       };

       const selector = { width: { min: 16, max: 64 } };
       expect(selectorMatches(node, selector)).toBe(false);
     });

     it('should match regex name pattern', () => {
       const node: AltNode = {
         id: '1',
         name: 'ButtonPrimary',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const selector = { name: /^Button/ }; // starts with "Button"
       expect(selectorMatches(node, selector)).toBe(true);
     });
   });

   describe('Rule Engine - Priority Resolution', () => {
     it('should resolve conflicts with higher priority winning', () => {
       const node: AltNode = {
         id: '1',
         name: 'Button',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const ruleA: MappingRule = {
         id: 'rule-a',
         name: 'Rule A',
         priority: 10,
         selector: { type: 'FRAME' },
         transformer: {
           backgroundColor: 'red',
           padding: '16px',
         },
       };

       const ruleB: MappingRule = {
         id: 'rule-b',
         name: 'Rule B',
         priority: 5,
         selector: { type: 'FRAME' },
         transformer: {
           backgroundColor: 'blue', // conflict with ruleA
           color: 'white',
         },
       };

       const matches = evaluateRules(node, [ruleA, ruleB]);

       expect(matches).toHaveLength(2);
       expect(matches[0].ruleId).toBe('rule-a'); // higher priority first
       expect(matches[0].contributedProperties).toContain('backgroundColor');
       expect(matches[0].contributedProperties).toContain('padding');
       expect(matches[1].ruleId).toBe('rule-b');
       expect(matches[1].contributedProperties).toContain('color');
       expect(matches[1].conflicts).toContain('backgroundColor'); // lost to ruleA
     });
   });

   describe('Rule Engine - Conflict Detection', () => {
     it('should detect major conflicts on layout properties', () => {
       const node: AltNode = {
         id: '1',
         name: 'Container',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const ruleA: MappingRule = {
         id: 'rule-a',
         name: 'Rule A',
         priority: 10,
         selector: { type: 'FRAME' },
         transformer: { width: '100px' },
       };

       const ruleB: MappingRule = {
         id: 'rule-b',
         name: 'Rule B',
         priority: 5,
         selector: { type: 'FRAME' },
         transformer: { width: '200px' }, // major conflict on width
       };

       const matches = evaluateRules(node, [ruleA, ruleB]);

       expect(matches[1].severity).toBe('major'); // ruleB has major conflict
     });

     it('should detect minor conflicts on visual properties', () => {
       const node: AltNode = {
         id: '1',
         name: 'Text',
         type: 'TEXT',
         styles: {},
         children: [],
       };

       const ruleA: MappingRule = {
         id: 'rule-a',
         name: 'Rule A',
         priority: 10,
         selector: { type: 'TEXT' },
         transformer: { color: 'red' },
       };

       const ruleB: MappingRule = {
         id: 'rule-b',
         name: 'Rule B',
         priority: 5,
         selector: { type: 'TEXT' },
         transformer: { color: 'blue' }, // minor conflict on color
       };

       const matches = evaluateRules(node, [ruleA, ruleB]);

       expect(matches[1].severity).toBe('minor'); // ruleB has minor conflict
     });
   });

   describe('Rule Engine - Property Provenance', () => {
     it('should track which rule contributed each property', () => {
       const node: AltNode = {
         id: '1',
         name: 'Button',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const ruleA: MappingRule = {
         id: 'rule-a',
         name: 'Rule A',
         priority: 10,
         selector: { type: 'FRAME' },
         transformer: {
           backgroundColor: 'red',
           padding: '16px',
         },
       };

       const ruleB: MappingRule = {
         id: 'rule-b',
         name: 'Rule B',
         priority: 5,
         selector: { type: 'FRAME' },
         transformer: {
           color: 'white',
         },
       };

       const matches = evaluateRules(node, [ruleA, ruleB]);
       const provenance = getPropertyProvenance(matches);

       expect(provenance.get('backgroundColor')).toBe('rule-a');
       expect(provenance.get('padding')).toBe('rule-a');
       expect(provenance.get('color')).toBe('rule-b');
     });
   });
   ```

2. Run tests:
   ```bash
   npm test rule-engine.test.ts
   ```

3. Verify all tests pass with 90% coverage target (Constitution requirement)

**Files**: `__tests__/unit/rule-engine.test.ts`

**Parallel?**: No (requires T043-T047 complete)

**Notes**:
- Test cases cover all selector types: exact name, regex, width/height ranges, hasChildren
- Test cases cover conflict resolution: priority override, property composition, severity detection
- Test cases cover provenance: property attribution to rules
- Coverage target: 90% for rule engine (Constitution Testing Standards)

---

### Subtask T049 – Benchmark performance: <2 seconds for 50 rules × 100 nodes

**Purpose**: Validate performance meets Success Criteria SC-005 and SC-014.

**Steps**:
1. Create `__tests__/performance/rule-engine-benchmark.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { evaluateRules } from '@/lib/rule-engine';
   import { AltNode } from '@/lib/types/altnode';
   import { MappingRule } from '@/lib/types/rule';

   describe('Rule Engine - Performance Benchmarks', () => {
     it('should evaluate 50 rules × 100 nodes in <2 seconds (SC-005)', () => {
       // Generate 100 test nodes
       const nodes: AltNode[] = Array.from({ length: 100 }, (_, i) => ({
         id: `node-${i}`,
         name: `Node ${i}`,
         type: i % 3 === 0 ? 'FRAME' : i % 3 === 1 ? 'TEXT' : 'RECTANGLE',
         styles: {
           width: 50 + (i * 5),
           height: 30 + (i * 2),
         },
         children: [],
       }));

       // Generate 50 test rules
       const rules: MappingRule[] = Array.from({ length: 50 }, (_, i) => ({
         id: `rule-${i}`,
         name: `Rule ${i}`,
         priority: i,
         selector: {
           type: i % 3 === 0 ? 'FRAME' : i % 3 === 1 ? 'TEXT' : 'RECTANGLE',
         },
         transformer: {
           backgroundColor: `hsl(${i * 7}, 70%, 50%)`,
           padding: `${i + 8}px`,
         },
       }));

       // Benchmark: evaluate all rules against all nodes
       const startTime = performance.now();

       const results = nodes.map(node => evaluateRules(node, rules));

       const endTime = performance.now();
       const duration = endTime - startTime;

       console.log(`Evaluated 50 rules × 100 nodes in ${duration.toFixed(2)}ms`);

       // Success Criteria SC-005: <2000ms
       expect(duration).toBeLessThan(2000);
       expect(results).toHaveLength(100);
     });

     it('should calculate match counts for entire library in <2 seconds', () => {
       // Simulate use-rule-matches.ts hook calculating match counts
       const nodes: AltNode[] = Array.from({ length: 100 }, (_, i) => ({
         id: `node-${i}`,
         name: `Node ${i}`,
         type: i % 2 === 0 ? 'FRAME' : 'TEXT',
         styles: {},
         children: [],
       }));

       const rules: MappingRule[] = Array.from({ length: 30 }, (_, i) => ({
         id: `rule-${i}`,
         name: `Rule ${i}`,
         priority: i,
         selector: { type: i % 2 === 0 ? 'FRAME' : 'TEXT' },
         transformer: { padding: '16px' },
       }));

       const startTime = performance.now();

       // Calculate match count for each rule (Rule Manager sidebar display)
       const matchCounts = rules.map(rule => {
         const matchingNodes = nodes.filter(node =>
           evaluateRules(node, [rule]).length > 0
         );
         return {
           ruleId: rule.id,
           matchCount: matchingNodes.length,
         };
       });

       const endTime = performance.now();
       const duration = endTime - startTime;

       console.log(`Calculated match counts for 30 rules × 100 nodes in ${duration.toFixed(2)}ms`);

       expect(duration).toBeLessThan(2000);
       expect(matchCounts).toHaveLength(30);
       expect(matchCounts[0].matchCount).toBeGreaterThan(0);
     });
   });
   ```

2. Run benchmark:
   ```bash
   npm test rule-engine-benchmark.test.ts
   ```

3. If performance fails (<2s), profile and optimize:
   - Use Map for selector property lookup instead of array iteration
   - Memoize selectorMatches() results for identical selectors
   - Short-circuit evaluation: return false early on first selector mismatch

**Files**: `__tests__/performance/rule-engine-benchmark.test.ts`

**Parallel?**: No (requires T043-T048 complete)

**Notes**:
- Performance target: <2 seconds for 50 rules × 100 nodes (Success Criteria SC-005)
- Real-world usage: Rule Manager sidebar calculates match counts on rule changes (WP11)
- Applied Rules Inspector updates on node selection in Viewer (WP10)
- If benchmark fails, investigate bottlenecks:
  - Selector matching: optimize regex compilation, property lookup
  - Conflict resolution: optimize property iteration
  - Provenance tracking: optimize map operations

## Definition of Done Checklist

- [ ] `lib/rule-engine.ts` created with evaluateRules() function
- [ ] selectorMatches() implements AND-logic matching (all properties must match)
- [ ] resolveConflicts() implements priority-based property composition
- [ ] Conflict detection classifies major (red) vs minor (yellow) conflicts
- [ ] Property provenance tracked via contributedProperties in RuleMatch
- [ ] Unit tests written with 90% coverage (Constitution requirement)
- [ ] Performance benchmark passes: <2 seconds for 50 rules × 100 nodes
- [ ] All tests pass: `npm test rule-engine.test.ts`
- [ ] TypeScript strict mode: zero errors with `npx tsc --noEmit`

## Review Guidance

**Key Acceptance Checkpoints**:
1. Selector matching uses AND logic (NOT OR) - all selector properties must match
2. Priority resolution at property level (NOT rule level) - higher priority wins per property
3. Provenance tracked: contributedProperties array shows which properties from which rule
4. Conflict severity correctly classified: major (layout) vs minor (visual)
5. Performance meets Success Criteria SC-005: <2s for 50 rules × 100 nodes
6. Test coverage meets 90% (Constitution requirement for rule engine)

**Reviewers should verify**:
- No `any` types in rule-engine.ts (TypeScript strict mode)
- selectorMatches() handles all selector types: type, name (string + regex), width/height ranges, hasChildren, parentType
- resolveConflicts() correctly orders by priority (descending - highest first)
- Conflict detection accurately identifies major vs minor based on property type
- RuleMatch structure includes all required fields: ruleId, ruleName, priority, contributedProperties, conflicts, severity
- Benchmark test completes in <2s for 50 rules × 100 nodes

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
