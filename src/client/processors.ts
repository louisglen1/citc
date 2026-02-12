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
     */
    setContext(ctx: Partial<Context>): void {
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
