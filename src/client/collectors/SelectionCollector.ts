import { BaseCollector } from './BaseCollector.js';

/**
 * Collects text selection events.
 */
export class SelectionCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'select', () => {
            const element = this.target as HTMLInputElement | HTMLTextAreaElement;
            if ('selectionStart' in element && 'selectionEnd' in element) {
                const start = element.selectionStart ?? 0;
                const end = element.selectionEnd ?? 0;
                const selectedText = element.value.substring(start, end);

                this.emit({
                    type: 'selection',
                    fieldId: this.fieldId,
                    target: this.target,
                    timestamp: Date.now(),
                    data: {
                        start,
                        end,
                        text: selectedText,
                        length: selectedText.length,
                    },
                });
            }
        });
    }
}
