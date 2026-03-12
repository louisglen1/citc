# CITC (Client Input Telemetry Collection)

A minimal browser telemetry SDK for collecting user input events. Captures interaction patterns (timing, focus, keystrokes) without capturing raw input.
Demo available at [louisglen1.github.io/citc](https://louisglen1.github.io/citc)

## Installation

```bash
npm install @louisglen1/citc
```

## Usage

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

telemetry.setContext({ userId: '12345' });

await telemetry.stop(); // flushes remaining events
```

Mark fields in HTML:

```html
<input type="text" data-citc="username" />
<input type="email" data-citc="email" />
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
    dom?:       DOMOptions,
    debug?:     boolean,
})
```

### Field Discovery

**Attribute mode** — discovers all elements with a given data attribute at `start()` time.

```typescript
fields: {
    mode: 'attribute',
    attribute: 'data-citc',
    capture: {
        focus:     true,   // default
        keystroke: true,   // default
        caret:     false,  // default
        selection: false,  // default
        clipboard: false,  // default
    },
}
```

**Explicit mode** — specify fields by CSS selector with per-field capture config.

```typescript
fields: [
    { id: 'email',    selector: '#email',    capture: { focus: true, keystroke: true } },
    { id: 'password', selector: '#password', capture: { focus: true, clipboard: false } },
]
```

**Default capture config** — applied to all fields before per-field overrides.

```typescript
defaults: {
    capture: { focus: true, keystroke: true, caret: false },
}
```

### Privacy

```typescript
privacy: {
    redactText?:      boolean,  // default: true  — nulls keystroke.key, keystroke.code, selection.text
    redactClipboard?: boolean,  // default: true  — nulls clipboard.content
}
```

### Queue

```typescript
queue: {
    batchSize?:     number,  // default: 10    — flush after N events
    flushInterval?: number,  // default: 5000  — flush N ms after last enqueue (0 to disable)
    maxQueueSize?:  number,  // default: 1000  — drops oldest when exceeded
}
```

### Lifecycle

```typescript
lifecycle: {
    enabled?:                boolean,  // default: true
    autoFlushIntervalMs?:    number,   // default: 5000  — repeating flush interval
    flushOnVisibilityChange?: boolean, // default: true  — flush when tab is hidden
    flushOnBeforeUnload?:    boolean,  // default: true  — flush before page unload
    flushOnFormSubmit?:      boolean,  // default: false — flush on data-citc-submit forms
}
```

> `flushOnBeforeUnload` works most reliably with `BeaconTransport` — HTTP requests may not complete before the page closes.

### Context

Attached to every event. Can be updated at any time with `setContext()`.

```typescript
context: {
    userId?:      string,
    environment?: string,
    metadata?:    Record<string, unknown>,
    // sessionId is generated automatically
}
```

## Transports

When `endpoint` is provided, CITC uses `BeaconTransport` if `sendBeacon` is available, otherwise `HttpTransport`. With no `endpoint`, it falls back to `ConsoleTransport`.

```typescript
import { CITC, HttpTransport, BeaconTransport, ConsoleTransport } from '@louisglen1/citc';

CITC({ transport: new BeaconTransport('https://api.example.com/telemetry') });
```

**Custom transport:**

```typescript
import { Transport, TelemetryEvent } from '@louisglen1/citc';

class MyTransport implements Transport {
    async send(events: TelemetryEvent[]): Promise<void> {
        // send anywhere
    }
}
```

## Privacy Model

| Event | Always captured | Redacted by default |
|-------|----------------|---------------------|
| `focus` / `blur` | field ID, timestamp | — |
| `keystroke` | field ID, timestamp, modifier keys | `key`, `code` |
| `caret` | field ID, timestamp, cursor position | — |
| `selection` | field ID, timestamp, range (start, end, length) | selected text |
| `clipboard` | field ID, timestamp, content length | clipboard content |

Full input values and `password` fields are never captured regardless of settings. Redaction happens in the browser before events are queued.

## API

### `CITC(options?: CITCOptions): TelemetryEngine`

| Method | Description |
|--------|-------------|
| `start(): void` | Discover fields and begin collecting |
| `stop(): Promise<void>` | Stop collecting and flush remaining events |
| `flush(): Promise<void>` | Flush pending events without stopping |
| `setContext(ctx: Partial<Context>): void` | Merge new values into the session context |

## License

MIT
