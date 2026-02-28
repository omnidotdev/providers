import type { HttpEventsProviderConfig } from "./http";
import type { IggyEventsProviderConfig } from "./iggy";
import type { EventsProvider } from "./interface";
import type { NoopEventsProviderConfig } from "./noop";
/**
 * Discriminated union config for `createEventsProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type EventsProviderConfig = ({
    provider: "http";
} & HttpEventsProviderConfig) | ({
    provider: "iggy";
} & IggyEventsProviderConfig) | ({
    provider: "noop";
} & NoopEventsProviderConfig) | NoopEventsProviderConfig;
/**
 * Create an events provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured events provider instance
 * @throws When required config is missing for the chosen variant
 */
declare const createEventsProvider: (config: EventsProviderConfig) => EventsProvider;
export { createEventsProvider };
export { EventBuffer } from "./buffer";
export { registerSchemas } from "./helpers";
export { HttpEventsProvider } from "./http";
export { IggyEventsProvider } from "./iggy";
export { NoopEventsProvider } from "./noop";
export { SchemaCache, validateEventData } from "./validation";
export type { BufferConfig } from "./buffer";
export type { EventsProviderConfig };
export type { HttpEventsProviderConfig } from "./http";
export type { IggyEventsProviderConfig } from "./iggy";
export type { EmitResult, EventInput, EventsProvider, EventsProviderStatus, RegisteredSchema, SchemaRegistration, Subscription, SubscriptionCreated, SubscriptionInput, } from "./interface";
export type { NoopEventsProviderConfig } from "./noop";
export type { ValidationResult } from "./validation";
