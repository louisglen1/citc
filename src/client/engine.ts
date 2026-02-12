import { CITCOptions } from '../schemas/config.js';
import { Context } from '../schemas/context.js';
import { RawEvent } from '../schemas/events.js';
import { FieldDiscovery } from './discover.js';
import { TargetManager } from './targets.js';
import { EventProcessor } from './processors.js';
import { Privacy } from '../core/privacy.js';
import { Queue } from '../core/queue.js';
import { Transport, HttpTransport, BeaconTransport, ConsoleTransport } from './transport.js';
import { LifecycleManager } from './lifecycle.js';

/**
 * Main telemetry engine orchestrating discovery, collection, and transport.
 */
export class TelemetryEngine {
    private options: CITCOptions;
    private discovery: FieldDiscovery;
    private targets: TargetManager;
    private processor: EventProcessor;
    private privacy: Privacy;
    private queue: Queue;
    private transport: Transport;
    private lifecycle: LifecycleManager;
    private running: boolean = false;

    constructor(options: CITCOptions = {}) {
        this.options = options;

        // Initialize transport
        this.transport = this.createTransport();

        // Initialize core components
        this.discovery = new FieldDiscovery(options.defaults?.capture);
        this.processor = new EventProcessor(options.context);
        this.privacy = new Privacy(options.privacy);
        this.queue = new Queue(this.transport);

        // Initialize lifecycle manager
        this.lifecycle = new LifecycleManager(
            options.lifecycle ?? {},
            () => this.flush()
        );

        // Initialize target manager with event pipeline
        this.targets = new TargetManager((raw: RawEvent) => {
            this.handleRawEvent(raw);
        });
    }

    /**
     * Starts telemetry collection.
     */
    start(): void {
        if (this.running) {
            return;
        }

        const fields = this.discovery.discover(this.options.fields);
        this.targets.attach(fields);
        this.lifecycle.setup();
        this.running = true;
    }

    /**
     * Stops telemetry collection and flushes pending events.
     */
    async stop(): Promise<void> {
        if (!this.running) {
            return;
        }

        this.lifecycle.teardown();
        this.targets.detach();
        await this.queue.flush();
        this.running = false;
    }

    /**
     * Flushes pending events without stopping.
     */
    async flush(): Promise<void> {
        await this.queue.flush();
    }

    /**
     * Updates the telemetry context.
     */
    setContext(ctx: Partial<Context>): void {
        this.processor.setContext(ctx);
    }

    private handleRawEvent(raw: RawEvent): void {
        // Process raw event
        const telemetry = this.processor.process(raw);

        // Apply privacy filters
        const filtered = this.privacy.filter(telemetry);

        // Debug logging
        if (this.options.debug) {
            console.log('[CITC Debug]', filtered);
        }

        // Enqueue for transport
        this.queue.enqueue(filtered);
    }

    private createTransport(): Transport {
        // Use custom transport if provided
        if (this.options.transport) {
            return this.options.transport;
        }

        // Use endpoint-based transport
        if (this.options.endpoint) {
            // Prefer beacon for reliability
            if ('sendBeacon' in navigator) {
                return new BeaconTransport(this.options.endpoint);
            }
            return new HttpTransport(this.options.endpoint);
        }

        // Default to console for debugging
        return new ConsoleTransport();
    }
}
