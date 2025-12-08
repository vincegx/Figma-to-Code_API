# Phase 2 : Core lib/

> **Statut** : À faire
> **Risque** : Moyen
> **Durée** : 4h
> **Prérequis** : Phase 1 terminée
> **Référence** : Voir `docs/MOVE-MAP.md` pour les lignes exactes et fixes critiques (WP08, WP25, WP31, WP32, WP38, etc.)

---

## Objectif

Découper les 4 fichiers >1000 lignes en modules cohérents (~400-500 lignes max).

---

## Règle Absolue

```
MOVE VERBATIM - On déplace le code exact, on ne réécrit pas
Après CHAQUE fichier créé : npm run golden:verify
```

---

## 2.1 Split `react-tailwind.ts` (1562 → 3 fichiers)

### Structure cible

```
lib/code-generators/react-tailwind/
├── index.ts              # generateReactTailwind() - orchestration (~250 lignes)
├── jsx-generator.ts      # generateTailwindJSXElement() (~500 lignes)
└── class-processing.ts   # deduplicate, normalize, consolidate (~450 lignes)
```

### Mapping des fonctions

| Fonction | Lignes source | Fichier cible |
|----------|---------------|---------------|
| `smartSplitTailwindClasses` | 12-56 | `class-processing.ts` |
| `collectProps`, `generatePropsInterface`, `createPropLookup` | 67-222 | `index.ts` |
| `extractFonts`, `generateGoogleFontsUrl` | 227-262 | `index.ts` |
| `SvgExportInfo`, `generateSvgVarName`, SVG handlers | 264-347 | `index.ts` |
| `deduplicateTailwindClasses` | 386-506 | `class-processing.ts` |
| `removeDefaultFlexProperties` | 508-551 | `class-processing.ts` |
| `normalizeArbitraryValues` | 561-651 | `class-processing.ts` |
| `consolidateSemanticSpacing` | 662-833 | `class-processing.ts` |
| `generateReactTailwind` | 858-1047 | `index.ts` |
| `generateTailwindJSXElement` | 1066-1505 | `jsx-generator.ts` |
| Utilitaires restants | 1510-1562 | `index.ts` |

### Étapes

1. Créer `lib/code-generators/react-tailwind/` dossier
2. Créer `class-processing.ts` - COPIER VERBATIM les fonctions de traitement de classes
3. Créer `jsx-generator.ts` - COPIER VERBATIM `generateTailwindJSXElement`
4. Créer `index.ts` - COPIER VERBATIM le reste + exports

### Validation après CHAQUE fichier

```bash
npm run golden:verify
git add lib/code-generators/react-tailwind/
git commit -m "refactor: split react-tailwind.ts - [fichier]"
```

### Checklist 2.1

- [ ] `class-processing.ts` créé (~450 lignes)
- [ ] `jsx-generator.ts` créé (~500 lignes)
- [ ] `index.ts` créé (~250 lignes)
- [ ] Ancien `react-tailwind.ts` supprimé
- [ ] Imports mis à jour partout
- [ ] Golden tests passent

---

## 2.2 Split `helpers.ts` (1222 → 3 fichiers)

### Structure cible

```
lib/code-generators/helpers/
├── index.ts              # cssPropToTailwind() dispatcher (~150 lignes)
├── spacing-layout.ts     # padding, margin, gap, position, flex, grid (~500 lignes)
└── visual.ts             # colors, borders, backgrounds, text, shadows (~500 lignes)
```

### Mapping des propriétés CSS

| Propriétés | Lignes source | Fichier cible |
|------------|---------------|---------------|
| `truncateLayerName`, `toCamelCase`, utilitaires | 1-95 | `index.ts` |
| `padding*`, `margin*`, `gap` | 164-211 | `spacing-layout.ts` |
| `position`, `top/right/bottom/left` | 524-535 | `spacing-layout.ts` |
| `display`, `flex*`, `grid*` | 117-163 | `spacing-layout.ts` |
| `border*` | 219-328, 596-654 | `visual.ts` |
| `background*`, `color`, `opacity` | 654-687 | `visual.ts` |
| `font*`, `text*`, `line-height` | 700-850 | `visual.ts` |
| `width`, `height`, `min/max-*` | 861-907 | `spacing-layout.ts` |
| Reste (overflow, z-index, etc.) | divers | `index.ts` |

### Étapes

1. Créer `lib/code-generators/helpers/` dossier
2. Créer `spacing-layout.ts` - COPIER VERBATIM handlers spacing/layout
3. Créer `visual.ts` - COPIER VERBATIM handlers visuels
4. Créer `index.ts` - Dispatcher `cssPropToTailwind` + exports

### Validation

```bash
npm run golden:verify
git commit -m "refactor: split helpers.ts"
```

### Checklist 2.2

- [ ] `spacing-layout.ts` créé (~500 lignes)
- [ ] `visual.ts` créé (~500 lignes)
- [ ] `index.ts` créé (~150 lignes)
- [ ] Ancien `helpers.ts` supprimé
- [ ] Golden tests passent

---

## 2.3 Split `merge-simple-alt-nodes.ts` (1038 → 3 fichiers)

### Structure cible

```
lib/merge/alt-nodes/
├── index.ts          # mergeSimpleAltNodes() orchestration (~300 lignes)
├── matching.ts       # findBestMatch(), matchChildrenByName() (~350 lignes)
└── style-diff.ts     # computeStyleDiff(), areValuesEquivalent() (~350 lignes)
```

### Mapping des fonctions

| Fonction | Lignes source | Fichier cible |
|----------|---------------|---------------|
| Constantes, types, interfaces | 1-110 | `index.ts` (importer depuis constants/) |
| `cleanStyles`, `getResetValue`, `areValuesEquivalent` | 111-333 | `style-diff.ts` |
| `computeStyleDiff` | 335-433 | `style-diff.ts` |
| `findBestMatch` | 495-631 | `matching.ts` |
| `matchChildrenByName` | 642-734 | `matching.ts` |
| `mergeElement` | 739-871 | `index.ts` |
| `smartSplitClasses`, `stylesToTailwindClasses` | 886-991 | `index.ts` |
| `toUnifiedElement`, `mergeSimpleAltNodes` | 994-1038 | `index.ts` |

### Validation

```bash
npm run golden:verify
git commit -m "refactor: split merge-simple-alt-nodes.ts"
```

### Checklist 2.3

- [ ] `style-diff.ts` créé (~350 lignes)
- [ ] `matching.ts` créé (~350 lignes)
- [ ] `index.ts` créé (~300 lignes)
- [ ] Ancien fichier supprimé
- [ ] Golden tests passent

---

## 2.4 Split `altnode-transform.ts` (1475 → 3 fichiers)

### Structure cible

```
lib/altnode-transform/
├── index.ts              # transformToAltNode() principal (~400 lignes)
├── node-handlers.ts      # Handlers par type (FRAME, TEXT, etc.) (~600 lignes)
└── style-extraction.ts   # Extraction styles Figma (~400 lignes)
```

### Mapping des fonctions

| Fonction | Lignes source | Fichier cible |
|----------|---------------|---------------|
| Types, interfaces, constantes | 1-100 | `index.ts` |
| `transformToAltNode`, logique principale | 100-400 | `index.ts` |
| Handlers par type de node | 400-1000 | `node-handlers.ts` |
| Extraction de styles (fills, strokes, effects) | 1000-1400 | `style-extraction.ts` |
| Utilitaires restants | 1400-1475 | `index.ts` |

### Validation

```bash
npm run golden:verify
git commit -m "refactor: split altnode-transform.ts"
```

### Checklist 2.4

- [ ] `style-extraction.ts` créé (~400 lignes)
- [ ] `node-handlers.ts` créé (~600 lignes)
- [ ] `index.ts` créé (~400 lignes)
- [ ] Ancien fichier supprimé
- [ ] Golden tests passent

---

## 2.5 (Optionnel) Évaluer les fichiers 600-700 lignes

Ces fichiers sont borderline. Évaluer si un split apporte de la valeur :

| Fichier | Lignes | Recommandation |
|---------|--------|----------------|
| `rule-engine.ts` | 683 | Probablement OK, une responsabilité claire |
| `tailwind-to-css.ts` | 658 | Pourrait split V3/V4 si besoin |
| `merge-engine.ts` | 646 | Probablement OK, orchestration |

**Action** : Ne pas splitter sauf si la maintenabilité pose problème.

---

## Validation Finale Phase 2

```bash
npm run golden:verify  # MUST PASS
npm run lint
npm run build
```

### Checklist Finale

- [ ] `react-tailwind/` (3 fichiers, ~1200 lignes total)
- [ ] `helpers/` (3 fichiers, ~1150 lignes total)
- [ ] `alt-nodes/` (3 fichiers, ~1000 lignes total)
- [ ] `altnode-transform/` (3 fichiers, ~1400 lignes total)
- [ ] Aucun fichier > 600 lignes
- [ ] Golden tests passent
- [ ] Build réussit

---

## Prochaine Phase

→ `docs/phases/phase-3-pages-ui.md`
