import { BaseCollector } from './BaseCollector.js';

/**
 * Collects clipboard events (paste).
 */
export class ClipboardCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'paste', (event) => {
            const clipboardData = event.clipboardData;
            const content = clipboardData?.getData('text') ?? '';

            this.emit({
                type: 'clipboard',
                fieldId: this.fieldId,
                target: this.target,
                timestamp: Date.now(),
                data: {
                    content,
                    length: content.length,
                },
            });
        });
    }
}
