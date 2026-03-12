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
                const start = element.selectionStart;
                const end = element.selectionEnd;
                if (start === null || end === null) return;
                this.emit({
                    type: 'caret',
                    fieldId: this.fieldId,
                    target: this.target,
                    timestamp: Date.now(),
                    data: { start, end },
                });
            }
        });
    }
}
