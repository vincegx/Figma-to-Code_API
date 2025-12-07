# Plan de Refactoring

> Exécution progressive et sécurisée du refactoring

## Vue d'ensemble

| Phase | Description | Risque | Durée estimée |
|-------|-------------|--------|---------------|
| **Phase 0** | Setup & Préparation | Aucun | 30 min |
| **Phase 1** | Constantes & Utils partagés | Faible | 2h |
| **Phase 2** | Découpage lib/ (gros fichiers) | Moyen | 4h |
| **Phase 3** | Hooks partagés | Faible | 1h |
| **Phase 4** | Composants partagés | Faible | 2h |
| **Phase 5** | Pages React (extraction) | Élevé | 6h |
| **Phase 6** | Nettoyage final | Faible | 1h |

**Total estimé : ~16h de travail**

---

## Phase 0 : Setup & Préparation

### 0.1 Créer la structure de dossiers

```bash
mkdir -p lib/constants
mkdir -p lib/code-generators/react-tailwind
mkdir -p lib/code-generators/helpers
mkdir -p lib/merge/alt-nodes
mkdir -p lib/utils/tailwind-css
mkdir -p components/shared
mkdir -p components/figma
mkdir -p components/rules
mkdir -p components/dashboard
mkdir -p docs
```

### 0.2 Vérifier que les tests passent

```bash
npm test
npm run lint
npm run build
```

> ⚠️ **IMPORTANT** : Ne jamais commencer une phase sans que les tests passent.

---

## Phase 1 : Constantes & Utils Partagés

**Objectif** : Éliminer les magic values et code dupliqué simple.

### 1.1 Créer `lib/constants/breakpoints.ts`

```typescript
// Extraire de :
// - merge/[id]/page.tsx (lignes 710, 717, 1145, 1152)
// - viewer/[nodeId]/page.tsx (lignes 838, 845)
// - merges/page.tsx
// - merge-engine.ts (lignes 394-395)

export const MOBILE_WIDTH = 375;
export const MOBILE_HEIGHT = 667;
export const TABLET_WIDTH = 768;
export const TABLET_HEIGHT = 1024;
export const DESKTOP_WIDTH = 1280;
export const DESKTOP_WIDTH_XL = 1440;

export const BREAKPOINTS = {
  mobile: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT },
  tablet: { width: TABLET_WIDTH, height: TABLET_HEIGHT },
  desktop: { width: DESKTOP_WIDTH },
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;
```

**Fichiers à modifier** :
- [ ] `app/merge/[id]/page.tsx`
- [ ] `app/viewer/[nodeId]/page.tsx`
- [ ] `app/merges/page.tsx`
- [ ] `lib/merge/merge-engine.ts`

### 1.2 Créer `lib/constants/tailwind-scale.ts`

```typescript
// Extraire de :
// - react-tailwind.ts (lignes 564-604 ET 667-689 - DUPLIQUÉ!)
// - helpers.ts (lignes 164-191, 299-308, 861-899)

export const TAILWIND_SPACING_SCALE: Record<number, string> = {
  0: '0', 1: '0.25', 2: '0.5', 4: '1', 6: '1.5', 8: '2',
  10: '2.5', 12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6',
  28: '7', 32: '8', 36: '9', 40: '10', 44: '11', 48: '12',
  52: '13', 56: '14', 60: '15', 64: '16', 72: '18', 80: '20',
  96: '24',
};

export const TAILWIND_BORDER_RADIUS_SCALE: Record<number, string> = {
  0: 'none', 2: 'sm', 4: 'DEFAULT', 6: 'md', 8: 'lg',
  12: 'xl', 16: '2xl', 24: '3xl', 9999: 'full',
};

export const TAILWIND_SIZE_SCALE: Record<number, string> = {
  // ... extraire de helpers.ts
};
```

**Fichiers à modifier** :
- [ ] `lib/code-generators/react-tailwind.ts`
- [ ] `lib/code-generators/helpers.ts`

### 1.3 Créer `lib/constants/defaults.ts`

```typescript
// Extraire de :
// - viewer/[nodeId]/page.tsx (lignes 247, 310)
// - merge/[id]/page.tsx (lignes 203, 331)
// - merges/page.tsx (ligne 141)
// - react-tailwind.ts (lignes 237, 324, 1363)

export const PER_PAGE = 20;
export const RAW_DATA_LIMIT = 2000;
export const GRID_SKELETON_COUNT = 6;
export const MAX_CHILDREN_DISPLAY = 10;

export const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/300x200';
export const DEFAULT_FONT_WEIGHT = '400';
export const DEFAULT_GRADIENT_ANGLE = 180;
export const NORMALIZE_TOLERANCE = 0.05;

export const INDENT = '  '; // 2 spaces
```

**Fichiers à modifier** :
- [ ] `app/viewer/[nodeId]/page.tsx`
- [ ] `app/merge/[id]/page.tsx`
- [ ] `app/merges/page.tsx`
- [ ] `lib/code-generators/react-tailwind.ts`

### 1.4 Créer `lib/utils/format.ts`

```typescript
// Unifier :
// - merges/page.tsx (lignes 278-289)
// - components/merge/merge-card.tsx (logique similaire)

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}
```

**Fichiers à modifier** :
- [ ] `app/merges/page.tsx`
- [ ] `components/merge/merge-card.tsx`

### 1.5 Créer `lib/utils/selection.ts`

```typescript
// Unifier :
// - merges/page.tsx (lignes 221-229)
// - nodes/page.tsx (lignes 113-121)

export function toggleInSet<T>(
  set: Set<T>,
  item: T
): Set<T> {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  return newSet;
}
```

**Fichiers à modifier** :
- [ ] `app/merges/page.tsx`
- [ ] `app/nodes/page.tsx`

### 1.6 Créer `lib/utils/download.ts`

```typescript
// Unifier :
// - merge/[id]/page.tsx (lignes 544-558 et 848-874 - DUPLIQUÉ!)

export function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: object, filename: string): void {
  downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
}

export function downloadCode(code: string, filename: string): void {
  const ext = filename.split('.').pop();
  const mimeTypes: Record<string, string> = {
    tsx: 'text/typescript',
    jsx: 'text/javascript',
    css: 'text/css',
    html: 'text/html',
  };
  downloadFile(code, filename, mimeTypes[ext || ''] || 'text/plain');
}
```

**Fichiers à modifier** :
- [ ] `app/merge/[id]/page.tsx`

### 1.7 Commit Phase 1

```bash
git add lib/constants/ lib/utils/format.ts lib/utils/selection.ts lib/utils/download.ts
git commit -m "refactor: extract constants and shared utils"
npm test && npm run build
```

---

## Phase 2 : Découpage lib/ (Gros Fichiers)

**Objectif** : Découper les fichiers > 1000 lignes en modules cohérents.

### 2.1 Découper `helpers.ts` (1222 lignes) → `lib/code-generators/helpers/`

| Nouveau fichier | Contenu | Lignes sources |
|-----------------|---------|----------------|
| `index.ts` | Exports publics | - |
| `css-to-tailwind.ts` | `cssPropToTailwind()` (simplifié) | 109-814 |
| `border-handlers.ts` | `handleBorderRadius/Color/Width()` | 313-328, 596-643 |
| `layout-handlers.ts` | flex, grid, position, display | 524-535, 688-716 |
| `text-handlers.ts` | font, text, color | - |
| `spacing-handlers.ts` | padding, margin | 164-191, 667-689 |
| `size-scale.ts` | Mapping tailles | 861-899 |

**Étapes** :
1. [ ] Créer `border-handlers.ts` avec fonctions extraites
2. [ ] Créer `layout-handlers.ts`
3. [ ] Créer `spacing-handlers.ts`
4. [ ] Créer `text-handlers.ts`
5. [ ] Simplifier `css-to-tailwind.ts` en appelant les handlers
6. [ ] Créer `index.ts` avec exports
7. [ ] Mettre à jour imports dans `react-tailwind.ts`
8. [ ] Supprimer ancien `helpers.ts`
9. [ ] Tests

### 2.2 Découper `react-tailwind.ts` (1562 lignes) → `lib/code-generators/react-tailwind/`

| Nouveau fichier | Contenu | Lignes sources |
|-----------------|---------|----------------|
| `index.ts` | `generateReactTailwind()` | 858-1047 |
| `jsx-generator.ts` | `generateTailwindJSXElement()` | 1066-1505 |
| `class-deduplication.ts` | `deduplicateTailwindClasses()` | 386-506 |
| `spacing-consolidation.ts` | `consolidateSemanticSpacing()` | 662-833 |
| `props-collector.ts` | `collectProps()`, `extractFonts()` | 67-245 |
| `constants.ts` | Constantes locales | dispersées |

**Étapes** :
1. [ ] Créer `constants.ts` avec constantes extraites
2. [ ] Créer `props-collector.ts`
3. [ ] Créer `class-deduplication.ts`
4. [ ] Créer `spacing-consolidation.ts`
5. [ ] Créer `jsx-generator.ts`
6. [ ] Créer `index.ts` principal
7. [ ] Mettre à jour imports
8. [ ] Supprimer ancien fichier
9. [ ] Tests

### 2.3 Découper `merge-simple-alt-nodes.ts` (1038 lignes) → `lib/merge/alt-nodes/`

| Nouveau fichier | Contenu | Lignes sources |
|-----------------|---------|----------------|
| `index.ts` | `mergeSimpleAltNodes()` | 854-897 |
| `matching.ts` | `findBestMatch()`, `matchChildrenByName()` | 568-734 |
| `style-diff.ts` | `computeStyleDiff()`, `cleanStyles()` | 344-493 |
| `element-merger.ts` | `mergeElement()` | 773-844 |
| `converters.ts` | `toUnifiedElement()`, `stylesToTailwind()` | 957-1038 |
| `constants.ts` | Scoring weights, thresholds | 613-623 |

**Étapes** :
1. [ ] Créer `constants.ts` avec magic values nommées
2. [ ] Créer `style-diff.ts`
3. [ ] Créer `matching.ts`
4. [ ] Créer `element-merger.ts`
5. [ ] Créer `converters.ts`
6. [ ] Créer `index.ts`
7. [ ] Mettre à jour imports
8. [ ] Tests

### 2.4 Découper `tailwind-to-css.ts` (658 lignes) → `lib/utils/tailwind-css/`

| Nouveau fichier | Contenu | Lignes sources |
|-----------------|---------|----------------|
| `index.ts` | Exports publics | - |
| `parser.ts` | `parseMediaQueries()`, `parseCSSToMap()` | 25-213 |
| `v3-compiler.ts` | Compilation Tailwind v3 | 325-406 (partie v3) |
| `v4-compiler.ts` | Compilation Tailwind v4 | 325-406 (partie v4) |
| `css-generator.ts` | `generateFinalCSS()` | 580-658 |
| `brace-utils.ts` | `findMatchingBraceIndex()` | 71-83 (répété 4x) |

**Étapes** :
1. [ ] Créer `brace-utils.ts` (éliminer 4 duplications)
2. [ ] Créer `parser.ts`
3. [ ] Créer `v3-compiler.ts`
4. [ ] Créer `v4-compiler.ts`
5. [ ] Créer `css-generator.ts`
6. [ ] Créer `index.ts`
7. [ ] Tests

### 2.5 Commit Phase 2

```bash
git add lib/code-generators/ lib/merge/alt-nodes/ lib/utils/tailwind-css/
git commit -m "refactor: split large lib files into modules"
npm test && npm run build
```

---

## Phase 3 : Hooks Partagés

**Objectif** : Créer des hooks réutilisables pour les patterns communs.

### 3.1 Créer `hooks/useLocalStorage.ts`

```typescript
// Pattern répété dans :
// - viewer/[nodeId]/page.tsx (lignes 204-220, 223-236)
// - rules/page.tsx
// - settings/page.tsx
```

### 3.2 Créer `hooks/useToggleSet.ts`

```typescript
// Pattern répété dans :
// - merges/page.tsx (lignes 77-87)
// - nodes/page.tsx
```

### 3.3 Créer `hooks/useDropdownState.ts`

```typescript
// Pattern répété dans :
// - rules/page.tsx (lignes 100-112 - 2 dropdowns identiques)
// - merges/page.tsx
```

### 3.4 Créer `hooks/useFetchWithRetry.ts`

```typescript
// Pattern répété dans :
// - merge/[id]/page.tsx (lignes 218-300 - 3 useEffect fetch)
// - viewer/[nodeId]/page.tsx
// - merges/page.tsx
```

### 3.5 Commit Phase 3

```bash
git add hooks/
git commit -m "refactor: add shared hooks for common patterns"
npm test
```

---

## Phase 4 : Composants Partagés

**Objectif** : Extraire les composants utilisés par 2+ pages.

### 4.1 Créer `components/shared/DeviceSelector.tsx`

```typescript
// Extraire de :
// - components/merge/breakpoint-toggle.tsx
// - merge/[id]/page.tsx (lignes 709-729 et 1144-1164 - DUPLIQUÉ!)
// - viewer/[nodeId]/page.tsx (lignes 838-857)
```

### 4.2 Créer `components/shared/BreakpointIcon.tsx`

```typescript
// Extraire de :
// - merges/page.tsx (lignes 594-596)
// - merge/[id]/page.tsx
```

### 4.3 Créer `components/shared/EmptyState.tsx`

```typescript
// Pattern répété dans plusieurs pages
```

### 4.4 Créer `components/shared/CodeHighlight.tsx`

```typescript
// Wrapper Highlight.js utilisé dans :
// - merge/[id]/page.tsx
// - viewer/[nodeId]/page.tsx
```

### 4.5 Réorganiser `components/figma/`

```bash
# Déplacer :
mv components/import-dialog.tsx components/figma/ImportDialog.tsx
mv components/import-progress.tsx components/figma/ImportProgress.tsx
mv components/import-logs.tsx components/figma/ImportLogs.tsx
mv components/refetch-button.tsx components/figma/RefetchButton.tsx
mv components/refetch-dialog.tsx components/figma/RefetchDialog.tsx
mv components/figma-tree-view.tsx components/figma/FigmaTreeView.tsx
```

### 4.6 Réorganiser `components/rules/`

```bash
# Déplacer :
mv components/rule-card.tsx components/rules/RuleCard.tsx
mv components/rule-editor.tsx components/rules/RuleEditor.tsx
mv components/selector-editor.tsx components/rules/SelectorEditor.tsx
mv components/transformer-editor.tsx components/rules/TransformerEditor.tsx
mv components/custom-rule-modal.tsx components/rules/CustomRuleModal.tsx
```

### 4.7 Réorganiser `components/dashboard/`

```bash
# Déplacer :
mv components/recent-imports-carousel.tsx components/dashboard/RecentImportsCarousel.tsx
mv components/recent-merges-carousel.tsx components/dashboard/RecentMergesCarousel.tsx
mv components/stats-card.tsx components/dashboard/StatsCard.tsx
mv components/health-score.tsx components/dashboard/HealthScore.tsx
mv components/live-metrics-card.tsx components/dashboard/LiveMetricsCard.tsx
```

### 4.8 Commit Phase 4

```bash
git add components/
git commit -m "refactor: reorganize components by domain"
npm test && npm run build
```

---

## Phase 5 : Pages React (Extraction)

**Objectif** : Réduire chaque page à ~200 lignes max.

> ⚠️ **ATTENTION** : Phase la plus risquée. Procéder page par page avec tests entre chaque.

### 5.1 Refactorer `viewer/[nodeId]/page.tsx` (1296 → ~200 lignes)

**Créer** :
```
app/viewer/[nodeId]/
├── page.tsx                 # Orchestration seulement
├── _components/
│   ├── ViewerHeader.tsx     # Lignes 595-733
│   ├── CanvasPreview.tsx    # Lignes 736-909
│   ├── CodePanel.tsx        # Lignes 912-1075
│   ├── InfoPanel.tsx
│   └── DetailsSection.tsx   # Lignes 1077-1184
└── _hooks/
    ├── useViewerState.ts    # Consolider 16 useState
    └── useCodeGeneration.ts # Lignes 416-485
```

**Étapes** :
1. [ ] Créer `_hooks/useViewerState.ts` (consolider états)
2. [ ] Créer `_hooks/useCodeGeneration.ts`
3. [ ] Créer `_components/ViewerHeader.tsx`
4. [ ] Créer `_components/CanvasPreview.tsx`
5. [ ] Créer `_components/CodePanel.tsx`
6. [ ] Créer `_components/InfoPanel.tsx`
7. [ ] Créer `_components/DetailsSection.tsx`
8. [ ] Simplifier `page.tsx`
9. [ ] Tests
10. [ ] Commit

### 5.2 Refactorer `merge/[id]/page.tsx` (1218 → ~200 lignes)

**Créer** :
```
app/merge/[id]/
├── page.tsx
├── _components/
│   ├── MergeHeader.tsx
│   ├── CanvasPreviewBlock.tsx
│   ├── CodeDisplayBlock.tsx
│   ├── NodeInfoPanel.tsx
│   └── FullscreenModal.tsx
└── _hooks/
    ├── useMergeData.ts
    └── useCodeDisplay.ts
```

### 5.3 Refactorer `merges/page.tsx` (674 → ~200 lignes)

**Créer** :
```
app/merges/
├── page.tsx
├── _components/
│   ├── MergesControlBar.tsx
│   ├── MergeGridView.tsx
│   └── MergeListView.tsx
└── _hooks/
    └── useMergesFilters.ts
```

### 5.4 Refactorer `rules/page.tsx` (716 → ~200 lignes)

**Créer** :
```
app/rules/
├── page.tsx
├── _components/
│   ├── RulesSidebar.tsx
│   ├── RuleCard.tsx
│   ├── RuleDetailPanel.tsx
│   └── CategoryDropdown.tsx
└── _hooks/
    ├── useRulesData.ts
    └── useRulesFilters.ts
```

### 5.5 Commit Phase 5

```bash
git add app/
git commit -m "refactor: extract page components and hooks"
npm test && npm run build
```

---

## Phase 6 : Nettoyage Final

### 6.1 Supprimer imports inutilisés

```typescript
// react-tailwind.ts ligne 2 : toCamelCase (non utilisé)
// viewer/[nodeId]/page.tsx : RefetchButton, Image, InformationPanel
// merge-simple-alt-nodes.ts ligne 15 : FillData
// tailwind-to-css.ts ligne 328 : readFileSync (dead code)
```

### 6.2 Supprimer code commenté

```typescript
// react-tailwind.ts : 7 console.log commentés (892, 899, 932, 939, 1004, 1006, 1094)
// rule-engine.ts : blocs DEBUG commentés
// altnode-transform.ts : bloc "empty container optimization" (694-703)
```

### 6.3 Supprimer code dupliqué résiduel

Vérifier qu'il ne reste plus de :
- Position properties définies 2x (helpers.ts 524-535 vs 688-699)
- gridTemplateColumns/Rows en double (helpers.ts 129-136 vs 710-716)

### 6.4 Mettre à jour les exports

Créer/mettre à jour les fichiers `index.ts` pour chaque module.

### 6.5 Commit Final

```bash
git add .
git commit -m "refactor: cleanup dead code and unused imports"
npm test && npm run build
```

---

## Checklist de Validation

### Après chaque phase

- [ ] `npm test` passe
- [ ] `npm run lint` passe
- [ ] `npm run build` réussit
- [ ] L'application fonctionne (test manuel)
- [ ] Commit créé

### Après refactoring complet

- [ ] Aucun fichier > 500 lignes (sauf exceptions documentées)
- [ ] Aucune fonction > 50 lignes
- [ ] Aucune fonction > 3 paramètres (sauf objet config)
- [ ] Aucun code dupliqué (3+ répétitions)
- [ ] Aucune magic value non nommée
- [ ] Tous les booléens ont préfixe `is/has/can/should`
- [ ] Tous les imports utilisés
- [ ] Aucun code commenté

---

## Ordre de Priorité (si temps limité)

Si tu ne peux pas tout faire, voici l'ordre de priorité :

1. **Phase 1.1-1.3** : Constantes (élimine magic values) ⭐⭐⭐
2. **Phase 2.1** : Découper helpers.ts (le plus gros impact) ⭐⭐⭐
3. **Phase 1.4-1.6** : Utils partagés (élimine duplication) ⭐⭐
4. **Phase 2.2** : Découper react-tailwind.ts ⭐⭐
5. **Phase 4.1** : DeviceSelector (composant le plus dupliqué) ⭐⭐
6. **Phase 5.1** : viewer/page.tsx (page la plus grosse) ⭐
7. **Reste** : Selon disponibilité

---

## Risques et Mitigations

| Risque | Mitigation |
|--------|------------|
| Casser les imports | Toujours tester après chaque fichier déplacé |
| Régression fonctionnelle | Tests unitaires + test manuel après chaque phase |
| Perte de code | Commits fréquents + branches de feature |
| Conflits de merge | Travailler sur branche dédiée, merger souvent |
| Oublier des usages | Utiliser `grep` pour trouver tous les imports |
