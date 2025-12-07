# Phase 4 : Composants Partagés

> **Statut** : À faire
> **Risque** : Faible
> **Durée estimée** : 2h
> **Prérequis** : Phase 3 terminée

---

## Règles de Refactoring - Rappel

- ✅ **Tests before/after** : `npm test` après CHAQUE composant
- ✅ **One change at a time** : Commit après chaque composant déplacé/créé
- ✅ **DRY à 3+** : Extraire uniquement si utilisé 3+ fois
- ✅ **Props naming** : `onX` pour callbacks, `isX` pour booleans

---

## Objectif

Extraire et réorganiser les composants utilisés par 2+ pages :
- Créer `components/shared/` pour composants cross-pages
- Réorganiser `components/figma/` pour domaine import
- Réorganiser `components/rules/` pour domaine règles
- Réorganiser `components/dashboard/` pour dashboard

---

## 4.1 Créer `components/shared/DeviceSelector.tsx`

### Dupliqué dans

| Fichier | Lignes | Occurrences |
|---------|--------|-------------|
| `app/merge/[id]/page.tsx` | 709-729 | Buttons Mobile/Tablet/Desktop |
| `app/merge/[id]/page.tsx` | 1144-1164 | DOUBLON (fullscreen modal) |
| `app/viewer/[nodeId]/page.tsx` | 838-857 | Même pattern |
| `components/merge/breakpoint-toggle.tsx` | Tout | Composant existant similaire |

### Fichier à créer

```typescript
// components/shared/DeviceSelector.tsx

'use client';

import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BREAKPOINTS, type BreakpointKey } from '@/lib/constants';

interface DeviceSelectorProps {
  value: BreakpointKey;
  onChange: (breakpoint: BreakpointKey) => void;
  className?: string;
  size?: 'sm' | 'default';
  showLabels?: boolean;
  disabled?: boolean;
}

const DEVICE_CONFIG = {
  mobile: {
    icon: Smartphone,
    label: 'Mobile',
    shortLabel: 'M',
    width: BREAKPOINTS.mobile.width,
    height: BREAKPOINTS.mobile.height,
  },
  tablet: {
    icon: Tablet,
    label: 'Tablet',
    shortLabel: 'T',
    width: BREAKPOINTS.tablet.width,
    height: BREAKPOINTS.tablet.height,
  },
  desktop: {
    icon: Monitor,
    label: 'Desktop',
    shortLabel: 'D',
    width: BREAKPOINTS.desktop.width,
  },
} as const;

export function DeviceSelector({
  value,
  onChange,
  className,
  size = 'default',
  showLabels = false,
  disabled = false,
}: DeviceSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {(Object.keys(DEVICE_CONFIG) as BreakpointKey[]).map((breakpoint) => {
        const config = DEVICE_CONFIG[breakpoint];
        const Icon = config.icon;
        const isActive = value === breakpoint;

        return (
          <Button
            key={breakpoint}
            variant={isActive ? 'default' : 'outline'}
            size={size === 'sm' ? 'sm' : 'default'}
            onClick={() => onChange(breakpoint)}
            disabled={disabled}
            className={cn(
              'transition-colors',
              isActive && 'bg-primary text-primary-foreground'
            )}
            title={`${config.label} (${config.width}px)`}
          >
            <Icon className={cn('h-4 w-4', showLabels && 'mr-1')} />
            {showLabels && <span>{config.label}</span>}
          </Button>
        );
      })}
    </div>
  );
}

// Export pour usage direct
export { DEVICE_CONFIG };
```

### Fichiers à modifier

- [ ] `app/merge/[id]/page.tsx` - remplacer 2 occurrences
- [ ] `app/viewer/[nodeId]/page.tsx` - remplacer occurrence
- [ ] Supprimer `components/merge/breakpoint-toggle.tsx` si redondant

### Checklist

- [ ] Créer `components/shared/DeviceSelector.tsx`
- [ ] Modifier pages pour utiliser le composant
- [ ] Vérifier que `breakpoint-toggle.tsx` est toujours nécessaire

---

## 4.2 Créer `components/shared/BreakpointIcon.tsx`

### Dupliqué dans

| Fichier | Usage |
|---------|-------|
| `app/merges/page.tsx` | Icon selon breakpoint dans liste |
| `app/merge/[id]/page.tsx` | Icon dans header |

### Fichier à créer

```typescript
// components/shared/BreakpointIcon.tsx

import { Smartphone, Tablet, Monitor, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreakpointKey } from '@/lib/constants';

interface BreakpointIconProps {
  breakpoint: BreakpointKey;
  className?: string;
  size?: number;
}

const BREAKPOINT_ICONS: Record<BreakpointKey, LucideIcon> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

export function BreakpointIcon({
  breakpoint,
  className,
  size = 16,
}: BreakpointIconProps) {
  const Icon = BREAKPOINT_ICONS[breakpoint];
  return <Icon className={cn('inline-block', className)} size={size} />;
}
```

### Checklist

- [ ] Créer `components/shared/BreakpointIcon.tsx`
- [ ] Modifier `app/merges/page.tsx`
- [ ] Modifier `app/merge/[id]/page.tsx`

---

## 4.3 Créer `components/shared/EmptyState.tsx`

### Pattern répété

```typescript
// components/shared/EmptyState.tsx

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### Checklist

- [ ] Créer `components/shared/EmptyState.tsx`
- [ ] Utiliser dans `app/merges/page.tsx`
- [ ] Utiliser dans `app/nodes/page.tsx`
- [ ] Utiliser dans `app/rules/page.tsx`

---

## 4.4 Créer `components/shared/LoadingSpinner.tsx`

```typescript
// components/shared/LoadingSpinner.tsx

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
}

const SIZE_MAP = {
  sm: 'h-4 w-4',
  default: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({
  size = 'default',
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', SIZE_MAP[size])} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

export function PageLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
```

### Checklist

- [ ] Créer `components/shared/LoadingSpinner.tsx`
- [ ] Remplacer spinners inline dans les pages

---

## 4.5 Créer `components/shared/CodeHighlight.tsx`

### Dupliqué dans

| Fichier | Usage |
|---------|-------|
| `app/merge/[id]/page.tsx` | Highlight code généré |
| `app/viewer/[nodeId]/page.tsx` | Highlight code généré |

### Fichier à créer

```typescript
// components/shared/CodeHighlight.tsx

'use client';

import { useEffect, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/github-dark.css';

// Register languages
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);

interface CodeHighlightProps {
  code: string;
  language: 'typescript' | 'css' | 'html' | 'json';
  className?: string;
  maxHeight?: string;
  showLineNumbers?: boolean;
}

export function CodeHighlight({
  code,
  language,
  className,
  maxHeight = '500px',
  showLineNumbers = false,
}: CodeHighlightProps) {
  const [highlighted, setHighlighted] = useState('');

  useEffect(() => {
    if (code) {
      const lang = language === 'json' ? 'typescript' : language;
      const result = hljs.highlight(code, { language: lang });
      setHighlighted(result.value);
    }
  }, [code, language]);

  const lines = highlighted.split('\n');

  return (
    <div
      className={className}
      style={{ maxHeight, overflow: 'auto' }}
    >
      <pre className="p-4 text-sm">
        <code>
          {showLineNumbers ? (
            <table className="border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td className="pr-4 text-right text-muted-foreground select-none">
                      {i + 1}
                    </td>
                    <td dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} />
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: highlighted }} />
          )}
        </code>
      </pre>
    </div>
  );
}
```

### Checklist

- [ ] Créer `components/shared/CodeHighlight.tsx`
- [ ] Modifier `app/merge/[id]/page.tsx`
- [ ] Modifier `app/viewer/[nodeId]/page.tsx`

---

## 4.6 Créer `components/shared/ConfirmDialog.tsx`

```typescript
// components/shared/ConfirmDialog.tsx

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Checklist

- [ ] Créer `components/shared/ConfirmDialog.tsx`
- [ ] Utiliser pour remplacer delete dialogs similaires

---

## 4.7 Réorganiser `components/figma/`

### Déplacer les fichiers

```bash
# Créer le dossier
mkdir -p components/figma

# Déplacer
mv components/import-dialog.tsx components/figma/ImportDialog.tsx
mv components/import-progress.tsx components/figma/ImportProgress.tsx
mv components/import-logs.tsx components/figma/ImportLogs.tsx
mv components/refetch-button.tsx components/figma/RefetchButton.tsx
mv components/refetch-dialog.tsx components/figma/RefetchDialog.tsx
mv components/figma-tree-view.tsx components/figma/FigmaTreeView.tsx
mv components/figma-type-icon.tsx components/figma/FigmaTypeIcon.tsx
```

### Créer index.ts

```typescript
// components/figma/index.ts

export { ImportDialog } from './ImportDialog';
export { ImportProgress } from './ImportProgress';
export { ImportLogs } from './ImportLogs';
export { RefetchButton } from './RefetchButton';
export { RefetchDialog } from './RefetchDialog';
export { FigmaTreeView } from './FigmaTreeView';
export { FigmaTypeIcon } from './FigmaTypeIcon';
```

### Mettre à jour les imports

Rechercher et remplacer dans tous les fichiers :
- `@/components/import-dialog` → `@/components/figma`
- `@/components/refetch-dialog` → `@/components/figma`
- etc.

### Checklist

- [ ] Créer dossier `components/figma/`
- [ ] Déplacer fichiers
- [ ] Créer `index.ts`
- [ ] Mettre à jour tous les imports
- [ ] Vérifier build

---

## 4.8 Réorganiser `components/rules/`

### Déplacer les fichiers

```bash
mkdir -p components/rules

mv components/rule-card.tsx components/rules/RuleCard.tsx
mv components/rule-editor.tsx components/rules/RuleEditor.tsx
mv components/rule-preview.tsx components/rules/RulePreview.tsx
mv components/selector-editor.tsx components/rules/SelectorEditor.tsx
mv components/transformer-editor.tsx components/rules/TransformerEditor.tsx
mv components/custom-rule-modal.tsx components/rules/CustomRuleModal.tsx
mv components/rules-*.tsx components/rules/  # Tous les rules-*
```

### Créer index.ts

```typescript
// components/rules/index.ts

export { RuleCard } from './RuleCard';
export { RuleEditor } from './RuleEditor';
export { RulePreview } from './RulePreview';
export { SelectorEditor } from './SelectorEditor';
export { TransformerEditor } from './TransformerEditor';
export { CustomRuleModal } from './CustomRuleModal';
// ... autres exports
```

### Checklist

- [ ] Créer dossier `components/rules/`
- [ ] Déplacer fichiers
- [ ] Créer `index.ts`
- [ ] Mettre à jour tous les imports

---

## 4.9 Réorganiser `components/dashboard/`

### Déplacer les fichiers

```bash
mkdir -p components/dashboard

mv components/recent-imports-carousel.tsx components/dashboard/RecentImportsCarousel.tsx
mv components/recent-merges-carousel.tsx components/dashboard/RecentMergesCarousel.tsx
mv components/recent-nodes.tsx components/dashboard/RecentNodes.tsx
mv components/stats-card.tsx components/dashboard/StatsCard.tsx
mv components/health-score.tsx components/dashboard/HealthScore.tsx
mv components/live-metrics-card.tsx components/dashboard/LiveMetricsCard.tsx
```

### Checklist

- [ ] Créer dossier `components/dashboard/`
- [ ] Déplacer fichiers
- [ ] Créer `index.ts`
- [ ] Mettre à jour imports dans `app/page.tsx`

---

## 4.10 Créer `components/shared/index.ts`

```typescript
// components/shared/index.ts

export { DeviceSelector, DEVICE_CONFIG } from './DeviceSelector';
export { BreakpointIcon } from './BreakpointIcon';
export { EmptyState } from './EmptyState';
export { LoadingSpinner, PageLoading } from './LoadingSpinner';
export { CodeHighlight } from './CodeHighlight';
export { ConfirmDialog } from './ConfirmDialog';
```

---

## Validation Finale Phase 4

### Commandes

```bash
npm test
npm run lint
npm run build
npm run dev  # Test manuel
```

### Checklist finale

- [ ] Tous les tests passent
- [ ] Build réussit
- [ ] Application fonctionne
- [ ] Aucune duplication de composants

### Commit

```bash
git add components/
git commit -m "refactor: reorganize components by domain (Phase 4)"
```

---

## Prochaine Phase

→ `docs/phases/phase-5-pages.md`
