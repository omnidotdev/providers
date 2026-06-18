import type { EvaluationContext, JsonValue, Provider, ProviderMetadata, ResolutionDetails } from "@openfeature/server-sdk";
type FractalOpenFeatureProviderConfig = {
    /** fractal-api GraphQL endpoint (e.g. https://api.fractal.omni.dev/graphql) */
    url: string;
    /** Fractal project id the flags belong to */
    project: string;
    /** Default environment used when the evaluation context omits one */
    environment?: string;
    /** Bearer token for fractal-api auth (a FractalApiToken) */
    token?: string;
    /** Evaluation cache TTL in milliseconds (per distinct context) */
    cacheTtlMs?: number;
    /** Skip the network entirely and serve the caller's default values only */
    devMode?: boolean;
    /** Injected fetch implementation (testing) */
    fetch?: typeof fetch;
};
/**
 * OpenFeature-compliant Fractal feature flags provider.
 *
 * Implements the CNCF OpenFeature `Provider` interface so Fractal Flags is
 * consumable by any OpenFeature SDK (`OpenFeature.setProvider(...)`) rather than
 * a proprietary client. Evaluates against fractal-api's `evaluateFlags` query
 * (server is the source of truth), caches each context's result for a short TTL,
 * and degrades to the caller's default on any failure (OpenFeature `ERROR`
 * reason) so a Fractal outage never breaks the consuming app.
 */
declare class FractalOpenFeatureProvider implements Provider {
    #private;
    readonly metadata: ProviderMetadata;
    constructor(config: FractalOpenFeatureProviderConfig);
    resolveBooleanEvaluation(flagKey: string, defaultValue: boolean, context: EvaluationContext): Promise<ResolutionDetails<boolean>>;
    resolveStringEvaluation(flagKey: string, defaultValue: string, context: EvaluationContext): Promise<ResolutionDetails<string>>;
    resolveNumberEvaluation(flagKey: string, defaultValue: number, context: EvaluationContext): Promise<ResolutionDetails<number>>;
    resolveObjectEvaluation<T extends JsonValue>(flagKey: string, defaultValue: T, context: EvaluationContext): Promise<ResolutionDetails<T>>;
    onClose(): Promise<void>;
}
export { FractalOpenFeatureProvider };
export type { FractalOpenFeatureProviderConfig };
