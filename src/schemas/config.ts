import { Context } from './context.js';
import { Transport } from '../client/transport.js';

/**
 * Capture configuration per field or globally.
 * 
 * Controls which event collectors are enabled for a specific field or all fields.
 * 
 * @example
 * ```typescript
 * // Enable only keystroke and focus tracking
 * const capture: CaptureConfig = {
 *   keystroke: true,
 *   focus: true,
 *   caret: false,
 *   selection: false,
 *   clipboard: false
 * };
 * ```
 */
export interface CaptureConfig {
    /** Track focus/blur events on input fields */
    focus?: boolean;
    /** Track keystroke events (metadata only, no raw text) */
    keystroke?: boolean;
    /** Track caret position changes (cursor movement) */
    caret?: boolean;
    /** Track text selection events */
    selection?: boolean;
    /** Track clipboard events (cut/copy/paste) */
    clipboard?: boolean;
}

/**
 * Attribute mode: discover fields by data attribute.
 */
export interface AttributeFieldSelection {
    mode: 'attribute';
    attribute: string;
    capture?: CaptureConfig;
}

/**
 * Explicit field definition.
 */
export interface ExplicitField {
    id: string;
    selector: string;
    capture?: CaptureConfig;
}

/**
 * Field selection: either attribute mode or explicit list.
 */
export type FieldSelection = AttributeFieldSelection | ExplicitField[];

/**
 * Privacy filtering options.
 * 
 * Controls what data is redacted before events are queued for transmission.
 * All options default to `true` for maximum privacy.
 * 
 * @example
 * ```typescript
 * const privacy: PrivacyOptions = {
 *   redactText: true,      // Redact keystroke.key and selection.text
 *   redactClipboard: true  // Redact clipboard content
 * };
 * ```
 * 
 * @remarks
 * - Even with redaction disabled, CITC never captures full input values
 * - Only individual keystroke metadata is captured (key name, timestamp, modifiers)
 * - Consider GDPR/CCPA requirements when disabling redaction
 */
export interface PrivacyOptions {
    /** Redact text content from keystroke and selection events (default: true) */
    redactText?: boolean;
    /** Redact clipboard content from clipboard events (default: true) */
    redactClipboard?: boolean;
}

/**
 * DOM observation options.
 */
export interface DOMOptions {
    observeMutations?: boolean;
}

/**
 * Default configuration applied to all fields.
 */
export interface DefaultsOptions {
    capture?: CaptureConfig;
}

/**
 * Lifecycle hooks for automatic event flushing.
 * 
 * Controls when the SDK automatically flushes queued events to the transport.
 * 
 * @example
 * ```typescript
 * const lifecycle: LifecycleOptions = {
 *   enabled: true,
 *   autoFlushIntervalMs: 10000,        // Flush every 10 seconds
 *   flushOnVisibilityChange: true,      // Flush when tab becomes hidden
 *   flushOnBeforeUnload: true,          // Flush before page unloads
 *   flushOnFormSubmit: false            // Don't flush on form submit
 * };
 * ```
 */
export interface LifecycleOptions {
    /** Enable lifecycle hooks (default: true) */
    enabled?: boolean;
    /** Interval in ms for automatic flushing (default: 5000). Set to 0 to disable. */
    autoFlushIntervalMs?: number;
    /** Flush when page visibility changes to hidden (default: true) */
    flushOnVisibilityChange?: boolean;
    /** Flush before page unload (default: true). Uses BeaconTransport for reliability. */
    flushOnBeforeUnload?: boolean;
    /** Flush when forms with data-citc-submit attribute are submitted (default: false) */
    flushOnFormSubmit?: boolean;
}

/**
 * Queue configuration options.
 * 
 * Controls event batching, flush timing, and overflow behavior.
 * 
 * @example
 * ```typescript
 * const queue: QueueOptions = {
 *   batchSize: 50,         // Send 50 events per batch
 *   flushInterval: 10000,  // Flush every 10 seconds
 *   maxQueueSize: 2000     // Drop oldest events after 2000
 * };
 * ```
 */
export interface QueueOptions {
    /** Number of events per batch before auto-flush (default: 10) */
    batchSize?: number;
    /** Milliseconds between automatic flushes (default: 5000) */
    flushInterval?: number;
    /**
     * Maximum events in queue before dropping oldest (default: 1000).
     * Prevents memory exhaustion if transport fails repeatedly.
     */
    maxQueueSize?: number;
}

/**
 * Main CITC configuration.
 * 
 * All options are optional. Sensible defaults are provided for production use.
 * 
 * @example
 * ```typescript
 * const citc = CITC({
 *   endpoint: 'https://api.example.com/telemetry',
 *   fields: { mode: 'attribute', attribute: 'data-track' },
 *   privacy: { redactText: true },
 *   lifecycle: { autoFlushIntervalMs: 10000 },
 *   debug: false
 * });
 * citc.start();
 * ```
 */
export interface CITCOptions {
    /**
     * HTTP endpoint for telemetry events.
     * If omitted, uses ConsoleTransport (logs to console).
     * Automatically selects BeaconTransport if available, otherwise HttpTransport.
     */
    endpoint?: string;
    
    /**
     * Custom transport implementation.
     * Overrides endpoint and built-in transport selection.
     */
    transport?: Transport;
    
    /** Lifecycle hook configuration for automatic flushing */
    lifecycle?: LifecycleOptions;
    
    /** Event queue batching and overflow configuration */
    queue?: QueueOptions;
    
    /** Privacy filtering options (defaults maximize privacy) */
    privacy?: PrivacyOptions;
    
    /**
     * Session context included with every event.
     * Use setContext() to update after initialization.
     */
    context?: Partial<Context>;
    
    /**
     * Field selection strategy.
     * Either attribute-based discovery or explicit field list.
     */
    fields?: FieldSelection;
    
    /** Default capture configuration applied to all fields */
    defaults?: DefaultsOptions;
    
    /** DOM observation configuration */
    dom?: DOMOptions;
    
    /**
     * Enable debug mode (logs events to console).
     * Do not use in production.
     */
    debug?: boolean;
}
