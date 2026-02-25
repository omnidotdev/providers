import { NoopNotificationProvider } from "./noop";
import { ResendNotificationProvider } from "./resend";

import type { NotificationProvider } from "./interface";
import type { NoopNotificationProviderConfig } from "./noop";
import type { ResendNotificationProviderConfig } from "./resend";

/**
 * Discriminated union config for `createNotificationProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type NotificationProviderConfig =
  | ({ provider: "resend" } & ResendNotificationProviderConfig)
  | ({ provider: "noop" } & NoopNotificationProviderConfig)
  | NoopNotificationProviderConfig;

/**
 * Create a notification provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured notification provider instance
 * @throws When required config is missing for the chosen variant
 */
const createNotificationProvider = (
  config: NotificationProviderConfig,
): NotificationProvider => {
  if (!("provider" in config) || config.provider === "noop") {
    return new NoopNotificationProvider();
  }

  if (config.provider === "resend") {
    if (!config.apiKey) {
      throw new Error("ResendNotificationProvider requires apiKey in config");
    }
    if (!config.defaultFrom) {
      throw new Error(
        "ResendNotificationProvider requires defaultFrom in config",
      );
    }
    return new ResendNotificationProvider({
      ...config,
      apiKey: config.apiKey,
      defaultFrom: config.defaultFrom,
    });
  }

  // Exhaustive check
  const _exhaustive: never = config;
  throw new Error(`Unknown notification provider: ${_exhaustive}`);
};

export { createNotificationProvider };

export { NoopNotificationProvider } from "./noop";
export { ResendNotificationProvider } from "./resend";

export type { NotificationProviderConfig };

export type {
  EmailParams,
  EmailResult,
  NotificationProvider,
} from "./interface";
export type { NoopNotificationProviderConfig } from "./noop";
export type { ResendNotificationProviderConfig } from "./resend";
