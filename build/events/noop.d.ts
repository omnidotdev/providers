import type { EmitResult, EventInput, EventsProvider, Subscription, SubscriptionCreated, SubscriptionInput } from "./interface";
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
    subscribe(input: SubscriptionInput): Promise<SubscriptionCreated>;
    unsubscribe(_subscriptionId: string): Promise<void>;
    listSubscriptions(): Promise<Subscription[]>;
    close(): Promise<void>;
}
export { NoopEventsProvider };
export type { NoopEventsProviderConfig };
