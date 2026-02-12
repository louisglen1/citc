import { BaseCollector } from './BaseCollector.js';

/**
 * Collects keystroke events.
 */
export class KeystrokeCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'keydown', (event) => {
            this.emit({
                type: 'keystroke',
                fieldId: this.fieldId,
                target: this.target,
                timestamp: Date.now(),
                data: {
                    key: event.key,
                    code: event.code,
                    ctrlKey: event.ctrlKey,
                    shiftKey: event.shiftKey,
                    altKey: event.altKey,
                    metaKey: event.metaKey,
                },
            });
        });
    }
}
