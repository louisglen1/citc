import { BaseCollector } from './BaseCollector.js';

/**
 * Collects caret position changes.
 */
export class CaretCollector extends BaseCollector {
    start(): void {
        // Track selection changes for caret movement
        // Note: selectionchange only fires on document, not individual elements
        this.on(document, 'selectionchange', () => {
            // Only emit if this field is the active element
            if (document.activeElement !== this.target) {
                return;
            }
            
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
