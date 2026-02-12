import { BaseCollector } from './BaseCollector.js';

/**
 * Collects caret position changes.
 */
export class CaretCollector extends BaseCollector {
    start(): void {
        // Track selection changes for caret movement
        this.on(this.target, 'selectionchange', () => {
            const element = this.target as HTMLInputElement | HTMLTextAreaElement;
            if ('selectionStart' in element && 'selectionEnd' in element) {
                this.emit({
                    type: 'caret',
                    fieldId: this.fieldId,
                    target: this.target,
                    timestamp: Date.now(),
                    data: {
                        start: element.selectionStart,
                        end: element.selectionEnd,
                    },
                });
            }
        });

        // Also track on click and keyup
        const emitCaret = () => {
            const element = this.target as HTMLInputElement | HTMLTextAreaElement;
            if ('selectionStart' in element && 'selectionEnd' in element) {
                this.emit({
                    type: 'caret',
                    fieldId: this.fieldId,
                    target: this.target,
                    timestamp: Date.now(),
                    data: {
                        start: element.selectionStart,
                        end: element.selectionEnd,
                    },
                });
            }
        };

        this.on(this.target, 'click', emitCaret);
        this.on(this.target, 'keyup', emitCaret);
    }
}
