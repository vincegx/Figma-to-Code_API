# Phase 6 : Nettoyage Final

> **Statut** : À faire
> **Risque** : Faible
> **Durée estimée** : 1h
> **Prérequis** : Phases 1-5 terminées

---

## Objectif

Nettoyer le code restant :
- Supprimer imports inutilisés
- Supprimer code commenté
- Supprimer code dupliqué résiduel
- Mettre à jour les exports

---

## 6.1 Supprimer Imports Inutilisés

### Liste identifiée

| Fichier | Ligne | Import inutilisé |
|---------|-------|------------------|
| `lib/code-generators/react-tailwind.ts` | 2 | `toCamelCase` |
| `app/viewer/[nodeId]/page.tsx` | 46 | `RefetchButton` |
| `app/viewer/[nodeId]/page.tsx` | 56 | `Image` (next/image) |
| `app/viewer/[nodeId]/page.tsx` | 58 | `InformationPanel` |
| `lib/merge/merge-simple-alt-nodes.ts` | 15 | `FillData` |
| `lib/utils/tailwind-to-css.ts` | 328 | `readFileSync` (dead code) |

### Commande pour trouver d'autres

```bash
# Utiliser ESLint
npm run lint -- --rule 'no-unused-vars: error'

# Ou manuellement avec grep
grep -r "import.*from" lib/ app/ components/ | grep -v node_modules
```

### Checklist

- [ ] Supprimer `toCamelCase` de react-tailwind.ts
- [ ] Supprimer `RefetchButton` de viewer page
- [ ] Supprimer `Image` de viewer page
- [ ] Supprimer `InformationPanel` de viewer page
- [ ] Supprimer `FillData` de merge-simple-alt-nodes.ts
- [ ] Supprimer `readFileSync` de tailwind-to-css.ts
- [ ] Exécuter `npm run lint` pour trouver autres imports

---

## 6.2 Supprimer Code Commenté

### Liste identifiée

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `lib/code-generators/react-tailwind.ts` | 892 | `// console.log(...imageUrls...)` |
| `lib/code-generators/react-tailwind.ts` | 899 | `// console.log(...imageUrls...)` |
| `lib/code-generators/react-tailwind.ts` | 932 | `// console.log(...svgDataUrls...)` |
| `lib/code-generators/react-tailwind.ts` | 939 | `// console.log(...svgContent...)` |
| `lib/code-generators/react-tailwind.ts` | 1004 | `// console.log('[REACT-TAILWIND]...')` |
| `lib/code-generators/react-tailwind.ts` | 1006 | `// console.log('[REACT-TAILWIND]...')` |
| `lib/code-generators/react-tailwind.ts` | 1094 | `// console.log('🔍 SVG:...')` |
| `lib/rule-engine.ts` | 178-200 | Blocs DEBUG commentés |
| `lib/rule-engine.ts` | 401-407 | Blocs DEBUG commentés |
| `lib/rule-engine.ts` | 422-427 | Blocs DEBUG commentés |
| `lib/rule-engine.ts` | 465-493 | Blocs DEBUG commentés |
| `lib/altnode-transform.ts` | 694-703 | Bloc "empty container optimization" |
| `app/viewer/[nodeId]/page.tsx` | 65 | `// ResizablePanelGroup removed` |

### Commande pour trouver d'autres

```bash
# Chercher console.log commentés
grep -rn "// console\." lib/ app/ components/

# Chercher TODO abandonnés
grep -rn "// TODO" lib/ app/ components/

# Chercher code commenté
grep -rn "// if\|// const\|// return\|// function" lib/ app/ components/
```

### Checklist

- [ ] Supprimer console.log commentés dans react-tailwind.ts
- [ ] Supprimer blocs DEBUG dans rule-engine.ts
- [ ] Supprimer bloc commenté dans altnode-transform.ts
- [ ] Supprimer commentaire obsolète dans viewer page
- [ ] Vérifier autres occurrences avec grep

---

## 6.3 Supprimer Code Dupliqué Résiduel

### Vérifications

| À vérifier | Fichiers | Action |
|------------|----------|--------|
| Position properties | `helpers.ts` lignes 524-535 vs 688-699 | Supprimer doublon |
| gridTemplateColumns/Rows | `helpers.ts` lignes 129-136 vs 710-716 | Supprimer doublon |
| Tailwind spacing scale | `react-tailwind.ts` lignes 564-604 vs 667-689 | Vérifier après Phase 1 |

### Commande pour trouver duplications

```bash
# Utiliser jscpd (Copy/Paste Detector)
npx jscpd lib/ app/ components/ --min-lines 5 --min-tokens 50
```

### Checklist

- [ ] Vérifier que position properties n'est défini qu'une fois
- [ ] Vérifier que gridTemplate n'est défini qu'une fois
- [ ] Exécuter détecteur de duplication

---

## 6.4 Résoudre ou Supprimer TODOs

### Liste identifiée

| Fichier | Lignes | TODO |
|---------|--------|------|
| `lib/code-generators/helpers.ts` | 1079 | `// TODO WP26: Full implementation` |
| `lib/code-generators/helpers.ts` | 1095 | `// TODO WP27: Full implementation` |
| `lib/code-generators/helpers.ts` | 1111 | `// TODO WP28: Full implementation` |
| `lib/store/rules-store.ts` | 4, 61, 91, 160, 197 | 5x TODOs non résolus |

### Actions

1. **Si implémenté** : Supprimer le TODO
2. **Si non nécessaire** : Supprimer la fonction stub
3. **Si à faire** : Créer issue GitHub et mettre à jour le TODO

### Checklist

- [ ] Vérifier TODOs dans helpers.ts
- [ ] Vérifier TODOs dans rules-store.ts
- [ ] Créer issues si nécessaire

---

## 6.5 Mettre à Jour les Exports

### Vérifier les index.ts

```bash
# Lister tous les index.ts
find lib/ components/ hooks/ -name "index.ts"
```

### Fichiers à vérifier/créer

| Dossier | index.ts existe? | Action |
|---------|------------------|--------|
| `lib/constants/` | À créer en Phase 1 | Vérifier |
| `lib/code-generators/` | Probablement | Mettre à jour |
| `lib/code-generators/helpers/` | À créer en Phase 2 | Vérifier |
| `lib/code-generators/react-tailwind/` | À créer en Phase 2 | Vérifier |
| `lib/merge/` | Existe | Mettre à jour |
| `lib/merge/alt-nodes/` | À créer en Phase 2 | Vérifier |
| `lib/utils/` | Probablement | Mettre à jour |
| `lib/utils/tailwind-css/` | À créer en Phase 2 | Vérifier |
| `components/shared/` | À créer en Phase 4 | Vérifier |
| `components/figma/` | À créer en Phase 4 | Vérifier |
| `components/rules/` | À créer en Phase 4 | Vérifier |
| `components/dashboard/` | À créer en Phase 4 | Vérifier |
| `hooks/` | Probablement | Mettre à jour |

### Checklist

- [ ] Vérifier tous les index.ts après refactoring
- [ ] Ajouter exports manquants
- [ ] Supprimer exports obsolètes

---

## 6.6 Vérifier Nommage

### Booleans sans préfixe is/has/can/should

| Fichier | Variable | Correction |
|---------|----------|------------|
| `app/viewer/[nodeId]/page.tsx` | `copiedCode` | → `isCopiedCode` |
| `app/viewer/[nodeId]/page.tsx` | `copiedClasses` | → `isCopiedClasses` |
| `app/viewer/[nodeId]/page.tsx` | `copiedRawData` | → `isCopiedRawData` |
| `app/viewer/[nodeId]/page.tsx` | `withProps` | → `shouldIncludeProps` |
| `app/viewer/[nodeId]/page.tsx` | `refetchDialogOpen` | → `isRefetchDialogOpen` |
| `app/merge/[id]/page.tsx` | `copiedCode` | → `isCopiedCode` |
| `lib/code-generators/react-tailwind.ts` | `specificClasses.paddingTop` | → `hasPaddingTop` |

### Checklist

- [ ] Renommer booleans dans viewer page
- [ ] Renommer booleans dans merge page
- [ ] Renommer booleans dans react-tailwind.ts

---

## 6.7 Optimiser les Imports

### Grouper les imports

```typescript
// AVANT
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// APRÈS
import { Button, Input, Card, Label } from '@/components/ui';
```

### Ordre des imports

1. React / Next.js
2. Libraries externes
3. `@/lib/...`
4. `@/components/...`
5. `@/hooks/...`
6. Imports relatifs (`./`, `../`)

### Checklist

- [ ] Grouper imports UI dans les pages principales
- [ ] Vérifier ordre des imports

---

## 6.8 Vérification Finale

### Commandes

```bash
# Lint complet
npm run lint

# Type check
npm run type-check  # ou npx tsc --noEmit

# Tests
npm test

# Build
npm run build

# Test manuel
npm run dev
```

### Checklist de validation

- [ ] `npm run lint` passe sans erreur
- [ ] `npm run type-check` passe
- [ ] `npm test` passe
- [ ] `npm run build` réussit
- [ ] Application fonctionne (test manuel de chaque page)

---

## 6.9 Documentation

### Mettre à jour README si nécessaire

- [ ] Documenter nouvelle structure de dossiers
- [ ] Documenter conventions utilisées

### Archiver les docs de refactoring

```bash
# Optionnel : déplacer les docs de phase après completion
mkdir -p docs/refactoring-archive
mv docs/phases/* docs/refactoring-archive/
```

---

## Validation Finale Phase 6

### Commit

```bash
git add .
git commit -m "refactor: cleanup dead code and unused imports (Phase 6)"
```

### Résumé du refactoring complet

| Métrique | Avant | Après |
|----------|-------|-------|
| Fichiers > 1000 lignes | 6 | 0 |
| Fichiers > 500 lignes | 15 | ~5 |
| Magic values | ~50 | 0 |
| Code dupliqué | ~30 occurrences | 0 |
| Imports inutilisés | ~10 | 0 |
| Code commenté | ~20 blocs | 0 |

---

## REFACTORING TERMINÉ ! 🎉

Le codebase est maintenant :
- ✅ Modulaire (fichiers < 500 lignes)
- ✅ DRY (pas de duplication)
- ✅ Organisé par domaine
- ✅ Facile à maintenir
- ✅ Facile à tester
