# Phase 3 : Hooks Partagés

> **Statut** : À faire
> **Risque** : Faible
> **Durée estimée** : 1h
> **Prérequis** : Phase 2 terminée

---

## Règles de Refactoring - Rappel

> **IMPORTANT** : Respecter pendant l'exécution

- ✅ **Tests before/after** : `npm test` après CHAQUE hook créé
- ✅ **One change at a time** : Commit après chaque hook
- ✅ **Booleans naming** : Préfixer avec `is`, `has`, `can`, `should`
  - ❌ `copiedCode` → ✅ `isCopied`
  - ❌ `loading` → ✅ `isLoading`
  - ❌ `open` → ✅ `isOpen`
- ✅ **Functions: verb + noun** : `toggleSelection`, `formatDate`, etc.

---

## Objectif

Créer des hooks réutilisables pour les patterns répétés dans les pages :
- `useLocalStorage` - Persistance localStorage
- `useToggleSet` - Toggle sélection Set
- `useDropdownState` - Dropdown + click outside
- `useFetchWithRetry` - Fetch avec try/catch/finally

---

## 3.1 Créer `hooks/useLocalStorage.ts`

### Pattern répété dans

| Fichier | Lignes | Usage |
|---------|--------|-------|
| `app/viewer/[nodeId]/page.tsx` | 204-220 | Framework par défaut |
| `app/viewer/[nodeId]/page.tsx` | 223-236 | Language par défaut |
| `app/rules/page.tsx` | - | Filtres persistés |
| `app/settings/page.tsx` | - | Préférences |

### Fichier à créer

```typescript
// hooks/useLocalStorage.ts

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for persisting state in localStorage
 * Handles SSR (returns defaultValue on server)
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize with defaultValue (SSR-safe)
  const [value, setValue] = useState<T>(defaultValue);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Persist to localStorage on change
  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const valueToStore = newValue instanceof Function ? newValue(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`Error writing localStorage key "${key}":`, error);
        }
        return valueToStore;
      });
    },
    [key]
  );

  return [value, setStoredValue];
}

/**
 * Hook for reading localStorage without persisting
 * Useful for one-time reads
 */
export function useLocalStorageValue<T>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setValue(JSON.parse(item));
      }
    } catch {
      // Ignore errors
    }
  }, [key]);

  return value;
}
```

### Checklist

- [ ] Créer `hooks/useLocalStorage.ts`
- [ ] Modifier `app/viewer/[nodeId]/page.tsx` - utiliser hook
- [ ] Modifier `app/rules/page.tsx` si applicable
- [ ] Tests

---

## 3.2 Créer `hooks/useToggleSet.ts`

### Pattern répété dans

| Fichier | Lignes | Usage |
|---------|--------|-------|
| `app/merges/page.tsx` | 77-87 | Sélection multiple merges |
| `app/nodes/page.tsx` | - | Sélection multiple nodes |
| `app/viewer/[nodeId]/page.tsx` | - | Expansion nodes tree |

### Fichier à créer

```typescript
// hooks/useToggleSet.ts

import { useState, useCallback } from 'react';

/**
 * Hook for managing a Set with toggle functionality
 * Useful for multi-select UIs
 */
export function useToggleSet<T>(
  initial: Set<T> | T[] = []
): {
  set: Set<T>;
  toggle: (item: T) => void;
  add: (item: T) => void;
  remove: (item: T) => void;
  clear: () => void;
  has: (item: T) => boolean;
  selectAll: (items: T[]) => void;
  isAllSelected: (items: T[]) => boolean;
  isSomeSelected: (items: T[]) => boolean;
  size: number;
} {
  const [set, setSet] = useState<Set<T>>(
    () => new Set(Array.isArray(initial) ? initial : initial)
  );

  const toggle = useCallback((item: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }, []);

  const add = useCallback((item: T) => {
    setSet((prev) => new Set(prev).add(item));
  }, []);

  const remove = useCallback((item: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSet(new Set());
  }, []);

  const has = useCallback((item: T) => set.has(item), [set]);

  const selectAll = useCallback((items: T[]) => {
    setSet(new Set(items));
  }, []);

  const isAllSelected = useCallback(
    (items: T[]) => items.length > 0 && items.every((item) => set.has(item)),
    [set]
  );

  const isSomeSelected = useCallback(
    (items: T[]) => {
      const selectedCount = items.filter((item) => set.has(item)).length;
      return selectedCount > 0 && selectedCount < items.length;
    },
    [set]
  );

  return {
    set,
    toggle,
    add,
    remove,
    clear,
    has,
    selectAll,
    isAllSelected,
    isSomeSelected,
    size: set.size,
  };
}
```

### Checklist

- [ ] Créer `hooks/useToggleSet.ts`
- [ ] Modifier `app/merges/page.tsx` - utiliser hook
- [ ] Modifier `app/nodes/page.tsx` - utiliser hook
- [ ] Tests

---

## 3.3 Créer `hooks/useDropdownState.ts`

### Pattern répété dans

| Fichier | Lignes | Usage |
|---------|--------|-------|
| `app/rules/page.tsx` | 100-112 | 2 dropdowns (catégorie + framework) |
| `app/merges/page.tsx` | - | Dropdown tri/filtre |

### Fichier à créer

```typescript
// hooks/useDropdownState.ts

import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook for managing dropdown state with click-outside detection
 */
export function useDropdownState(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    setIsOpen,
    toggle,
    open,
    close,
    ref,
  };
}

/**
 * Hook for managing multiple dropdowns (ensures only one is open)
 */
export function useMultipleDropdowns<K extends string>(keys: K[]) {
  const [openDropdown, setOpenDropdown] = useState<K | null>(null);
  const refs = useRef<Record<K, HTMLDivElement | null>>(
    {} as Record<K, HTMLDivElement | null>
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (openDropdown) {
        const ref = refs.current[openDropdown];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdown(null);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggle = useCallback((key: K) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }, []);

  const close = useCallback(() => setOpenDropdown(null), []);

  const setRef = useCallback((key: K) => (el: HTMLDivElement | null) => {
    refs.current[key] = el;
  }, []);

  const isOpen = useCallback((key: K) => openDropdown === key, [openDropdown]);

  return {
    openDropdown,
    toggle,
    close,
    setRef,
    isOpen,
  };
}
```

### Checklist

- [ ] Créer `hooks/useDropdownState.ts`
- [ ] Modifier `app/rules/page.tsx` - utiliser hook
- [ ] Modifier `app/merges/page.tsx` si applicable
- [ ] Tests

---

## 3.4 Créer `hooks/useFetchWithRetry.ts`

### Pattern répété dans

| Fichier | Lignes | Usage |
|---------|--------|-------|
| `app/merge/[id]/page.tsx` | 218-227, 252-269, 273-300 | 3 useEffect fetch |
| `app/viewer/[nodeId]/page.tsx` | - | Fetch node data |
| `app/merges/page.tsx` | - | Fetch merges list |

### Fichier à créer

```typescript
// hooks/useFetchWithRetry.ts

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFetchOptions<T> {
  /** Initial data */
  initialData?: T;
  /** Fetch on mount */
  fetchOnMount?: boolean;
  /** Retry count on error */
  retryCount?: number;
  /** Retry delay in ms */
  retryDelay?: number;
  /** Dependencies to refetch */
  deps?: unknown[];
  /** Transform response */
  transform?: (data: unknown) => T;
}

interface UseFetchResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setData: (data: T) => void;
}

/**
 * Hook for fetching data with loading/error states
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    initialData,
    fetchOnMount = true,
    retryCount = 0,
    retryDelay = 1000,
    deps = [],
    transform,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  const retriesRef = useRef(0);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      const transformedResult = transform ? transform(result) : result;
      setData(transformedResult);
      retriesRef.current = 0;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (retriesRef.current < retryCount) {
        retriesRef.current++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return fetch();
      }

      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, retryCount, retryDelay, transform]);

  useEffect(() => {
    if (fetchOnMount) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOnMount, ...deps]);

  return {
    data,
    isLoading,
    error,
    refetch: fetch,
    setData,
  };
}

/**
 * Simplified hook for API routes
 */
export function useAPI<T>(
  url: string,
  options?: UseFetchOptions<T> & RequestInit
): UseFetchResult<T> {
  const { initialData, fetchOnMount, retryCount, retryDelay, deps, transform, ...fetchOptions } =
    options || {};

  const fetchFn = useCallback(async () => {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [url, fetchOptions]);

  return useFetch(fetchFn, {
    initialData,
    fetchOnMount,
    retryCount,
    retryDelay,
    deps,
    transform,
  });
}
```

### Checklist

- [ ] Créer `hooks/useFetchWithRetry.ts`
- [ ] Modifier `app/merge/[id]/page.tsx` - utiliser hook
- [ ] Modifier `app/merges/page.tsx` - utiliser hook
- [ ] Tests

---

## 3.5 Mettre à jour `hooks/index.ts` (optionnel)

```typescript
// hooks/index.ts

// Existing hooks
export { useApiQuota } from './use-api-quota';
export { useFigmaProgress } from './use-figma-progress';
// ... autres existants

// New hooks
export { useLocalStorage, useLocalStorageValue } from './useLocalStorage';
export { useToggleSet } from './useToggleSet';
export { useDropdownState, useMultipleDropdowns } from './useDropdownState';
export { useFetch, useAPI } from './useFetchWithRetry';
```

---

## Validation Finale Phase 3

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
- [ ] Hooks utilisés dans au moins 2 fichiers chacun

### Commit

```bash
git add hooks/
git add app/
git commit -m "refactor: add shared hooks for common patterns (Phase 3)"
```

---

## Prochaine Phase

→ `docs/phases/phase-4-components.md`
