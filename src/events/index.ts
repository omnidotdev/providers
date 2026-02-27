import { HttpEventsProvider } from "./http";
import { IggyEventsProvider } from "./iggy";
import { NoopEventsProvider } from "./noop";

import type { HttpEventsProviderConfig } from "./http";
import type { IggyEventsProviderConfig } from "./iggy";
import type { EventsProvider } from "./interface";
import type { NoopEventsProviderConfig } from "./noop";

/**
 * Discriminated union config for `createEventsProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type EventsProviderConfig =
  | ({ provider: "http" } & HttpEventsProviderConfig)
  | ({ provider: "iggy" } & IggyEventsProviderConfig)
  | ({ provider: "noop" } & NoopEventsProviderConfig)
  | NoopEventsProviderConfig;

/**
 * Create an events provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured events provider instance
 * @throws When required config is missing for the chosen variant
 */
const createEventsProvider = (config: EventsProviderConfig): EventsProvider => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopEventsProvider();
  }

  if (config.provider === "http") {
    if (!config.baseUrl) {
      throw new Error("HttpEventsProvider requires baseUrl in config");
    }
    if (!config.apiKey) {
      throw new Error("HttpEventsProvider requires apiKey in config");
    }
    return new HttpEventsProvider({
      ...config,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
    });
  }

  if (config.provider === "iggy") {
    if (!config.host) {
      throw new Error("IggyEventsProvider requires host in config");
    }
    if (!config.username) {
      throw new Error("IggyEventsProvider requires username in config");
    }
    if (!config.password) {
      throw new Error("IggyEventsProvider requires password in config");
    }
    return new IggyEventsProvider({
      ...config,
      host: config.host,
      username: config.username,
      password: config.password,
    });
  }

  // Exhaustive check
  const _exhaustive: never = config;
  throw new Error(`Unknown events provider: ${_exhaustive}`);
};

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
export type {
  EmitResult,
  EventInput,
  EventsProvider,
  EventsProviderStatus,
  RegisteredSchema,
  SchemaRegistration,
  Subscription,
  SubscriptionCreated,
  SubscriptionInput,
} from "./interface";
export type { NoopEventsProviderConfig } from "./noop";
export type { ValidationResult } from "./validation";
