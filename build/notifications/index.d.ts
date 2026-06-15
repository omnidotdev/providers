import type { HeraldNotificationProviderConfig } from "./herald";
import type { NotificationProvider } from "./interface";
import type { NoopNotificationProviderConfig } from "./noop";
/**
 * Discriminated union config for `createNotificationProvider`.
 * Defaults to noop when `provider` is omitted.
 */
type NotificationProviderConfig = ({
    provider: "herald";
} & HeraldNotificationProviderConfig) | ({
    provider: "noop";
} & NoopNotificationProviderConfig) | NoopNotificationProviderConfig;
/**
 * Create a notification provider.
 * @param config - Provider configuration (discriminated by `provider` field)
 * @returns Configured notification provider instance
 * @throws When required config is missing for the chosen variant
 */
declare const createNotificationProvider: (config: NotificationProviderConfig) => NotificationProvider;
export { createNotificationProvider };
export { HeraldNotificationProvider } from "./herald";
export { NoopNotificationProvider } from "./noop";
export type { NotificationProviderConfig };
export type { HeraldNotificationProviderConfig } from "./herald";
export type { EmailParams, EmailResult, NotificationProvider, } from "./interface";
export type { NoopNotificationProviderConfig } from "./noop";
