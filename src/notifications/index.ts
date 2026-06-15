import { HeraldNotificationProvider } from "./herald";
import { NoopNotificationProvider } from "./noop";
import { ResendNotificationProvider } from "./resend";

import type { HeraldNotificationProviderConfig } from "./herald";
import type { NotificationProvider } from "./interface";
import type { NoopNotificationProviderConfig } from "./noop";
import type { ResendNotificationProviderConfig } from "./resend";

/**
 * Discriminated union config for `createNotificationProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type NotificationProviderConfig =
  | ({ provider: "herald" } & HeraldNotificationProviderConfig)
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

  if (config.provider === "herald") {
    if (!config.apiKey) {
      throw new Error("HeraldNotificationProvider requires apiKey in config");
    }
    if (!config.apiUrl) {
      throw new Error("HeraldNotificationProvider requires apiUrl in config");
    }
    if (!config.defaultFrom) {
      throw new Error(
        "HeraldNotificationProvider requires defaultFrom in config",
      );
    }
    return new HeraldNotificationProvider({
      ...config,
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      defaultFrom: config.defaultFrom,
    });
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

export { HeraldNotificationProvider } from "./herald";
export { NoopNotificationProvider } from "./noop";
export { ResendNotificationProvider } from "./resend";

export type { NotificationProviderConfig };

export type { HeraldNotificationProviderConfig } from "./herald";
export type {
  EmailParams,
  EmailResult,
  NotificationProvider,
} from "./interface";
export type { NoopNotificationProviderConfig } from "./noop";
export type { ResendNotificationProviderConfig } from "./resend";
