// File: src/client/collectors/DeletionCollector.ts

import { BaseCollector } from './BaseCollector.js';

const DELETION_KEYS = new Set(['Backspace', 'Delete']);

/**
 * Collects deletion events (Backspace and Delete key presses) as a distinct
 * event type, separate from regular keystroke events.
 */
export class DeletionCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'keydown', (event) => {
            const keyEvent = event as KeyboardEvent;
            if (!DELETION_KEYS.has(keyEvent.key)) {
                return;
            }
            // Capture caret position before the browser applies the deletion.
            // selectionStart/End are null on non-text elements; default to 0.
            const el = this.target as HTMLInputElement;
            const selStart = el.selectionStart ?? 0;
            const selEnd   = el.selectionEnd   ?? 0;

            this.emit({
                type: 'deletion',
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
                    start: selStart,
                    end: selEnd,
                },
            });
        });
    }
}
