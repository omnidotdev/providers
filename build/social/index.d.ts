import type { GatekeeperSocialProviderConfig } from "./gatekeeper";
import type { SocialProvider } from "./interface";
/**
 * Create a social connections provider backed by Gatekeeper.
 * @param config - Gatekeeper base URL and service key
 * @returns Configured social provider instance
 */
declare const createSocialProvider: (config: GatekeeperSocialProviderConfig) => SocialProvider;
export { createSocialProvider };
export { GatekeeperSocialProvider } from "./gatekeeper";
export type { GatekeeperSocialProviderConfig } from "./gatekeeper";
export type { SocialConnectionDTO, SocialProvider } from "./interface";
