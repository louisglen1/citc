import { TelemetryEvent } from '../schemas/events.js';
import { Transport } from '../client/transport.js';

/**
 * In-memory queue with batching support.
 */
export class Queue {
    private buffer: TelemetryEvent[] = [];
    private transport: Transport;
    private flushTimer?: number;
    private batchSize: number = 10;
    private flushInterval: number = 5000;

    constructor(transport: Transport) {
        this.transport = transport;
    }

    /**
     * Enqueues an event and schedules flush.
     */
    enqueue(event: TelemetryEvent): void {
        this.buffer.push(event);

        if (this.buffer.length >= this.batchSize) {
            this.flush();
        } else {
            this.scheduleFlush();
        }
    }

    /**
     * Flushes all buffered events.
     */
    async flush(): Promise<void> {
        if (this.flushTimer !== undefined) {
            clearTimeout(this.flushTimer);
            this.flushTimer = undefined;
        }

        if (this.buffer.length === 0) {
            return;
        }

        const events = this.buffer.splice(0);
        await this.transport.send(events);
    }

    private scheduleFlush(): void {
        if (this.flushTimer !== undefined) {
            return;
        }

        this.flushTimer = window.setTimeout(() => {
            this.flushTimer = undefined;
            this.flush();
        }, this.flushInterval);
    }
}
