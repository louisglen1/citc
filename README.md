# CITC (Client Input Telemetry Collection)

A minimal, production-ready browser telemetry SDK for collecting user input events with privacy-first defaults.

I needed interaction-level telemetry for a research project and couldn't find a library that was both minimal and privacy-centric, so I built one.


## What it does

CITC captures how clients interact with form fields through collating focus patterns, keystroke timings, caret movement, text selection, and clipboard action; data is sent to your analytics endpoint or outputted in the console. Sensitive content is redacted by default and the SDK never captures raw input values.

## Features

- **Zero dependencies** – Pure TypeScript, no external libraries
- **Privacy-safe defaults** – Redacts key content, selections, and clipboard data by default
- **Flexible field discovery** – Attribute-based (`data-citc`) or explicit selector mode
- **Extensible transport** – HTTP, Beacon, Console, or bring your own
- **Reliable delivery** – Event queue with batching, overflow protection, and lifecycle hooks
- **Type-safe** – Full TypeScript support with complete type definitions

## Installation

```bash
npm install @louisglen1/citc
```

## Quick Start

```typescript
import { CITC } from '@louisglen1/citc';

const telemetry = CITC({
    endpoint: 'https://api.example.com/telemetry',
    fields: {
        mode: 'attribute',
        attribute: 'data-citc',
    },
});

telemetry.start();

// Attach a user ID once known
telemetry.setContext({ userId: '12345' });

// Manually flush pending events
await telemetry.flush();

// Stop collecting and flush remaining events
await telemetry.stop();
```

Mark fields in your HTML with the attribute:

```html
<input type="text" data-citc="username" />
<input type="email" data-citc="email" />
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
            fields: { mode: 'attribute', attribute: 'data-citc' },
        });

        telemetry.start();
    </script>
</body>
</html>
```

## Configuration

```typescript
CITC({
    endpoint?:  string,           // if omitted, uses ConsoleTransport
    transport?: Transport,
    fields?:    FieldSelection,
    privacy?:   PrivacyOptions,
    queue?:     QueueOptions,
    lifecycle?: LifecycleOptions,
    context?:   Partial<Context>,
    defaults?:  DefaultsOptions,
    debug?:     boolean,
})
```

### Field Discovery

**Attribute mode** — discovers all elements with a given data attribute at `start()` time. The attribute value becomes the field ID.

```typescript
CITC({
    fields: {
        mode: 'attribute',
        attribute: 'data-citc',   // matches <input data-citc="fieldName">
        capture: {
            focus:     true,   // default
            keystroke: true,   // default
            caret:     false,  // default
            selection: false,  // default
            clipboard: false,  // default
        },
    },
});
```

**Explicit mode** — specify fields by CSS selector with per-field capture config.

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

**Default capture config** — applied to all fields before per-field overrides.

```typescript
CITC({
    defaults: {
        capture: { focus: true, keystroke: true, caret: false },
    },
});
```

### Privacy

```typescript
CITC({
    privacy: {
        redactText?:      boolean,  // default: true  — nulls keystroke.key, keystroke.code, selection.text
        redactClipboard?: boolean,  // default: true  — nulls clipboard.content
    },
});
```

See [Privacy Model](#privacy-model) for a full breakdown of what is and isn't captured.

### Queue

```typescript
CITC({
    queue: {
        batchSize?:     number,  // default: 10    — flush after N events
        flushInterval?: number,  // default: 5000  — flush every N ms
        maxQueueSize?:  number,  // default: 1000  — drops oldest beyond this
    },
});
```

### Lifecycle Hooks

```typescript
CITC({
    lifecycle: {
        enabled?:                boolean,  // default: true
        autoFlushIntervalMs?:    number,   // default: 5000
        flushOnVisibilityChange?: boolean, // default: true  — flush when tab is hidden
        flushOnBeforeUnload?:    boolean,  // default: true  — flush before page unload
        flushOnFormSubmit?:      boolean,  // default: false — flush on data-citc-submit forms
    },
});
```

> **Note:** `flushOnBeforeUnload` works most reliably with `BeaconTransport`. HTTP requests may not complete before the page closes.

### Context

Attached to every event. Can also be updated at any time with `setContext()`.

```typescript
CITC({
    context: {
        userId?:      string,
        environment?: string,
        metadata?:    Record<string, unknown>,
        // sessionId is generated automatically
    },
});

telemetry.setContext({ userId: 'user-456' });
```

## Transports

### ConsoleTransport (default)

Logs events to the browser console. Used automatically when no `endpoint` is provided. Useful during development.

```typescript
import { CITC, ConsoleTransport } from '@louisglen1/citc';

CITC({ transport: new ConsoleTransport() });
```

### HttpTransport

Sends events as a JSON `POST` request via `fetch`. Used automatically when `endpoint` is set and `sendBeacon` is unavailable.

```typescript
import { CITC, HttpTransport } from '@louisglen1/citc';

CITC({ transport: new HttpTransport('https://api.example.com/telemetry') });
```

### BeaconTransport

Sends events using `navigator.sendBeacon`, which is guaranteed to complete even if the page is navigating away. Recommended for `flushOnBeforeUnload` scenarios.

```typescript
import { CITC, BeaconTransport } from '@louisglen1/citc';

CITC({ transport: new BeaconTransport('https://api.example.com/telemetry') });
```

When `endpoint` is provided, CITC automatically selects `BeaconTransport` if `sendBeacon` is available, otherwise falls back to `HttpTransport`.

### Custom Transport

Implement the `Transport` interface to send events anywhere.

```typescript
import { CITC, Transport, TelemetryEvent } from '@louisglen1/citc';

class MyTransport implements Transport {
    async send(events: TelemetryEvent[]): Promise<void> {
        // send events to your backend
    }
}

CITC({ transport: new MyTransport() });
```

## Privacy Model

CITC is designed to collect interaction patterns, not content. Here is exactly what each event type captures:

| Event | Always captured | Redacted by default | Opt-in raw content |
|-------|----------------|--------------------|--------------------|
| `focus` | field ID, timestamp | — | — |
| `blur` | field ID, timestamp | — | — |
| `keystroke` | field ID, timestamp, modifier keys (Ctrl/Shift/Alt/Meta) | `key`, `code` | Set `redactText: false` |
| `caret` | field ID, timestamp, cursor position (start, end) | — | — |
| `selection` | field ID, timestamp, selection range (start, end, length) | selected text | Set `redactText: false` |
| `clipboard` | field ID, timestamp, content length | clipboard content | Set `redactClipboard: false` |

**What CITC never captures:**
- The full value of any input field
- Passwords or any input of type `password`
- Content unless a collector is explicitly enabled and redaction is disabled

**Default behaviour** collects only metadata: that a key was pressed (not which one), that a selection was made (not what text), that something was pasted (not what). Redaction happens in the browser before events are queued, so raw content never reaches the transport.

## API Reference

### `CITC(options?: CITCOptions): TelemetryEngine`

Creates and returns a new telemetry engine instance. Logs a warning if more than one active instance is detected.

### `TelemetryEngine`

| Method | Signature | Description |
|--------|-----------|-------------|
| `start` | `(): void` | Discover fields and begin collecting events |
| `stop` | `(): Promise<void>` | Stop collecting, flush remaining events, and clean up |
| `flush` | `(): Promise<void>` | Flush pending events without stopping |
| `setContext` | `(ctx: Partial<Context>): void` | Merge new values into the session context |

### Types

```typescript
import type {
    CITCOptions,
    CaptureConfig,
    PrivacyOptions,
    QueueOptions,
    LifecycleOptions,
    FieldSelection,
    AttributeFieldSelection,
    ExplicitField,
    Transport,
    TelemetryEvent,
    RawEvent,
    Context,
} from '@louisglen1/citc';
```

## License

MIT
