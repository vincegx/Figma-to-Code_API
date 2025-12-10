# Figma Rules Builder - CLAUDE.md

Application Next.js pour convertir des designs Figma en code (React/Tailwind, HTML/CSS).

## Commands

```bash
npm run dev          # Serveur dev (localhost:3000)
npm run build        # Build production
npm test             # Tests unitaires (Vitest)
npm run test:e2e     # Tests E2E (Playwright)
npm run lint         # ESLint
```

## Tech Stack

- **Next.js 14** (App Router, Server/Client Components)
- **TypeScript 5.3+** (strict mode)
- **React 18** + **Zustand** (state management)
- **Tailwind CSS 3.4** + **Tailwind v4** support
- **Radix UI** + **shadcn/ui** (composants)
- **Vitest** (unit) + **Playwright** (e2e)

## Project Structure

```
app/                    # Next.js App Router
├── api/                # API Routes (22 endpoints)
│   ├── figma/          # Import, library, nodes, versions
│   ├── rules/          # CRUD règles personnalisées
│   ├── merges/         # Opérations de merge responsive
│   ├── export/         # Génération de code
│   └── quota/          # Monitoring API Figma
├── rules/              # Page gestion des règles
├── nodes/              # Page exploration des nodes
├── merges/             # Page merges responsives
└── settings/           # Configuration

components/             # Composants React
├── ui/                 # shadcn/ui (button, card, dialog...)
├── library/            # Browsing bibliothèque Figma
├── merge/              # UI merge responsive
└── quota/              # Indicateurs quota API

lib/                    # Logique métier
├── types/              # Définitions TypeScript (15+ fichiers)
├── store/              # Zustand (rules, nodes, ui, quota)
├── code-generators/    # Code generators (react-tailwind, html-css)
├── merge/              # Algorithme de merge responsive
└── figma-client.ts     # Client API Figma

hooks/                  # Custom hooks React
__tests__/              # Tests Vitest + golden tests
figma-data/             # Cache données Figma (JSON)
merges-data/            # Données de merge (JSON)
```

## Code Style

### IMPORTANT - Conventions strictes

- **Imports**: ES modules, path alias `@/*` (ex: `@/lib/utils`)
- **Components**: `'use client'` explicite pour composants interactifs
- **Types**: Typage strict, utiliser les guards de `lib/types/guards.ts`
- **State**: Zustand stores dans `lib/store/`, pas de useState global

### Patterns du projet

```typescript
// Composant client
'use client'
import { Button } from '@/components/ui/button'
import { useRulesStore } from '@/lib/store/rules-store'

// API Route
import { NextResponse } from 'next/server'
export async function GET(request: Request) { ... }

// Store Zustand
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
```

### Styling

- Tailwind utility-first avec CSS variables pour le theming
- Dark mode via selector strategy
- `cn()` helper pour merge de classes (`lib/utils.ts`)

## Key Files

| Fichier | Rôle |
|---------|------|
| `lib/figma-client.ts` | Client REST API Figma |
| `lib/rule-engine.ts` | Moteur de matching des règles |
| `lib/code-generators/react-tailwind-v4.ts` | Générateur React + Tailwind v4 |
| `lib/code-generators/html-tailwind-css.ts` | Générateur HTML/CSS |
| `lib/merge/merge-engine.ts` | Algorithme merge responsive |
| `lib/types/figma.ts` | Types API Figma |
| `lib/types/rules.ts` | Types règles de conversion |
| `lib/store/rules-store.ts` | Store Zustand règles |

## API Figma

- Token dans `.env.local`: `FIGMA_ACCESS_TOKEN=xxx`
- Quota tracking automatique via `lib/api-quota-tracker.ts`
- Cache des nodes dans `figma-data/`

## Testing

```bash
npm test                        # Tous les tests
npm test -- --watch             # Mode watch
npm run test:coverage           # Avec coverage
npm run golden:capture          # Capturer golden tests
npm run golden:verify           # Vérifier golden tests
```

## Workflow

### Avant modification
1. Lire les fichiers concernés
2. Vérifier les types dans `lib/types/`
3. Identifier le store Zustand impacté

### Après modification
1. `npm run lint`
2. `npm test` (tests concernés)
3. Vérifier le typage (erreurs TypeScript dans l'IDE)

## Notes importantes

- **Server Components** par défaut dans `/app`, ajouter `'use client'` si interactivité
- **Pas de `any`** - utiliser les types existants ou créer dans `lib/types/`
- **Validation Zod** pour les inputs API
- **Toast notifications** via Sonner (`sonner`)
- Les générateurs de code sont dans `lib/code-generators/` - ne pas modifier sans tests golden
