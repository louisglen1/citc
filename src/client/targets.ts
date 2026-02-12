import { DiscoveredField } from './discover.js';
import { BaseCollector, EventEmitter } from './collectors/BaseCollector.js';
import { FocusCollector } from './collectors/FocusCollector.js';
import { KeystrokeCollector } from './collectors/KeystrokeCollector.js';
import { CaretCollector } from './collectors/CaretCollector.js';
import { SelectionCollector } from './collectors/SelectionCollector.js';
import { ClipboardCollector } from './collectors/ClipboardCollector.js';

/**
 * Manages collector lifecycle for discovered fields.
 */
export class TargetManager {
    private collectors: BaseCollector[] = [];
    private emit: EventEmitter;

    constructor(emit: EventEmitter) {
        this.emit = emit;
    }

    /**
     * Attaches collectors to discovered fields.
     */
    attach(fields: DiscoveredField[]): void {
        for (const field of fields) {
            const { id, element, capture } = field;

            if (capture.focus) {
                this.collectors.push(new FocusCollector(element, id, this.emit));
            }

            if (capture.keystroke) {
                this.collectors.push(new KeystrokeCollector(element, id, this.emit));
            }

            if (capture.caret) {
                this.collectors.push(new CaretCollector(element, id, this.emit));
            }

            if (capture.selection) {
                this.collectors.push(new SelectionCollector(element, id, this.emit));
            }

            if (capture.clipboard) {
                this.collectors.push(new ClipboardCollector(element, id, this.emit));
            }
        }

        // Start all collectors
        for (const collector of this.collectors) {
            collector.start();
        }
    }

    /**
     * Detaches all collectors.
     */
    detach(): void {
        for (const collector of this.collectors) {
            collector.stop();
        }
        this.collectors = [];
    }
}
