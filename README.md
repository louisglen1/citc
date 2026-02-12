# CITC (Client Input Telemetry Collection)

A minimal, production-quality browser telemetry SDK for collecting user input events with privacy-first defaults.

## Features

- **Zero dependencies** – Pure TypeScript, no external libraries
- **Privacy-safe defaults** – Redacts sensitive data by default
- **Flexible field discovery** – Attribute-based or explicit selector mode
- **Extensible transport** – HTTP, Beacon, Console, or custom
- **Type-safe** – Full TypeScript support with complete type definitions

## Installation

```bash
npm install citc
```

## Quick Start

```typescript
import { CITC } from 'citc';

// Initialize with attribute-based field discovery
const telemetry = CITC({
    endpoint: 'https://api.example.com/telemetry',
    fields: {
        mode: 'attribute',
        attribute: 'data-citc',
        capture: {
            focus: true,
            keystroke: true,
        },
    },
    privacy: {
        redactText: true,
        redactClipboard: true,
    },
});

// Start collecting
telemetry.start();

// Update context
telemetry.setContext({ userId: '12345' });

// Flush pending events
await telemetry.flush();

// Stop collecting
await telemetry.stop();
```

## HTML Example

```html
<!DOCTYPE html>
<html>
<body>
    <input type="text" data-citc="username" placeholder="Username" />
    <input type="email" data-citc="email" placeholder="Email" />

    <script type="module">
        import { CITC } from './dist/index.js';

        const telemetry = CITC({
            fields: {
                mode: 'attribute',
                attribute: 'data-citc',
            },
        });

        telemetry.start();
    </script>
</body>
</html>
```

## Configuration

### Attribute Mode

```typescript
CITC({
    fields: {
        mode: 'attribute',
        attribute: 'data-citc',
        capture: {
            focus: true,
            keystroke: true,
            caret: false,
            selection: false,
            clipboard: false,
        },
    },
});
```

### Explicit List Mode

```typescript
CITC({
    fields: [
        {
            id: 'email-field',
            selector: '#email',
            capture: { focus: true, keystroke: true },
        },
        {
            id: 'password-field',
            selector: '#password',
            capture: { focus: true, clipboard: false },
        },
    ],
});
```

## API Reference

### `CITC(options?: CITCOptions): TelemetryEngine`

Creates a new telemetry engine instance.

### `TelemetryEngine`

- `start(): void` – Start collecting events
- `stop(): Promise<void>` – Stop collecting and flush pending events
- `flush(): Promise<void>` – Flush pending events without stopping
- `setContext(ctx: Partial<Context>): void` – Update session context

## Privacy

By default, CITC redacts:
- Keystroke text content
- Clipboard paste content
- Selected text content

Only metadata (event type, timing, positions) is collected.

## License

MIT
