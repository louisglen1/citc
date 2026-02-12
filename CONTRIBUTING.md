# Contributing to CITC

Thank you for your interest in contributing to CITC (Client Input Telemetry Collection)! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- TypeScript knowledge
- Understanding of browser APIs and DOM events

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/louisglen/citc.git
   cd citc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Watch mode for development**
   ```bash
   npm run watch
   ```

5. **Test your changes**
   - Open `demo/index.html` in a browser
   - Open browser DevTools console to see events

## Project Structure

```
citc/
├── src/
│   ├── index.ts              # Public API entry point
│   ├── client/               # Client-side collection logic
│   │   ├── engine.ts         # Main orchestration engine
│   │   ├── collectors/       # Event collectors (keystroke, focus, etc.)
│   │   ├── discover.ts       # Field discovery
│   │   ├── lifecycle.ts      # Lifecycle management
│   │   ├── processors.ts     # Event processing pipeline
│   │   ├── targets.ts        # Target field management
│   │   └── transport.ts      # Transport layer (HTTP, Beacon, Console)
│   ├── core/                 # Core utilities
│   │   ├── privacy.ts        # Privacy filters
│   │   └── queue.ts          # Event queue with batching
│   └── schemas/              # TypeScript interfaces
│       ├── config.ts         # Configuration types
│       ├── context.ts        # Context metadata
│       ├── events.ts         # Event types
│       └── index.ts          # Barrel export
├── demo/                     # Demo/example files
└── dist/                     # Compiled output (gitignored)
```

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include:
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment details
   - Code samples or screenshots

### Suggesting Features

1. Open an issue with the enhancement label
2. Clearly describe:
   - Use case / problem being solved
   - Proposed solution
   - Alternative approaches considered
   - Privacy implications (if any)

### Pull Requests

1. **Fork and branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make focused changes**
   - One feature/fix per PR
   - Keep commits atomic and well-described
   - Follow existing code style

3. **Write tests** (when test infrastructure is added)
   - Unit tests for new collectors
   - Integration tests for pipeline changes

4. **Update documentation**
   - Add JSDoc comments to public APIs
   - Update README.md if adding features
   - Add entries to CHANGELOG.md (Unreleased section)

5. **Ensure build passes**
   ```bash
   npm run clean && npm run build
   ```

6. **Submit PR**
   - Reference related issues
   - Describe changes and motivation
   - Include screenshots for UI changes

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode (enabled in tsconfig.json)
- Prefer interfaces over type aliases for objects
- Export types from `schemas/` directory
- Use meaningful variable names (avoid single letters except loops)
- Add JSDoc comments to all public APIs

### Naming Conventions

- **Classes**: PascalCase (e.g., `KeystrokeCollector`)
- **Interfaces**: PascalCase (e.g., `CITCOptions`)
- **Functions/Methods**: camelCase (e.g., `enqueue()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_QUEUE_SIZE`)
- **Private fields**: prefix with `_` is optional but avoid when possible

### File Organization

- One class/interface per file (with exceptions for small helpers)
- Use barrel exports (`index.ts`) for public APIs
- Keep files under 300 lines (refactor if larger)

## Privacy-First Development

CITC is a privacy-first telemetry SDK. When contributing:

- **Never capture raw input values** - Only metadata
- **Redact by default** - Privacy filters should default to maximum safety
- **Document implications** - Explain what data is captured
- **Consider GDPR/CCPA** - Ensure compliance-friendly defaults
- **Transparency** - Keep the codebase auditable

## Adding a New Collector

1. Create `src/client/collectors/YourCollector.ts`
2. Extend `BaseCollector` and implement `start()` method
3. Use `this.on()` helper to register event listeners (auto-cleanup)
4. Emit events with `this.emit()`
5. Register in `src/client/targets.ts` collector map
6. Add to `CaptureConfig` interface in `src/schemas/config.ts`
7. Update README.md with collector documentation

Example:
```typescript
import { BaseCollector } from './BaseCollector.js';

export class ScrollCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'scroll', (event) => {
            this.emit({
                type: 'scroll',
                fieldId: this.fieldId,
                target: this.target,
                timestamp: Date.now(),
                data: {
                    scrollTop: (this.target as HTMLElement).scrollTop,
                    scrollHeight: (this.target as HTMLElement).scrollHeight
                }
            });
        });
    }
}
```

## Testing (Planned)

Testing infrastructure will be added in Phase 3. When available:

- Run tests: `npm test`
- Coverage: `npm run coverage`
- Target: 80%+ code coverage
- Use Vitest for unit/integration tests
- Use Playwright for E2E tests

## Release Process (Maintainers Only)

1. Update version in `package.json` (follow semver)
2. Move Unreleased changes in CHANGELOG.md to new version section
3. Commit: `git commit -m "chore: release v0.x.0"`
4. Tag: `git tag v0.x.0`
5. Push: `git push origin main --tags`
6. Publish: `npm publish`

## Questions?

- Open a discussion on GitHub
- Tag maintainers in issues
- Be patient - this is an open-source project maintained in spare time

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
