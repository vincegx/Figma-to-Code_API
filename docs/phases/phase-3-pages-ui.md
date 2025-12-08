# Phase 3 : Pages UI

> **Statut** : À faire
> **Risque** : Isolé (chaque page indépendante)
> **Durée** : 4h
> **Prérequis** : Phase 2 terminée

---

## Objectif

Réduire les pages >500 lignes en extrayant :
- Hooks pour la logique (fetch, state)
- Composants pour l'UI réutilisable

---

## Règle Absolue

```
MOVE VERBATIM - On déplace le code exact, on ne réécrit pas
Après CHAQUE extraction : npm run build (pas de golden car c'est du React)
```

---

## Inventaire des Pages

| Page | Lignes | Priorité | Action |
|------|--------|----------|--------|
| `viewer/[nodeId]/page.tsx` | **1296** | P1 | → ~300 lignes |
| `merge/[id]/page.tsx` | **1218** | P1 | → ~300 lignes |
| `rules/page.tsx` | **716** | P2 | → ~300 lignes |
| `merges/page.tsx` | **674** | P2 | → ~300 lignes |
| `nodes/page.tsx` | 514 | P3 | Évaluer |
| `settings/page.tsx` | 519 | P3 | Évaluer |
| `page.tsx` (dashboard) | 469 | OK | Pas de changement |

---

## 3.1 Refacto `viewer/[nodeId]/page.tsx` (1296 → ~300)

### Structure cible

```
app/viewer/[nodeId]/
├── page.tsx              # Orchestration (~300 lignes)
├── _hooks/
│   ├── useViewerData.ts      # Fetch node + transform + rules (~150 lignes)
│   └── useCodeGeneration.ts  # Génération code à la demande (~100 lignes)
└── _components/
    ├── ViewerHeader.tsx      # Header avec actions (~150 lignes)
    ├── PreviewCanvas.tsx     # Canvas + device selector (~200 lignes)
    ├── CodePanel.tsx         # Code + tabs + copy (~200 lignes)
    └── NodeInfoPanel.tsx     # Infos du node sélectionné (~150 lignes)
```

### Étapes

1. **Créer `_hooks/useViewerData.ts`**
   - EXTRAIRE la logique de fetch (useEffect avec fetch node)
   - EXTRAIRE les useState liés aux données
   - EXTRAIRE la transformation altNode

2. **Créer `_hooks/useCodeGeneration.ts`**
   - EXTRAIRE la logique de génération de code
   - EXTRAIRE les handlers de changement de framework

3. **Créer `_components/ViewerHeader.tsx`**
   - EXTRAIRE le header avec boutons d'action
   - EXTRAIRE les selects framework/language

4. **Créer `_components/PreviewCanvas.tsx`**
   - EXTRAIRE le canvas de preview
   - EXTRAIRE le device selector

5. **Créer `_components/CodePanel.tsx`**
   - EXTRAIRE l'affichage du code
   - EXTRAIRE les tabs component/styles
   - EXTRAIRE le bouton copy

6. **Créer `_components/NodeInfoPanel.tsx`**
   - EXTRAIRE le panneau d'infos du node

### Validation

```bash
npm run build
npm run dev  # Test manuel de la page viewer
git commit -m "refactor: split viewer page into hooks and components"
```

### Checklist 3.1

- [ ] `_hooks/useViewerData.ts` créé
- [ ] `_hooks/useCodeGeneration.ts` créé
- [ ] `_components/ViewerHeader.tsx` créé
- [ ] `_components/PreviewCanvas.tsx` créé
- [ ] `_components/CodePanel.tsx` créé
- [ ] `_components/NodeInfoPanel.tsx` créé
- [ ] `page.tsx` réduit à ~300 lignes
- [ ] Page fonctionne (test manuel)

---

## 3.2 Refacto `merge/[id]/page.tsx` (1218 → ~300)

### Structure cible

```
app/merge/[id]/
├── page.tsx              # Orchestration (~300 lignes)
├── _hooks/
│   ├── useMergeData.ts       # Fetch merge + nodes (~150 lignes)
│   └── useMergeCode.ts       # Génération code merge (~100 lignes)
└── _components/
    ├── MergeHeader.tsx       # Header avec nav prev/next (~150 lignes)
    ├── BreakpointPreview.tsx # Preview par breakpoint (~200 lignes)
    ├── MergeCodePanel.tsx    # Code généré + export (~200 lignes)
    └── MergeNodeInfo.tsx     # Infos du node merge (~150 lignes)
```

### Étapes

Même approche que 3.1 :
1. Extraire les hooks de données
2. Extraire les composants UI

### Checklist 3.2

- [ ] `_hooks/useMergeData.ts` créé
- [ ] `_hooks/useMergeCode.ts` créé
- [ ] `_components/MergeHeader.tsx` créé
- [ ] `_components/BreakpointPreview.tsx` créé
- [ ] `_components/MergeCodePanel.tsx` créé
- [ ] `_components/MergeNodeInfo.tsx` créé
- [ ] `page.tsx` réduit à ~300 lignes
- [ ] Page fonctionne (test manuel)

---

## 3.3 Refacto `rules/page.tsx` (716 → ~300)

### Structure cible

```
app/rules/
├── page.tsx              # Orchestration (~300 lignes)
├── _hooks/
│   └── useRulesData.ts       # Fetch rules + filtrage (~150 lignes)
└── _components/
    ├── RulesSidebar.tsx      # Liste + filtres (~200 lignes)
    └── RuleDetailPanel.tsx   # Détail de la règle (~150 lignes)
```

### Checklist 3.3

- [ ] `_hooks/useRulesData.ts` créé
- [ ] `_components/RulesSidebar.tsx` créé
- [ ] `_components/RuleDetailPanel.tsx` créé
- [ ] `page.tsx` réduit à ~300 lignes

---

## 3.4 Refacto `merges/page.tsx` (674 → ~300)

### Structure cible

```
app/merges/
├── page.tsx              # Orchestration (~300 lignes)
├── _hooks/
│   └── useMergesData.ts      # Fetch merges + filtrage (~150 lignes)
└── _components/
    ├── MergesToolbar.tsx     # Filtres, tri, recherche (~150 lignes)
    └── MergesGrid.tsx        # Grille de cartes (~200 lignes)
```

### Checklist 3.4

- [ ] `_hooks/useMergesData.ts` créé
- [ ] `_components/MergesToolbar.tsx` créé
- [ ] `_components/MergesGrid.tsx` créé
- [ ] `page.tsx` réduit à ~300 lignes

---

## 3.5 (Optionnel) Évaluer `nodes/` et `settings/`

| Page | Lignes | Recommandation |
|------|--------|----------------|
| `nodes/page.tsx` | 514 | Borderline, splitter si logique complexe |
| `settings/page.tsx` | 519 | Borderline, splitter si sections distinctes |

**Action** : Ne pas splitter si la structure est simple et linéaire.

---

## 3.6 (Optionnel) API Route `figma/stream`

| Route | Lignes | Recommandation |
|-------|--------|----------------|
| `figma/stream/route.ts` | 566 | Borderline, OK si une responsabilité |

---

## Composants Partagés Potentiels

Pendant le refacto, identifier les patterns répétés pour créer des composants partagés :

| Pattern | Pages concernées | Composant partagé |
|---------|------------------|-------------------|
| Device selector (Mobile/Tablet/Desktop) | viewer, merge | `components/shared/DeviceSelector.tsx` |
| Code display avec tabs | viewer, merge | `components/shared/CodeDisplay.tsx` |
| Copy button avec feedback | viewer, merge, rules | `components/shared/CopyButton.tsx` |

**Note** : Créer les composants partagés SEULEMENT si utilisés dans 2+ pages.

---

## Validation Finale Phase 3

```bash
npm run lint
npm run build
npm run dev  # Test manuel de CHAQUE page modifiée
```

### Checklist Finale

- [ ] `viewer/[nodeId]/` refactoré (~300 lignes + hooks + components)
- [ ] `merge/[id]/` refactoré (~300 lignes + hooks + components)
- [ ] `rules/` refactoré (~300 lignes + hooks + components)
- [ ] `merges/` refactoré (~300 lignes + hooks + components)
- [ ] Aucune page > 400 lignes
- [ ] Toutes les pages fonctionnent (test manuel)
- [ ] Build réussit

---

## Prochaine Phase

→ `docs/phases/phase-4-validation.md`
