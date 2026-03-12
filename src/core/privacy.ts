import { TelemetryEvent } from '../schemas/events.js';
import { PrivacyOptions } from '../schemas/config.js';

/**
 * Applies privacy filters to telemetry events.
 */
export class Privacy {
    private options: PrivacyOptions;

    constructor(options: PrivacyOptions = {}) {
        this.options = {
            redactText: options.redactText ?? true,
            redactClipboard: options.redactClipboard ?? true,
        };
    }

    /**
     * Filters a telemetry event according to privacy rules.
     * Uses deep cloning to prevent reference leaks in nested objects.
     */
    filter(event: TelemetryEvent): TelemetryEvent {
        // Deep clone to prevent nested object reference leaks
        const filtered = structuredClone(event);

        // Redact keystroke text
        if (this.options.redactText && event.type === 'keystroke') {
            if (filtered.data.key !== undefined) {
                filtered.data.key = null;
            }
            if (filtered.data.code !== undefined) {
                filtered.data.code = null;
            }
        }

        // Redact clipboard content
        if (this.options.redactClipboard && event.type === 'clipboard' && filtered.data.content !== undefined) {
            filtered.data.content = null;
        }

        // Redact selection text
        if (this.options.redactText && event.type === 'selection' && filtered.data.text !== undefined) {
            filtered.data.text = null;
        }

        // Redact deleted text
        if (this.options.redactText && event.type === 'deletion' && filtered.data.text !== undefined) {
            filtered.data.text = null;
        }

        return filtered;
    }
}
