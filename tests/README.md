# Test Infrastructure

Test suite using Vitest + jsdom with 165 tests and 95%+ coverage.

## Structure

```
tests/
├── setup.ts, helpers.ts     # Global setup and test utilities
├── core/                    # Queue, privacy filtering
├── client/                  # Engine, transport, lifecycle, collectors
└── schemas/                 # Type validation
```

## Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Interactive UI
```

## Quick Reference

```typescript
// Test helpers
import { createTestEvent, createMockTransport, waitFor } from '../helpers';

// Basic test
describe('Module', () => {
  it('does something', () => {
    const result = module.process(input);
    expect(result).toBeDefined();
  });
});

// Mock transport
const transport = createMockTransport();
expect(transport.send).toHaveBeenCalledWith(expectedPayload);

// DOM testing
const input = createTestInput({ name: 'email', dataField: 'email' });
document.body.appendChild(input);
```