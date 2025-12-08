# Phase 1 : Fondations

> **Statut** : À faire
> **Risque** : Faible
> **Durée** : 2h
> **Prérequis** : Golden tests en place (`npm run golden:verify` passe)
> **Référence** : Voir `docs/MOVE-MAP.md` pour les lignes exactes et fixes critiques

---

## Objectif

Éliminer les doublons, centraliser les magic values, supprimer le code mort.

---

## Règle Absolue

```
MOVE VERBATIM - On déplace le code exact, on ne réécrit pas
Après CHAQUE étape : npm run golden:verify
```

---

## 1.1 Créer `lib/constants/tailwind-scale.ts`

### Source : Doublons identifiés

| Fichier | Lignes | Contenu |
|---------|--------|---------|
| `react-tailwind.ts` | 564-604 | `TAILWIND_SPACING_SCALE` (garder) |
| `react-tailwind.ts` | 667-689 | `TAILWIND_SPACING_SCALE` (DOUBLON → supprimer) |
| `helpers.ts` | 164-191 | Padding scale (vérifier si identique) |
| `helpers.ts` | 299-308 | Border radius scale |
| `helpers.ts` | 861-899 | Size scale |

### Action

1. Créer `lib/constants/tailwind-scale.ts`
2. COPIER VERBATIM `TAILWIND_SPACING_SCALE` depuis `react-tailwind.ts:564-604`
3. COPIER VERBATIM les autres scales depuis `helpers.ts`
4. Mettre à jour les imports dans les fichiers sources
5. SUPPRIMER les doublons

### Validation

```bash
npm run golden:verify  # DOIT PASS
git add lib/constants/tailwind-scale.ts
git commit -m "refactor: extract TAILWIND_SPACING_SCALE to constants"
```

---

## 1.2 Créer `lib/constants/breakpoints.ts`

### Source : Magic values éparpillées

| Fichier | Lignes | Valeurs |
|---------|--------|---------|
| `app/merge/[id]/page.tsx` | 710, 717 | `375, 667`, `768, 1024` |
| `app/viewer/[nodeId]/page.tsx` | 838, 845 | `375, 667`, `768, 1024` |
| `lib/merge/merge-engine.ts` | 394-395 | `420, 960, 375, 768, 1280` |

### Fichier à créer

```typescript
// lib/constants/breakpoints.ts

export const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280 },
  desktopXL: { width: 1440 },
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Pour merge-engine
export const MERGE_BREAKPOINTS = {
  mobileMaxWidth: 420,
  tabletMaxWidth: 960,
  mobileWidth: 375,
  tabletWidth: 768,
  desktopWidth: 1280,
} as const;
```

### Validation

```bash
npm run golden:verify
git commit -m "refactor: extract breakpoints to constants"
```

---

## 1.3 Créer `lib/constants/merge-scoring.ts`

### Source : Magic values dans merge-simple-alt-nodes.ts

| Lignes | Valeur | Usage |
|--------|--------|-------|
| 185, 200 | `0.01` | ZERO_THRESHOLD |
| 210 | `0.5` | VALUE_TOLERANCE |
| 325 | `0.1` | SHORTHAND_TOLERANCE |
| 614 | `10` | POSITION_WEIGHT |
| 614 | `100` | RELATIVE_POS_WEIGHT |
| 619 | `50` | NAME_SIMILARITY_BONUS |
| 623 | `3` | MAX_POSITION_DIFF |
| 623 | `0.2` | MAX_RELATIVE_DIFF |

### Fichier à créer

```typescript
// lib/constants/merge-scoring.ts

// Tolerances pour comparaison de valeurs
export const ZERO_THRESHOLD = 0.01;
export const VALUE_TOLERANCE = 0.5;
export const SHORTHAND_TOLERANCE = 0.1;

// Scoring pour matching d'enfants
export const POSITION_WEIGHT = 10;
export const RELATIVE_POS_WEIGHT = 100;
export const NAME_SIMILARITY_BONUS = 50;

// Seuils de matching
export const MAX_POSITION_DIFF = 3;
export const MAX_RELATIVE_DIFF = 0.2;
```

### Validation

```bash
npm run golden:verify
git commit -m "refactor: extract merge scoring constants"
```

---

## 1.4 Créer `lib/constants/index.ts`

```typescript
// lib/constants/index.ts

export * from './tailwind-scale';
export * from './breakpoints';
export * from './merge-scoring';
```

---

## 1.5 Supprimer les Doublons

### Doublons confirmés à supprimer

| Fichier | Lignes | Raison |
|---------|--------|--------|
| `react-tailwind.ts` | 667-689 | Doublon de TAILWIND_SPACING_SCALE |
| `helpers.ts` | 688-699 | Doublon de position properties (garder 524-535) |

### Action

1. Vérifier que l'import depuis `@/lib/constants` fonctionne
2. Supprimer les blocs dupliqués
3. Run golden tests

```bash
npm run golden:verify
git commit -m "refactor: remove duplicate code blocks"
```

---

## 1.6 Cleanup Code Mort

### Imports inutilisés

| Fichier | Import |
|---------|--------|
| `react-tailwind.ts:2` | `toCamelCase` |
| `viewer/[nodeId]/page.tsx:46` | `RefetchButton` |
| `viewer/[nodeId]/page.tsx:56` | `Image` |
| `merge-simple-alt-nodes.ts:15` | `FillData` |

### Console.log commentés

| Fichier | Lignes |
|---------|--------|
| `react-tailwind.ts` | 892, 899, 932, 939, 1004, 1006, 1094 |
| `rule-engine.ts` | 178-200, 401-407, 422-427, 465-493 |

### Action

```bash
# Supprimer les imports inutilisés
# Supprimer les console.log commentés
npm run golden:verify
git commit -m "refactor: remove dead code and unused imports"
```

---

## Validation Finale Phase 1

```bash
npm run golden:verify  # MUST PASS
npm run lint
npm run build
```

### Checklist

- [ ] `lib/constants/tailwind-scale.ts` créé
- [ ] `lib/constants/breakpoints.ts` créé
- [ ] `lib/constants/merge-scoring.ts` créé
- [ ] `lib/constants/index.ts` créé
- [ ] Doublons supprimés (2 blocs)
- [ ] Code mort supprimé
- [ ] Golden tests passent
- [ ] Build réussit

---

## Prochaine Phase

→ `docs/phases/phase-2-core-lib.md`
