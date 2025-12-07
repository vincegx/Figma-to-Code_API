# Architecture Cible

> Proposition de réorganisation du projet figma-rules-builder

## Principes Directeurs

### 1. Colocation
Les composants et hooks utilisés par UNE SEULE page restent dans le dossier de cette page.

### 2. Limite de taille
| Type | Max lignes |
|------|------------|
| Page component | 200 |
| Sous-composant | 150 |
| Hook | 80 |
| Fonction utilitaire | 50 |

### 3. DRY à 3+
On extrait une abstraction à partir de 3 répétitions, pas avant.

### 4. Données séparées
`figma-data/` et `merges/` sont des dossiers de données runtime, pas de code.

---

## Structure Cible

```
figma-rules-builder/
│
├── 📁 app/                              # PAGES - Orchestration seulement
│   │
│   ├── layout.tsx
│   ├── page.tsx                         # Dashboard (~200 lignes)
│   │
│   ├── 📁 viewer/[nodeId]/
│   │   ├── page.tsx                     # ~150 lignes (layout + orchestration)
│   │   ├── 📁 _components/              # Composants LOCAUX
│   │   │   ├── ViewerHeader.tsx         # Actions, navigation
│   │   │   ├── CanvasPreview.tsx        # Preview Figma
│   │   │   ├── CodePanel.tsx            # Code généré + tabs
│   │   │   ├── InfoPanel.tsx            # Informations node
│   │   │   └── DetailsSection.tsx       # Appearance, Raw Data, Rules
│   │   └── 📁 _hooks/
│   │       ├── useViewerState.ts        # État local consolidé
│   │       └── useCodeGeneration.ts     # Génération code
│   │
│   ├── 📁 merge/[id]/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── 📁 _components/
│   │   │   ├── MergeHeader.tsx          # Header + actions
│   │   │   ├── CanvasPreviewBlock.tsx   # Preview responsive
│   │   │   ├── CodeDisplayBlock.tsx     # Code + CSS généré
│   │   │   ├── NodeInfoPanel.tsx        # Détails du node
│   │   │   └── FullscreenModal.tsx      # Modal plein écran
│   │   └── 📁 _hooks/
│   │       ├── useMergeData.ts          # Fetch merge data
│   │       └── useCodeDisplay.ts        # Logique affichage code
│   │
│   ├── 📁 merges/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── 📁 _components/
│   │   │   ├── MergesControlBar.tsx     # Filtres, recherche, tri
│   │   │   ├── MergeGridView.tsx        # Vue grille
│   │   │   └── MergeListView.tsx        # Vue liste
│   │   └── 📁 _hooks/
│   │       └── useMergesFilters.ts      # Filtrage + pagination
│   │
│   ├── 📁 rules/
│   │   ├── page.tsx
│   │   ├── 📁 _components/
│   │   │   ├── RulesSidebar.tsx         # Liste + filtres
│   │   │   ├── RuleCard.tsx             # Carte règle
│   │   │   ├── RuleDetailPanel.tsx      # Détails règle
│   │   │   └── CategoryDropdown.tsx     # Dropdown catégories
│   │   └── 📁 _hooks/
│   │       ├── useRulesData.ts          # Chargement règles
│   │       └── useRulesFilters.ts       # Filtrage
│   │
│   ├── 📁 nodes/
│   │   ├── page.tsx
│   │   └── 📁 _components/
│   │
│   ├── 📁 settings/
│   │   └── page.tsx
│   │
│   └── 📁 api/                          # Inchangé
│       ├── figma/
│       ├── merges/
│       ├── rules/
│       └── ...
│
├── 📁 components/                       # Composants PARTAGÉS uniquement
│   │
│   ├── 📁 ui/                           # shadcn/ui - NE PAS TOUCHER
│   │   └── (32 fichiers)
│   │
│   ├── 📁 shared/                       # NOUVEAU - Réutilisables cross-pages
│   │   ├── DeviceSelector.tsx           # Buttons Mobile/Tablet/Desktop
│   │   ├── CodeHighlight.tsx            # Wrapper Highlight.js
│   │   ├── EmptyState.tsx               # État vide générique
│   │   ├── LoadingSpinner.tsx           # Spinner chargement
│   │   ├── BreakpointIcon.tsx           # Icon par breakpoint
│   │   ├── DropdownWithClickOutside.tsx # Dropdown + click outside
│   │   └── ConfirmDialog.tsx            # Dialog confirmation
│   │
│   ├── 📁 figma/                        # NOUVEAU - Domaine Figma
│   │   ├── ImportDialog.tsx
│   │   ├── ImportProgress.tsx
│   │   ├── ImportLogs.tsx
│   │   ├── RefetchButton.tsx
│   │   ├── FigmaTreeView.tsx
│   │   └── 📁 RefetchDialog/            # Découpage
│   │       ├── index.tsx
│   │       ├── RefetchForm.tsx
│   │       ├── RefetchPreview.tsx
│   │       └── RefetchStatus.tsx
│   │
│   ├── 📁 merge/                        # Existant - Nettoyé
│   │   ├── MergeCard.tsx
│   │   ├── MergePreview.tsx
│   │   ├── MergeExportPanel.tsx
│   │   ├── DeleteMergeDialog.tsx
│   │   ├── index.ts
│   │   └── 📁 MergeCreationModal/       # Découpage
│   │       ├── index.tsx
│   │       ├── SourceSelection.tsx
│   │       ├── BreakpointConfig.tsx
│   │       └── PreviewStep.tsx
│   │
│   ├── 📁 rules/                        # NOUVEAU - Domaine Rules
│   │   ├── RuleCard.tsx                 # Extrait de components/
│   │   ├── RuleEditor.tsx
│   │   ├── SelectorEditor.tsx
│   │   ├── TransformerEditor.tsx
│   │   └── CustomRuleModal.tsx
│   │
│   ├── 📁 dashboard/                    # NOUVEAU - Dashboard
│   │   ├── RecentImportsCarousel.tsx
│   │   ├── RecentMergesCarousel.tsx
│   │   ├── StatsCard.tsx
│   │   ├── HealthScore.tsx
│   │   └── LiveMetricsCard.tsx
│   │
│   ├── 📁 library/                      # Existant
│   │
│   └── 📁 quota/                        # Existant
│
├── 📁 hooks/                            # Hooks PARTAGÉS uniquement
│   │
│   ├── # Existants
│   ├── use-figma-progress.ts
│   ├── use-refetch.ts
│   ├── use-health-score.ts
│   ├── use-import-progress.ts
│   ├── use-conversion-rate.ts
│   ├── use-aggregated-stats.ts
│   ├── use-stats-history.ts
│   ├── use-rule-matches.ts
│   ├── use-api-quota.ts
│   ├── use-library-stats.ts
│   ├── use-import-history.ts
│   ├── use-weekly-trend.ts
│   ├── use-media-query.ts
│   ├── use-mobile.tsx
│   ├── use-toast.ts
│   │
│   ├── # NOUVEAUX - Patterns réutilisables
│   ├── useLocalStorage.ts              # localStorage + JSON parse
│   ├── useToggleSet.ts                  # Set.add/delete pattern
│   ├── useDropdownState.ts              # Dropdown + click outside
│   └── useFetchWithRetry.ts             # Fetch + try/catch/finally
│
├── 📁 lib/
│   │
│   ├── 📁 code-generators/
│   │   ├── index.ts                     # Exports publics
│   │   │
│   │   ├── 📁 react-tailwind/           # NOUVEAU - Découpage
│   │   │   ├── index.ts                 # generateReactTailwind()
│   │   │   ├── jsx-generator.ts         # generateTailwindJSXElement()
│   │   │   ├── class-deduplication.ts   # deduplicateTailwindClasses()
│   │   │   ├── spacing-consolidation.ts # consolidateSemanticSpacing()
│   │   │   ├── props-collector.ts       # collectProps(), extractFonts()
│   │   │   └── constants.ts             # INDENT, PLACEHOLDER_URL, etc.
│   │   │
│   │   ├── 📁 helpers/                  # NOUVEAU - Découpage
│   │   │   ├── index.ts                 # Exports publics
│   │   │   ├── css-to-tailwind.ts       # cssPropToTailwind() principal
│   │   │   ├── border-handlers.ts       # handleBorderRadius/Color/Width
│   │   │   ├── layout-handlers.ts       # flex, grid, position, display
│   │   │   ├── text-handlers.ts         # font, text, color
│   │   │   ├── spacing-handlers.ts      # padding, margin
│   │   │   └── size-scale.ts            # Mapping tailles Tailwind
│   │   │
│   │   ├── html-css.ts                  # Garder tel quel
│   │   ├── html-tailwind-css.ts
│   │   ├── react.ts
│   │   ├── react-tailwind-v4.ts
│   │   ├── class-mapper.ts
│   │   └── class-mapper-v4.ts
│   │
│   ├── 📁 merge/
│   │   ├── index.ts
│   │   ├── merge-engine.ts              # À découper plus tard
│   │   ├── visibility-mapper.ts
│   │   │
│   │   └── 📁 alt-nodes/                # NOUVEAU - Découpage
│   │       ├── index.ts                 # mergeSimpleAltNodes()
│   │       ├── matching.ts              # findBestMatch(), matchChildrenByName()
│   │       ├── style-diff.ts            # computeStyleDiff(), cleanStyles()
│   │       ├── element-merger.ts        # mergeElement()
│   │       ├── converters.ts            # toUnifiedElement(), stylesToTailwind()
│   │       └── constants.ts             # Scoring weights, thresholds
│   │
│   ├── 📁 utils/
│   │   ├── index.ts                     # Exports publics
│   │   │
│   │   ├── 📁 tailwind-css/             # NOUVEAU - Découpage
│   │   │   ├── index.ts                 # compileTailwindDirect()
│   │   │   ├── parser.ts                # parseMediaQueries(), parseCSSToMap()
│   │   │   ├── v3-compiler.ts           # Compilation Tailwind v3
│   │   │   ├── v4-compiler.ts           # Compilation Tailwind v4
│   │   │   ├── css-generator.ts         # generateFinalCSS()
│   │   │   └── brace-utils.ts           # findMatchingBraceIndex()
│   │   │
│   │   ├── # NOUVEAUX - Utils partagés
│   │   ├── format.ts                    # formatRelativeTime() unifié
│   │   ├── selection.ts                 # toggleSelection() unifié
│   │   ├── download.ts                  # downloadFile() unifié
│   │   │
│   │   ├── # Existants
│   │   ├── file-storage.ts
│   │   ├── library-index.ts
│   │   ├── variable-extractor.ts
│   │   ├── image-fetcher.ts
│   │   ├── figma-diff.ts
│   │   ├── history-manager.ts
│   │   ├── svg-converter.ts
│   │   ├── variables.ts
│   │   ├── variable-css.ts
│   │   ├── node-colors.ts
│   │   ├── url-parser.ts
│   │   ├── export-utils.ts
│   │   └── rule-conflict-detector.ts
│   │
│   ├── 📁 constants/                    # NOUVEAU
│   │   ├── breakpoints.ts               # MOBILE_WIDTH, TABLET_WIDTH, DESKTOP_WIDTH
│   │   ├── tailwind-scale.ts            # Spacing/sizing maps (UNE SEULE FOIS)
│   │   └── defaults.ts                  # PER_PAGE, LIMITS, PLACEHOLDER_URL
│   │
│   ├── 📁 types/                        # Inchangé
│   │   ├── index.ts
│   │   ├── rules.ts
│   │   ├── merge.ts
│   │   ├── guards.ts
│   │   ├── library.ts
│   │   ├── stores.ts
│   │   ├── dashboard.ts
│   │   ├── altnode.ts
│   │   ├── figma.ts
│   │   ├── code-generation.ts
│   │   ├── code-generator.ts
│   │   ├── stats-history.ts
│   │   └── versioning.ts
│   │
│   ├── 📁 store/                        # Inchangé
│   │   ├── index.ts
│   │   ├── ui-store.ts
│   │   ├── rules-store.ts
│   │   ├── merge-store.ts
│   │   ├── nodes-store.ts
│   │   └── quota-store.ts
│   │
│   ├── 📁 validation/                   # Inchangé
│   │   └── rule-schema.ts
│   │
│   ├── altnode-transform.ts             # À découper Phase 2
│   ├── rule-engine.ts                   # À découper Phase 2
│   ├── figma-client.ts
│   ├── figma-transform-config.json
│   ├── stats-history-service.ts
│   ├── transform-stats.ts
│   ├── toast-utils.ts
│   └── utils.ts
│
├── 📁 figma-data/                       # 📦 DONNÉES - Inchangé
│   ├── {nodeId}/
│   │   ├── data.json
│   │   ├── metadata.json
│   │   ├── variables.json
│   │   ├── versions.json
│   │   ├── screenshot.png
│   │   ├── img/
│   │   ├── svg/
│   │   └── history/
│   │
│   ├── rules/
│   │   ├── official-figma-rules.json
│   │   ├── community-rules.json
│   │   ├── custom-rules.json
│   │   └── system-variables.json
│   │
│   ├── api-quota.json
│   ├── library-index.json
│   └── stats-history.json
│
├── 📁 merges/                           # 📦 DONNÉES - Inchangé
│   └── {uuid}.json
│
├── 📁 __tests__/                        # Inchangé
│   ├── unit/
│   ├── integration/
│   ├── performance/
│   └── e2e/
│
├── 📁 scripts/                          # Inchangé
│
├── 📁 public/                           # Inchangé
│
├── 📁 docs/                             # NOUVEAU
│   ├── 01-CARTOGRAPHIE-PROJET.md
│   ├── 02-ARCHITECTURE-CIBLE.md
│   └── 03-PLAN-REFACTORING.md
│
└── (config files)
```

---

## Fichiers à Créer

### lib/constants/

```typescript
// breakpoints.ts
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
```

```typescript
// tailwind-scale.ts
export const TAILWIND_SPACING_SCALE: Record<number, string> = {
  0: '0',
  1: '0.25',
  2: '0.5',
  4: '1',
  8: '2',
  12: '3',
  16: '4',
  20: '5',
  24: '6',
  32: '8',
  40: '10',
  48: '12',
  64: '16',
  // ... etc
};
```

```typescript
// defaults.ts
export const PER_PAGE = 20;
export const RAW_DATA_LIMIT = 2000;
export const GRID_SKELETON_COUNT = 6;
export const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/300x200';
export const DEFAULT_FONT_WEIGHT = '400';
export const DEFAULT_GRADIENT_ANGLE = 180;
```

### lib/utils/ (nouveaux)

```typescript
// format.ts
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}
```

```typescript
// selection.ts
export function toggleSelection<T>(
  set: Set<T>,
  item: T,
  setFn: (newSet: Set<T>) => void
): void {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  setFn(newSet);
}
```

```typescript
// download.ts
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
  a.click();
  URL.revokeObjectURL(url);
}
```

### hooks/ (nouveaux)

```typescript
// useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, setStoredValue];
}
```

```typescript
// useToggleSet.ts
export function useToggleSet<T>(
  initial: Set<T> = new Set()
): [Set<T>, (item: T) => void, () => void] {
  const [set, setSet] = useState(initial);

  const toggle = useCallback((item: T) => {
    setSet(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSet(new Set()), []);

  return [set, toggle, clear];
}
```

```typescript
// useDropdownState.ts
export function useDropdownState() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return { isOpen, setIsOpen, toggle: () => setIsOpen(!isOpen), ref };
}
```

---

## Conventions de Nommage

### Fichiers

| Type | Convention | Exemple |
|------|------------|---------|
| Page | `page.tsx` | `app/merges/page.tsx` |
| Composant | PascalCase | `MergeCard.tsx` |
| Hook | camelCase avec `use` | `useMergeData.ts` |
| Utilitaire | kebab-case | `format.ts`, `download.ts` |
| Constantes | kebab-case | `breakpoints.ts` |
| Types | PascalCase | `merge.ts` (contient `MergeData`) |

### Dossiers

| Type | Convention | Exemple |
|------|------------|---------|
| Dossier page local | `_components/`, `_hooks/` | `app/merge/[id]/_components/` |
| Dossier découpage | kebab-case | `lib/code-generators/react-tailwind/` |
| Dossier domaine | kebab-case | `components/merge/` |

### Variables

| Type | Convention | Exemple |
|------|------------|---------|
| Booléen | `is`, `has`, `can`, `should` | `isLoading`, `hasError` |
| Handler | `handle` + Event | `handleClick`, `handleSubmit` |
| Callback prop | `on` + Event | `onClick`, `onSubmit` |
| Constante | SCREAMING_SNAKE | `MOBILE_WIDTH`, `PER_PAGE` |

---

## Ce qui NE CHANGE PAS

1. **`figma-data/`** - Données runtime
2. **`merges/`** - Données runtime
3. **`components/ui/`** - shadcn/ui
4. **`app/api/`** - Routes API
5. **`__tests__/`** - Structure tests
6. **`scripts/`** - Scripts utilitaires
7. **`public/`** - Assets statiques
8. **Config files** - tsconfig, package.json, etc.
