import { TelemetryEvent } from '../schemas/events.js';
import { Transport } from '../client/transport.js';
import { QueueOptions } from '../schemas/config.js';

/**
 * In-memory queue with batching support and size limits.
 */
export class Queue {
    private buffer: TelemetryEvent[] = [];
    private transport: Transport;
    private flushTimer?: number;
    private batchSize: number;
    private flushInterval: number;
    private maxQueueSize: number;
    private droppedEvents: number = 0;
    private flushing: boolean = false;

    constructor(transport: Transport, options: QueueOptions = {}) {
        this.transport = transport;

        // 0 is allowed for flushInterval (disables timer), but not negative
        const batchSize = options.batchSize ?? 10;
        if (batchSize < 1 || !Number.isFinite(batchSize)) {
            throw new Error(`[CITC] queue.batchSize must be >= 1 and finite, got: ${batchSize}`);
        }
        this.batchSize = Math.floor(batchSize);

        const flushInterval = options.flushInterval ?? 5000;
        if (flushInterval < 0 || !Number.isFinite(flushInterval)) {
            throw new Error(`[CITC] queue.flushInterval must be >= 0 and finite, got: ${flushInterval}`);
        }
        this.flushInterval = Math.floor(flushInterval);

        const maxQueueSize = options.maxQueueSize ?? 1000;
        if (maxQueueSize < 1 || !Number.isFinite(maxQueueSize)) {
            throw new Error(`[CITC] queue.maxQueueSize must be >= 1 and finite, got: ${maxQueueSize}`);
        }
        this.maxQueueSize = Math.floor(maxQueueSize);
    }

    /** Drops oldest event if at capacity (FIFO eviction). */
    enqueue(event: TelemetryEvent): void {
        if (this.buffer.length >= this.maxQueueSize) {
            this.buffer.shift();
            this.droppedEvents++;

            if (this.droppedEvents % 100 === 0) {
                console.warn(`[CITC] Queue overflow: ${this.droppedEvents} events dropped`);
            }
        }

        this.buffer.push(event);

        if (this.buffer.length >= this.batchSize) {
            this.flush();
        } else {
            this.scheduleFlush();
        }
    }

    getDroppedCount(): number {
        return this.droppedEvents;
    }

    async flush(): Promise<void> {
        if (this.flushing) {
            return;
        }

        if (this.flushTimer !== undefined) {
            clearTimeout(this.flushTimer);
            this.flushTimer = undefined;
        }

        if (this.buffer.length === 0) {
            return;
        }

        this.flushing = true;
        const events = this.buffer.splice(0);

        try {
            await this.transport.send(events);
        } catch (error) {
            // Restore events to the front of the buffer for retry on next flush
            console.error('[CITC] Transport failed, restoring events to queue:', error);

            const availableSpace = this.maxQueueSize - this.buffer.length;
            if (availableSpace > 0) {
                const eventsToRestore = events.slice(0, availableSpace);
                this.buffer.unshift(...eventsToRestore);

                const dropped = events.length - eventsToRestore.length;
                if (dropped > 0) {
                    this.droppedEvents += dropped;
                    console.warn(
                        `[CITC] Queue overflow after transport failure: ` +
                        `${dropped} events dropped, ${eventsToRestore.length} restored`
                    );
                }
            } else {
                this.droppedEvents += events.length;
                console.warn(
                    `[CITC] Queue full after transport failure: ` +
                    `${events.length} events dropped`
                );
            }
        } finally {
            this.flushing = false;
        }
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
