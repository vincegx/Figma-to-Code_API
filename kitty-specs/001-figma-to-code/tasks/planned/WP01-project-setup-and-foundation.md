---
work_package_id: "WP01"
subtasks:
  - "T001"
  - "T002"
  - "T003"
  - "T004"
  - "T005"
  - "T006"
  - "T007"
  - "T008"
  - "T009"
  - "T010"
  - "T011"
title: "Project Setup & Foundation"
phase: "Phase 0 - Foundation"
lane: "planned"
assignee: ""
agent: ""
shell_pid: ""
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-11-24T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---

# Work Package Prompt: WP01 – Project Setup & Foundation

## Objectives & Success Criteria

Initialize a production-ready Next.js 14+ project with TypeScript strict mode, establish the complete folder structure for the multi-node library manager architecture, and configure all essential tooling (Zustand, Monaco Editor, Shadcn/ui, Vitest, Playwright).

**Success Criteria**:
- `npm run dev` starts development server successfully
- Navigate to http://localhost:3000, see default Next.js page
- `npm run build` completes with zero TypeScript errors
- All dependencies installed with exact versions pinned
- Project structure matches plan.md specifications
- Git repository initialized with appropriate .gitignore

## Context & Constraints

**Architecture**: Multi-node library manager with 5 pages (Homepage Dashboard, Node Library, Viewer, Rule Manager, Settings)

**Key Decisions from Planning**:
- Next.js 14+ App Router (not Pages Router)
- Zustand for state management (chosen for DevTools support and performance at scale)
- Feature-first testing strategy (implement features → manual test → write tests after)
- Monaco Editor with dynamic import to reduce bundle size

**Constitutional Principles**:
- Principle V: Type Safety Throughout – TypeScript strict mode non-negotiable
- Principle VI: Simple Before Clever – Start with working setup, not complex abstractions
- Principle I: Developer Experience First – Zero-config startup for common use cases

**Related Documents**:
- [plan.md](../plan.md) – Technical architecture and dependencies
- [spec.md](../spec.md) – 6 user stories, 70 functional requirements
- [.kittify/memory/constitution.md](../../../../.kittify/memory/constitution.md) – Constitutional principles v1.1.0

## Subtasks & Detailed Guidance

### Subtask T001 – Initialize Next.js 14+ project with App Router

**Purpose**: Bootstrap Next.js project with correct configuration for multi-node library manager.

**Steps**:
1. Run `npx create-next-app@latest` with options:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - `src/` directory: No (use `app/` at root)
   - App Router: Yes (CRITICAL - not Pages Router)
   - Import alias: Yes (`@/*`)

2. Verify generated structure includes:
   - `app/` directory (App Router)
   - `public/` directory
   - `package.json` with Next.js 14.x
   - `tsconfig.json`
   - `tailwind.config.ts`

**Files**: Root directory, `package.json`, `next.config.js`, `tsconfig.json`

**Parallel?**: No (must complete before other tasks)

**Notes**:
- Name the project `figma-rules-builder`
- Accept default Next.js 14.x version
- If prompted, skip creating Git repository (we'll do it manually)

---

### Subtask T002 – Configure TypeScript strict mode

**Purpose**: Enable TypeScript strict mode to catch type errors at compile time (Constitution Principle V).

**Steps**:
1. Open `tsconfig.json`
2. Ensure `compilerOptions` includes:
   ```json
   {
     "strict": true,
     "noImplicitAny": true,
     "strictNullChecks": true,
     "strictFunctionTypes": true,
     "strictBindCallApply": true,
     "strictPropertyInitialization": true,
     "noImplicitThis": true,
     "alwaysStrict": true
   }
   ```
3. Run `npm run build` to verify no existing type errors

**Files**: `tsconfig.json`

**Parallel?**: No (depends on T001)

**Notes**:
- Strict mode is NON-NEGOTIABLE per Constitution Principle V
- If build fails with type errors, fix them before proceeding

---

### Subtask T003 – Install core dependencies

**Purpose**: Install all required packages with exact versions pinned.

**Steps**:
1. Install React ecosystem:
   ```bash
   npm install react@18.3.1 react-dom@18.3.1 next@14.2.15
   ```

2. Install state management:
   ```bash
   npm install zustand@4.5.0
   ```

3. Install Monaco Editor:
   ```bash
   npm install @monaco-editor/react@4.6.0
   ```

4. Install UI utilities:
   ```bash
   npm install tailwindcss@3.4.1 @tailwindcss/typography@0.5.10
   npm install clsx@2.1.0 tailwind-merge@2.2.0
   ```

5. Install type definitions:
   ```bash
   npm install --save-dev @types/react@18.3.1 @types/react-dom@18.3.1 @types/node@20.11.5
   ```

**Files**: `package.json`, `package-lock.json`

**Parallel?**: Yes (can run concurrently with T004, T008, T009)

**Notes**:
- Pin EXACT versions to avoid dependency drift
- Monaco Editor will be lazy-loaded via `next/dynamic` in WP11

---

### Subtask T004 – Install and configure Shadcn/ui

**Purpose**: Setup Shadcn/ui component library for consistent UI components.

**Steps**:
1. Initialize Shadcn/ui:
   ```bash
   npx shadcn-ui@latest init
   ```
   - Style: Default
   - Base color: Neutral
   - CSS variables: Yes

2. Install initial components (needed for MVP):
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add dropdown-menu
   npx shadcn-ui@latest add tabs
   npx shadcn-ui@latest add table
   npx shadcn-ui@latest add toast
   ```

3. Verify `components/ui/` directory created

**Files**: `components/ui/*`, `lib/utils.ts`, `tailwind.config.ts` (updated)

**Parallel?**: Yes (can run concurrently with T003, T008, T009)

**Notes**:
- Shadcn/ui uses Radix UI primitives under the hood
- Additional components can be added later as needed

---

### Subtask T005 – Create project folder structure

**Purpose**: Establish complete folder structure matching plan.md architecture.

**Steps**:
1. Create core directories:
   ```bash
   mkdir -p app/api/figma app/api/rules app/api/library
   mkdir -p app/nodes app/viewer app/rules app/settings
   mkdir -p components/ui
   mkdir -p lib/types lib/utils lib/store lib/code-generators
   mkdir -p hooks
   mkdir -p __tests__/unit __tests__/integration __tests__/e2e __tests__/components
   mkdir -p public/icons
   ```

2. Verify structure matches plan.md:
   ```
   app/                     # Next.js App Router
   ├── api/                 # API routes
   ├── nodes/               # Node Library page
   ├── viewer/              # Viewer page
   ├── rules/               # Rule Manager page
   ├── settings/            # Settings page
   components/ui/           # Shadcn/ui components
   lib/
   ├── types/               # TypeScript types
   ├── utils/               # Utility functions
   ├── store/               # Zustand stores
   └── code-generators/     # Code generation modules
   hooks/                   # Custom React hooks
   __tests__/               # Test files
   ```

**Files**: All directories listed above

**Parallel?**: Yes (can run concurrently with T003, T004)

**Notes**:
- Do not create files yet, only directories
- `figma-data/` will be created in T006 (gitignored)

---

### Subtask T006 – Create figma-data/ structure and mapping-rules.json placeholder

**Purpose**: Setup local storage directories for multi-node data (gitignored).

**Steps**:
1. Create storage directory:
   ```bash
   mkdir -p figma-data
   ```

2. Create placeholder `mapping-rules.json`:
   ```bash
   echo '{"version":"1.0.0","rules":[],"metadata":{"createdAt":"","lastModified":""}}' > mapping-rules.json
   ```

3. Create placeholder library index:
   ```bash
   echo '{"version":"1.0.0","lastUpdated":"","nodes":[]}' > figma-data/library-index.json
   ```

**Files**: `figma-data/`, `mapping-rules.json`, `figma-data/library-index.json`

**Parallel?**: No (needed for T007 gitignore)

**Notes**:
- These files are user-managed and should NOT be committed to Git
- Multi-node structure: `figma-data/{nodeId}/data.json`, `metadata.json`, `screenshot.png`

---

### Subtask T007 – Configure .gitignore

**Purpose**: Prevent committing user data, dependencies, and environment variables.

**Steps**:
1. Ensure `.gitignore` includes:
   ```gitignore
   # Next.js
   .next/
   out/
   build/

   # Dependencies
   node_modules/
   package-lock.json # Optional: keep if team uses npm, remove if using yarn/pnpm

   # Environment variables
   .env
   .env.local
   .env.*.local

   # User data (CRITICAL - do not commit)
   figma-data/
   mapping-rules.json

   # Testing
   coverage/
   .nyc_output/

   # Editor
   .vscode/
   .idea/
   *.swp
   *.swo

   # OS
   .DS_Store
   Thumbs.db
   ```

2. Verify excluded files are not tracked:
   ```bash
   git status
   ```

**Files**: `.gitignore`

**Parallel?**: No (depends on T006)

**Notes**:
- `figma-data/` and `mapping-rules.json` MUST be gitignored to protect user data
- `.env.local` will contain Figma API token (sensitive)

---

### Subtask T008 – Setup Vitest for unit tests

**Purpose**: Configure Vitest with React Testing Library for fast unit testing.

**Steps**:
1. Install Vitest and React Testing Library:
   ```bash
   npm install --save-dev vitest@1.2.0 @vitest/ui@1.2.0
   npm install --save-dev @testing-library/react@14.1.2 @testing-library/jest-dom@6.1.5
   npm install --save-dev jsdom@24.0.0
   ```

2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./vitest.setup.ts'],
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './'),
       },
     },
   })
   ```

3. Create `vitest.setup.ts`:
   ```typescript
   import '@testing-library/jest-dom'
   ```

4. Add test script to `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest --coverage"
     }
   }
   ```

**Files**: `vitest.config.ts`, `vitest.setup.ts`, `package.json`

**Parallel?**: Yes (can run concurrently with T003, T004, T009)

**Notes**:
- Feature-first testing strategy: Tests written AFTER features implemented
- Coverage targets: 90% rule engine, 80% transformations, 70% other modules

---

### Subtask T009 – Setup Playwright for E2E tests

**Purpose**: Configure Playwright for end-to-end workflow testing.

**Steps**:
1. Install Playwright:
   ```bash
   npm install --save-dev @playwright/test@1.40.0
   npx playwright install
   ```

2. Create `playwright.config.ts`:
   ```typescript
   import { defineConfig, devices } from '@playwright/test'

   export default defineConfig({
     testDir: './__tests__/e2e',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
     },
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
     ],
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
     },
   })
   ```

3. Add E2E test script to `package.json`:
   ```json
   {
     "scripts": {
       "test:e2e": "playwright test",
       "test:e2e:ui": "playwright test --ui"
     }
   }
   ```

**Files**: `playwright.config.ts`, `package.json`

**Parallel?**: Yes (can run concurrently with T003, T004, T008)

**Notes**:
- E2E tests validate complete user workflows (import → rule → export)
- Tests will be written in WP14 (Testing & Validation)

---

### Subtask T010 – Create README.md

**Purpose**: Document project setup, architecture, and quick start instructions.

**Steps**:
1. Create `README.md` with sections:
   - Project Title & Description
   - Architecture Overview (multi-node library manager, 5 pages)
   - Prerequisites (Node.js 18+, Figma personal access token)
   - Installation
   - Configuration (.env.local setup)
   - Development (npm run dev)
   - Testing (npm test, npm run test:e2e)
   - Project Structure
   - Constitutional Principles reference

2. Include architecture diagram (text-based):
   ```
   ┌─────────────┐
   │  Homepage   │  Dashboard with stats, recent nodes, import
   │  Dashboard  │
   └──────┬──────┘
          │
   ┌──────┴──────────────────────────────┐
   │                                     │
   ┌──────┴──────┐  ┌────────┴────────┐  ┌─────┴─────┐
   │   Library   │  │     Viewer      │  │   Rules   │
   │   Page      │  │  (Code/Render)  │  │  Manager  │
   └─────────────┘  └─────────────────┘  └───────────┘
   ```

**Files**: `README.md`

**Parallel?**: Yes (can write while other tasks run)

**Notes**:
- Keep README concise, detailed docs in `quickstart.md`
- Reference Constitution v1.1.0 for design principles

---

### Subtask T011 – Verify build succeeds

**Purpose**: Final validation that project setup is complete and error-free.

**Steps**:
1. Run full build:
   ```bash
   npm run build
   ```

2. Verify output:
   - No TypeScript errors
   - Next.js build completes successfully
   - Static pages generated

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000
   - Verify Next.js default page loads
   - Check browser console for errors

5. Run type check:
   ```bash
   npx tsc --noEmit
   ```

**Files**: N/A (validation step)

**Parallel?**: No (final step after all others)

**Notes**:
- If build fails, review all previous steps
- Zero TypeScript errors is MANDATORY (Constitution Principle V)

## Definition of Done Checklist

- [ ] Next.js 14+ project initialized with App Router
- [ ] TypeScript strict mode enabled and verified
- [ ] All dependencies installed with exact versions pinned
- [ ] Shadcn/ui configured with initial components
- [ ] Complete folder structure created matching plan.md
- [ ] `figma-data/` and `mapping-rules.json` created and gitignored
- [ ] .gitignore configured to exclude user data and dependencies
- [ ] Vitest configured with React Testing Library
- [ ] Playwright configured for E2E tests
- [ ] README.md created with architecture overview
- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npm run dev` starts successfully, homepage accessible at http://localhost:3000

## Review Guidance

**Key Acceptance Checkpoints**:
1. TypeScript strict mode active (check `tsconfig.json`)
2. All dependencies match exact versions in plan.md
3. Folder structure exactly matches plan.md specifications
4. `figma-data/` and `mapping-rules.json` in .gitignore
5. Build produces zero TypeScript errors
6. Development server starts without errors

**Reviewers should verify**:
- No `any` types introduced (check with `grep -r "any" .`)
- Package versions pinned (no `^` or `~` in package.json)
- All MVP directories created (app/, components/, lib/, hooks/, __tests__/)

## Activity Log

- 2025-11-24T00:00:00Z – system – lane=planned – Prompt created via /spec-kitty.tasks
