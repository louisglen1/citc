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
        this.batchSize = options.batchSize ?? 10;
        this.flushInterval = options.flushInterval ?? 5000;
        this.maxQueueSize = options.maxQueueSize ?? 1000;
    }

    /**
     * Enqueues an event and schedules flush.
     * If queue is at max capacity, drops oldest events (FIFO eviction).
     */
    enqueue(event: TelemetryEvent): void {
        // Enforce queue size limit with drop-oldest policy
        if (this.buffer.length >= this.maxQueueSize) {
            this.buffer.shift(); // Drop oldest event
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

    /**
     * Returns the number of events dropped due to queue overflow.
     */
    getDroppedCount(): number {
        return this.droppedEvents;
    }

    /**
     * Flushes all buffered events.
     * Uses a mutex to prevent concurrent flush operations.
     */
    async flush(): Promise<void> {
        // Prevent concurrent flushes
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
        } finally {
            // Always release lock, even if transport fails
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
