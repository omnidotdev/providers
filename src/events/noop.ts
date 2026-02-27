import type {
  EmitResult,
  EventInput,
  EventsProvider,
  Subscription,
  SubscriptionCreated,
  SubscriptionInput,
} from "./interface";

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

  async subscribe(input: SubscriptionInput): Promise<SubscriptionCreated> {
    return {
      id: crypto.randomUUID(),
      name: input.name,
      typePattern: input.typePattern,
      targetUrl: input.targetUrl,
      sourcePattern: input.sourcePattern ?? null,
      signatureHeader: input.signatureHeader ?? "x-vortex-signature",
      enabled: true,
      createdAt: new Date().toISOString(),
      hmacSecret: "noop-secret",
    };
  }

  async unsubscribe(_subscriptionId: string): Promise<void> {}

  async listSubscriptions(): Promise<Subscription[]> {
    return [];
  }

  async close(): Promise<void> {}
}

export { NoopEventsProvider };

export type { NoopEventsProviderConfig };
