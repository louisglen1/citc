/**
 * Raw event emitted by collectors before processing.
 */
export interface RawEvent {
    type: 'focus' | 'blur' | 'keystroke' | 'deletion' | 'caret' | 'selection' | 'clipboard';
    fieldId: string;
    target: HTMLElement;
    timestamp?: number;
    data?: Record<string, unknown>;
}

/**
 * Processed telemetry event ready for transport.
 */
export interface TelemetryEvent {
    type: string;
    fieldId: string;
    timestamp: number;
    context: Record<string, unknown>;
    data: Record<string, unknown>;
}
