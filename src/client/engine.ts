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
        this.queue = new Queue(this.transport, options.queue);

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
     * 
     * Discovers fields based on configuration, attaches collectors to each field,
     * and sets up lifecycle hooks for automatic flushing.
     * 
     * @remarks
     * - Idempotent: calling start() multiple times has no effect
     * - Fields are discovered at start time (for dynamic fields, call stop() then start())
     * - Event listeners are attached synchronously
     * 
     * @example
     * ```typescript
     * const citc = CITC({ endpoint: '/api/telemetry' });
     * citc.start();  // Begin collecting events
     * ```
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
     * 
     * Tears down lifecycle hooks, detaches all collectors, removes event listeners,
     * and sends any queued events before completing.
     * 
     * @returns Promise that resolves when all pending events are flushed
     * 
     * @remarks
     * - Safe to call multiple times (idempotent)
     * - Always await stop() to ensure events are sent before page navigation
     * - In SPAs, call stop() before unmounting the component that initialized CITC
     * 
     * @example
     * ```typescript
     * // React example
     * useEffect(() => {
     *   const citc = CITC(config);
     *   citc.start();
     *   return () => { citc.stop(); }; // Cleanup on unmount
     * }, []);
     * ```
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
     * Flushes pending events without stopping collection.
     * 
     * Manually triggers a flush of all queued events. Useful for ensuring
     * events are sent before critical navigation or state changes.
     * 
     * @returns Promise that resolves when flush completes
     * 
     * @remarks
     * - Does not stop collection - events continue to be captured
     * - Automatically called by lifecycle hooks (visibility change, unload, etc.)
     * - Safe to call concurrently - flushes are serialized
     * 
     * @example
     * ```typescript
     * // Flush before navigation
     * async function navigate(url: string) {
     *   await citc.flush();
     *   window.location.href = url;
     * }
     * ```
     */
    async flush(): Promise<void> {
        await this.queue.flush();
    }

    /**
     * Updates the telemetry context.
     * 
     * Context is metadata included with every event (e.g., userId, sessionId).
     * Use this to update context dynamically after authentication or state changes.
     * 
     * @param ctx - Partial context to merge with existing context
     * 
     * @remarks
     * - Context is merged, not replaced (pass undefined to clear a field)
     * - Changes affect all events captured after this call
     * - Context persists until stop() is called
     * 
     * @example
     * ```typescript
     * // Update context after user login
     * citc.setContext({
     *   userId: user.id,
     *   sessionId: generateSessionId()
     * });
     * 
     * // Clear userId on logout
     * citc.setContext({ userId: undefined });
     * ```
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
