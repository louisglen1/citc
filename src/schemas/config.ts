import { Context } from './context.js';
import { Transport } from '../client/transport.js';

/**
 * Capture configuration per field or globally.
 */
export interface CaptureConfig {
    focus?: boolean;
    keystroke?: boolean;
    caret?: boolean;
    selection?: boolean;
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
 */
export interface PrivacyOptions {
    redactText?: boolean;
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

export interface LifecycleOptions {
    enabled?: boolean;                  // default true
    autoFlushIntervalMs?: number;       // flush every 5 seconds by default
    flushOnVisibilityChange?: boolean;  // flush when page visibility changes
    flushOnBeforeUnload?: boolean;      // flush on page unload
    flushOnFormSubmit?: boolean;        // flush when a form is submitted (citc-submit html flag)
}

/**
 * Main CITC configuration.
 */
export interface CITCOptions {
    endpoint?: string;
    transport?: Transport;
    lifecycle?: LifecycleOptions;
    privacy?: PrivacyOptions;
    context?: Partial<Context>;
    fields?: FieldSelection;
    defaults?: DefaultsOptions;
    dom?: DOMOptions;
    debug?: boolean;
}
