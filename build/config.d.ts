/**
 * Resolve a provider name based on explicit config or self-hosted defaults.
 * Explicit value always wins. When absent, uses local provider for
 * self-hosted mode and the SaaS provider otherwise.
 * @param explicit - Explicit provider name from env/config (takes priority)
 * @param defaultSaas - Default provider for SaaS mode
 * @param defaultSelfHosted - Default provider for self-hosted mode
 * @returns Resolved provider name
 */
declare const resolveProvider: (explicit: string | undefined, defaultSaas: string, defaultSelfHosted?: string) => string;
/**
 * Check if the current environment is self-hosted.
 * Reads `SELF_HOSTED` env var at call time.
 */
declare const isSelfHosted: () => boolean;
export { isSelfHosted, resolveProvider };
