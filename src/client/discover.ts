import { FieldSelection, CaptureConfig } from '../schemas/config.js';

/**
 * Discovered field target.
 */
export interface DiscoveredField {
    id: string;
    element: HTMLElement;
    capture: CaptureConfig;
}

/**
 * Resolves field selection configuration into concrete DOM elements.
 */
export class FieldDiscovery {
    private defaults: CaptureConfig;

    constructor(defaults: CaptureConfig = {}) {
        this.defaults = {
            focus: defaults.focus ?? true,
            keystroke: defaults.keystroke ?? true,
            caret: defaults.caret ?? false,
            selection: defaults.selection ?? false,
            clipboard: defaults.clipboard ?? false,
        };
    }

    /**
     * Discovers fields based on selection configuration.
     */
    discover(selection?: FieldSelection): DiscoveredField[] {
        if (!selection) {
            return [];
        }

        if (Array.isArray(selection)) {
            return this.discoverExplicit(selection);
        }

        return this.discoverByAttribute(selection);
    }

    private discoverByAttribute(config: { mode: 'attribute'; attribute: string; capture?: CaptureConfig }): DiscoveredField[] {
        const elements = document.querySelectorAll<HTMLElement>(`[${config.attribute}]`);
        const fields: DiscoveredField[] = [];

        elements.forEach((element) => {
            const id = element.getAttribute(config.attribute);
            if (id) {
                fields.push({
                    id,
                    element,
                    capture: this.mergeCapture(config.capture),
                });
            }
        });

        return fields;
    }

    private discoverExplicit(fields: Array<{ id: string; selector: string; capture?: CaptureConfig }>): DiscoveredField[] {
        const discovered: DiscoveredField[] = [];

        for (const field of fields) {
            const element = document.querySelector<HTMLElement>(field.selector);
            if (element) {
                discovered.push({
                    id: field.id,
                    element,
                    capture: this.mergeCapture(field.capture),
                });
            }
        }

        return discovered;
    }

    private mergeCapture(override?: CaptureConfig): CaptureConfig {
        return {
            focus: override?.focus ?? this.defaults.focus,
            keystroke: override?.keystroke ?? this.defaults.keystroke,
            caret: override?.caret ?? this.defaults.caret,
            selection: override?.selection ?? this.defaults.selection,
            clipboard: override?.clipboard ?? this.defaults.clipboard,
        };
    }
}
