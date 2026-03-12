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
        const fields: DiscoveredField[] = [];
        
        // The DOM will validate formatting when querying but we need to check if the attribute is provided first
        const attr = config.attribute;
        if (!attr) {
            throw new Error("[CITC] Received an empty attribute string. Check your AttributeFieldSelection configuration");
        }
        
        try {
            const elements = document.querySelectorAll<HTMLElement>(`[${attr}]`);
            elements.forEach((element) => {
                const id = element.getAttribute(attr);
                if (id) {
                    fields.push({
                        id,
                        element,
                        capture: this.mergeCapture(config.capture),
                    });
                }
            });
        } catch (error) {
            console.error(`[CITC] Invalid attribute: ${attr}`);
            throw error;
        }
    
        return fields;
    }

    private discoverExplicit(fields: Array<{ id: string; selector: string; capture?: CaptureConfig }>): DiscoveredField[] {
        const discovered: DiscoveredField[] = [];

        for (const field of fields) {
            if (!field.selector) {
                throw new Error("[CITC] Received an empty field selector. Check your ExplicitField configuration");
            }

            try {
                const element = document.querySelector<HTMLElement>(field.selector);
                if (element) {
                    discovered.push({
                        id: field.id,
                        element,
                        capture: this.mergeCapture(field.capture),
                    });
                }
            } catch (error) {
                console.error(`[CITC] Invalid selector: ${field.selector}`);
                throw error;
            }
            
        }

        return discovered;
    }

    buildField(element: HTMLElement, id: string, capture?: CaptureConfig): DiscoveredField {
        return { id, element, capture: this.mergeCapture(capture) };
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
