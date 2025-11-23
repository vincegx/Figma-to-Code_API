# Figma-to-Code Rule Builder

Web-based developer workbench for creating and testing reusable mapping rules that transform Figma designs into code.

## Prerequisites

- Node.js 18+ installed
- Figma personal access token ([create one](https://www.figma.com/developers/api#access-tokens))
- Modern browser (Chrome, Firefox, Safari)

## Setup

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd figma-rules-builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Figma token:
   ```bash
   cp .env.local.template .env.local
   # Edit .env.local and add your Figma token
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

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
