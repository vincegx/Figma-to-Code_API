# Move Map - Refactoring Guide

> **RÈGLE ABSOLUE** : MOVE = copier VERBATIM, jamais réécrire
> **Version** : 2.0
> **Date** : 2025-12-08

## Phases de Refactoring

| Phase | Fichier | Description |
|-------|---------|-------------|
| 1 | `phase-1-fondations.md` | Constantes, doublons, cleanup |
| 2 | `phase-2-core-lib.md` | Split react-tailwind, helpers, merge, altnode-transform |
| 3 | `phase-3-pages-ui.md` | Split viewer, merge, rules, merges pages |
| 4 | `phase-4-validation.md` | Tests, vérification, commit final |

---

## 1. Inventaire des Fixes Critiques

Ces fixes sont annotés dans le code et DOIVENT être préservés mot pour mot.

### react-tailwind.ts (1562 lignes)

| Fix ID | Lignes | Description | Risque si supprimé |
|--------|--------|-------------|-------------------|
| **WP08** | 12-56 | `smartSplitTailwindClasses()` - Préserve les valeurs arbitraires avec espaces dans les brackets | Classes CSS cassées |
| **WP47** | 67-222 | `collectProps()`, `generatePropsInterface()`, `createPropLookup()` - Props dynamiques | Export props cassé |
| **WP31** | 227-262 | `extractFonts()`, `generateGoogleFontsUrl()` - Extraction fonts | Fonts manquantes |
| **WP32** | 264-347 | SVG handling - `SvgExportInfo`, `generateSvgVarName()`, `fillDataToGradientCSS()`, `fillDataToColorCSS()` | SVG cassés |
| **WP25** | 386-506 | `deduplicateTailwindClasses()` - Déduplication 3-pass avec tracking | Classes dupliquées/conflits |
| **WP25** | 508-551 | `removeDefaultFlexProperties()` - Supprime les défauts redondants | Classes inutiles |
| **WP38** | 561-651 | `normalizeArbitraryValues()` - **gap-18 removed ligne 588** | gap-18 invalide en V3 |
| **WP25** | 662-833 | `consolidateSemanticSpacing()` - Consolidation pl+pr→px | Padding non consolidé |
| **WP38** | 619-623 | w-/h- jamais arrondis (dans `normalizeArbitraryValues`) | Dimensions cassées |

### helpers.ts (1222 lignes)

| Fix ID | Lignes | Description | Risque si supprimé |
|--------|--------|-------------|-------------------|
| **WP08** | 233-239 | `border-[color:var(...)]` syntax pour CSS variables | Border colors cassées |
| **WP31** | 196-199 | Padding individuel force arbitrary values | Padding incorrect |
| **WP31** | 204-211 | Gap skip négatif (handled by margin) | Gap invalide |
| **WP38** | 219-246 | Border decimal strokeWeight + variable handling | Borders cassées |
| **WP31** | 287-293 | Border-radius CSS variables | Radius variables cassé |
| **WP25** | 296-308 | Border-radius decimal matching | Radius arrondi incorrect |
| **WP31** | 331-336 | translateX/translateY pour CENTER constraints | Positionnement cassé |
| **WP08** | 614-654 | Border colors avec `color:` prefix obligatoire | Couleurs border cassées |
| **DOUBLON** | 524-535 vs 688-699 | Position properties (à supprimer 688-699) | ✅ SAFE DELETE |

### merge-simple-alt-nodes.ts (1038 lignes)

| Fix ID | Lignes | Description | Risque si supprimé |
|--------|--------|-------------|-------------------|
| **TOLERANCE** | 185, 200 | `0.01` - Zero threshold | Valeurs ~0 mal détectées |
| **TOLERANCE** | 210 | `0.5` - Value equivalence | Floating point noise |
| **TOLERANCE** | 325 | `0.1` - Shorthand matching | Longhands pas supprimés |
| **SCORING** | 614 | `positionDiff * 10 + relativePosDiff * 100` | Matching enfants cassé |
| **SCORING** | 619 | `score -= 50` (name similarity bonus) | Noms similaires pas matchés |
| **SCORING** | 623 | `positionDiff <= 3 || relativePosDiff <= 0.2` | Fallback trop strict/laxe |

### tailwind-to-css.ts (658 lignes)

| Fix ID | Lignes | Description | Risque si supprimé |
|--------|--------|-------------|-------------------|
| **WP38** | 507-533 | Fallback border-[color] parsing | Border colors non compilées |
| **WP38** | 543-568 | CSS variable resolution | Variables non résolues |
| **V4** | 63-213 | `parseMediaQueries()` - Support V3 ET V4 nested | Media queries cassées |

### rule-engine.ts (683 lignes)

| Fix ID | Lignes | Description | Risque si supprimé |
|--------|--------|-------------|-------------------|
| **T176** | 93-105 | `originalType` pour type comparison (pas HTML type) | Rules matchent mauvais nodes |
| **T176** | 166-201 | Dynamic validation pour TOUTES les selector properties | Rules matchent TOUT |
| **WP25** | 474-479 | className concatenation au lieu de conflict | Classes perdues |
| **WP25** | 514-535 | `replacePlaceholders()` avec Math.round() | Valeurs décimales |

---

## 2. Move Map Détaillé

### Phase 1 : Constants

| Source | Lignes | Destination | Action |
|--------|--------|-------------|--------|
| `react-tailwind.ts` | 564-604 | `lib/constants/tailwind-scale.ts` | **MOVE** |
| `react-tailwind.ts` | 667-689 | ❌ | **DELETE** (doublon exact) |
| `helpers.ts` | 178-191 | `lib/constants/tailwind-scale.ts` | **MERGE** (vérifier identique) |
| `helpers.ts` | 299-308 | `lib/constants/tailwind-scale.ts` | **MERGE** (border-radius scale) |
| `helpers.ts` | 861-899 | `lib/constants/tailwind-scale.ts` | **MERGE** (size scale) |
| `merge-simple-alt-nodes.ts` | 37-68 | `lib/constants/css-defaults.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 73-109 | `lib/constants/css-normalization.ts` | **MOVE** |

### Phase 2 : react-tailwind/ Split

| Source | Lignes | Destination | Action |
|--------|--------|-------------|--------|
| `react-tailwind.ts` | 12-56 | `react-tailwind/class-utils.ts` | **MOVE** (WP08 smartSplit) |
| `react-tailwind.ts` | 67-222 | `react-tailwind/props-collector.ts` | **MOVE** (WP47 props) |
| `react-tailwind.ts` | 227-262 | `react-tailwind/font-extractor.ts` | **MOVE** (WP31 fonts) |
| `react-tailwind.ts` | 264-347 | `react-tailwind/svg-handlers.ts` | **MOVE** (WP32 SVG) |
| `react-tailwind.ts` | 349-373 | `react-tailwind/property-cleaner.ts` | **MOVE** |
| `react-tailwind.ts` | 386-833 | `react-tailwind/class-deduplication.ts` | **MOVE** (WP25 dedupe) |
| `react-tailwind.ts` | 858-1047 | `react-tailwind/index.ts` | **KEEP** (main export) |
| `react-tailwind.ts` | 1066-1505 | `react-tailwind/jsx-generator.ts` | **MOVE** |
| `react-tailwind.ts` | 1510-1562 | `react-tailwind/utils.ts` | **MOVE** |

### Phase 3 : helpers/ Split

| Source | Lignes | Destination | Action |
|--------|--------|-------------|--------|
| `helpers.ts` | 1-50 | `helpers/layer-name.ts` | **MOVE** |
| `helpers.ts` | 52-95 | `helpers/pascal-case.ts` | **MOVE** |
| `helpers.ts` | 109-814 | `helpers/css-to-tailwind.ts` | **MOVE** (cssPropToTailwind) |
| `helpers.ts` | 816-907 | `helpers/size-converter.ts` | **MOVE** |
| `helpers.ts` | 909-971 | `helpers/color-converter.ts` | **MOVE** |
| `helpers.ts` | 973-997 | `helpers/format.ts` | **MOVE** |
| `helpers.ts` | 999-1069 | `helpers/component-attrs.ts` | **MOVE** |
| `helpers.ts` | 1071-1163 | `helpers/scale-mode.ts` | **MOVE** |
| `helpers.ts` | 1165-1222 | `helpers/unique-props.ts` | **MOVE** |
| `helpers.ts` | 524-535 | ❌ | **KEEP** (première occurrence position) |
| `helpers.ts` | 688-699 | ❌ | **DELETE** (doublon position) |

### Phase 4 : merge/ Split

| Source | Lignes | Destination | Action |
|--------|--------|-------------|--------|
| `merge-simple-alt-nodes.ts` | 111-166 | `merge/style-helpers.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 168-333 | `merge/shorthand-parser.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 335-433 | `merge/style-diff.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 495-631 | `merge/child-matching.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 739-871 | `merge/merge-element.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 886-937 | `merge/class-split.ts` | **MOVE** |
| `merge-simple-alt-nodes.ts` | 939-1038 | `merge/unified-element.ts` | **MOVE** |

### Phase 5 : tailwind-to-css/ Split

| Source | Lignes | Destination | Action |
|--------|--------|-------------|--------|
| `tailwind-to-css.ts` | 22-53 | `tailwind-css/parser.ts` | **MOVE** |
| `tailwind-to-css.ts` | 55-261 | `tailwind-css/media-parser.ts` | **MOVE** |
| `tailwind-to-css.ts` | 290-411 | `tailwind-css/compiler.ts` | **MOVE** |
| `tailwind-to-css.ts` | 413-537 | `tailwind-css/class-merger.ts` | **MOVE** |
| `tailwind-to-css.ts` | 539-658 | `tailwind-css/css-generator.ts` | **MOVE** |

### Phase 6 : rule-engine (minimal)

> **Note** : rule-engine.ts est déjà bien structuré. Pas de split nécessaire.
> Juste extraire les constantes.

| Source | Lignes | Destination | Action |
|--------|--------|-------------|--------|
| `rule-engine.ts` | 321-335 | `lib/constants/major-properties.ts` | **MOVE** |

---

## 3. Vrais Doublons à Supprimer

Ces blocs sont des doublons EXACTS qui peuvent être supprimés en toute sécurité :

| Fichier | Lignes à supprimer | Raison |
|---------|-------------------|--------|
| `react-tailwind.ts` | 667-689 | Doublon de TAILWIND_SPACING_SCALE (564-604) |
| `helpers.ts` | 688-699 | Doublon de position properties (524-535) |

---

## 4. Validation

### Avant chaque MOVE

```bash
npm run golden:verify  # DOIT PASS
```

### Après chaque MOVE

```bash
npm run golden:verify  # DOIT PASS
git commit -m "refactor: move X to Y"
```

### Si FAIL

```bash
git checkout -- .  # Annuler
# Analyser la diff
# Recommencer autrement
```

---

## 5. Ordre d'Exécution

1. **Golden tests** : ✅ DONE (`npm run golden:verify`)
2. **Phase 1** : Fondations (constantes, doublons, cleanup)
3. **Phase 2** : Core lib/ (split 4 gros fichiers)
4. **Phase 3** : Pages UI (split viewer, merge, rules, merges)
5. **Phase 4** : Validation finale

---

## 6. Checklist par Phase

### Phase 1 : Fondations
- [ ] Créer `lib/constants/tailwind-scale.ts`
- [ ] Créer `lib/constants/breakpoints.ts`
- [ ] Créer `lib/constants/merge-scoring.ts`
- [ ] Supprimer doublon react-tailwind.ts:667-689
- [ ] Supprimer doublon helpers.ts:688-699
- [ ] Cleanup code mort
- [ ] Golden test PASS
- [ ] Commit

### Phase 2 : Core lib/
- [ ] Split `react-tailwind.ts` → 3 fichiers (index, jsx-generator, class-processing)
- [ ] Split `helpers.ts` → 3 fichiers (index, spacing-layout, visual)
- [ ] Split `merge-simple-alt-nodes.ts` → 3 fichiers (index, matching, style-diff)
- [ ] Split `altnode-transform.ts` → 3 fichiers (index, node-handlers, style-extraction)
- [ ] Golden test PASS après CHAQUE split
- [ ] Commit après CHAQUE split

### Phase 3 : Pages UI
- [ ] Split `viewer/[nodeId]/page.tsx` → hooks + components
- [ ] Split `merge/[id]/page.tsx` → hooks + components
- [ ] Split `rules/page.tsx` → hooks + components
- [ ] Split `merges/page.tsx` → hooks + components
- [ ] Build PASS après chaque page
- [ ] Test manuel de chaque page

### Phase 4 : Validation
- [ ] `npm run golden:verify` PASS
- [ ] `npm run lint` PASS
- [ ] `npm run build` PASS
- [ ] Test manuel complet
- [ ] Commit final

---

## 7. Notes Importantes

### Ce qui NE DOIT PAS changer

1. **Tolerances** : 0.01, 0.5, 0.1 - exactement ces valeurs
2. **Scoring weights** : 10, 100, -50, 3, 0.2 - exactement ces valeurs
3. **gap-18** : doit rester supprimé (V3 doesn't have it)
4. **color: prefix** : obligatoire pour CSS variables dans border
5. **w-/h- never rounded** : les dimensions exactes sont critiques

### Commentaires à préserver

Tous les commentaires qui commencent par :
- `// WP` (workaround)
- `// T` suivi de numéro (ticket/fix)
- `// FIX:` ou `// CRITICAL:`
- `// Note:` avec explication technique
