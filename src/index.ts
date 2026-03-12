import { TelemetryEngine } from './client/engine.js';
import { CITCOptions } from './schemas/config.js';

/**
 * Track active instances to prevent accidental duplicate initialization.
 */
let activeInstances = 0;
const MAX_INSTANCES = 1;

/**
 * Main entry point: creates and returns a TelemetryEngine instance.
 * 
 * @param options - Configuration options for the telemetry engine
 * @returns A TelemetryEngine instance with start() and stop() methods
 * 
 * @example
 * ```typescript
 * const citc = CITC({
 *   endpoint: 'https://api.example.com/telemetry',
 *   fields: { mode: 'attribute', attribute: 'data-track' }
 * });
 * citc.start();
 * ```
 */
export function CITC(options?: CITCOptions): TelemetryEngine {
    // Warn if creating multiple instances
    if (activeInstances >= MAX_INSTANCES) {
        console.warn(
            `[CITC] Warning: Creating instance #${activeInstances + 1}. ` +
            `Multiple concurrent instances may cause duplicate event collection. ` +
            `Call .stop() on existing instances before creating new ones.`
        );
    }
    
    const engine = new TelemetryEngine(options);
    activeInstances++;
    
    // Wrap stop() to decrement counter
    const originalStop = engine.stop.bind(engine);
    engine.stop = async function() {
        await originalStop();
        activeInstances = Math.max(0, activeInstances - 1);
    };
    
    return engine;
}

// Re-export public types
export type {
    Context,
    RawEvent,
    TelemetryEvent,
    CaptureConfig,
    AttributeFieldSelection,
    ExplicitField,
    FieldSelection,
    PrivacyOptions,
    DOMOptions,
    DefaultsOptions,
    CITCOptions,
    QueueOptions,
    LifecycleOptions
} from './schemas';

// Re-export engine type
export { TelemetryEngine } from './client/engine.js';

// Re-export transport types for custom implementations
export type { Transport } from './client/transport.js';
export { HttpTransport, BeaconTransport, ConsoleTransport } from './client/transport.js';
