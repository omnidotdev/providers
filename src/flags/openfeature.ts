import { log } from "../util/log";

// Imported type-only so @openfeature/server-sdk stays a genuinely optional peer
// dependency (no runtime load), matching the dynamic-import pattern the other
// optional peers in this package use. OpenFeature's reason/errorCode members are
// stable spec strings, so we use their literal values rather than runtime enums.
import type {
  ErrorCode,
  EvaluationContext,
  JsonValue,
  Provider,
  ProviderMetadata,
  ResolutionDetails,
} from "@openfeature/server-sdk";

const REQUEST_TIMEOUT_MS = 5_000;
const DEFAULT_CACHE_TTL_MS = 30_000;
const DEFAULT_ENVIRONMENT = "production";

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

const EVALUATE_FLAGS_QUERY = `query EvaluateFlags($projectId: String!, $environment: String!, $context: FlagEvaluationContextInput) {
  evaluateFlags(projectId: $projectId, environment: $environment, context: $context) {
    key
    value
  }
}`;

type CacheEntry = { evaluatedAt: number; flags: Record<string, unknown> };

/** Sentinel returned by a coercer when the evaluated value is the wrong type. */
const MISMATCH = Symbol("type-mismatch");

/** Deterministic JSON for use as a cache key. */
function stableStringify(obj: Record<string, string>): string {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(obj).sort()) sorted[key] = obj[key];
  return JSON.stringify(sorted);
}

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
class FractalOpenFeatureProvider implements Provider {
  readonly metadata: ProviderMetadata = { name: "fractal" } as const;

  readonly #config: FractalOpenFeatureProviderConfig;
  readonly #devMode: boolean;
  readonly #cacheTtlMs: number;
  readonly #fetchImpl: typeof fetch;
  readonly #cache = new Map<string, CacheEntry>();

  constructor(config: FractalOpenFeatureProviderConfig) {
    this.#config = config;
    this.#devMode = config.devMode ?? false;
    this.#cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.#fetchImpl = config.fetch ?? globalThis.fetch;
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    return this.#resolve(flagKey, defaultValue, context, (v) =>
      typeof v === "boolean" ? v : MISMATCH,
    );
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<string>> {
    return this.#resolve(flagKey, defaultValue, context, (v) =>
      typeof v === "string" ? v : MISMATCH,
    );
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<number>> {
    return this.#resolve(flagKey, defaultValue, context, (v) =>
      typeof v === "number" && !Number.isNaN(v) ? v : MISMATCH,
    );
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<T>> {
    return this.#resolve(flagKey, defaultValue, context, (v) =>
      typeof v === "object" && v !== null ? (v as T) : MISMATCH,
    );
  }

  async onClose(): Promise<void> {
    this.#cache.clear();
  }

  /** Shared evaluation + typing path for all four flag types. */
  async #resolve<T>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    coerce: (value: unknown) => T | typeof MISMATCH,
  ): Promise<ResolutionDetails<T>> {
    if (this.#devMode) {
      return { value: defaultValue, reason: "DEFAULT" };
    }
    const flags = await this.#evaluate(context);
    if (flags === null) {
      return {
        value: defaultValue,
        reason: "ERROR",
        errorCode: "GENERAL" as ErrorCode,
        errorMessage: "fractal evaluation failed",
      };
    }
    if (!(flagKey in flags)) {
      return { value: defaultValue, reason: "DEFAULT" };
    }
    const coerced = coerce(flags[flagKey]);
    if (coerced === MISMATCH) {
      return {
        value: defaultValue,
        reason: "ERROR",
        errorCode: "TYPE_MISMATCH" as ErrorCode,
      };
    }
    return {
      value: coerced,
      reason: "TARGETING_MATCH",
    };
  }

  /** Attributes the API targets on, derived from the OpenFeature context. */
  #attributes(context: EvaluationContext): Record<string, string> {
    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(context)) {
      if (key === "targetingKey" || value === undefined || value === null) {
        continue;
      }
      attributes[key] = typeof value === "string" ? value : String(value);
    }
    return attributes;
  }

  #cacheKey(environment: string, context: EvaluationContext): string {
    return `${environment} ${context.targetingKey ?? ""} ${stableStringify(
      this.#attributes(context),
    )}`;
  }

  async #evaluate(
    context: EvaluationContext,
  ): Promise<Record<string, unknown> | null> {
    const environment =
      typeof context.environment === "string"
        ? context.environment
        : (this.#config.environment ?? DEFAULT_ENVIRONMENT);
    const key = this.#cacheKey(environment, context);

    const cached = this.#cache.get(key);
    if (cached && Date.now() - cached.evaluatedAt < this.#cacheTtlMs) {
      return cached.flags;
    }

    const attributes = this.#attributes(context);
    const variables = {
      projectId: this.#config.project,
      environment,
      context: {
        ...(context.targetingKey ? { targetingKey: context.targetingKey } : {}),
        ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
      },
    };

    try {
      const flags = await this.#requestEvaluation(variables);
      this.#cache.set(key, { evaluatedAt: Date.now(), flags });
      return flags;
    } catch (error) {
      log("warn", "flags", "Fractal evaluation failed, using defaults", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  async #requestEvaluation(
    variables: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await this.#fetchImpl(this.#config.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.#config.token
            ? { authorization: `Bearer ${this.#config.token}` }
            : {}),
        },
        body: JSON.stringify({ query: EVALUATE_FLAGS_QUERY, variables }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`fractal-api returned ${response.status}`);
      }
      const json = (await response.json()) as {
        data?: { evaluateFlags?: Array<{ key: string; value: unknown }> };
        errors?: unknown[];
      };
      if (json.errors && json.errors.length > 0) {
        throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
      }
      const flags: Record<string, unknown> = {};
      for (const evaluation of json.data?.evaluateFlags ?? []) {
        flags[evaluation.key] = evaluation.value;
      }
      return flags;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export { FractalOpenFeatureProvider };

export type { FractalOpenFeatureProviderConfig };
