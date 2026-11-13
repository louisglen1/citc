// File: src/client/collectors/KeystrokeCollector.ts

import { BaseCollector } from './BaseCollector.js';

// Deletion keys are handled exclusively by DeletionCollector.
const DELETION_KEYS = new Set(['Backspace', 'Delete']);

/**
 * Collects keystroke events. Backspace and Delete are excluded — use
 * DeletionCollector (capture.deletion) to capture those separately.
 */
export class KeystrokeCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'keydown', (event) => {
            const keyEvent = event as KeyboardEvent;
            if (DELETION_KEYS.has(keyEvent.key)) {
                return;
            }
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
