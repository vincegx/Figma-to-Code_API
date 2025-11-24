---
work_package_id: "WP06"
subtasks:
  - "T050"
  - "T051"
  - "T052"
  - "T053"
  - "T054"
  - "T055"
  - "T056"
  - "T057"
title: "Code Generators"
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

# Work Package Prompt: WP06 – Code Generators

## Objectives & Success Criteria

Generate syntactically valid React JSX, React+Tailwind, and HTML/CSS code from AltNode trees with resolved rule properties. Implement FigmaToCode Tailwind enhancements (arbitrary values, rotation classes, opacity conversion, PascalCase validation).

**Success Criteria**:
- Generated code is syntactically valid (JSX parser, HTML DOM parser)
- Tailwind output uses arbitrary values when needed (`gap-[13px]` for non-standard values)
- Rotation classes generated correctly (`rotate-45`, `rotate-[47deg]`)
- Opacity converted to Tailwind scale (0-1 → 0, 25, 50, 75, 100)
- Component names PascalCase with numeric-leading prefix ("Component123Button")
- Code readability: proper indentation, line breaks, semantic naming
- Success Criteria SC-007: Format switch → preview update <500ms

## Context & Constraints

**Architecture**: Code generators are the output layer that transforms AltNode trees (with resolved rule properties from WP05) into framework-specific code. Each generator produces different output formats for different developer workflows.

**Key Decisions from Planning**:
- Template-based generation (string interpolation, not AST manipulation) - simpler and faster
- React JSX: Export function components with inline styles as `React.CSSProperties`
- React+Tailwind: Map CSS properties to Tailwind classes, use arbitrary values for non-standard values
- HTML/CSS: Generate separate `.css` file with class selectors
- Recursive generation for nested children
- FigmaToCode recommendations: Tailwind enhancements (arbitrary values, rotation, opacity)

**Constitutional Principles**:
- Principle V: Type Safety Throughout – Generated code type-safe (TypeScript JSX)
- Principle VI: Simple Before Clever – Template-based generation, not complex AST
- Principle VII: Live Feedback – Preview updates <500ms on format switch (SC-007)

**Related Documents**:
- [plan.md](../plan.md) – Code generation architecture
- [spec.md](../spec.md) – User Story 4 (Viewer page requirements)
- [research.md](../research.md) – FigmaToCode Decision 7 (Tailwind enhancements)
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T050 – Create lib/code-generators/react.ts for React JSX with inline styles

**Purpose**: Generate React JSX components with inline styles (no Tailwind, pure CSS-in-JS).

**Steps**:
1. Create `lib/code-generators/react.ts`:
   ```typescript
   import { AltNode } from '../types/altnode';
   import { GeneratedCode } from '../types/generated-code';
   import { toPascalCase, cssObjectToString } from './helpers';

   /**
    * Generate React JSX component with inline styles
    *
    * Output format:
    *   export function ButtonComponent() {
    *     const styles: React.CSSProperties = {
    *       display: 'flex',
    *       padding: '16px',
    *       backgroundColor: '#FF0000',
    *     };
    *
    *     return (
    *       <div style={styles}>
    *         <span>Button Text</span>
    *       </div>
    *     );
    *   }
    *
    * @param altNode - The AltNode tree to generate code from
    * @param resolvedProperties - CSS properties from rule evaluation
    * @returns GeneratedCode object with JSX string
    */
   export function generateReactJSX(
     altNode: AltNode,
     resolvedProperties: Record<string, string>
   ): GeneratedCode {
     const componentName = toPascalCase(altNode.uniqueName);
     const jsx = generateJSXElement(altNode, resolvedProperties, 0);

     const code = `export function ${componentName}() {
  return (
${jsx}
  );
}`;

     return {
       code,
       format: 'react-jsx',
       language: 'tsx',
       metadata: {
         componentName,
         nodeId: altNode.id,
         generatedAt: new Date().toISOString(),
       },
     };
   }

   /**
    * Recursively generate JSX element with children
    *
    * @param node - Current AltNode
    * @param properties - Resolved CSS properties for this node
    * @param depth - Indentation depth
    * @returns JSX string
    */
   function generateJSXElement(
     node: AltNode,
     properties: Record<string, string>,
     depth: number
   ): string {
     const indent = '  '.repeat(depth + 1);
     const htmlTag = mapNodeTypeToHTMLTag(node.type);

     // Build style object
     const styleLines = Object.entries(properties)
       .map(([key, value]) => `${indent}  ${key}: '${value}',`)
       .join('\n');

     const hasStyles = styleLines.length > 0;
     const hasChildren = node.children.length > 0;

     // Generate style declaration
     let jsxString = '';
     if (hasStyles) {
       jsxString += `${indent}const styles: React.CSSProperties = {\n`;
       jsxString += styleLines + '\n';
       jsxString += `${indent}};\n\n`;
     }

     // Generate JSX
     if (hasChildren) {
       jsxString += `${indent}<${htmlTag}${hasStyles ? ' style={styles}' : ''}>\n`;

       // Recursively generate children
       for (const child of node.children) {
         jsxString += generateJSXElement(child, {}, depth + 1);
       }

       jsxString += `${indent}</${htmlTag}>`;
     } else {
       // Self-closing tag for leaf nodes
       const content = node.type === 'TEXT' ? node.styles.text || '' : '';
       if (content) {
         jsxString += `${indent}<${htmlTag}${hasStyles ? ' style={styles}' : ''}>${content}</${htmlTag}>`;
       } else {
         jsxString += `${indent}<${htmlTag}${hasStyles ? ' style={styles}' : ''} />`;
       }
     }

     return jsxString + '\n';
   }

   /**
    * Map Figma node type to HTML tag
    */
   function mapNodeTypeToHTMLTag(nodeType: string): string {
     const mapping: Record<string, string> = {
       FRAME: 'div',
       RECTANGLE: 'div',
       TEXT: 'span',
       GROUP: 'div',
       COMPONENT: 'div',
       INSTANCE: 'div',
       VECTOR: 'svg',
       ELLIPSE: 'div',
     };

     return mapping[nodeType] || 'div';
   }
   ```

2. Test generation with sample AltNode:
   ```typescript
   const node: AltNode = {
     id: '1',
     name: 'Button',
     uniqueName: 'Button',
     type: 'FRAME',
     styles: {},
     children: [
       {
         id: '2',
         name: 'Text',
         uniqueName: 'Text',
         type: 'TEXT',
         styles: { text: 'Click me' },
         children: [],
       },
     ],
   };

   const properties = {
     display: 'flex',
     padding: '16px',
     backgroundColor: '#FF0000',
   };

   const result = generateReactJSX(node, properties);
   console.log(result.code);
   // Expected output: Valid JSX with inline styles
   ```

**Files**: `lib/code-generators/react.ts`

**Parallel?**: Yes (can develop concurrently with T051, T052)

**Notes**:
- React JSX uses inline styles (no external CSS file)
- Style object typed as `React.CSSProperties` for type safety
- Recursive generation handles nested children
- Component names PascalCase (validated in T054)
- Indentation: 2 spaces per level

---

### Subtask T051 – Create lib/code-generators/react-tailwind.ts for React with Tailwind utility classes

**Purpose**: Generate React JSX components with Tailwind CSS utility classes instead of inline styles.

**Steps**:
1. Create `lib/code-generators/react-tailwind.ts`:
   ```typescript
   import { AltNode } from '../types/altnode';
   import { GeneratedCode } from '../types/generated-code';
   import { toPascalCase, cssPropToTailwind } from './helpers';

   /**
    * Generate React JSX component with Tailwind CSS classes
    *
    * Output format:
    *   export function ButtonComponent() {
    *     return (
    *       <div className="flex p-4 bg-red-500 rounded-lg">
    *         <span className="text-white font-semibold">Button Text</span>
    *       </div>
    *     );
    *   }
    *
    * FigmaToCode enhancements:
    * - Arbitrary values for non-standard sizes: gap-[13px]
    * - Rotation classes: rotate-45, rotate-[47deg]
    * - Opacity conversion: 0-1 → opacity-0, opacity-25, opacity-50, opacity-75, opacity-100
    *
    * @param altNode - The AltNode tree to generate code from
    * @param resolvedProperties - CSS properties from rule evaluation
    * @returns GeneratedCode object with Tailwind JSX string
    */
   export function generateReactTailwind(
     altNode: AltNode,
     resolvedProperties: Record<string, string>
   ): GeneratedCode {
     const componentName = toPascalCase(altNode.uniqueName);
     const jsx = generateTailwindJSXElement(altNode, resolvedProperties, 0);

     const code = `export function ${componentName}() {
  return (
${jsx}
  );
}`;

     return {
       code,
       format: 'react-tailwind',
       language: 'tsx',
       metadata: {
         componentName,
         nodeId: altNode.id,
         generatedAt: new Date().toISOString(),
       },
     };
   }

   /**
    * Recursively generate JSX element with Tailwind classes
    *
    * @param node - Current AltNode
    * @param properties - Resolved CSS properties for this node
    * @param depth - Indentation depth
    * @returns JSX string with Tailwind classes
    */
   function generateTailwindJSXElement(
     node: AltNode,
     properties: Record<string, string>,
     depth: number
   ): string {
     const indent = '  '.repeat(depth + 1);
     const htmlTag = mapNodeTypeToHTMLTag(node.type);

     // Convert CSS properties to Tailwind classes
     const tailwindClasses = Object.entries(properties)
       .map(([cssProperty, cssValue]) => cssPropToTailwind(cssProperty, cssValue))
       .filter(Boolean)
       .join(' ');

     const hasClasses = tailwindClasses.length > 0;
     const hasChildren = node.children.length > 0;

     // Generate JSX
     let jsxString = '';

     if (hasChildren) {
       jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''}>\n`;

       // Recursively generate children
       for (const child of node.children) {
         jsxString += generateTailwindJSXElement(child, {}, depth + 1);
       }

       jsxString += `${indent}</${htmlTag}>`;
     } else {
       // Leaf node
       const content = node.type === 'TEXT' ? node.styles.text || '' : '';
       if (content) {
         jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''}>${content}</${htmlTag}>`;
       } else {
         jsxString += `${indent}<${htmlTag}${hasClasses ? ` className="${tailwindClasses}"` : ''} />`;
       }
     }

     return jsxString + '\n';
   }

   function mapNodeTypeToHTMLTag(nodeType: string): string {
     // Same mapping as react.ts
     const mapping: Record<string, string> = {
       FRAME: 'div',
       RECTANGLE: 'div',
       TEXT: 'span',
       GROUP: 'div',
       COMPONENT: 'div',
       INSTANCE: 'div',
       VECTOR: 'svg',
       ELLIPSE: 'div',
     };

     return mapping[nodeType] || 'div';
   }
   ```

2. Test Tailwind generation:
   ```typescript
   const node: AltNode = {
     id: '1',
     name: 'Button',
     uniqueName: 'Button',
     type: 'FRAME',
     styles: {},
     children: [],
   };

   const properties = {
     display: 'flex',
     padding: '16px',
     backgroundColor: '#EF4444', // Tailwind red-500
     borderRadius: '8px',
   };

   const result = generateReactTailwind(node, properties);
   console.log(result.code);
   // Expected: <div className="flex p-4 bg-red-500 rounded-lg" />
   ```

**Files**: `lib/code-generators/react-tailwind.ts`

**Parallel?**: Yes (can develop concurrently with T050, T052)

**Notes**:
- Tailwind class mapping handled by cssPropToTailwind() helper (T053)
- FigmaToCode enhancements integrated in T054
- Arbitrary value syntax: `gap-[13px]` when no standard class exists
- Rotation classes: `rotate-45`, `rotate-90`, `rotate-[47deg]`
- Opacity conversion: 0.5 → `opacity-50`, 0.73 → `opacity-75` (nearest)

---

### Subtask T052 – Create lib/code-generators/html-css.ts for HTML + separate CSS file

**Purpose**: Generate HTML with class names and a separate CSS file with styles.

**Steps**:
1. Create `lib/code-generators/html-css.ts`:
   ```typescript
   import { AltNode } from '../types/altnode';
   import { GeneratedCode } from '../types/generated-code';
   import { toPascalCase, cssObjectToString } from './helpers';

   /**
    * Generate HTML with separate CSS file
    *
    * Output format:
    *   HTML file:
    *     <div class="button-component">
    *       <span class="button-text">Click me</span>
    *     </div>
    *
    *   CSS file:
    *     .button-component {
    *       display: flex;
    *       padding: 16px;
    *       background-color: #FF0000;
    *       border-radius: 8px;
    *     }
    *
    * @param altNode - The AltNode tree to generate code from
    * @param resolvedProperties - CSS properties from rule evaluation
    * @returns GeneratedCode object with HTML and CSS strings
    */
   export function generateHTMLCSS(
     altNode: AltNode,
     resolvedProperties: Record<string, string>
   ): GeneratedCode {
     const className = toKebabCase(altNode.uniqueName);
     const cssRules: Array<{ selector: string; properties: Record<string, string> }> = [];

     // Generate HTML and collect CSS rules
     const html = generateHTMLElement(altNode, resolvedProperties, cssRules, 0);

     // Generate CSS from collected rules
     const css = cssRules
       .map(rule => {
         const properties = Object.entries(rule.properties)
           .map(([key, value]) => `  ${toKebabCase(key)}: ${value};`)
           .join('\n');
         return `.${rule.selector} {\n${properties}\n}`;
       })
       .join('\n\n');

     const code = `<!-- HTML -->\n${html}\n\n/* CSS */\n${css}`;

     return {
       code,
       format: 'html-css',
       language: 'html',
       metadata: {
         componentName: className,
         nodeId: altNode.id,
         generatedAt: new Date().toISOString(),
       },
       css, // Include separate CSS string
     };
   }

   /**
    * Recursively generate HTML element and collect CSS rules
    *
    * @param node - Current AltNode
    * @param properties - Resolved CSS properties for this node
    * @param cssRules - Array to collect CSS rules (mutated)
    * @param depth - Indentation depth
    * @returns HTML string
    */
   function generateHTMLElement(
     node: AltNode,
     properties: Record<string, string>,
     cssRules: Array<{ selector: string; properties: Record<string, string> }>,
     depth: number
   ): string {
     const indent = '  '.repeat(depth);
     const htmlTag = mapNodeTypeToHTMLTag(node.type);
     const className = toKebabCase(node.uniqueName);

     // Collect CSS rule for this node
     if (Object.keys(properties).length > 0) {
       cssRules.push({
         selector: className,
         properties,
       });
     }

     const hasChildren = node.children.length > 0;

     // Generate HTML
     let htmlString = '';

     if (hasChildren) {
       htmlString += `${indent}<${htmlTag} class="${className}">\n`;

       // Recursively generate children
       for (const child of node.children) {
         htmlString += generateHTMLElement(child, {}, cssRules, depth + 1);
       }

       htmlString += `${indent}</${htmlTag}>`;
     } else {
       // Leaf node
       const content = node.type === 'TEXT' ? node.styles.text || '' : '';
       if (content) {
         htmlString += `${indent}<${htmlTag} class="${className}">${content}</${htmlTag}>`;
       } else {
         htmlString += `${indent}<${htmlTag} class="${className}"></${htmlTag}>`;
       }
     }

     return htmlString + '\n';
   }

   function mapNodeTypeToHTMLTag(nodeType: string): string {
     const mapping: Record<string, string> = {
       FRAME: 'div',
       RECTANGLE: 'div',
       TEXT: 'span',
       GROUP: 'div',
       COMPONENT: 'div',
       INSTANCE: 'div',
       VECTOR: 'svg',
       ELLIPSE: 'div',
     };

     return mapping[nodeType] || 'div';
   }

   function toKebabCase(str: string): string {
     return str
       .replace(/([a-z])([A-Z])/g, '$1-$2')
       .replace(/[\s_]+/g, '-')
       .toLowerCase();
   }
   ```

2. Test HTML/CSS generation

**Files**: `lib/code-generators/html-css.ts`

**Parallel?**: Yes (can develop concurrently with T050, T051)

**Notes**:
- HTML uses semantic class names (kebab-case: button-component, button-text)
- CSS collected during HTML generation (single pass)
- CSS properties converted from camelCase to kebab-case (backgroundColor → background-color)
- Output includes both HTML and CSS strings in GeneratedCode object

---

### Subtask T053 – Create lib/code-generators/helpers.ts with utility functions

**Purpose**: Shared helper functions for code generation (PascalCase, CSS conversion, formatting).

**Steps**:
1. Create `lib/code-generators/helpers.ts`:
   ```typescript
   /**
    * Convert string to PascalCase for React component names
    *
    * Examples:
    *   "button-primary" → "ButtonPrimary"
    *   "icon_24px" → "Icon24px"
    *   "123Button" → "Component123Button" (prefix numeric-leading)
    *
    * @param str - Input string
    * @returns PascalCase string
    */
   export function toPascalCase(str: string): string {
     // Remove non-alphanumeric characters, split into words
     const words = str
       .replace(/[^a-zA-Z0-9]/g, ' ')
       .split(/\s+/)
       .filter(Boolean);

     const pascalCased = words
       .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
       .join('');

     // FigmaToCode enhancement: Prefix numeric-leading names
     if (/^[0-9]/.test(pascalCased)) {
       return 'Component' + pascalCased;
     }

     return pascalCased || 'Component'; // Fallback if empty
   }

   /**
    * Convert CSS object to string
    *
    * Example:
    *   { display: 'flex', padding: '16px' } → "display: flex; padding: 16px;"
    *
    * @param cssObject - CSS properties as object
    * @returns CSS string
    */
   export function cssObjectToString(cssObject: Record<string, string>): string {
     return Object.entries(cssObject)
       .map(([key, value]) => `${toKebabCase(key)}: ${value}`)
       .join('; ');
   }

   /**
    * Convert CSS property + value to Tailwind class
    *
    * FigmaToCode enhancements:
    * - Arbitrary values: gap-[13px] for non-standard values
    * - Rotation classes: rotate-45, rotate-[47deg]
    * - Opacity conversion: 0-1 → opacity-0, opacity-25, opacity-50, opacity-75, opacity-100
    *
    * @param cssProperty - CSS property name (camelCase)
    * @param cssValue - CSS value
    * @returns Tailwind class string (or empty if no mapping)
    */
   export function cssPropToTailwind(cssProperty: string, cssValue: string): string {
     // Normalize property name
     const prop = cssProperty.toLowerCase();

     // Display
     if (prop === 'display') {
       const displayMap: Record<string, string> = {
         flex: 'flex',
         block: 'block',
         inline: 'inline',
         'inline-block': 'inline-block',
         grid: 'grid',
         hidden: 'hidden',
       };
       return displayMap[cssValue] || '';
     }

     // Flex direction
     if (prop === 'flexdirection') {
       const directionMap: Record<string, string> = {
         row: 'flex-row',
         column: 'flex-col',
         'row-reverse': 'flex-row-reverse',
         'column-reverse': 'flex-col-reverse',
       };
       return directionMap[cssValue] || '';
     }

     // Padding (standard values: 4, 8, 12, 16, 20, 24, 32...)
     if (prop === 'padding') {
       const match = cssValue.match(/^(\d+)px$/);
       if (match) {
         const px = parseInt(match[1], 10);
         // Tailwind scale: p-0, p-1 (4px), p-2 (8px), p-4 (16px), p-8 (32px)
         const standardValues: Record<number, string> = {
           0: 'p-0',
           4: 'p-1',
           8: 'p-2',
           12: 'p-3',
           16: 'p-4',
           20: 'p-5',
           24: 'p-6',
           32: 'p-8',
           40: 'p-10',
           48: 'p-12',
           64: 'p-16',
         };
         return standardValues[px] || `p-[${px}px]`; // Arbitrary value fallback
       }
     }

     // Gap (FigmaToCode enhancement: arbitrary values)
     if (prop === 'gap') {
       const match = cssValue.match(/^(\d+)px$/);
       if (match) {
         const px = parseInt(match[1], 10);
         const standardValues: Record<number, string> = {
           0: 'gap-0',
           4: 'gap-1',
           8: 'gap-2',
           12: 'gap-3',
           16: 'gap-4',
           20: 'gap-5',
           24: 'gap-6',
           32: 'gap-8',
         };
         return standardValues[px] || `gap-[${px}px]`; // Arbitrary value
       }
     }

     // Background color (hex → Tailwind color)
     if (prop === 'backgroundcolor') {
       return hexToTailwindColor(cssValue, 'bg');
     }

     // Text color
     if (prop === 'color') {
       return hexToTailwindColor(cssValue, 'text');
     }

     // Border radius
     if (prop === 'borderradius') {
       const match = cssValue.match(/^(\d+)px$/);
       if (match) {
         const px = parseInt(match[1], 10);
         const standardValues: Record<number, string> = {
           0: 'rounded-none',
           2: 'rounded-sm',
           4: 'rounded',
           8: 'rounded-lg',
           12: 'rounded-xl',
           16: 'rounded-2xl',
           9999: 'rounded-full',
         };
         return standardValues[px] || `rounded-[${px}px]`;
       }
     }

     // Rotation (FigmaToCode enhancement)
     if (prop === 'transform' && cssValue.includes('rotate')) {
       const match = cssValue.match(/rotate\((-?\d+)deg\)/);
       if (match) {
         const degrees = parseInt(match[1], 10);
         const standardRotations: Record<number, string> = {
           0: '',
           45: 'rotate-45',
           90: 'rotate-90',
           180: 'rotate-180',
           [-45]: '-rotate-45',
           [-90]: '-rotate-90',
           [-180]: '-rotate-180',
         };
         return standardRotations[degrees] || `rotate-[${degrees}deg]`;
       }
     }

     // Opacity (FigmaToCode enhancement: 0-1 → Tailwind scale)
     if (prop === 'opacity') {
       const opacity = parseFloat(cssValue);
       if (opacity === 0) return 'opacity-0';
       if (opacity <= 0.25) return 'opacity-25';
       if (opacity <= 0.50) return 'opacity-50';
       if (opacity <= 0.75) return 'opacity-75';
       return 'opacity-100';
     }

     // No mapping found
     return '';
   }

   /**
    * Convert hex color to Tailwind color class
    *
    * TODO (MEDIUM priority from FigmaToCode): Implement precise hex-to-Tailwind mapping
    * For MVP: Return arbitrary value `bg-[#FF0000]`
    *
    * @param hexColor - Hex color string (#FF0000)
    * @param prefix - Tailwind prefix (bg, text, border)
    * @returns Tailwind color class
    */
   function hexToTailwindColor(hexColor: string, prefix: string): string {
     // MVP: Use arbitrary values for all colors
     return `${prefix}-[${hexColor}]`;

     // TODO: Map common hex values to Tailwind colors
     // const colorMap: Record<string, string> = {
     //   '#EF4444': `${prefix}-red-500`,
     //   '#3B82F6': `${prefix}-blue-500`,
     //   // ... add more mappings
     // };
     // return colorMap[hexColor.toUpperCase()] || `${prefix}-[${hexColor}]`;
   }

   /**
    * Convert camelCase to kebab-case
    */
   export function toKebabCase(str: string): string {
     return str
       .replace(/([a-z])([A-Z])/g, '$1-$2')
       .replace(/[\s_]+/g, '-')
       .toLowerCase();
   }

   /**
    * Format code with indentation
    *
    * @param code - Unformatted code string
    * @param indentSize - Number of spaces per indent level
    * @returns Formatted code string
    */
   export function formatCode(code: string, indentSize: number = 2): string {
     // Basic formatting: normalize line breaks, trim whitespace
     return code
       .split('\n')
       .map(line => line.trim())
       .filter(Boolean)
       .join('\n');
   }
   ```

2. Test helpers:
   - toPascalCase("button-primary") → "ButtonPrimary"
   - toPascalCase("123Icon") → "Component123Icon" (numeric prefix)
   - cssPropToTailwind("padding", "16px") → "p-4"
   - cssPropToTailwind("gap", "13px") → "gap-[13px]" (arbitrary value)
   - cssPropToTailwind("opacity", "0.5") → "opacity-50"

**Files**: `lib/code-generators/helpers.ts`

**Parallel?**: No (required by T050, T051, T052)

**Notes**:
- PascalCase conversion handles edge cases: numeric-leading names, special characters
- Tailwind mapping prioritizes standard classes, falls back to arbitrary values
- FigmaToCode enhancements: arbitrary values, rotation, opacity conversion
- Hex-to-Tailwind color mapping is TODO (MEDIUM priority) - use arbitrary values for MVP

---

### Subtask T054 – Implement FigmaToCode Tailwind enhancements

**Purpose**: Integrate FigmaToCode recommendations for Tailwind output quality.

**Steps**:
1. Review FigmaToCode enhancements from research.md Decision 7:
   - ✅ Arbitrary value fallbacks: `gap-[13px]` when no standard class (implemented in T053)
   - ✅ Rotation classes: `rotate-45`, `rotate-[47deg]` (implemented in T053)
   - ✅ Opacity conversion: 0-1 → Tailwind scale (implemented in T053)
   - ✅ PascalCase validation: prefix numeric-leading names (implemented in T053)

2. Add comprehensive tests for FigmaToCode enhancements in `__tests__/unit/code-generators.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { cssPropToTailwind, toPascalCase } from '@/lib/code-generators/helpers';

   describe('Code Generators - FigmaToCode Tailwind Enhancements', () => {
     it('should use arbitrary values for non-standard gap', () => {
       expect(cssPropToTailwind('gap', '13px')).toBe('gap-[13px]');
       expect(cssPropToTailwind('gap', '7px')).toBe('gap-[7px]');
     });

     it('should use standard gap classes when available', () => {
       expect(cssPropToTailwind('gap', '16px')).toBe('gap-4');
       expect(cssPropToTailwind('gap', '8px')).toBe('gap-2');
     });

     it('should generate rotation classes', () => {
       expect(cssPropToTailwind('transform', 'rotate(45deg)')).toBe('rotate-45');
       expect(cssPropToTailwind('transform', 'rotate(90deg)')).toBe('rotate-90');
       expect(cssPropToTailwind('transform', 'rotate(47deg)')).toBe('rotate-[47deg]');
     });

     it('should convert opacity to Tailwind scale', () => {
       expect(cssPropToTailwind('opacity', '0')).toBe('opacity-0');
       expect(cssPropToTailwind('opacity', '0.25')).toBe('opacity-25');
       expect(cssPropToTailwind('opacity', '0.5')).toBe('opacity-50');
       expect(cssPropToTailwind('opacity', '0.75')).toBe('opacity-75');
       expect(cssPropToTailwind('opacity', '1')).toBe('opacity-100');
       expect(cssPropToTailwind('opacity', '0.73')).toBe('opacity-75'); // Nearest
     });

     it('should prefix numeric-leading component names', () => {
       expect(toPascalCase('123Button')).toBe('Component123Button');
       expect(toPascalCase('456Icon')).toBe('Component456Icon');
     });

     it('should NOT prefix alphabetic names', () => {
       expect(toPascalCase('ButtonPrimary')).toBe('Buttonprimary');
       expect(toPascalCase('icon-24px')).toBe('Icon24px');
     });
   });
   ```

3. Run tests: `npm test code-generators.test.ts`

**Files**: `lib/code-generators/helpers.ts`, `__tests__/unit/code-generators.test.ts`

**Parallel?**: No (depends on T053)

**Notes**:
- All FigmaToCode HIGH priority Tailwind enhancements implemented
- MEDIUM priority enhancements are TODOs (hex-to-Tailwind colors, shadow matching, context-aware sizing)
- Test coverage ensures enhancements work correctly across edge cases

---

### Subtask T055 – Add syntax highlighting preparation: integrate Prism.js or Shiki

**Purpose**: Prepare for syntax highlighting in code preview (WP10 Viewer page).

**Steps**:
1. Install Prism.js:
   ```bash
   npm install prismjs@1.29.0
   npm install --save-dev @types/prismjs@1.26.0
   ```

2. Create syntax highlighting wrapper in `lib/code-generators/syntax-highlight.ts`:
   ```typescript
   import Prism from 'prismjs';
   import 'prismjs/components/prism-jsx';
   import 'prismjs/components/prism-tsx';
   import 'prismjs/components/prism-css';

   /**
    * Apply syntax highlighting to code string
    *
    * @param code - Code string to highlight
    * @param language - Language (jsx, tsx, css, html)
    * @returns HTML string with syntax highlighting
    */
   export function highlightCode(code: string, language: string): string {
     const grammar = Prism.languages[language];

     if (!grammar) {
       console.warn(`No Prism grammar found for language: ${language}`);
       return code;
     }

     return Prism.highlight(code, grammar, language);
   }
   ```

3. Test syntax highlighting:
   ```typescript
   const jsxCode = `export function Button() {
  return <div className="flex p-4">Click me</div>;
}`;

   const highlighted = highlightCode(jsxCode, 'tsx');
   console.log(highlighted); // Should include <span class="token ..."> markup
   ```

**Files**: `lib/code-generators/syntax-highlight.ts`, `package.json`

**Parallel?**: Yes (independent of code generation logic)

**Notes**:
- Syntax highlighting used in WP10 code-preview.tsx component
- Prism.js chosen for simplicity (Shiki alternative requires server-side rendering)
- Languages: jsx, tsx, css, html
- CSS themes applied in WP10 (Prism CSS imported in component)

---

### Subtask T056 – Test generated code validity: React JSX → JSX parser, HTML → DOM parser

**Purpose**: Validate that generated code is syntactically correct.

**Steps**:
1. Create validation tests in `__tests__/unit/code-generators.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { generateReactJSX, generateReactTailwind, generateHTMLCSS } from '@/lib/code-generators';
   import { AltNode } from '@/lib/types/altnode';

   describe('Code Generators - Syntax Validation', () => {
     const sampleNode: AltNode = {
       id: '1',
       name: 'Button',
       uniqueName: 'Button',
       type: 'FRAME',
       styles: {},
       children: [
         {
           id: '2',
           name: 'Text',
           uniqueName: 'Text',
           type: 'TEXT',
           styles: { text: 'Click me' },
           children: [],
         },
       ],
     };

     const sampleProperties = {
       display: 'flex',
       padding: '16px',
       backgroundColor: '#EF4444',
     };

     it('should generate valid React JSX', () => {
       const result = generateReactJSX(sampleNode, sampleProperties);

       // Basic validation: code contains expected keywords
       expect(result.code).toContain('export function');
       expect(result.code).toContain('return');
       expect(result.code).toContain('React.CSSProperties');
       expect(result.code).toContain('<div');
       expect(result.code).toContain('</div>');

       // No syntax errors (manual inspection - could use @babel/parser for strict validation)
       expect(result.code).not.toContain('undefined');
       expect(result.format).toBe('react-jsx');
     });

     it('should generate valid React Tailwind JSX', () => {
       const result = generateReactTailwind(sampleNode, sampleProperties);

       expect(result.code).toContain('export function');
       expect(result.code).toContain('className="');
       expect(result.code).toContain('flex');
       expect(result.format).toBe('react-tailwind');
     });

     it('should generate valid HTML and CSS', () => {
       const result = generateHTMLCSS(sampleNode, sampleProperties);

       expect(result.code).toContain('<div');
       expect(result.code).toContain('</div>');
       expect(result.code).toContain('class="');
       expect(result.css).toContain('.button');
       expect(result.css).toContain('display: flex');
       expect(result.format).toBe('html-css');
     });

     it('should handle deeply nested nodes', () => {
       const deepNode: AltNode = {
         id: '1',
         name: 'Container',
         uniqueName: 'Container',
         type: 'FRAME',
         styles: {},
         children: [
           {
             id: '2',
             name: 'Inner',
             uniqueName: 'Inner',
             type: 'FRAME',
             styles: {},
             children: [
               {
                 id: '3',
                 name: 'Text',
                 uniqueName: 'Text',
                 type: 'TEXT',
                 styles: { text: 'Deep content' },
                 children: [],
               },
             ],
           },
         ],
       };

       const result = generateReactJSX(deepNode, {});

       // Verify nesting preserved
       expect(result.code.match(/<div/g)?.length).toBeGreaterThan(1);
       expect(result.code).toContain('Deep content');
     });
   });
   ```

2. Run tests: `npm test code-generators.test.ts`

**Files**: `__tests__/unit/code-generators.test.ts`

**Parallel?**: No (requires T050-T052 complete)

**Notes**:
- Basic syntax validation via string checks (contains expected keywords)
- For strict JSX validation, could integrate @babel/parser (optional enhancement)
- HTML validation could use DOMParser API (browser-only, or jsdom in tests)
- Coverage target: 70% for code generators (Constitution Testing Standards)

---

### Subtask T057 – Verify code readability: proper indentation, line breaks, component naming

**Purpose**: Ensure generated code is human-readable and follows best practices.

**Steps**:
1. Manual inspection of generated code samples:
   - React JSX: Proper indentation (2 spaces), style object formatted, closing tags aligned
   - React Tailwind: Class names separated by spaces, attributes on same line
   - HTML/CSS: CSS rules separated by blank lines, properties indented

2. Add readability tests to `__tests__/unit/code-generators.test.ts`:
   ```typescript
   describe('Code Generators - Readability', () => {
     it('should use proper indentation (2 spaces)', () => {
       const node: AltNode = {
         id: '1',
         name: 'Button',
         uniqueName: 'Button',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const result = generateReactJSX(node, { padding: '16px' });

       // Check for consistent 2-space indentation
       const lines = result.code.split('\n');
       const indentedLines = lines.filter(line => line.startsWith('  '));
       expect(indentedLines.length).toBeGreaterThan(0);
     });

     it('should use PascalCase component names', () => {
       const node: AltNode = {
         id: '1',
         name: 'button-primary',
         uniqueName: 'button-primary',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const result = generateReactJSX(node, {});

       expect(result.code).toContain('export function ButtonPrimary');
       expect(result.metadata.componentName).toBe('ButtonPrimary');
     });

     it('should format CSS properties with proper spacing', () => {
       const node: AltNode = {
         id: '1',
         name: 'Box',
         uniqueName: 'Box',
         type: 'FRAME',
         styles: {},
         children: [],
       };

       const properties = {
         display: 'flex',
         padding: '16px',
         backgroundColor: '#EF4444',
       };

       const result = generateHTMLCSS(node, properties);

       // CSS should have properties on separate lines with semicolons
       expect(result.css).toContain('display: flex;');
       expect(result.css).toContain('padding: 16px;');
       expect(result.css).toContain('background-color: #ef4444;');
     });
   });
   ```

3. Review generated code samples manually for:
   - Consistent indentation
   - Semantic naming (component names describe purpose)
   - No unnecessary whitespace
   - Line breaks between logical sections

**Files**: `__tests__/unit/code-generators.test.ts`

**Parallel?**: No (requires T050-T056 complete)

**Notes**:
- Code readability is CRITICAL for user satisfaction
- Generated code should match hand-written code quality
- FigmaToCode principle: Production-ready output, not just functional

## Definition of Done Checklist

- [ ] `lib/code-generators/react.ts` created with React JSX generation
- [ ] `lib/code-generators/react-tailwind.ts` created with Tailwind class generation
- [ ] `lib/code-generators/html-css.ts` created with HTML + CSS output
- [ ] `lib/code-generators/helpers.ts` created with toPascalCase, cssPropToTailwind, formatCode
- [ ] FigmaToCode Tailwind enhancements implemented: arbitrary values, rotation, opacity, PascalCase
- [ ] Syntax highlighting prepared with Prism.js integration
- [ ] Unit tests written with 70% coverage (Constitution requirement)
- [ ] Generated code is syntactically valid (JSX parser, HTML parser compatible)
- [ ] Code readability verified: proper indentation, semantic naming, formatting
- [ ] All tests pass: `npm test code-generators.test.ts`
- [ ] TypeScript strict mode: zero errors with `npx tsc --noEmit`

## Review Guidance

**Key Acceptance Checkpoints**:
1. All three generators produce syntactically valid code (React JSX, React+Tailwind, HTML/CSS)
2. Tailwind generator uses arbitrary values when needed (`gap-[13px]`)
3. Rotation classes generated correctly (`rotate-45`, `rotate-[47deg]`)
4. Opacity converted to Tailwind scale (0-1 → 0, 25, 50, 75, 100)
5. Component names PascalCase with numeric-leading prefix ("Component123Button")
6. Code readability: 2-space indentation, semantic naming, proper line breaks
7. Test coverage meets 70% (Constitution requirement for code generators)

**Reviewers should verify**:
- No `any` types in code generator modules
- Recursive generation handles deeply nested nodes (10+ levels)
- Helper functions pure (no side effects, testable in isolation)
- FigmaToCode enhancements all implemented (arbitrary values, rotation, opacity, PascalCase)
- Generated code matches quality of hand-written code
- Performance acceptable for complex nodes (100+ children) - generation <100ms

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
