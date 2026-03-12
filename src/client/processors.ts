import { RawEvent, TelemetryEvent } from '../schemas/events.js';
import { Context } from '../schemas/context.js';

export class EventProcessor {
    private context: Context;

    constructor(initialContext: Partial<Context> = {}) {
        this.context = {
            sessionId: this.generateSessionId(),
            ...initialContext,
        };
    }

    /** Validates that ctx is JSON-serializable before merging (prevents transport crashes). */
    setContext(ctx: Partial<Context>): void {
        try {
            JSON.stringify(ctx);
        } catch (error) {
            console.error(
                '[CITC] Invalid context: must be JSON-serializable. ' +
                'Circular references and non-serializable values are not allowed.',
                error
            );
            return;
        }

        this.context = { ...this.context, ...ctx };
    }

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
