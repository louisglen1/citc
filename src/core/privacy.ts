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
     */
    filter(event: TelemetryEvent): TelemetryEvent {
        const filtered = { ...event, data: { ...event.data } };

        // Redact keystroke text
        if (this.options.redactText && event.type === 'keystroke' && filtered.data.key) {
            filtered.data.key = '[REDACTED]';
        }

        // Redact clipboard content
        if (this.options.redactClipboard && event.type === 'clipboard' && filtered.data.content) {
            filtered.data.content = '[REDACTED]';
        }

        // Redact selection text
        if (this.options.redactText && event.type === 'selection' && filtered.data.text) {
            filtered.data.text = '[REDACTED]';
        }

        return filtered;
    }
}
