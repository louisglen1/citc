import { LifecycleOptions } from '../schemas/config.js';

/**
 * Manages lifecycle hooks for automatic telemetry flushing.
 */
export class LifecycleManager {
    private options: LifecycleOptions;
    private flushCallback: () => void | Promise<void>;
    private timer?: number;
    private boundHandlers: {
        beforeUnload?: () => void;
        visibilityChange?: () => void;
        formSubmit?: (e: Event) => void;
    } = {};

    constructor(options: LifecycleOptions, flushCallback: () => void | Promise<void>) {
        this.options = options;
        this.flushCallback = flushCallback;
    }

    /**
     * Sets up all lifecycle hooks.
     */
    setup(): void {
        const enabled = this.options.enabled ?? true;

        if (!enabled) {
            return;
        }

        this.setupAutoFlush();
        this.setupVisibilityChange();
        this.setupBeforeUnload();
        this.setupFormSubmit();
    }

    /**
     * Tears down all lifecycle hooks.
     */
    teardown(): void {
        // Clear interval timer
        if (this.timer !== undefined) {
            clearInterval(this.timer);
            this.timer = undefined;
        }

        // Remove event listeners
        if (this.boundHandlers.visibilityChange) {
            document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange);
        }
        if (this.boundHandlers.beforeUnload) {
            window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload);
        }
        if (this.boundHandlers.formSubmit) {
            document.removeEventListener('submit', this.boundHandlers.formSubmit, true);
        }

        this.boundHandlers = {};
    }

    private setupAutoFlush(): void {
        const intervalMs = this.options.autoFlushIntervalMs ?? 5000;
        if (intervalMs > 0) {
            this.timer = window.setInterval(() => {
                this.flushCallback();
            }, intervalMs);
        }
    }

    private setupVisibilityChange(): void {
        const enabled = this.options.flushOnVisibilityChange ?? true;
        if (enabled) {
            this.boundHandlers.visibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    this.flushCallback();
                }
            };
            document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange);
        }
    }

    private setupBeforeUnload(): void {
        const enabled = this.options.flushOnBeforeUnload ?? true;
        if (enabled) {
            this.boundHandlers.beforeUnload = () => {
                this.flushCallback();
            };
            window.addEventListener('beforeunload', this.boundHandlers.beforeUnload);
        }
    }

    private setupFormSubmit(): void {
        const enabled = this.options.flushOnFormSubmit ?? false;
        if (enabled) {
            this.boundHandlers.formSubmit = (e: Event) => {
                const form = e.target as HTMLFormElement;
                if (form.hasAttribute('data-citc-submit')) {
                    this.flushCallback();
                }
            };
            document.addEventListener('submit', this.boundHandlers.formSubmit, true);
        }
    }
}
