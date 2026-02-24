import type { EmitResult, EventInput, EventsProvider } from "./interface";
type NoopEventsProviderConfig = Record<string, never>;
/**
 * No-op events provider.
 * Swallows events silently — useful for dev, testing, and SSR.
 */
declare class NoopEventsProvider implements EventsProvider {
    emit(_event: EventInput): Promise<EmitResult>;
    emitBatch(events: EventInput[]): Promise<EmitResult[]>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { NoopEventsProvider };
export type { NoopEventsProviderConfig };
