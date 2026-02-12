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
        
        // Validate and set batchSize (must be positive integer)
        const batchSize = options.batchSize ?? 10;
        if (batchSize < 1 || !Number.isFinite(batchSize)) {
            throw new Error(`[CITC] queue.batchSize must be >= 1 and finite, got: ${batchSize}`);
        }
        this.batchSize = Math.floor(batchSize);
        
        // Validate and set flushInterval (0 is allowed to disable, but not negative)
        const flushInterval = options.flushInterval ?? 5000;
        if (flushInterval < 0 || !Number.isFinite(flushInterval)) {
            throw new Error(`[CITC] queue.flushInterval must be >= 0 and finite, got: ${flushInterval}`);
        }
        this.flushInterval = Math.floor(flushInterval);
        
        // Validate and set maxQueueSize (must be positive integer)
        const maxQueueSize = options.maxQueueSize ?? 1000;
        if (maxQueueSize < 1 || !Number.isFinite(maxQueueSize)) {
            throw new Error(`[CITC] queue.maxQueueSize must be >= 1 and finite, got: ${maxQueueSize}`);
        }
        this.maxQueueSize = Math.floor(maxQueueSize);
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
        } catch (error) {
            // Transport failed - restore events to front of buffer
            // to retry on next flush (respecting maxQueueSize)
            console.error('[CITC] Transport failed, restoring events to queue:', error);
            
            // Restore events to front of buffer, but respect maxQueueSize
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
                // No space - drop all events
                this.droppedEvents += events.length;
                console.warn(
                    `[CITC] Queue full after transport failure: ` +
                    `${events.length} events dropped`
                );
            }
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
