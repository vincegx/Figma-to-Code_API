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
title: "Project Setup & Foundation"
phase: "Phase 0 - Foundation"
lane: "done"
assignee: ""
agent: "claude"
shell_pid: "78160"
review_status: ""
reviewed_by: ""
history:
  - timestamp: "2025-11-23T00:00:00Z"
    lane: "planned"
    agent: "system"
    shell_pid: ""
    action: "Prompt generated via /spec-kitty.tasks"
---
*Path: [kitty-specs/001-figma-to-code/tasks/planned/WP01-project-setup-and-foundation.md](kitty-specs/001-figma-to-code/tasks/planned/WP01-project-setup-and-foundation.md)*

# Work Package Prompt: WP01 – Project Setup & Foundation

## ⚠️ IMPORTANT: Review Feedback Status

**Read this first if you are implementing this task!**

- **Has review feedback?**: Check the `review_status` field above. If it says `has_feedback`, scroll to the **Review Feedback** section immediately.
- **You must address all feedback** before your work is complete.
- **Mark as acknowledged**: Update `review_status: acknowledged` when you begin addressing feedback.

---

## Review Feedback

*[Empty initially. Reviewers populate this section if changes are needed.]*

---

## Objectives & Success Criteria

**Goal**: Establish a production-ready Next.js 14+ project with TypeScript strict mode, all required dependencies installed, folder structure created, and build verification complete.

**Success Criteria**:
- `npm run dev` starts successfully on http://localhost:3000
- TypeScript compiles with zero errors in strict mode
- All dependencies installed and version-locked
- Test frameworks configured (Vitest, Playwright)
- `.env.local` template and `.gitignore` properly configured
- README.md provides clear setup instructions

---

## Context & Constraints

**References**:
- [plan.md](../../plan.md) - Technical Context section specifies Next.js 14+ App Router, TypeScript 5.3+, React 18+
- [constitution.md](../../../.kittify/memory/constitution.md) - Principle V (Type Safety) requires strict mode, no `any` types

**Constraints**:
- **TypeScript strict mode**: NON-NEGOTIABLE per constitution
- **Node.js 18+**: Required for Next.js 14+
- **File-based storage**: No database setup needed (part of data locality principle)
- **Local-first**: Primary deployment is `npm run dev`, Vercel is optional

**Key Dependencies** (from plan.md):
- Next.js 14+, React 18+
- Monaco Editor (`@monaco-editor/react`)
- Shadcn/ui (manual component installation)
- Tailwind CSS
- Vitest, React Testing Library, Playwright

---

## Subtasks & Detailed Guidance

### T001 – Initialize Next.js 14+ Project with App Router

**Purpose**: Bootstrap the project using official Next.js CLI

**Steps**:
1. Run: `npx create-next-app@latest figma-rules-builder --typescript --app --tailwind --eslint`
2. When prompted:
   - Would you like to use TypeScript? → **Yes**
   - Would you like to use ESLint? → **Yes**
   - Would you like to use Tailwind CSS? → **Yes**
   - Would you like to use `src/` directory? → **No** (use App Router convention)
   - Would you like to use App Router? → **Yes**
   - Would you like to customize the default import alias? → **No**
3. Navigate into project: `cd figma-rules-builder`
4. Verify structure includes: `app/`, `public/`, `next.config.js`, `package.json`

**Files**: Root directory structure
**Parallel**: No (must complete before other tasks)
**Notes**: Next.js 14 requires Node.js 18.17+. Verify with `node -v` before starting.

---

### T002 – Configure TypeScript Strict Mode

**Purpose**: Enable strict type checking per constitutional requirement

**Steps**:
1. Open `tsconfig.json`
2. Ensure `compilerOptions` includes:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "strictBindCallApply": true,
       "strictPropertyInitialization": true,
       "noImplicitThis": true,
       "useUnknownInCatchVariables": true,
       "alwaysStrict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "exactOptionalPropertyTypes": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true,
       "noUncheckedSideEffectImports": true
     }
   }
   ```
3. Run `npm run build` to verify no type errors

**Files**: `tsconfig.json`
**Parallel**: No (must follow T001)
**Notes**: Strict mode will catch errors early. Any `any` type usage must be explicitly justified per constitution.

---

### T003 – Install Core Dependencies

**Purpose**: Add all required npm packages with locked versions

**Steps**:
1. Install Next.js and React (already done by create-next-app)
2. Install Monaco Editor:
   ```bash
   npm install @monaco-editor/react monaco-editor
   ```
3. Install Shadcn/ui dependencies:
   ```bash
   npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
   ```
4. Install utility libraries:
   ```bash
   npm install zod          # Runtime validation
   npm install nanoid       # Unique ID generation for rules
   ```
5. Lock versions: Commit `package-lock.json`

**Files**: `package.json`, `package-lock.json`
**Parallel**: Yes (can run while T004 configures Tailwind)
**Notes**: Monaco Editor is ~2MB; use dynamic import in components to reduce initial bundle.

---

### T004 – Setup Tailwind CSS with Shadcn/ui

**Purpose**: Configure utility-first CSS and component library

**Steps**:
1. Initialize Shadcn/ui:
   ```bash
   npx shadcn-ui@latest init
   ```
   - Would you like to use TypeScript? → **Yes**
   - Which style would you like to use? → **Default**
   - Which color would you like to use? → **Slate** (neutral, dev tool aesthetic)
   - Where is your global CSS file? → **app/globals.css**
   - Configure components.json → **Yes**
2. Update `tailwind.config.ts` to include components path:
   ```typescript
   content: [
     "./app/**/*.{js,ts,jsx,tsx,mdx}",
     "./components/**/*.{js,ts,jsx,tsx,mdx}",
   ]
   ```
3. Install initial Shadcn/ui components:
   ```bash
   npx shadcn-ui@latest add button input tabs toast
   ```

**Files**: `tailwind.config.ts`, `components/ui/`, `components.json`
**Parallel**: Yes (independent of T003)
**Notes**: Shadcn/ui installs components as source files (not npm package), allowing customization.

---

### T005 – Create Project Folder Structure

**Purpose**: Establish clean architecture per plan.md

**Steps**:
1. Create `lib/` directory structure:
   ```bash
   mkdir -p lib/{types,utils,code-generators}
   ```
2. Create `components/` directory:
   ```bash
   mkdir -p components/ui    # Shadcn/ui primitives (created by T004)
   ```
3. Create `app/api/` routes structure:
   ```bash
   mkdir -p app/api/{figma/{fetch,refresh},rules/{save,load},preview/render}
   ```
4. Create `__tests__/` directory structure:
   ```bash
   mkdir -p __tests__/{unit,integration,e2e}
   ```
5. Create data directories (gitignored):
   ```bash
   mkdir -p figma-data public/examples
   ```

**Files**: Directory structure per plan.md Project Structure section
**Parallel**: Yes (can run while dependencies install)
**Notes**: `figma-data/` will hold cached Figma JSON at runtime (not committed).

---

### T006 – Create .env.local Template and .gitignore

**Purpose**: Configure environment variables and exclude sensitive/generated files

**Steps**:
1. Create `.env.local.template`:
   ```bash
   # Figma API Access Token
   # Get yours at: https://www.figma.com/developers/api#access-tokens
   FIGMA_ACCESS_TOKEN=figd_your_token_here
   ```
2. Create `.env.local` (user copies from template, adds real token)
3. Update `.gitignore` to include:
   ```
   # Environment variables
   .env.local

   # Figma cached data
   figma-data/

   # Rule library (user decides whether to commit)
   mapping-rules.json

   # Standard Next.js ignores (already included by create-next-app)
   .next/
   out/
   node_modules/
   ```
4. Add `.env.local.template` to git (but NOT `.env.local`)

**Files**: `.env.local.template`, `.env.local`, `.gitignore`
**Parallel**: No (sequential after T005)
**Notes**: `.env.local` is auto-loaded by Next.js (no additional config needed).

---

### T007 – Setup Vitest for Unit Tests

**Purpose**: Configure fast unit test runner for lib/ modules

**Steps**:
1. Install Vitest and dependencies:
   ```bash
   npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
   ```
2. Create `vitest.config.ts`:
   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: './__tests__/setup.ts',
     },
   });
   ```
3. Create `__tests__/setup.ts`:
   ```typescript
   import '@testing-library/jest-dom';
   ```
4. Add npm script to `package.json`:
   ```json
   "scripts": {
     "test": "vitest",
     "test:ui": "vitest --ui"
   }
   ```
5. Create sample test `__tests__/unit/example.test.ts`:
   ```typescript
   import { describe, it, expect } from 'vitest';

   describe('Setup test', () => {
     it('should pass', () => {
       expect(true).toBe(true);
     });
   });
   ```
6. Run `npm test` to verify

**Files**: `vitest.config.ts`, `__tests__/setup.ts`, `package.json`
**Parallel**: Yes (independent of T008)
**Notes**: Vitest is faster than Jest and has better TypeScript support.

---

### T008 – Setup Playwright for E2E Tests

**Purpose**: Configure browser automation for end-to-end testing

**Steps**:
1. Install Playwright:
   ```bash
   npm install -D @playwright/test
   npx playwright install   # Installs browser binaries
   ```
2. Create `playwright.config.ts`:
   ```typescript
   import { defineConfig, devices } from '@playwright/test';

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
       { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     ],
     webServer: {
       command: 'npm run dev',
       url: 'http://localhost:3000',
       reuseExistingServer: !process.env.CI,
     },
   });
   ```
3. Add npm script:
   ```json
   "scripts": {
     "test:e2e": "playwright test",
     "test:e2e:ui": "playwright test --ui"
   }
   ```
4. Create sample test `__tests__/e2e/home.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';

   test('homepage loads', async ({ page }) => {
     await page.goto('/');
     await expect(page).toHaveTitle(/Figma-to-Code Rule Builder/);
   });
   ```

**Files**: `playwright.config.ts`, `__tests__/e2e/home.spec.ts`, `package.json`
**Parallel**: Yes (independent of T007)
**Notes**: Playwright auto-starts dev server (see webServer config).

---

### T009 – Create README.md with Setup Instructions

**Purpose**: Document project setup for new developers

**Steps**:
1. Create comprehensive `README.md`:
   ```markdown
   # Figma-to-Code Rule Builder

   Web-based developer workbench for creating and testing reusable mapping rules that transform Figma designs into code.

   ## Prerequisites

   - Node.js 18+ installed
   - Figma personal access token ([create one](https://www.figma.com/developers/api#access-tokens))
   - Modern browser (Chrome, Firefox, Safari)

   ## Setup

   1. Clone repository:
      \`\`\`bash
      git clone <repo-url>
      cd figma-rules-builder
      \`\`\`

   2. Install dependencies:
      \`\`\`bash
      npm install
      \`\`\`

   3. Configure Figma token:
      \`\`\`bash
      cp .env.local.template .env.local
      # Edit .env.local and add your Figma token
      \`\`\`

   4. Start development server:
      \`\`\`bash
      npm run dev
      \`\`\`

   5. Open http://localhost:3000

   ## Available Commands

   - `npm run dev` - Start development server
   - `npm run build` - Build for production
   - `npm test` - Run unit tests
   - `npm run test:e2e` - Run E2E tests
   - `npm run lint` - Check code quality

   ## Architecture

   - **Next.js 14+** App Router with TypeScript strict mode
   - **React 18+** for UI
   - **Monaco Editor** for rule editing
   - **Shadcn/ui + Tailwind** for components
   - **File-based storage** (no database)

   ## Documentation

   See [quickstart.md](kitty-specs/001-figma-to-code/quickstart.md) for detailed usage guide.
   ```

**Files**: `README.md`
**Parallel**: Yes (documentation task)
**Notes**: Keep README concise; detailed docs in quickstart.md.

---

### T010 – Verify Build Succeeds with Zero TypeScript Errors

**Purpose**: Ensure clean baseline before development begins

**Steps**:
1. Run full build:
   ```bash
   npm run build
   ```
2. Verify output shows:
   - "Compiled successfully"
   - No TypeScript errors
   - No ESLint errors
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Navigate to http://localhost:3000
5. Verify default Next.js page loads
6. Check browser console for errors (should be none)
7. Run tests:
   ```bash
   npm test
   npm run test:e2e
   ```
8. Verify all tests pass

**Files**: N/A (verification step)
**Parallel**: No (must run after all other tasks)
**Notes**: If errors found, fix before marking WP01 complete. Constitutional requirement: zero TypeScript errors.

---

## Test Strategy

No explicit tests required for setup tasks. Verification is done via successful build and dev server startup.

**Validation Commands**:
- `npm run build` (must succeed)
- `npm run dev` (must start server)
- `npm test` (sample test must pass)
- `npm run test:e2e` (sample E2E test must pass)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Dependency version conflicts** | Pin exact versions in package.json, commit package-lock.json |
| **Monaco Editor bundle size (2MB)** | Document in implementation notes; use dynamic import in components (WP08) |
| **Node.js version mismatch** | Add `.nvmrc` file with `18.17.0` or higher |
| **Shadcn/ui component conflicts** | Install only needed components initially, add more as WPs require |

---

## Definition of Done Checklist

- [ ] T001: Next.js 14+ project initialized with App Router
- [ ] T002: TypeScript strict mode enabled, tsconfig.json configured
- [ ] T003: All dependencies installed and locked (package-lock.json committed)
- [ ] T004: Tailwind + Shadcn/ui configured, initial components installed
- [ ] T005: Folder structure created (lib/, components/, app/api/, __tests__/)
- [ ] T006: .env.local.template created, .gitignore updated
- [ ] T007: Vitest configured, sample test passing
- [ ] T008: Playwright configured, sample E2E test passing
- [ ] T009: README.md created with setup instructions
- [ ] T010: Build succeeds with zero TypeScript errors
- [ ] `npm run dev` starts successfully on http://localhost:3000
- [ ] All test commands run without errors (`npm test`, `npm run test:e2e`)
- [ ] Project structure matches plan.md specification

---

## Reviewer Guidance

**What to check**:
1. Run `npm install && npm run build` - must succeed with zero errors
2. Verify `tsconfig.json` has strict mode enabled
3. Check `.gitignore` excludes `.env.local`, `figma-data/`, `node_modules/`
4. Confirm folder structure matches plan.md (lib/, app/api/, components/, __tests__/)
5. Run `npm test` and `npm run test:e2e` - both must pass
6. Check `package.json` for correct versions: Next.js 14+, React 18+, TypeScript 5.3+

**Common Issues**:
- Missing dependencies → check package.json completeness
- TypeScript errors → ensure strict mode is enabled, no `any` types
- Build failures → verify Node.js 18+ installed

**Acceptance**:
- All checklist items marked complete
- Zero TypeScript/ESLint errors
- Dev server starts and loads homepage successfully

## Activity Log

- 2025-11-23T14:40:03Z – claude – shell_pid=78160 – lane=doing – Starting implementation of Project Setup & Foundation
- 2025-11-23T14:50:54Z – claude – shell_pid=78160 – lane=for_review – Completed all 10 subtasks. Build succeeds with zero TypeScript errors. All tests passing.
- 2025-11-23T18:11:14Z – claude – shell_pid=78160 – lane=done – Approved after review - all acceptance criteria met
