import { RawEvent, TelemetryEvent } from '../schemas/events.js';
import { Context } from '../schemas/context.js';

/**
 * Processes raw events into telemetry events with context enrichment.
 */
export class EventProcessor {
    private context: Context;

    constructor(initialContext: Partial<Context> = {}) {
        this.context = {
            sessionId: this.generateSessionId(),
            ...initialContext,
        };
    }

    /**
     * Updates the current context.
     * Validates that the context is JSON-serializable to prevent crashes during transport.
     */
    setContext(ctx: Partial<Context>): void {
        // Validate context is serializable
        try {
            JSON.stringify(ctx);
        } catch (error) {
            console.error(
                '[CITC] Invalid context: must be JSON-serializable. ' +
                'Circular references and non-serializable values are not allowed.',
                error
            );
            return; // Don't update context with invalid data
        }
        
        this.context = { ...this.context, ...ctx };
    }

    /**
     * Processes a raw event into a telemetry event.
     */
    process(raw: RawEvent): TelemetryEvent {
        return {
            type: raw.type,
            fieldId: raw.fieldId,
            timestamp: raw.timestamp ?? Date.now(),
            context: { ...this.context },
            data: raw.data ?? {},
        };
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
