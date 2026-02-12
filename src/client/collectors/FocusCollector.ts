import { BaseCollector } from './BaseCollector.js';

/**
 * Collects focus and blur events.
 */
export class FocusCollector extends BaseCollector {
    start(): void {
        this.on(this.target, 'focus', () => {
            this.emit({
                type: 'focus',
                fieldId: this.fieldId,
                target: this.target,
                timestamp: Date.now(),
            });
        });

        this.on(this.target, 'blur', () => {
            this.emit({
                type: 'blur',
                fieldId: this.fieldId,
                target: this.target,
                timestamp: Date.now(),
            });
        });
    }
}
