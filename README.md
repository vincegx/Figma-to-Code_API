# Figma Rules Builder

Multi-node library manager for Figma components with rule-based code generation.

## Architecture Overview

This application is a multi-node library manager that allows you to:
- Import Figma components into a local library
- Create rule-based transformations to customize code generation
- Generate React, React+Tailwind, or HTML/CSS code from Figma designs
- Manage and version your component library offline

### Application Structure

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

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Figma personal access token ([Get one here](https://www.figma.com/developers/api#access-tokens))

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```
   FIGMA_ACCESS_TOKEN=your_figma_personal_access_token
   ```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Unit Tests (Vitest)
```bash
npm test                 # Run tests in watch mode
npm run test:ui          # Run with UI
npm run test:coverage    # Run with coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run with Playwright UI
```

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/                     # Next.js App Router
├── api/                 # API routes
│   ├── figma/           # Figma API integration
│   ├── library/         # Library management endpoints
│   └── rules/           # Rule management endpoints
├── nodes/               # Node Library page
├── viewer/              # Viewer page (code/render preview)
├── rules/               # Rule Manager page
└── settings/            # Settings page
components/ui/           # Shadcn/ui components
lib/
├── types/               # TypeScript types and interfaces
├── utils/               # Utility functions
├── store/               # Zustand state management stores
└── code-generators/     # Code generation modules
hooks/                   # Custom React hooks
__tests__/               # Test files
├── unit/                # Unit tests
├── integration/         # Integration tests
├── e2e/                 # End-to-end tests
└── components/          # Component tests
figma-data/             # Local storage for imported Figma nodes (gitignored)
mapping-rules.json      # User-created rules (gitignored)
```

## Constitutional Principles

This project follows a set of constitutional principles:

1. **Developer Experience First** - Zero-config startup for common use cases
2. **Type Safety Throughout** - TypeScript strict mode non-negotiable
3. **Simple Before Clever** - Start with working setup, not complex abstractions
4. **Separation of Pages** - Distinct pages for viewing, editing, and management

## Features

- ✅ Multi-node library management
- ✅ Offline-first architecture
- ✅ Rule-based code generation
- ✅ Real-time preview updates
- ✅ Monaco Editor integration
- ✅ Export to React JSX, React+Tailwind, or HTML/CSS
