import { RawEvent } from '../../schemas/events.js';

/**
 * Event emitter function type.
 */
export type EventEmitter = (event: RawEvent) => void;

/**
 * Listener remover function.
 */
type ListenerRemover = () => void;

/**
 * Abstract base class for all collectors.
 */
export abstract class BaseCollector {
    protected target: HTMLElement;
    protected emit: EventEmitter;
    protected fieldId: string;
    private removers: ListenerRemover[] = [];

    constructor(target: HTMLElement, fieldId: string, emit: EventEmitter) {
        this.target = target;
        this.fieldId = fieldId;
        this.emit = emit;
    }

    /**
     * Start collecting events.
     */
    abstract start(): void;

    /**
     * Stop collecting events and cleanup.
     */
    stop(): void {
        for (const remove of this.removers) {
            remove();
        }
        this.removers = [];
    }

    /**
     * Helper to attach event listeners with automatic cleanup tracking.
     */
    protected on<K extends keyof HTMLElementEventMap>(
        element: HTMLElement | Document | Window,
        event: K,
        handler: (event: HTMLElementEventMap[K]) => void,
        options?: AddEventListenerOptions
    ): void {
        const listener = handler as EventListener;
        element.addEventListener(event as string, listener, options);

        this.removers.push(() => {
            element.removeEventListener(event as string, listener, options);
        });
    }
}
