import type { FlagContext, FlagProvider } from "./interface";
type FractalFlagProviderConfig = {
    /** fractal-api GraphQL endpoint (e.g. https://api.fractal.omni.dev/graphql) */
    url?: string;
    /** Fractal project id the flags belong to */
    project?: string;
    /** Default environment used when the evaluation context omits one */
    environment?: string;
    /** Bearer token for fractal-api auth (a FractalApiToken) */
    token?: string;
    /** Default flag values returned when Fractal is unreachable or the flag is unknown */
    defaults?: Record<string, boolean>;
    /** Evaluation cache TTL in milliseconds (per distinct context) */
    cacheTtlMs?: number;
    /** Skip the network entirely and serve defaults only */
    devMode?: boolean;
    /** Injected fetch implementation (testing) */
    fetch?: typeof fetch;
};
type ValidatedFractalConfig = FractalFlagProviderConfig & {
    url: string;
    project: string;
};
/**
 * Fractal feature flags provider.
 *
 * Evaluates flags remotely against fractal-api's `evaluateFlags` query (the
 * server is the source of truth) and caches each context's result for a short
 * TTL. Every failure mode degrades gracefully to the configured defaults, so a
 * Fractal outage never breaks the consuming app.
 */
declare class FractalFlagProvider implements FlagProvider {
    #private;
    private readonly config;
    private readonly defaults;
    private readonly devMode;
    private readonly cacheTtlMs;
    private readonly fetchImpl;
    private readonly cache;
    constructor(config: ValidatedFractalConfig);
    isEnabled(flagKey: string, context?: FlagContext): Promise<boolean>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
}
export { FractalFlagProvider };
export type { FractalFlagProviderConfig };
