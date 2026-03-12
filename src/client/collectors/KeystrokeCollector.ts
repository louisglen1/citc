import { BaseCollector } from './BaseCollector.js';

/**
 * Collects keystroke events.
 *
 * Backspace and Delete are emitted as 'deletion' events rather than 'keystroke'.
 * The deletion event includes the text that will be removed (read from the field
 * before the browser processes the key), or null if the deleted range cannot be
 * determined (word-boundary deletions via Ctrl/Meta, or unsupported input types).
 */
export class KeystrokeCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'keydown', (event) => {
            const keyEvent = event as KeyboardEvent;

            if (keyEvent.key === 'Backspace' || keyEvent.key === 'Delete') {
                this.emitDeletion(keyEvent);
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

    private emitDeletion(keyEvent: KeyboardEvent): void {
        const element = this.target as HTMLInputElement | HTMLTextAreaElement;

        let start: number | null = null;
        let end: number | null = null;
        try {
            start = element.selectionStart;
            end = element.selectionEnd;
        } catch {
            // Some input types (e.g. email in Chrome) throw when accessing selection API
        }

        // Compute the range [delStart, delEnd) that will be deleted.
        // start/end here are the cursor/selection positions before the key fires.
        let delStart: number | null = null;
        let delEnd: number | null = null;
        let text: string | null = null;

        if (start !== null && end !== null) {
            if (start !== end) {
                // A range is selected — the entire selection will be deleted
                delStart = start;
                delEnd = end;
                text = element.value.substring(start, end);
            } else if (!keyEvent.ctrlKey && !keyEvent.metaKey) {
                // Single-character deletion
                if (keyEvent.key === 'Backspace') {
                    delStart = Math.max(0, start - 1);
                    delEnd = start;
                    text = start > 0 ? element.value[start - 1] : '';
                } else {
                    delStart = start;
                    delEnd = Math.min(element.value.length, start + 1);
                    text = start < element.value.length ? element.value[start] : '';
                }
            }
            // else: word/line deletion (Ctrl/Meta) — range is browser-defined, leave as null
        }

        const count = delStart !== null && delEnd !== null ? delEnd - delStart : null;

        this.emit({
            type: 'deletion',
            fieldId: this.fieldId,
            target: this.target,
            timestamp: Date.now(),
            data: {
                key: keyEvent.key,
                start: delStart,
                end: delEnd,
                count,
                text,
                ctrlKey: keyEvent.ctrlKey,
                shiftKey: keyEvent.shiftKey,
                altKey: keyEvent.altKey,
                metaKey: keyEvent.metaKey,
            },
        });
    }
}
