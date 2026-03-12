import { TelemetryEvent } from '../schemas/events.js';

/**
 * Transport interface for sending telemetry events.
 * 
 * Implementations are responsible for delivering batched events to a backend service.
 * The SDK includes built-in HTTP, Beacon, and Console transports, but custom
 * implementations can be provided via the `transport` config option.
 * 
 * @example
 * ```typescript
 * class CustomTransport implements Transport {
 *   async send(events: TelemetryEvent[]): Promise<void> {
 *     // Custom delivery logic (e.g., WebSocket, IndexedDB, etc.)
 *     await myCustomSender(events);
 *   }
 * }
 * 
 * CITC({ transport: new CustomTransport() }).start();
 * ```
 */
export interface Transport {
    /**
     * Sends a batch of telemetry events.
     * 
     * @param events - Array of processed telemetry events to send
     * @returns Promise that resolves when events are sent (or fails silently)
     * 
     * @remarks
     * - Called automatically by the queue when batch size or flush interval is reached
     * - For `beforeunload` reliability, use BeaconTransport (synchronous sendBeacon API)
     */
    send(events: TelemetryEvent[]): Promise<void>;
}

/**
 * HTTP transport using fetch API.
 */
export class HttpTransport implements Transport {
    private endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    async send(events: TelemetryEvent[]): Promise<void> {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
        });

        if (!response.ok) {
            throw new Error("[CITC] HTTP transport failed: " + response.status);
        }
    }
}

// BeaconTransport is fire-and-forget, dropped events will not be re-queued.
// The nature of this transport method (especially when used on page unload)
// means splicing failed beacon events into the queue would be unreliable
export class BeaconTransport implements Transport {
    private endpoint: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
    }

    async send(events: TelemetryEvent[]): Promise<void> {
        try {
            const blob = new Blob([JSON.stringify({ events })], {
                type: 'application/json',
            });
            // sendBeacon is synchronous and returns immediately
            const success = navigator.sendBeacon(this.endpoint, blob);

            if (!success) {
                console.error('[CITC] Beacon transport failed (queue may be full)');
            }
        } catch (error) {
            console.error('[CITC] Beacon transport error:', error);
        }
        // Return immediately - sendBeacon completes synchronously
    }
}

/**
 * Console transport for debugging (default when no endpoint provided).
 */
export class ConsoleTransport implements Transport {
    async send(events: TelemetryEvent[]): Promise<void> {
        console.log('[CITC] Events:', events);
    }
}
