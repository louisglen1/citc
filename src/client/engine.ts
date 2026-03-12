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
    private observer?: MutationObserver;

    constructor(options: CITCOptions = {}) {
        this.options = options;

        this.transport = this.createTransport();
        this.discovery = new FieldDiscovery(options.defaults?.capture);
        this.processor = new EventProcessor(options.context);
        this.privacy = new Privacy(options.privacy);
        this.queue = new Queue(this.transport, options.queue);
        this.lifecycle = new LifecycleManager(
            options.lifecycle ?? {},
            () => this.flush()
        );
        this.targets = new TargetManager((raw: RawEvent) => {
            this.handleRawEvent(raw);
        });
    }

    /** Idempotent. Fields are discovered at call time. */
    start(): void {
        if (this.running) {
            return;
        }

        const fields = this.discovery.discover(this.options.fields);

        if (fields.length === 0) {
            console.warn('[CITC] No fields discovered. Collection will not start.\n' +
                'Check your field selection configuration:\n' +
                '  - Ensure elements exist in DOM before calling start()\n' +
                '  - Verify selector/attribute matches your HTML\n' +
                '  - Current config:', 
                this.options.fields || { mode: 'default' }
            );
        }

        this.targets.attach(fields);

        if (this.options.dom?.observeMutations) {
            this.observer = this.createMutationObserver();
            this.observer?.observe(document.body, { childList: true, subtree: true});
        }

        this.lifecycle.setup();
        this.running = true;
    }

    /** Idempotent. Flushes pending events before resolving. */
    async stop(): Promise<void> {
        if (!this.running) {
            return;
        }

        this.lifecycle.teardown();
        this.targets.detach();
        await this.queue.flush();
        this.observer?.disconnect();
        this.observer = undefined;
        this.running = false;
    }

    async flush(): Promise<void> {
        await this.queue.flush();
    }

    /** Merges ctx into the current context. Affects all subsequent events. */
    setContext(ctx: Partial<Context>): void {
        this.processor.setContext(ctx);
    }

    private handleRawEvent(raw: RawEvent): void {
        const telemetry = this.processor.process(raw);
        const filtered = this.privacy.filter(telemetry);

        if (this.options.debug) {
            console.log('[CITC Debug]', filtered);
        }

        this.queue.enqueue(filtered);
    }

    private createTransport(): Transport {
        if (this.options.transport) {
            return this.options.transport;
        }

        if (this.options.endpoint) {
            if ('sendBeacon' in navigator) {
                return new BeaconTransport(this.options.endpoint);
            }
            return new HttpTransport(this.options.endpoint);
        }

        return new ConsoleTransport();
    }

    private createMutationObserver(): MutationObserver {
        const fieldConfig = this.options.fields;
        if (!fieldConfig || Array.isArray(fieldConfig) || fieldConfig.mode !== 'attribute') {
            return new MutationObserver(() => {});
        }

        const attr = fieldConfig.attribute;
        return new MutationObserver((mutations) => {
            const newElements: HTMLElement[] = [];
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (node.hasAttribute(attr)) newElements.push(node);
                    node.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el => newElements.push(el));
                }
            }

            if (newElements.length === 0) return;
            const newFields = newElements
                .map(el => ({ id: el.getAttribute(attr)!, element: el }))
                .filter(f => f.id);

            // Build DiscoveredField with merged capture config
            const discovered = newFields.map(f => this.discovery.buildField(f.element, f.id, fieldConfig.capture));
            this.targets.attach(discovered);
        })
    }
}
