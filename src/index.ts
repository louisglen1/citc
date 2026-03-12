import { TelemetryEngine } from './client/engine.js';
import { CITCOptions } from './schemas/config.js';

// Warn if creating multiple concurrent instances
let activeInstances = 0;
const MAX_INSTANCES = 1;

export function CITC(options?: CITCOptions): TelemetryEngine {
    if (activeInstances >= MAX_INSTANCES) {
        console.warn(
            `[CITC] Warning: Creating instance #${activeInstances + 1}. ` +
            `Multiple concurrent instances may cause duplicate event collection. ` +
            `Call .stop() on existing instances before creating new ones.`
        );
    }
    
    const engine = new TelemetryEngine(options);
    activeInstances++;
    
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

export { TelemetryEngine } from './client/engine.js';

// Re-export transport types for custom implementations
export type { Transport } from './client/transport.js';
export { HttpTransport, BeaconTransport, ConsoleTransport } from './client/transport.js';
