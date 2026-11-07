import type { FlagContext, FlagProvider } from "./interface";
type NoopFlagProviderConfig = {
    /** Default flag values to return */
    defaults?: Record<string, boolean>;
};
/**
 * No-op feature flags provider.
 * Returns static defaults — useful for dev, testing, and SSR.
 */
declare class NoopFlagProvider implements FlagProvider {
    private readonly defaults;
    constructor(config?: NoopFlagProviderConfig);
    isEnabled(flagKey: string, _context?: FlagContext): Promise<boolean>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export type { NoopFlagProviderConfig };
export { NoopFlagProvider };
