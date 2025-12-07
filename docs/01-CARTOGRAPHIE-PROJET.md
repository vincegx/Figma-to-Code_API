# Cartographie Complète du Projet

> Généré le 2025-12-07 | figma-rules-builder

## Vue d'ensemble

| Métrique | Valeur |
|----------|--------|
| **Lignes totales** | ~47,400 |
| **Fichiers TS/TSX** | ~120 |
| **Fichiers > 500 lignes** | 15 |
| **Fichiers > 1000 lignes** | 6 |

---

## Structure Racine

```
figma-rules-builder/
├── app/                    # Next.js App Router (pages + API)
├── components/             # Composants React
├── hooks/                  # Hooks React partagés
├── lib/                    # Logique métier
├── figma-data/             # 📦 DONNÉES - Imports Figma
├── merges/                 # 📦 DONNÉES - Fichiers merge
├── __tests__/              # Tests (unit, integration, e2e)
├── scripts/                # Scripts utilitaires Python/JS
├── public/                 # Assets statiques
└── (config files)          # package.json, tsconfig, etc.
```

---

## 1. APP - Pages & API Routes

### Pages (app/)

| Fichier | Lignes | Description | État |
|---------|--------|-------------|------|
| `page.tsx` | 469 | Dashboard principal | ⚠️ À découper |
| `viewer/[nodeId]/page.tsx` | 1296 | Viewer d'un node importé | 🔴 Critique |
| `merge/[id]/page.tsx` | 1218 | Détail d'un merge | 🔴 Critique |
| `merges/page.tsx` | 674 | Liste des merges | ⚠️ À découper |
| `rules/page.tsx` | 716 | Gestion des règles | ⚠️ À découper |
| `nodes/page.tsx` | 514 | Liste des nodes importés | ⚠️ À découper |
| `settings/page.tsx` | 519 | Paramètres | ⚠️ À découper |

### API Routes (app/api/)

```
api/
├── figma/                      # API Figma
│   ├── import/route.ts         # POST - Import depuis Figma
│   ├── library/route.ts        # Bibliothèque des imports
│   ├── stream/route.ts         # Streaming import (SSE)
│   ├── test-connection/        # Test connexion API
│   └── node/[id]/
│       ├── route.ts            # GET/DELETE node
│       ├── versions/route.ts   # Liste versions
│       └── version/[folder]/route.ts
│
├── merges/                     # API Merges
│   ├── route.ts                # GET/POST liste merges
│   └── [id]/
│       ├── route.ts            # GET/PUT/DELETE merge
│       ├── export/route.ts     # Export code généré
│       └── node/[nodeId]/route.ts
│
├── rules/                      # API Rules
│   ├── route.ts                # GET rules
│   └── custom/
│       ├── route.ts            # POST custom rule
│       └── [id]/route.ts       # PUT/DELETE
│
├── export/[nodeId]/route.ts    # Export node
├── generate-tailwind-css/route.ts
├── images/[nodeId]/[filename]/route.ts
├── library/stats/route.ts
├── quota/route.ts
├── stats-history/route.ts
├── transpile/route.ts
└── variables/route.ts
```

---

## 2. COMPONENTS - Composants React

### Structure

```
components/
├── ui/                     # shadcn/ui (32 fichiers) - NE PAS TOUCHER
├── merge/                  # Domaine merge (7 fichiers)
├── library/                # Domaine bibliothèque
├── quota/                  # Domaine quota API
└── (54 fichiers racine)    # Composants divers
```

### Composants Critiques (> 400 lignes)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `merge/merge-creation-modal.tsx` | 499 | Modal création merge |
| `refetch-dialog.tsx` | 524 | Dialog re-sync Figma |
| `transformer-editor.tsx` | 650 | Éditeur de transformers |
| `custom-rule-modal.tsx` | 424 | Modal règle custom |
| `live-preview.tsx` | 463 | Preview live du code |
| `generated-code-section.tsx` | 400 | Section code généré |

### Dossier merge/

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `merge-card.tsx` | 135 | Carte dans la liste |
| `merge-creation-modal.tsx` | 499 | Modal création |
| `merge-preview.tsx` | 120 | Preview du merge |
| `merge-export-panel.tsx` | 130 | Panel export |
| `breakpoint-toggle.tsx` | 75 | Toggle Mobile/Tablet/Desktop |
| `delete-merge-dialog.tsx` | 60 | Confirmation suppression |
| `index.ts` | - | Exports |

---

## 3. HOOKS - Hooks React

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `use-figma-progress.ts` | 330 | Progress import Figma |
| `use-refetch.ts` | 180 | Re-sync Figma |
| `use-health-score.ts` | 160 | Score de santé |
| `use-import-progress.ts` | 135 | Progress import |
| `use-conversion-rate.ts` | 120 | Taux conversion |
| `use-aggregated-stats.ts` | 100 | Stats agrégées |
| `use-stats-history.ts` | 95 | Historique stats |
| `use-rule-matches.ts` | 75 | Matching rules |
| `use-toast.ts` | 110 | Notifications toast |
| `use-api-quota.ts` | 35 | Quota API |
| `use-library-stats.ts` | 25 | Stats bibliothèque |
| `use-import-history.ts` | 45 | Historique imports |
| `use-weekly-trend.ts` | 50 | Tendance hebdo |
| `use-media-query.ts` | 25 | Media queries |
| `use-mobile.tsx` | 15 | Détection mobile |

---

## 4. LIB - Logique Métier

### Structure

```
lib/
├── code-generators/        # Génération de code
├── merge/                  # Logique fusion responsive
├── utils/                  # Utilitaires
├── types/                  # Types TypeScript
├── store/                  # Zustand stores
├── validation/             # Validation schemas
└── (fichiers racine)
```

### Fichiers Racine Critiques

| Fichier | Lignes | Description | État |
|---------|--------|-------------|------|
| `altnode-transform.ts` | 1475 | Transformation Figma → AltNode | 🔴 Critique |
| `rule-engine.ts` | 683 | Moteur d'évaluation des règles | ⚠️ À découper |
| `figma-client.ts` | 329 | Client API Figma | ✅ OK |

### code-generators/

| Fichier | Lignes | Description | État |
|---------|--------|-------------|------|
| `react-tailwind.ts` | 1562 | React + Tailwind | 🔴 Critique |
| `helpers.ts` | 1222 | Helpers CSS → Tailwind | 🔴 Critique |
| `html-css.ts` | 632 | HTML + CSS vanilla | ⚠️ À découper |
| `html-tailwind-css.ts` | 367 | HTML + Tailwind | ✅ OK |
| `react.ts` | 198 | React vanilla | ✅ OK |
| `react-tailwind-v4.ts` | 95 | React + Tailwind v4 | ✅ OK |
| `class-mapper.ts` | 100 | Mapping classes | ✅ OK |
| `class-mapper-v4.ts` | 230 | Mapping v4 | ✅ OK |

### merge/

| Fichier | Lignes | Description | État |
|---------|--------|-------------|------|
| `merge-engine.ts` | 646 | Moteur fusion principal | ⚠️ À découper |
| `merge-simple-alt-nodes.ts` | 1038 | Fusion des AltNodes | 🔴 Critique |
| `visibility-mapper.ts` | 165 | Mapping visibilité | ✅ OK |
| `index.ts` | 30 | Exports | ✅ OK |

### utils/

| Fichier | Lignes | Description | État |
|---------|--------|-------------|------|
| `tailwind-to-css.ts` | 658 | Compilation Tailwind → CSS | ⚠️ À découper |
| `file-storage.ts` | 496 | Stockage fichiers | ⚠️ À revoir |
| `library-index.ts` | 439 | Index bibliothèque | ✅ OK |
| `variable-extractor.ts` | 378 | Extraction variables | ✅ OK |
| `image-fetcher.ts` | 372 | Fetch images Figma | ✅ OK |
| `figma-diff.ts` | 320 | Diff entre versions | ✅ OK |
| `history-manager.ts` | 303 | Gestion historique | ✅ OK |
| `svg-converter.ts` | 155 | Conversion SVG | ✅ OK |
| `variables.ts` | 170 | Gestion variables | ✅ OK |
| `variable-css.ts` | 115 | Variables CSS | ✅ OK |
| `node-colors.ts` | 105 | Couleurs nodes | ✅ OK |
| `url-parser.ts` | 115 | Parsing URLs Figma | ✅ OK |
| `export-utils.ts` | 85 | Utils export | ✅ OK |
| `rule-conflict-detector.ts` | 90 | Détection conflits | ✅ OK |

### types/

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `index.ts` | 535 | Types principaux |
| `rules.ts` | 470 | Types règles |
| `merge.ts` | 423 | Types merge |
| `guards.ts` | 384 | Type guards |
| `library.ts` | 337 | Types bibliothèque |
| `stores.ts` | 320 | Types stores |
| `dashboard.ts` | 295 | Types dashboard |
| `altnode.ts` | 240 | Types AltNode |
| `figma.ts` | 210 | Types Figma |
| `code-generation.ts` | 215 | Types génération |
| `code-generator.ts` | 25 | Interface generator |
| `stats-history.ts` | 50 | Types stats |
| `versioning.ts` | 155 | Types versions |

### store/

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `ui-store.ts` | 210 | État UI global |
| `rules-store.ts` | 190 | État règles |
| `merge-store.ts` | 175 | État merges |
| `nodes-store.ts` | 130 | État nodes |
| `quota-store.ts` | 55 | État quota |
| `index.ts` | 35 | Exports |

---

## 5. FIGMA-DATA - Données Imports

### Structure

```
figma-data/
├── {nodeId}/                   # Un dossier par import
│   ├── data.json               # Arbre Figma complet (~150KB-4MB)
│   ├── metadata.json           # Métadonnées import
│   ├── variables.json          # Variables Figma extraites
│   ├── versions.json           # Historique versions
│   ├── screenshot.png          # Capture écran (~4MB)
│   ├── img/                    # Images extraites
│   ├── svg/                    # SVGs extraits
│   └── history/                # Historique modifications
│
├── rules/                      # Règles de transformation
│   ├── official-figma-rules.json   # 40KB - Règles officielles
│   ├── community-rules.json        # 34KB - Règles communauté
│   ├── custom-rules.json           # User custom rules
│   └── system-variables.json       # Variables système
│
├── api-quota.json              # Suivi quota API Figma
├── library-index.json          # Index de tous les imports
└── stats-history.json          # Statistiques d'utilisation
```

### Nodes Importés Actuels

| Node ID | Description |
|---------|-------------|
| `367-1346` | - |
| `425-2086` | - |
| `425-2146` | - |
| `425-2237` | - |
| `425-4344` | - |
| `425-4777` | - |
| `465-14116` | - |
| `465-16388` | - |
| `493-2811` | - |
| `509-2821` | - |
| `2465-308511` | - |
| `2540-377150` | - |
| `6055-2436` | BGS Homepage - 1440px |
| `6055-2654` | BGS Homepage - 960px |
| `6055-2872` | - |

---

## 6. MERGES - Données Merges

### Structure

```
merges/
├── .gitkeep
└── {uuid}.json                 # ~1MB par merge
```

### Format d'un fichier merge

```json
{
  "id": "uuid",
  "name": "Test Responsive 420-960-1440",
  "status": "ready",
  "sourceNodes": [
    {
      "breakpoint": "desktop",
      "nodeId": "lib-6055-2436",
      "nodeName": "BGS Homepage - 1440px",
      "thumbnail": "/api/images/6055-2436/screenshot.png",
      "width": 1440,
      "snapshotAt": "2025-12-06T21:55:25.705Z"
    },
    {
      "breakpoint": "tablet",
      "nodeId": "lib-6055-2654",
      "nodeName": "BGS Homepage - 960px",
      "thumbnail": "...",
      "width": 960
    },
    {
      "breakpoint": "mobile",
      "nodeId": "...",
      "width": 420
    }
  ],
  "mergedResult": {
    // Résultat de la fusion responsive
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Merges Actuels

| UUID | Taille |
|------|--------|
| `27b9e371-...` | 1.0 MB |
| `5b5a568c-...` | 1.0 MB |
| `7ed6bede-...` | 1.0 MB |
| `829b4d06-...` | 1.0 MB |
| `8703aa84-...` | 1.0 MB |
| `930b816c-...` | 0.9 MB |
| `9ab05e04-...` | 0.9 MB |
| `a4d828ec-...` | 0.9 MB |
| `beebd22d-...` | 0.9 MB |
| `d695c23a-...` | 1.0 MB |
| `eb8a9307-...` | 1.0 MB |

---

## 7. TESTS

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── altnode-transform.test.ts     # 788 lignes
│   │   ├── rule-engine.test.ts           # 619 lignes
│   │   ├── code-generators.test.ts       # 499 lignes
│   │   └── wp25-critical-fixes.test.ts   # 375 lignes
│   └── types/
│       └── integration.test.ts           # 621 lignes
│
├── integration/
│
├── performance/
│   ├── rule-engine-benchmark.test.ts     # 450 lignes
│   └── code-generators-benchmark.test.ts # 320 lignes
│
└── e2e/
```

---

## 8. SCRIPTS

| Fichier | Langage | Description |
|---------|---------|-------------|
| `add-missing-transformers.py` | Python | Ajoute transformers manquants |
| `deduplicate-rules.py` | Python | Déduplique les règles |
| `fix-arbitrary-props.py` | Python | Corrige props arbitraires |
| `remove-blendmode.py` | Python | Supprime blend modes |
| `export-node.ts` | TypeScript | Export d'un node |
| `copy-preview-assets.js` | JavaScript | Copie assets preview |
| `generate-tailwind-full.js` | JavaScript | Génère CSS Tailwind complet |

---

## 9. CONFIG FILES

| Fichier | Description |
|---------|-------------|
| `package.json` | Dépendances NPM |
| `package-lock.json` | Lock file (460KB) |
| `tsconfig.json` | Config TypeScript |
| `tailwind.config.ts` | Config Tailwind |
| `next.config.js` | Config Next.js |
| `vitest.config.ts` | Config Vitest |
| `playwright.config.ts` | Config Playwright |
| `postcss.config.mjs` | Config PostCSS |
| `.eslintrc.json` | Config ESLint |
| `.env.local` | Variables env |
| `components.json` | Config shadcn/ui |
| `mapping-rules.json` | Règles mapping |
| `lib/figma-transform-config.json` | Config transformation |

---

## Légende

| État | Description |
|------|-------------|
| 🔴 Critique | > 1000 lignes, refactoring urgent |
| ⚠️ À découper | 500-1000 lignes, refactoring recommandé |
| ✅ OK | < 500 lignes, acceptable |
