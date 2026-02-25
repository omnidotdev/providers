import type { FlagContext, FlagProvider } from "./interface";
type UnleashFlagProviderConfig = {
    /** Unleash server URL */
    url?: string;
    /** Unleash API key */
    apiKey?: string;
    /** Application name for Unleash registration */
    appName?: string;
    /** Polling interval in milliseconds */
    refreshInterval?: number;
    /** Default flag values used as fallback */
    defaults?: Record<string, boolean>;
    /** Skip Unleash entirely and use defaults only */
    devMode?: boolean;
};
type ValidatedUnleashConfig = UnleashFlagProviderConfig & {
    url: string;
    apiKey: string;
    appName: string;
};
/**
 * Unleash feature flags provider.
 * Evaluates flags against a remote Unleash server with local fallback.
 */
declare class UnleashFlagProvider implements FlagProvider {
    #private;
    private readonly config;
    private readonly defaults;
    private readonly devMode;
    private client;
    private initialized;
    constructor(config: ValidatedUnleashConfig);
    isEnabled(flagKey: string, context?: FlagContext): Promise<boolean>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { UnleashFlagProvider };
export type { UnleashFlagProviderConfig };
