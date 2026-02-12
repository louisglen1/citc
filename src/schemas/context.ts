/**
 * Context represents session-level metadata attached to all events.
 */
export interface Context {
    sessionId: string;
    userId?: string;
    environment?: string;
    metadata?: Record<string, unknown>;
}
