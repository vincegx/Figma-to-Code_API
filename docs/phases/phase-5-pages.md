# Phase 5 : Pages React (Extraction)

> **Statut** : À faire
> **Risque** : Élevé
> **Durée estimée** : 6h
> **Prérequis** : Phases 1-4 terminées

---

## ⚠️ ATTENTION - Phase la plus risquée

Procéder **page par page** avec :
1. `npm test` AVANT modification
2. Extraire UN composant/hook à la fois
3. `npm test` APRÈS chaque extraction
4. Commit APRÈS chaque extraction réussie
5. `npm run build` en fin de page

---

## Règles de Refactoring - Rappel

- ✅ **Extract > rewrite** : Copier le code existant, ne pas réécrire
- ✅ **One change at a time** : 1 composant = 1 commit
- ✅ **Early returns** : Simplifier les conditions imbriquées
- ✅ **Max 3 params** : Props complexes → interface dédiée
- ✅ **Booleans** : `isLoading`, `hasError`, `canSubmit`
- ✅ **Preserve behavior** : Aucune modification de logique

---

## Objectif

Réduire chaque page à ~200 lignes max en extrayant :
- Sous-composants dans `_components/`
- Hooks locaux dans `_hooks/`

---

## 5.1 Refactorer `viewer/[nodeId]/page.tsx` (1296 → ~200 lignes)

### Structure cible

```
app/viewer/[nodeId]/
├── page.tsx                     # ~200 lignes (orchestration)
├── _components/
│   ├── ViewerHeader.tsx         # ~140 lignes
│   ├── CanvasPreview.tsx        # ~170 lignes
│   ├── CodePanel.tsx            # ~160 lignes
│   ├── InfoPanel.tsx            # ~100 lignes
│   └── DetailsSection.tsx       # ~110 lignes
└── _hooks/
    ├── useViewerState.ts        # ~80 lignes
    └── useCodeGeneration.ts     # ~70 lignes
```

### 5.1.1 Créer `_hooks/useViewerState.ts`

Consolider les 16 useState (lignes 200-251) :

```typescript
// app/viewer/[nodeId]/_hooks/useViewerState.ts

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ViewerState {
  // Framework & language
  previewFramework: string;
  previewLanguage: string;
  setPreviewFramework: (v: string) => void;
  setPreviewLanguage: (v: string) => void;

  // Selection
  selectedTreeNodeId: string | null;
  setSelectedTreeNodeId: (v: string | null) => void;

  // Code
  generatedCode: string;
  displayCode: string;
  displayCss: string;
  codeActiveTab: 'component' | 'styles';
  setGeneratedCode: (v: string) => void;
  setDisplayCode: (v: string) => void;
  setDisplayCss: (v: string) => void;
  setCodeActiveTab: (v: 'component' | 'styles') => void;

  // UI state
  copiedCode: boolean;
  copiedClasses: boolean;
  copiedRawData: boolean;
  setCopiedCode: (v: boolean) => void;
  setCopiedClasses: (v: boolean) => void;
  setCopiedRawData: (v: boolean) => void;

  // Data limits
  rawDataLimit: number;
  setRawDataLimit: (v: number) => void;

  // Props
  withProps: boolean;
  setWithProps: (v: boolean) => void;

  // Dialogs
  refetchDialogOpen: boolean;
  setRefetchDialogOpen: (v: boolean) => void;
}

export function useViewerState(): ViewerState {
  // Framework from localStorage
  const [previewFramework, setPreviewFramework] = useLocalStorage(
    'viewer-framework',
    'react-tailwind'
  );
  const [previewLanguage, setPreviewLanguage] = useLocalStorage(
    'viewer-language',
    'tsx'
  );

  // Selection
  const [selectedTreeNodeId, setSelectedTreeNodeId] = useState<string | null>(null);

  // Code
  const [generatedCode, setGeneratedCode] = useState('');
  const [displayCode, setDisplayCode] = useState('');
  const [displayCss, setDisplayCss] = useState('');
  const [codeActiveTab, setCodeActiveTab] = useState<'component' | 'styles'>('component');

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedClasses, setCopiedClasses] = useState(false);
  const [copiedRawData, setCopiedRawData] = useState(false);

  // Data
  const [rawDataLimit, setRawDataLimit] = useState(2000);
  const [withProps, setWithProps] = useState(false);
  const [refetchDialogOpen, setRefetchDialogOpen] = useState(false);

  return {
    previewFramework,
    previewLanguage,
    setPreviewFramework,
    setPreviewLanguage,
    selectedTreeNodeId,
    setSelectedTreeNodeId,
    generatedCode,
    displayCode,
    displayCss,
    codeActiveTab,
    setGeneratedCode,
    setDisplayCode,
    setDisplayCss,
    setCodeActiveTab,
    copiedCode,
    copiedClasses,
    copiedRawData,
    setCopiedCode,
    setCopiedClasses,
    setCopiedRawData,
    rawDataLimit,
    setRawDataLimit,
    withProps,
    setWithProps,
    refetchDialogOpen,
    setRefetchDialogOpen,
  };
}
```

### 5.1.2 Créer `_hooks/useCodeGeneration.ts`

Extraire lignes 416-485 :

```typescript
// app/viewer/[nodeId]/_hooks/useCodeGeneration.ts

import { useEffect, useCallback } from 'react';
import { generateReactTailwind } from '@/lib/code-generators/react-tailwind';
import { generateHTMLCSS } from '@/lib/code-generators/html-css';
import { generateHTMLTailwind } from '@/lib/code-generators/html-tailwind-css';

interface UseCodeGenerationProps {
  altNode: AltNode | null;
  targetNode: AltNode | null;
  targetProps: ResolvedProperties;
  multiFrameworkRules: Rule[];
  previewFramework: string;
  nodeId: string;
  withProps: boolean;
  onCodeGenerated: (code: string) => void;
  onDisplayCodeGenerated: (code: string, css: string) => void;
}

export function useCodeGeneration({
  altNode,
  targetNode,
  targetProps,
  multiFrameworkRules,
  previewFramework,
  nodeId,
  withProps,
  onCodeGenerated,
  onDisplayCodeGenerated,
}: UseCodeGenerationProps) {
  // Generate root code
  const generateRootCode = useCallback(async () => {
    if (!altNode) return;

    let code = '';
    switch (previewFramework) {
      case 'react-tailwind':
        code = await generateReactTailwind(altNode, /* ... */);
        break;
      case 'html-css':
        code = generateHTMLCSS(altNode, /* ... */);
        break;
      case 'html-tailwind':
        code = generateHTMLTailwind(altNode, /* ... */);
        break;
    }
    onCodeGenerated(code);
  }, [altNode, previewFramework, nodeId, withProps, onCodeGenerated]);

  // Generate display code (for selected node)
  const generateDisplayCode = useCallback(async () => {
    if (!targetNode) return;

    let code = '';
    let css = '';
    // ... similar logic
    onDisplayCodeGenerated(code, css);
  }, [targetNode, targetProps, previewFramework, nodeId, onDisplayCodeGenerated]);

  useEffect(() => {
    generateRootCode();
  }, [generateRootCode]);

  useEffect(() => {
    generateDisplayCode();
  }, [generateDisplayCode]);

  return {
    regenerate: generateRootCode,
    regenerateDisplay: generateDisplayCode,
  };
}
```

### 5.1.3 Créer `_components/ViewerHeader.tsx`

Extraire lignes 595-733 :

```typescript
// app/viewer/[nodeId]/_components/ViewerHeader.tsx

'use client';

import { Button } from '@/components/ui/button';
import { DeviceSelector } from '@/components/shared/DeviceSelector';
// ... autres imports

interface ViewerHeaderProps {
  nodeData: NodeData;
  altNode: AltNode | null;
  previewFramework: string;
  onFrameworkChange: (v: string) => void;
  onRefetchClick: () => void;
  // ... autres props
}

export function ViewerHeader({
  nodeData,
  altNode,
  previewFramework,
  onFrameworkChange,
  onRefetchClick,
  // ...
}: ViewerHeaderProps) {
  // Lignes 595-733
  return (
    <header className="...">
      {/* ... */}
    </header>
  );
}
```

### 5.1.4 Créer `_components/CanvasPreview.tsx`

Extraire lignes 736-909 :

```typescript
// app/viewer/[nodeId]/_components/CanvasPreview.tsx

interface CanvasPreviewProps {
  nodeData: NodeData;
  previewBreakpoint: BreakpointKey;
  onBreakpointChange: (v: BreakpointKey) => void;
  // ...
}

export function CanvasPreview({ /* ... */ }: CanvasPreviewProps) {
  // Lignes 736-909
}
```

### 5.1.5 Créer autres composants

- `_components/CodePanel.tsx` - Lignes 912-1075
- `_components/InfoPanel.tsx` - Section informations
- `_components/DetailsSection.tsx` - Lignes 1077-1184

### 5.1.6 Simplifier `page.tsx`

```typescript
// app/viewer/[nodeId]/page.tsx

'use client';

import { useViewerState } from './_hooks/useViewerState';
import { useCodeGeneration } from './_hooks/useCodeGeneration';
import { ViewerHeader } from './_components/ViewerHeader';
import { CanvasPreview } from './_components/CanvasPreview';
import { CodePanel } from './_components/CodePanel';
import { InfoPanel } from './_components/InfoPanel';
import { DetailsSection } from './_components/DetailsSection';

export default function ViewerPage({ params }: { params: { nodeId: string } }) {
  const state = useViewerState();
  const { nodeData, altNode, isLoading } = useFetchNodeData(params.nodeId);

  useCodeGeneration({
    altNode,
    // ... autres props
  });

  if (isLoading) return <PageLoading />;

  return (
    <div className="flex flex-col h-full">
      <ViewerHeader {...} />
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        <CanvasPreview {...} />
        <CodePanel {...} />
      </div>
      <DetailsSection {...} />
    </div>
  );
}
```

### Checklist 5.1

- [ ] Créer `_hooks/useViewerState.ts`
- [ ] Créer `_hooks/useCodeGeneration.ts`
- [ ] Créer `_components/ViewerHeader.tsx`
- [ ] Créer `_components/CanvasPreview.tsx`
- [ ] Créer `_components/CodePanel.tsx`
- [ ] Créer `_components/InfoPanel.tsx`
- [ ] Créer `_components/DetailsSection.tsx`
- [ ] Simplifier `page.tsx`
- [ ] Tests
- [ ] Commit

---

## 5.2 Refactorer `merge/[id]/page.tsx` (1218 → ~200 lignes)

### Structure cible

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

### Principaux extractions

| Composant | Lignes source | Description |
|-----------|---------------|-------------|
| `MergeHeader.tsx` | ~100-200 | Header avec navigation, actions |
| `CanvasPreviewBlock.tsx` | 708-781 | Preview avec device selector |
| `CodeDisplayBlock.tsx` | 826-940 | Code + CSS avec tabs |
| `NodeInfoPanel.tsx` | 995-1135 | Info nœud sélectionné |
| `FullscreenModal.tsx` | 1137-1215 | Modal plein écran (DUPLIQUÉ!) |

### Points d'attention

1. **FullscreenModal** duplique CanvasPreviewBlock → réutiliser avec prop `isFullscreen`
2. **Download logic** dupliquée 2x → utiliser `lib/utils/download.ts`
3. **Device selector** dupliqué 2x → utiliser `DeviceSelector` partagé

### Checklist 5.2

- [ ] Créer `_hooks/useMergeData.ts`
- [ ] Créer `_hooks/useCodeDisplay.ts`
- [ ] Créer `_components/MergeHeader.tsx`
- [ ] Créer `_components/CanvasPreviewBlock.tsx` (avec prop `isFullscreen`)
- [ ] Créer `_components/CodeDisplayBlock.tsx`
- [ ] Créer `_components/NodeInfoPanel.tsx`
- [ ] Supprimer duplication FullscreenModal
- [ ] Simplifier `page.tsx`
- [ ] Tests
- [ ] Commit

---

## 5.3 Refactorer `merges/page.tsx` (674 → ~200 lignes)

### Structure cible

```
app/merges/
├── page.tsx
├── _components/
│   ├── MergesControlBar.tsx     # Filtres, recherche, tri
│   ├── MergeGridView.tsx        # Vue grille
│   └── MergeListView.tsx        # Vue liste
└── _hooks/
    └── useMergesFilters.ts      # Filtrage + pagination
```

### Checklist 5.3

- [ ] Créer `_hooks/useMergesFilters.ts`
- [ ] Créer `_components/MergesControlBar.tsx`
- [ ] Créer `_components/MergeGridView.tsx`
- [ ] Créer `_components/MergeListView.tsx`
- [ ] Simplifier `page.tsx`
- [ ] Tests
- [ ] Commit

---

## 5.4 Refactorer `rules/page.tsx` (716 → ~200 lignes)

### Structure cible

```
app/rules/
├── page.tsx
├── _components/
│   ├── RulesSidebar.tsx         # Liste + filtres
│   ├── RuleCard.tsx             # Carte individuelle
│   ├── RuleDetailPanel.tsx      # Panneau détail
│   └── CategoryDropdown.tsx     # Dropdown catégorie
└── _hooks/
    ├── useRulesData.ts          # Chargement règles
    └── useRulesFilters.ts       # Filtrage
```

### Points d'attention

1. **2 dropdowns identiques** (catégorie + framework) → utiliser `useDropdownState`
2. **Logique filtrage** (lignes 151-182) → extraire dans hook

### Checklist 5.4

- [ ] Créer `_hooks/useRulesData.ts`
- [ ] Créer `_hooks/useRulesFilters.ts`
- [ ] Créer `_components/RulesSidebar.tsx`
- [ ] Créer `_components/RuleCard.tsx`
- [ ] Créer `_components/RuleDetailPanel.tsx`
- [ ] Créer `_components/CategoryDropdown.tsx`
- [ ] Simplifier `page.tsx`
- [ ] Tests
- [ ] Commit

---

## 5.5 Pages mineures (optionnel)

### `nodes/page.tsx` (514 lignes)

Structure similaire si temps disponible.

### `settings/page.tsx` (519 lignes)

Moins prioritaire car moins complexe.

---

## Validation Finale Phase 5

### Commandes

```bash
npm test
npm run lint
npm run build
npm run dev  # Test manuel complet de chaque page
```

### Checklist finale

- [ ] Tous les tests passent
- [ ] Build réussit
- [ ] Viewer page fonctionne
- [ ] Merge page fonctionne
- [ ] Merges list fonctionne
- [ ] Rules page fonctionne
- [ ] Aucune page > 300 lignes

### Commit final

```bash
git add app/
git commit -m "refactor: extract page components and hooks (Phase 5)"
```

---

## Prochaine Phase

→ `docs/phases/phase-6-cleanup.md`
