import { BaseCollector } from './BaseCollector.js';

/**
 * Collects keystroke events.
 */
export class KeystrokeCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'keydown', (event) => {
            const keyEvent = event as KeyboardEvent;
            this.emit({
                type: 'keystroke',
                fieldId: this.fieldId,
                target: this.target,
                timestamp: Date.now(),
                data: {
                    key: keyEvent.key,
                    code: keyEvent.code,
                    ctrlKey: keyEvent.ctrlKey,
                    shiftKey: keyEvent.shiftKey,
                    altKey: keyEvent.altKey,
                    metaKey: keyEvent.metaKey,
                },
            });
        });
    }
}
