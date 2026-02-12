import { TelemetryEngine } from './client/engine.js';
import { CITCOptions } from './schemas/config.js';

/**
 * Main entry point: creates and returns a TelemetryEngine instance.
 */
export function CITC(options?: CITCOptions): TelemetryEngine {
    return new TelemetryEngine(options);
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
} from './schemas';

// Re-export engine type
export { TelemetryEngine } from './client/engine.js';

// Re-export transport types for custom implementations
export type { Transport } from './client/transport.js';
export { HttpTransport, BeaconTransport, ConsoleTransport } from './client/transport.js';
