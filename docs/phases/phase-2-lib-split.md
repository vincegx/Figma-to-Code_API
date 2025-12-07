# Phase 2 : Découpage lib/ (Gros Fichiers)

> **Statut** : À faire
> **Risque** : Moyen
> **Durée estimée** : 4h
> **Prérequis** : Phase 1 terminée

---

## Règles de Refactoring - Rappel

> **IMPORTANT** : Respecter pendant l'exécution

- ✅ **Tests before/after** : `npm test` après CHAQUE fichier créé
- ✅ **One change at a time** : Commit après chaque module (2.1, 2.2, etc.)
- ✅ **Extract > rewrite** : Copier-coller puis adapter, ne pas réécrire
- ✅ **Early returns** : Transformer `if/else imbriqués` en `if (!x) return`
- ✅ **Max 3 params** : Utiliser objet config si plus de 3 paramètres
- ✅ **Single responsibility** : 1 fonction = 1 tâche

---

## Objectif

Découper les fichiers > 1000 lignes en modules cohérents :
- `helpers.ts` (1222 lignes) → `lib/code-generators/helpers/`
- `react-tailwind.ts` (1562 lignes) → `lib/code-generators/react-tailwind/`
- `merge-simple-alt-nodes.ts` (1038 lignes) → `lib/merge/alt-nodes/`
- `tailwind-to-css.ts` (658 lignes) → `lib/utils/tailwind-css/`

---

## 2.1 Découper `helpers.ts` → `lib/code-generators/helpers/`

### Structure cible

```
lib/code-generators/helpers/
├── index.ts              # Exports publics
├── css-to-tailwind.ts    # Fonction principale simplifiée
├── border-handlers.ts    # handleBorderRadius/Color/Width
├── layout-handlers.ts    # flex, grid, position, display
├── text-handlers.ts      # font, text, color
├── spacing-handlers.ts   # padding, margin
└── size-scale.ts         # Mapping tailles (si pas déjà dans constants)
```

### Fichiers à créer

#### `border-handlers.ts`

Extraire de `helpers.ts` :
- Lignes 313-328 : Border radius (4x dupliqué pour tl, tr, bl, br)
- Lignes 596-611 : Border width (4x dupliqué)
- Lignes 616-643 : Border color (4x dupliqué)

```typescript
// lib/code-generators/helpers/border-handlers.ts

type BorderPosition = 't' | 'r' | 'b' | 'l' | 'tl' | 'tr' | 'bl' | 'br';

export function handleBorderRadius(
  position: BorderPosition,
  cssValue: string
): string {
  const match = cssValue.match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) return '';
  return `rounded-${position}-[${match[1]}px]`;
}

export function handleBorderWidth(
  position: 't' | 'r' | 'b' | 'l',
  cssValue: string
): string {
  if (cssValue === '0px') return '';
  return cssValue === '1px'
    ? `border-${position}`
    : `border-${position}-[${cssValue}]`;
}

export function handleBorderColor(
  position: 't' | 'r' | 'b' | 'l',
  cssValue: string
): string {
  const color = cssValue.replace(/\s+/g, '');
  const prefix = color.startsWith('var(') ? 'color:' : '';
  return `border-${position}-[${prefix}${color}]`;
}
```

#### `layout-handlers.ts`

Extraire de `helpers.ts` :
- Lignes 524-535 : position, top, bottom, left, right
- Lignes 688-699 : DOUBLON à supprimer
- Lignes 129-136 : gridTemplateColumns/Rows
- Lignes 710-716 : DOUBLON à supprimer

```typescript
// lib/code-generators/helpers/layout-handlers.ts

export function handlePosition(cssValue: string): string {
  const positionMap: Record<string, string> = {
    static: 'static',
    relative: 'relative',
    absolute: 'absolute',
    fixed: 'fixed',
    sticky: 'sticky',
  };
  return positionMap[cssValue] || '';
}

export function handleInset(
  prop: 'top' | 'right' | 'bottom' | 'left',
  cssValue: string
): string {
  if (cssValue === '0' || cssValue === '0px') return `${prop}-0`;
  if (cssValue === 'auto') return `${prop}-auto`;
  return `${prop}-[${cssValue}]`;
}

export function handleGridTemplate(
  prop: 'columns' | 'rows',
  cssValue: string
): string {
  // ... logique existante
}

export function handleFlex(cssValue: string): string {
  // ... logique existante
}

export function handleDisplay(cssValue: string): string {
  // ... logique existante
}
```

#### `spacing-handlers.ts`

Extraire de `helpers.ts` :
- Lignes 164-191 : Padding avec scale
- Lignes 667-689 : Margin avec scale

```typescript
// lib/code-generators/helpers/spacing-handlers.ts

import { TAILWIND_SPACING_SCALE } from '@/lib/constants';

export function handlePadding(
  prop: 'padding' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft',
  cssValue: string
): string {
  // Utiliser TAILWIND_SPACING_SCALE
}

export function handleMargin(
  prop: 'margin' | 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft',
  cssValue: string
): string {
  // Utiliser TAILWIND_SPACING_SCALE
}
```

#### `text-handlers.ts`

```typescript
// lib/code-generators/helpers/text-handlers.ts

export function handleFontSize(cssValue: string): string {
  // ... logique existante
}

export function handleFontWeight(cssValue: string): string {
  // ... logique existante
}

export function handleTextColor(cssValue: string): string {
  // ... logique existante
}

export function handleTextAlign(cssValue: string): string {
  // ... logique existante
}
```

#### `css-to-tailwind.ts` (simplifié)

```typescript
// lib/code-generators/helpers/css-to-tailwind.ts

import { handleBorderRadius, handleBorderWidth, handleBorderColor } from './border-handlers';
import { handlePosition, handleInset, handleFlex, handleDisplay } from './layout-handlers';
import { handlePadding, handleMargin } from './spacing-handlers';
import { handleFontSize, handleFontWeight, handleTextColor } from './text-handlers';

export function cssPropToTailwind(prop: string, value: string): string {
  const normalizedProp = prop.toLowerCase().replace(/-/g, '');

  // Border
  if (normalizedProp.startsWith('border')) {
    // Dispatcher vers border-handlers
  }

  // Layout
  if (['position', 'top', 'right', 'bottom', 'left'].includes(normalizedProp)) {
    // Dispatcher vers layout-handlers
  }

  // Spacing
  if (normalizedProp.startsWith('padding') || normalizedProp.startsWith('margin')) {
    // Dispatcher vers spacing-handlers
  }

  // Text
  if (normalizedProp.startsWith('font') || normalizedProp.startsWith('text')) {
    // Dispatcher vers text-handlers
  }

  // ... reste de la logique
}
```

#### `index.ts`

```typescript
// lib/code-generators/helpers/index.ts

export { cssPropToTailwind } from './css-to-tailwind';
export * from './border-handlers';
export * from './layout-handlers';
export * from './spacing-handlers';
export * from './text-handlers';

// Re-export des fonctions existantes qui ne sont pas découpées
export {
  truncateLayerName,
  toCamelCase,
  uniquePropName,
  // ... autres
} from './css-to-tailwind';
```

### Checklist 2.1

- [ ] Créer `lib/code-generators/helpers/` dossier
- [ ] Créer `border-handlers.ts`
- [ ] Créer `layout-handlers.ts`
- [ ] Créer `spacing-handlers.ts`
- [ ] Créer `text-handlers.ts`
- [ ] Créer `css-to-tailwind.ts` (simplifié)
- [ ] Créer `index.ts`
- [ ] Mettre à jour imports dans `react-tailwind.ts`
- [ ] Supprimer ancien `helpers.ts`
- [ ] Tests

---

## 2.2 Découper `react-tailwind.ts` → `lib/code-generators/react-tailwind/`

### Structure cible

```
lib/code-generators/react-tailwind/
├── index.ts                  # generateReactTailwind()
├── jsx-generator.ts          # generateTailwindJSXElement()
├── class-deduplication.ts    # deduplicateTailwindClasses()
├── spacing-consolidation.ts  # consolidateSemanticSpacing()
├── props-collector.ts        # collectProps(), extractFonts()
└── constants.ts              # Constantes locales
```

### Fichiers à créer

#### `constants.ts`

```typescript
// lib/code-generators/react-tailwind/constants.ts

// Réexporter depuis lib/constants si besoin
export { INDENT, PLACEHOLDER_IMAGE_URL } from '@/lib/constants';

// Constantes spécifiques à ce module
export const FLEX_CLASSES = ['flex', 'inline-flex'] as const;
export const MCP_STRUCTURAL_CLASSES = ['box-border', 'content-stretch'] as const;
```

#### `props-collector.ts`

Extraire lignes 67-245 de `react-tailwind.ts`

```typescript
// lib/code-generators/react-tailwind/props-collector.ts

export function collectProps(node: AltNode): PropInfo[] {
  // Lignes 67-140
}

export function extractFonts(node: AltNode): FontInfo[] {
  // Lignes 230-245
}
```

#### `class-deduplication.ts`

Extraire lignes 386-506

```typescript
// lib/code-generators/react-tailwind/class-deduplication.ts

export function deduplicateTailwindClasses(classes: string): string {
  // Lignes 386-506
}
```

#### `spacing-consolidation.ts`

Extraire lignes 662-833

```typescript
// lib/code-generators/react-tailwind/spacing-consolidation.ts

export function consolidateSemanticSpacing(classes: string): string {
  // Lignes 662-833
}

export function normalizeArbitraryValues(classes: string): string {
  // Lignes 561-651
}
```

#### `jsx-generator.ts`

Extraire lignes 1066-1505 (LA PLUS GROSSE)

```typescript
// lib/code-generators/react-tailwind/jsx-generator.ts

interface JSXGeneratorContext {
  node: AltNode;
  properties: ResolvedProperties;
  depth: number;
  allRules: Rule[];
  framework: Framework;
  imageUrls: Record<string, string>;
  svgMap: Record<string, string>;
  isViewerMode: boolean;
  svgBoundsMap: Record<string, Bounds>;
  parentNegativeSpacing?: NegativeSpacing;
  isLastChild: boolean;
  propLookup?: PropLookup;
}

export function generateTailwindJSXElement(ctx: JSXGeneratorContext): string {
  // Lignes 1066-1505
  // Utiliser objet context au lieu de 10 params
}
```

#### `index.ts`

```typescript
// lib/code-generators/react-tailwind/index.ts

import { generateTailwindJSXElement } from './jsx-generator';
import { deduplicateTailwindClasses } from './class-deduplication';
import { consolidateSemanticSpacing, normalizeArbitraryValues } from './spacing-consolidation';
import { collectProps, extractFonts } from './props-collector';

export async function generateReactTailwind(
  altNode: AltNode,
  resolvedProperties: ResolvedProperties,
  allRules: Rule[],
  framework: Framework,
  figmaFileKey?: string,
  figmaAccessToken?: string,
  nodeId?: string,
  options?: GenerateOptions
): Promise<GeneratedCode> {
  // Lignes 858-1047
  // Appeler les fonctions importées
}

// Re-exports
export { generateTailwindJSXElement } from './jsx-generator';
export { deduplicateTailwindClasses } from './class-deduplication';
export { consolidateSemanticSpacing } from './spacing-consolidation';
```

### Checklist 2.2

- [ ] Créer `lib/code-generators/react-tailwind/` dossier
- [ ] Créer `constants.ts`
- [ ] Créer `props-collector.ts`
- [ ] Créer `class-deduplication.ts`
- [ ] Créer `spacing-consolidation.ts`
- [ ] Créer `jsx-generator.ts` (avec interface context)
- [ ] Créer `index.ts`
- [ ] Mettre à jour imports dans fichiers qui utilisaient `react-tailwind.ts`
- [ ] Supprimer ancien `react-tailwind.ts`
- [ ] Tests

---

## 2.3 Découper `merge-simple-alt-nodes.ts` → `lib/merge/alt-nodes/`

### Structure cible

```
lib/merge/alt-nodes/
├── index.ts          # mergeSimpleAltNodes()
├── matching.ts       # findBestMatch(), matchChildrenByName()
├── style-diff.ts     # computeStyleDiff(), cleanStyles(), getResetValue()
├── element-merger.ts # mergeElement()
├── converters.ts     # toUnifiedElement(), stylesToTailwind()
└── constants.ts      # Scoring weights, thresholds
```

### Fichiers à créer

#### `constants.ts`

```typescript
// lib/merge/alt-nodes/constants.ts

// Scoring weights for matching
export const POSITION_WEIGHT = 10;
export const RELATIVE_POS_WEIGHT = 100;
export const NAME_SIMILARITY_BONUS = 50;

// Matching thresholds
export const MAX_POSITION_DIFF = 3;
export const MAX_RELATIVE_DIFF = 0.2;

// Value comparison
export const VALUE_TOLERANCE = 0.5;
export const ZERO_THRESHOLD = 0.01;
```

#### `style-diff.ts`

Extraire lignes 344-493

```typescript
// lib/merge/alt-nodes/style-diff.ts

export function cleanStyles(styles: Record<string, string>, keepEmpty?: boolean): Record<string, string> {
  // Lignes 344-389
}

export function computeStyleDiff(
  base: Record<string, string>,
  compare: Record<string, string>
): Record<string, string> {
  // Lignes 401-433
}

export function getResetValue(
  property: string,
  baseValue: string,
  compareStyles?: Record<string, string>
): string | number | null {
  // Lignes 440-493
}

export function areValuesEquivalent(
  baseValue: string,
  compareValue: string,
  tolerance?: number
): boolean {
  // Lignes 207-237
}
```

#### `matching.ts`

Extraire lignes 568-734

```typescript
// lib/merge/alt-nodes/matching.ts

import { POSITION_WEIGHT, RELATIVE_POS_WEIGHT, NAME_SIMILARITY_BONUS } from './constants';

interface MatchCandidate {
  key: string;
  node: SimpleAltNode;
  index: number;
}

interface MatchResult {
  name: string;
  mobile?: SimpleAltNode;
  tablet?: SimpleAltNode;
  desktop?: SimpleAltNode;
}

export function findBestMatch(
  target: MatchCandidate,
  candidates: MatchCandidate[],
  usedKeys: Set<string>,
  totalTargetChildren: number,
  totalCandidateChildren: number
): { key: string; score: number } | null {
  // Lignes 568-631
}

export function matchChildrenByName(
  mobileChildren: SimpleAltNode[],
  tabletChildren: SimpleAltNode[],
  desktopChildren: SimpleAltNode[]
): MatchResult[] {
  // Lignes 642-734
}
```

#### `element-merger.ts`

Extraire lignes 773-844

```typescript
// lib/merge/alt-nodes/element-merger.ts

import { computeStyleDiff, cleanStyles } from './style-diff';
import { matchChildrenByName } from './matching';

export function mergeElement(
  mobile: SimpleAltNode | undefined,
  tablet: SimpleAltNode | undefined,
  desktop: SimpleAltNode | undefined,
  warnings: string[]
): MergedElement {
  // Lignes 773-844
}
```

#### `converters.ts`

Extraire lignes 957-1038

```typescript
// lib/merge/alt-nodes/converters.ts

export function stylesToTailwindClasses(
  styles: Record<string, string>,
  breakpoint?: 'md' | 'lg'
): string {
  // Lignes 957-991
}

export function toUnifiedElement(merged: MergedElement): UnifiedElement {
  // Lignes 994-1038
}

export function smartSplitClasses(classString: string): string[] {
  // Lignes 899-937
}
```

#### `index.ts`

```typescript
// lib/merge/alt-nodes/index.ts

import { mergeElement } from './element-merger';
import { toUnifiedElement } from './converters';

export function mergeSimpleAltNodes(
  mobile: SimpleAltNode | null,
  tablet: SimpleAltNode | null,
  desktop: SimpleAltNode | null
): MergedNodeResult {
  // Lignes 854-897
}

// Re-exports
export * from './matching';
export * from './style-diff';
export * from './element-merger';
export * from './converters';
export * from './constants';
```

### Checklist 2.3

- [ ] Créer `lib/merge/alt-nodes/` dossier
- [ ] Créer `constants.ts`
- [ ] Créer `style-diff.ts`
- [ ] Créer `matching.ts`
- [ ] Créer `element-merger.ts`
- [ ] Créer `converters.ts`
- [ ] Créer `index.ts`
- [ ] Mettre à jour imports dans `merge-engine.ts`
- [ ] Supprimer ancien `merge-simple-alt-nodes.ts`
- [ ] Tests

---

## 2.4 Découper `tailwind-to-css.ts` → `lib/utils/tailwind-css/`

### Structure cible

```
lib/utils/tailwind-css/
├── index.ts          # Exports publics
├── parser.ts         # parseMediaQueries(), parseCSSToMap()
├── v3-compiler.ts    # Compilation Tailwind v3
├── v4-compiler.ts    # Compilation Tailwind v4
├── css-generator.ts  # generateFinalCSS()
└── brace-utils.ts    # findMatchingBraceIndex()
```

### Fichiers à créer

#### `brace-utils.ts`

Extraire logique répétée 4x (lignes 71-83, 112-116, 174-183, 231-241)

```typescript
// lib/utils/tailwind-css/brace-utils.ts

/**
 * Find the index of the matching closing brace
 * Répété 4x dans le fichier original - maintenant centralisé
 */
export function findMatchingBraceIndex(
  css: string,
  startIndex: number
): number {
  let braceCount = 1;
  let i = startIndex;

  while (i < css.length && braceCount > 0) {
    if (css[i] === '{') braceCount++;
    if (css[i] === '}') braceCount--;
    i++;
  }

  return braceCount === 0 ? i : -1;
}
```

#### `parser.ts`

Extraire lignes 25-213

```typescript
// lib/utils/tailwind-css/parser.ts

import { findMatchingBraceIndex } from './brace-utils';

export function parseCSSToMap(css: string): Map<string, Map<string, string>> {
  // Lignes 25-61
}

export function parseMediaQueries(css: string): MediaQueryMap {
  // Lignes 63-213
  // Utiliser findMatchingBraceIndex au lieu de code inline répété
}
```

#### `v3-compiler.ts`

```typescript
// lib/utils/tailwind-css/v3-compiler.ts

import { BREAKPOINTS } from '@/lib/constants';

export async function compileTailwindV3(
  code: string,
  breakpoints?: BreakpointConfig
): Promise<CompileResult> {
  // Partie v3 des lignes 325-406
}
```

#### `v4-compiler.ts`

```typescript
// lib/utils/tailwind-css/v4-compiler.ts

export async function compileTailwindV4(
  code: string,
  breakpoints?: BreakpointConfig
): Promise<CompileResult> {
  // Partie v4 des lignes 325-406
}
```

#### `css-generator.ts`

Extraire lignes 580-658

```typescript
// lib/utils/tailwind-css/css-generator.ts

interface GenerateCSSOptions {
  elements: Element[];
  themeCSS: string;
  mediaQueries?: MediaQueryMap;
  classMapping?: ClassMapping;
}

export function generateFinalCSS(options: GenerateCSSOptions): string {
  // Lignes 580-658
  // Utiliser objet options au lieu de 4 params
}
```

#### `index.ts`

```typescript
// lib/utils/tailwind-css/index.ts

import { compileTailwindV3 } from './v3-compiler';
import { compileTailwindV4 } from './v4-compiler';

export async function compileTailwindDirect(
  code: string,
  version: 'v3' | 'v4',
  breakpoints?: BreakpointConfig
): Promise<CompileResult> {
  return version === 'v4'
    ? compileTailwindV4(code, breakpoints)
    : compileTailwindV3(code, breakpoints);
}

export * from './parser';
export * from './css-generator';
export * from './brace-utils';
```

### Checklist 2.4

- [ ] Créer `lib/utils/tailwind-css/` dossier
- [ ] Créer `brace-utils.ts`
- [ ] Créer `parser.ts`
- [ ] Créer `v3-compiler.ts`
- [ ] Créer `v4-compiler.ts`
- [ ] Créer `css-generator.ts`
- [ ] Créer `index.ts`
- [ ] Mettre à jour imports
- [ ] Supprimer ancien `tailwind-to-css.ts`
- [ ] Tests

---

## Validation Finale Phase 2

### Commandes

```bash
npm test
npm run lint
npm run build
npm run dev  # Test manuel
```

### Checklist finale

- [ ] Tous les tests passent
- [ ] Build réussit
- [ ] Application fonctionne
- [ ] Aucun fichier > 500 lignes dans les nouveaux modules
- [ ] Imports corrects partout

### Commit

```bash
git add lib/code-generators/ lib/merge/alt-nodes/ lib/utils/tailwind-css/
git commit -m "refactor: split large lib files into modules (Phase 2)"
```

---

## Prochaine Phase

→ `docs/phases/phase-3-hooks.md`
