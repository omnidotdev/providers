import { CircuitBreaker } from "../util/circuitBreaker";
import { log } from "../util/log";

import type { EmitResult, EventInput, EventsProvider } from "./interface";

/** Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 5000;

/** Default max retries for transient failures */
const DEFAULT_MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms) */
const BASE_DELAY_MS = 200;

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
};

type ValidatedHttpConfig = HttpEventsProviderConfig & {
  baseUrl: string;
  apiKey: string;
};

/**
 * HTTP events provider.
 * POSTs events to the Vortex API with retry and circuit breaker.
 */
class HttpEventsProvider implements EventsProvider {
  private readonly config: ValidatedHttpConfig;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(config: ValidatedHttpConfig) {
    this.config = config;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS;
    this.circuitBreaker = new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      cooldownMs: config.circuitBreakerCooldownMs,
      label: "vortex-events",
    });
  }

  async emit(event: EventInput): Promise<EmitResult> {
    const startTime = Date.now();

    const body = {
      type: event.type,
      data: event.data,
      source: event.source ?? this.config.source,
      subject: event.subject,
      correlationId: event.correlationId,
      schemaId: event.schemaId,
      specversion: event.specversion,
      datacontenttype: event.datacontenttype,
      dataschema: event.dataschema,
      omniworkspaceid: event.omniworkspaceid,
      omnischemaversion: event.omnischemaversion,
    };

    try {
      const result = await this.circuitBreaker.execute(() =>
        retryWithBackoff(async () => {
          const response = await fetch(`${this.config.baseUrl}/api/v1/events`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...this.authHeaders(),
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeoutMs),
          });

          if (!response.ok) {
            throw new Error(`Event emit failed: ${response.status}`);
          }

          return (await response.json()) as EmitResult;
        }, this.maxRetries),
      );

      log("info", "events", "event emitted", {
        eventId: result.eventId,
        type: event.type,
        durationMs: Date.now() - startTime,
      });

      return result;
    } catch (err) {
      log("error", "events", "event emit failed", {
        type: event.type,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async emitBatch(events: EventInput[]): Promise<EmitResult[]> {
    const results: EmitResult[] = [];

    for (const event of events) {
      results.push(await this.emit(event));
    }

    return results;
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      return {
        healthy: response.ok,
        message: response.ok ? "OK" : `Status ${response.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async close(): Promise<void> {}

  private authHeaders(): Record<string, string> {
    return { Authorization: this.config.apiKey };
  }
}

/**
 * Retry a function with exponential backoff and jitter.
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of attempts
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxRetries - 1) {
        const delay =
          BASE_DELAY_MS * 2 ** attempt * (0.5 + Math.random() * 0.5);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export { HttpEventsProvider, retryWithBackoff };

export type { HttpEventsProviderConfig };
