import type { EmitResult, EventInput, EventsProvider } from "./interface";

type NoopEventsProviderConfig = Record<string, never>;

/**
 * No-op events provider.
 * Swallows events silently — useful for dev, testing, and SSR.
 */
class NoopEventsProvider implements EventsProvider {
  async emit(_event: EventInput): Promise<EmitResult> {
    return {
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
  }

  async emitBatch(events: EventInput[]): Promise<EmitResult[]> {
    return events.map(() => ({
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }));
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return { healthy: true, message: "noop" };
  }

  async close(): Promise<void> {}
}

export { NoopEventsProvider };

export type { NoopEventsProviderConfig };
