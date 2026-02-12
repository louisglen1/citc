# Test Infrastructure

This directory contains the test suite for CITC using Vitest and jsdom.

## Structure

```
tests/
├── setup.ts              # Global test setup (runs before all tests)
├── helpers.ts            # Test utilities and fixture factories
├── core/                 # Tests for core modules
│   ├── queue.test.ts     # Queue batching and flush tests
│   └── privacy.test.ts   # Privacy filtering and redaction tests
├── client/               # Tests for client modules (collectors, engine, etc.)
│   └── collectors/       # Tests for event collectors
└── schemas/              # Tests for schemas and types
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (interactive browser UI)
npm run test:ui
```

## Configuration

Test configuration is in [vitest.config.ts](../vitest.config.ts):
- **Environment**: jsdom (simulates browser DOM)
- **Coverage**: v8 provider with 70% threshold
- **Setup**: Automatic cleanup between tests
- **Globals**: Enabled for easier test writing

## Writing Tests

### Test File Structure

```typescript
import { describe, it, expect } from 'vitest';
import { createTestEvent } from '../helpers';
import { YourModule } from '../../src/module';

describe('YourModule', () => {
  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = createTestEvent();
      
      // Act
      const result = YourModule.process(input);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### Using Test Helpers

```typescript
import {
  createTestEvent,
  createMockTransport,
  createTestInput,
  waitFor,
} from '../helpers';

// Create test events
const event = createTestEvent({ type: 'keystroke', data: { key: 'a' } });

// Create mock transport
const transport = createMockTransport();

// Create DOM elements
const input = createTestInput({ name: 'email', dataField: 'email' });
document.body.appendChild(input);

// Wait for conditions
await waitFor(() => someCondition === true);
```

### Mocking Browser APIs

```typescript
import { vi } from 'vitest';

// Mock navigator.sendBeacon (already done in setup.ts)
expect(window.navigator.sendBeacon).toBeDefined();

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();

// Spy on functions
const spy = vi.fn();
transport.send = spy;
expect(spy).toHaveBeenCalledWith(expectedArgs);
```

## Coverage Goals

Target: **70%** coverage across all metrics
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

Priority areas for coverage:
1. **Core modules** (queue, privacy) - aim for 90%+
2. **Event collectors** - aim for 80%+
3. **Engine and lifecycle** - aim for 75%+
4. **Transport layer** - aim for 70%+

## Test Organization Guidelines

1. **Mirror source structure**: Test files should mirror `src/` directory structure
2. **One test file per source file**: `src/core/queue.ts` → `tests/core/queue.test.ts`
3. **Descriptive names**: Use `describe` blocks for classes/modules and methods
4. **Arrange-Act-Assert**: Follow AAA pattern in test bodies
5. **Test one thing**: Each `it` block should test a single behavior
6. **Use helpers**: Leverage test helpers for common setup

## Best Practices

### ✅ Do
- Clean up DOM after tests (done automatically in setup.ts)
- Use `createTest*()` helpers for fixtures
- Test error cases and edge cases
- Mock external dependencies (network, timers)
- Use meaningful test descriptions

### ❌ Don't
- Test implementation details (test behavior, not internals)
- Share mutable state between tests
- Use real timers for time-dependent tests
- Make network requests in tests
- Hardcode test data (use factories)

## Debugging Tests

```bash
# Run a specific test file
npx vitest tests/core/queue.test.ts

# Run tests matching a pattern
npx vitest --grep "should flush"

# Run with verbose output
npx vitest --reporter=verbose

# Debug in Chrome DevTools
npm run test:ui
```

## CI/CD Integration

Tests run automatically in CI with coverage reporting. The build will fail if:
- Any test fails
- Coverage drops below 70% threshold
- TypeScript compilation errors occur

## Next Steps

Current status: **Test infrastructure complete ✅**

To reach production-ready test coverage:
1. Add tests for all collectors (Keystroke, Focus, Caret, Selection, Clipboard)
2. Add tests for TelemetryEngine
3. Add tests for field discovery
4. Add tests for lifecycle hooks
5. Add tests for transport implementations
6. Add integration tests for full workflows

Expected timeline: ~2-3 days for comprehensive coverage
