import { TelemetryEvent } from '../schemas/events.js';

/**
 * Transport interface for sending telemetry events.
 */
export interface Transport {
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
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events }),
            });

            if (!response.ok) {
                console.error('[CITC] HTTP transport failed:', response.status);
            }
        } catch (error) {
            console.error('[CITC] HTTP transport error:', error);
        }
    }
}

/**
 * Beacon transport using sendBeacon API.
 */
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
                console.error('[CITC] Beacon transport failed');
            }
        } catch (error) {
            console.error('[CITC] Beacon transport error:', error);
        }
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
