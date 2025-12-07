# Phase 1 : Constantes & Utils Partagés

> **Statut** : À faire
> **Risque** : Faible
> **Durée estimée** : 2h
> **Prérequis** : Aucun

---

## Objectif

Éliminer les magic values et le code dupliqué simple en créant :
- `lib/constants/` - Constantes centralisées
- `lib/utils/format.ts` - Formatage dates
- `lib/utils/selection.ts` - Toggle sélection
- `lib/utils/download.ts` - Téléchargement fichiers

---

## 1.1 Créer `lib/constants/breakpoints.ts`

### Fichier à créer

```typescript
// lib/constants/breakpoints.ts

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

### Fichiers à modifier

| Fichier | Lignes | Valeurs à remplacer |
|---------|--------|---------------------|
| `app/merge/[id]/page.tsx` | 710, 717 | `375, 667`, `768, 1024` |
| `app/merge/[id]/page.tsx` | 1145, 1152 | `375, 667`, `768, 1024` |
| `app/viewer/[nodeId]/page.tsx` | 838, 845 | `375, 667`, `768, 1024` |
| `app/merges/page.tsx` | ~430, ~557 | `375`, `768` (tailles thumbnails) |
| `lib/merge/merge-engine.ts` | 394-395 | `420, 960, 375, 768, 1280` |

### Checklist

- [ ] Créer `lib/constants/breakpoints.ts`
- [ ] Modifier `app/merge/[id]/page.tsx`
- [ ] Modifier `app/viewer/[nodeId]/page.tsx`
- [ ] Modifier `app/merges/page.tsx`
- [ ] Modifier `lib/merge/merge-engine.ts`
- [ ] Vérifier imports

---

## 1.2 Créer `lib/constants/tailwind-scale.ts`

### Fichier à créer

```typescript
// lib/constants/tailwind-scale.ts

// Tailwind spacing scale (px -> rem class suffix)
export const TAILWIND_SPACING_SCALE: Record<number, string> = {
  0: '0',
  1: 'px',
  2: '0.5',
  4: '1',
  6: '1.5',
  8: '2',
  10: '2.5',
  12: '3',
  14: '3.5',
  16: '4',
  20: '5',
  24: '6',
  28: '7',
  32: '8',
  36: '9',
  40: '10',
  44: '11',
  48: '12',
  52: '13',
  56: '14',
  60: '15',
  64: '16',
  72: '18', // Note: removed in v3, check usage
  80: '20',
  96: '24',
};

// Tailwind border radius scale
export const TAILWIND_BORDER_RADIUS_SCALE: Record<number, string> = {
  0: 'none',
  2: 'sm',
  4: 'DEFAULT',
  6: 'md',
  8: 'lg',
  12: 'xl',
  16: '2xl',
  24: '3xl',
  9999: 'full',
};

// Tailwind size scale for width/height
export const TAILWIND_SIZE_SCALE: Record<number, string> = {
  0: '0',
  1: 'px',
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
  56: '14',
  64: '16',
  80: '20',
  96: '24',
  112: '28',
  128: '32',
  144: '36',
  160: '40',
  176: '44',
  192: '48',
  208: '52',
  224: '56',
  240: '60',
  256: '64',
  288: '72',
  320: '80',
  384: '96',
};

// Helper to find closest Tailwind class
export function findClosestTailwindValue(
  px: number,
  scale: Record<number, string>
): string | null {
  if (scale[px] !== undefined) return scale[px];

  // Find closest value within 5% tolerance
  const tolerance = px * 0.05;
  for (const [key, value] of Object.entries(scale)) {
    if (Math.abs(Number(key) - px) <= tolerance) {
      return value;
    }
  }
  return null;
}
```

### Fichiers à modifier

| Fichier | Lignes | Ce qui est dupliqué |
|---------|--------|---------------------|
| `lib/code-generators/react-tailwind.ts` | 564-604 | `TAILWIND_SPACING_SCALE` (1ère occurrence) |
| `lib/code-generators/react-tailwind.ts` | 667-689 | `TAILWIND_SPACING_SCALE` (2ème occurrence - DOUBLON!) |
| `lib/code-generators/helpers.ts` | 164-191 | Padding scale |
| `lib/code-generators/helpers.ts` | 299-308 | Border radius scale |
| `lib/code-generators/helpers.ts` | 861-899 | Size scale |

### Checklist

- [ ] Créer `lib/constants/tailwind-scale.ts`
- [ ] Modifier `lib/code-generators/react-tailwind.ts` (supprimer 2 duplications)
- [ ] Modifier `lib/code-generators/helpers.ts`
- [ ] Vérifier imports

---

## 1.3 Créer `lib/constants/defaults.ts`

### Fichier à créer

```typescript
// lib/constants/defaults.ts

// Pagination
export const PER_PAGE = 20;
export const MAX_CHILDREN_DISPLAY = 10;

// Data limits
export const RAW_DATA_LIMIT = 2000;
export const GRID_SKELETON_COUNT = 6;

// Placeholders
export const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/300x200';

// Code generation defaults
export const DEFAULT_FONT_WEIGHT = '400';
export const DEFAULT_GRADIENT_ANGLE = 180;
export const NORMALIZE_TOLERANCE = 0.05;
export const ZERO_THRESHOLD = 0.01;

// Indentation
export const INDENT = '  '; // 2 spaces
export const INDENT_SIZE = 2;

// Scoring (for merge matching)
export const POSITION_WEIGHT = 10;
export const RELATIVE_POS_WEIGHT = 100;
export const NAME_SIMILARITY_BONUS = 50;
export const MAX_POSITION_DIFF = 3;
export const MAX_RELATIVE_DIFF = 0.2;
```

### Fichiers à modifier

| Fichier | Lignes | Valeurs |
|---------|--------|---------|
| `app/viewer/[nodeId]/page.tsx` | 247, 310 | `2000` (RAW_DATA_LIMIT) |
| `app/merge/[id]/page.tsx` | 203, 331 | `2000` (RAW_DATA_LIMIT) |
| `app/merges/page.tsx` | 141 | `20` (PER_PAGE) |
| `lib/code-generators/react-tailwind.ts` | 237 | `'400'` (DEFAULT_FONT_WEIGHT) |
| `lib/code-generators/react-tailwind.ts` | 324 | `180` (DEFAULT_GRADIENT_ANGLE) |
| `lib/code-generators/react-tailwind.ts` | 633 | `0.05` (NORMALIZE_TOLERANCE) |
| `lib/code-generators/react-tailwind.ts` | 1085 | `'  '` (INDENT) |
| `lib/code-generators/react-tailwind.ts` | 1363, 1399, 1461 | Placeholder URL |
| `lib/merge/merge-simple-alt-nodes.ts` | 185 | `0.01` (ZERO_THRESHOLD) |
| `lib/merge/merge-simple-alt-nodes.ts` | 613-623 | Scoring weights |

### Checklist

- [ ] Créer `lib/constants/defaults.ts`
- [ ] Modifier `app/viewer/[nodeId]/page.tsx`
- [ ] Modifier `app/merge/[id]/page.tsx`
- [ ] Modifier `app/merges/page.tsx`
- [ ] Modifier `lib/code-generators/react-tailwind.ts`
- [ ] Modifier `lib/merge/merge-simple-alt-nodes.ts`
- [ ] Vérifier imports

---

## 1.4 Créer `lib/constants/index.ts`

### Fichier à créer

```typescript
// lib/constants/index.ts

export * from './breakpoints';
export * from './tailwind-scale';
export * from './defaults';
```

### Checklist

- [ ] Créer `lib/constants/index.ts`

---

## 1.5 Créer `lib/utils/format.ts`

### Fichier à créer

```typescript
// lib/utils/format.ts

/**
 * Format a date as relative time (e.g., "5m ago", "2d ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return d.toLocaleDateString();
}

/**
 * Format a date as datetime string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

### Fichiers à modifier

| Fichier | Lignes | Fonction existante |
|---------|--------|-------------------|
| `app/merges/page.tsx` | 278-289 | `formatRelativeTime()` local |
| `components/merge/merge-card.tsx` | ~66-80 | Logique similaire inline |

### Checklist

- [ ] Créer `lib/utils/format.ts`
- [ ] Modifier `app/merges/page.tsx` - supprimer fonction locale, importer
- [ ] Modifier `components/merge/merge-card.tsx` - importer et utiliser
- [ ] Vérifier imports

---

## 1.6 Créer `lib/utils/selection.ts`

### Fichier à créer

```typescript
// lib/utils/selection.ts

/**
 * Toggle an item in a Set (add if absent, remove if present)
 * Returns a new Set (immutable)
 */
export function toggleInSet<T>(set: Set<T>, item: T): Set<T> {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  return newSet;
}

/**
 * Select all items in a Set
 */
export function selectAll<T>(items: T[]): Set<T> {
  return new Set(items);
}

/**
 * Clear all selections
 */
export function clearSelection<T>(): Set<T> {
  return new Set();
}

/**
 * Check if all items are selected
 */
export function isAllSelected<T>(set: Set<T>, items: T[]): boolean {
  return items.length > 0 && items.every(item => set.has(item));
}

/**
 * Check if some (but not all) items are selected
 */
export function isSomeSelected<T>(set: Set<T>, items: T[]): boolean {
  const selectedCount = items.filter(item => set.has(item)).length;
  return selectedCount > 0 && selectedCount < items.length;
}
```

### Fichiers à modifier

| Fichier | Lignes | Fonction existante |
|---------|--------|-------------------|
| `app/merges/page.tsx` | 221-229 | `toggleSelection()` local |
| `app/nodes/page.tsx` | 113-121 | `toggleSelection()` identique |

### Checklist

- [ ] Créer `lib/utils/selection.ts`
- [ ] Modifier `app/merges/page.tsx` - supprimer fonction locale, importer
- [ ] Modifier `app/nodes/page.tsx` - supprimer fonction locale, importer
- [ ] Vérifier imports

---

## 1.7 Créer `lib/utils/download.ts`

### Fichier à créer

```typescript
// lib/utils/download.ts

/**
 * Download content as a file
 */
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

/**
 * Download object as JSON file
 */
export function downloadJSON(data: object, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  downloadFile(content, filename, 'application/json');
}

/**
 * Download code with appropriate MIME type
 */
export function downloadCode(code: string, filename: string): void {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    tsx: 'text/typescript-jsx',
    ts: 'text/typescript',
    jsx: 'text/javascript-jsx',
    js: 'text/javascript',
    css: 'text/css',
    html: 'text/html',
    json: 'application/json',
  };
  downloadFile(code, filename, mimeTypes[ext || ''] || 'text/plain');
}

/**
 * Download as HTML file
 */
export function downloadHTML(html: string, filename: string): void {
  downloadFile(html, filename, 'text/html');
}
```

### Fichiers à modifier

| Fichier | Lignes | Code dupliqué |
|---------|--------|---------------|
| `app/merge/[id]/page.tsx` | 544-558 | Download logic (1ère occurrence) |
| `app/merge/[id]/page.tsx` | 848-874 | Download logic (2ème occurrence - DOUBLON!) |

### Checklist

- [ ] Créer `lib/utils/download.ts`
- [ ] Modifier `app/merge/[id]/page.tsx` - remplacer 2 occurrences par imports
- [ ] Vérifier imports

---

## Règles de Refactoring - Rappel

> **IMPORTANT** : Respecter ces règles pendant l'exécution

- ✅ **Tests before/after** : Exécuter `npm test` après CHAQUE modification
- ✅ **One change at a time** : Commit après chaque sous-étape (1.1, 1.2, etc.)
- ✅ **Extract > rewrite** : On extrait, on ne réécrit pas
- ✅ **DRY à 3+** : Les utils format/selection/download sont à 2 occurrences mais seront réutilisés

---

## Validation & Commits

### Après CHAQUE sous-étape (1.1, 1.2, etc.)

```bash
npm test
git add <fichiers modifiés>
git commit -m "refactor(phase1): extract <nom> constants"
```

### Validation Finale Phase 1

```bash
npm test
npm run lint
npm run build
npm run dev  # Test manuel
```

### Checklist finale

- [ ] Tous les tests passent
- [ ] Build réussit
- [ ] Application fonctionne (test manuel)
- [ ] Aucune magic value restante dans les fichiers modifiés
- [ ] Plus de code dupliqué pour format/selection/download
- [ ] 7 commits créés (1 par sous-étape)

---

## Fichiers Créés (Résumé)

```
lib/
├── constants/
│   ├── index.ts
│   ├── breakpoints.ts
│   ├── tailwind-scale.ts
│   └── defaults.ts
└── utils/
    ├── format.ts
    ├── selection.ts
    └── download.ts
```

---

## Prochaine Phase

Après validation de la Phase 1, passer à :
→ `docs/phases/phase-2-lib-split.md`
