import { SchemaCache } from "./validation";
import type { BufferConfig } from "./buffer";
import type { EmitResult, EventInput, EventsProvider } from "./interface";
type HttpEventsProviderConfig = {
    /** Vortex API base URL */
    baseUrl?: string;
    /** API key for authentication */
    apiKey?: string;
    /** Default event source (e.g. "omni.runa") */
    source?: string;
    /** Default organization ID */
    organizationId?: string;
    /** Request timeout in milliseconds */
    timeoutMs?: number;
    /** Max retries for transient failures */
    maxRetries?: number;
    /** Circuit breaker failure threshold */
    circuitBreakerThreshold?: number;
    /** Circuit breaker cooldown in milliseconds */
    circuitBreakerCooldownMs?: number;
    /** Enable local batch queueing */
    batch?: BufferConfig;
    /**
     * Enable pre-emission schema validation
     * (requires schemas to be registered)
     */
    validation?: {
        enabled: boolean;
    };
};
type ValidatedHttpConfig = HttpEventsProviderConfig & {
    baseUrl: string;
    apiKey: string;
};
/**
 * HTTP events provider.
 * POSTs events to the Vortex API with retry and circuit breaker.
 */
declare class HttpEventsProvider implements EventsProvider {
    #private;
    private readonly config;
    private readonly circuitBreaker;
    private readonly maxRetries;
    private readonly timeoutMs;
    private readonly buffer;
    /**
     * Schema cache for pre-emission validation
     * (populated by registerSchemas)
     */
    readonly schemaCache: SchemaCache;
    constructor(config: ValidatedHttpConfig);
    emit(event: EventInput): Promise<EmitResult>;
    emitBatch(events: EventInput[]): Promise<EmitResult[]>;
    healthCheck(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    close(): Promise<void>;
    private authHeaders;
}
/**
 * Retry a function with exponential backoff and jitter.
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of attempts
 */
declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number): Promise<T>;
export { HttpEventsProvider, retryWithBackoff };
export type { HttpEventsProviderConfig };
