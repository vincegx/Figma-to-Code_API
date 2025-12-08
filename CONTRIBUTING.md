# Contributing to Figma Code Export

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

Be respectful and constructive. We're all here to build something useful.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Figma account (for testing)

### Setup

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/Figma-Code-Export.git
cd Figma-Code-Export
npm install

# Create environment file
cp .env.local.example .env.local
# Add your Figma token

# Start development
npm run dev
```

---

## Development Workflow

### Branch Naming

```
feature/description    # New features
fix/description        # Bug fixes
docs/description       # Documentation
refactor/description   # Code refactoring
```

### Making Changes

1. Create a branch from `main`
2. Make your changes
3. Write/update tests
4. Run linter and tests
5. Commit with clear messages
6. Push and create PR

### Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # Run ESLint
npm test              # Run tests
npm run golden:verify # Verify code generation snapshots
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the project style
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Golden tests pass (`npm run golden:verify`)
- [ ] Documentation updated (if needed)

### PR Description

Include:
- What changed and why
- Screenshots (for UI changes)
- Breaking changes (if any)
- Related issues

### Review Process

1. Automated checks run (lint, tests, build)
2. Maintainer reviews code
3. Address feedback
4. Merge when approved

---

## Coding Standards

### TypeScript

- Strict mode enabled
- Explicit types (avoid `any`)
- Interface over type when possible

```typescript
// Good
interface NodeProps {
  id: string;
  name: string;
}

// Avoid
type NodeProps = {
  id: any;
  name: any;
}
```

### React

- Functional components
- Hooks for state/effects
- Props destructuring

```tsx
// Good
function NodeCard({ id, name }: NodeCardProps) {
  return <div>{name}</div>;
}

// Avoid
function NodeCard(props: any) {
  return <div>{props.name}</div>;
}
```

### File Structure

- One component per file
- Colocate related files
- Use barrel exports (`index.ts`)

### Commits

- Clear, concise messages
- Present tense ("Add feature" not "Added feature")
- Reference issues when relevant

```
feat: add Vue export support
fix: correct padding calculation for nested frames
docs: update installation guide
refactor: simplify merge algorithm
```

---

## Reporting Bugs

### Before Reporting

1. Search existing issues
2. Try latest version
3. Reproduce reliably

### Bug Report Template

```markdown
**Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to...
2. Click on...
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., macOS 14]
- Node: [e.g., 18.17]
- Browser: [e.g., Chrome 120]

**Screenshots**
If applicable.
```

---

## Suggesting Features

### Feature Request Template

```markdown
**Problem**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought of.

**Additional Context**
Mockups, examples, etc.
```

---

## Areas for Contribution

### Good First Issues

Look for issues labeled `good first issue`:
- Documentation improvements
- Bug fixes with clear reproduction
- Small UI enhancements

### Larger Contributions

- New export formats (Vue, Svelte, etc.)
- Rule engine improvements
- Performance optimizations
- Test coverage

---

## Questions?

- Open a [Discussion](https://github.com/vincegx/Figma-Code-Export/discussions)
- Check [FAQ](docs/FAQ.md)

Thank you for contributing!
