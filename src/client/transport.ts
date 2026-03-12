import { TelemetryEvent } from '../schemas/events.js';

/**
 * Transport interface for sending telemetry events.
 * Implement this to deliver events via WebSocket, IndexedDB, or any custom mechanism.
 */
export interface Transport {
    send(events: TelemetryEvent[]): Promise<void>;
}

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

// Fire-and-forget. Failed beacon events are not re-queued — restoring events
// after a failed sendBeacon (especially on unload) would be unreliable.
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
            const success = navigator.sendBeacon(this.endpoint, blob);

            if (!success) {
                console.error('[CITC] Beacon transport failed (queue may be full)');
            }
        } catch (error) {
            console.error('[CITC] Beacon transport error:', error);
        }
    }
}

/** Default transport when no endpoint is configured. */
export class ConsoleTransport implements Transport {
    async send(events: TelemetryEvent[]): Promise<void> {
        console.log('[CITC] Events:', events);
    }
}
