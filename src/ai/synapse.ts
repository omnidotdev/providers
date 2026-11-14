/**
 * Shared client for the Synapse AI router's Anthropic-compatible
 * `POST {baseUrl}/v1/messages` endpoint.
 *
 * Synapse is the Omni AI gateway: it holds provider keys and enforces budgets,
 * rate limits, and usage metering (billed via Aether), so a product never holds
 * a raw provider key. This is the one blessed `/v1/messages` wrapper for the
 * fleet, the text/LLM backend of the generation capability. Consumers (facet,
 * keystone, creator) converge on it instead of each hand-rolling a client.
 *
 * It uses the global `fetch` (no SDK, no node imports) so it is trivially
 * mockable, and it never lets provider/transport detail reach the caller: a
 * failure throws a {@link SynapseRequestError} with a generic message for the
 * caller to log server-side and surface as a safe message. The error carries
 * the gateway's HTTP `status` so a product can map it onto its own UX (e.g.
 * 402 insufficient credits to an out-of-credits prompt, 503 to unavailable).
 * A per-request key (BYOK) overrides the configured key and is the only path a
 * caller's own key ever takes
 */

/**
 * A failed Synapse call. `message` stays generic (`synapse request failed: ...`)
 * and never carries provider detail. `status` is the gateway's HTTP status for
 * a non-2xx response (e.g. 402 insufficient credits, 503 unavailable), or
 * `undefined` for a transport failure, timeout, or missing key
 */
export class SynapseRequestError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SynapseRequestError";
    this.status = status;
  }
}

/** A text block within a multimodal message. */
export interface SynapseTextBlock {
  type: "text";
  text: string;
}

/** Media types Synapse/Anthropic accept for an inline base64 image. */
export type SynapseImageMediaType =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif";

/**
 * An inline image block within a multimodal message. `data` is raw base64 (no
 * `data:` URI prefix), matching the Anthropic `/v1/messages` image source shape
 */
export interface SynapseImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: SynapseImageMediaType;
    data: string;
  };
}

/** One content block of a multimodal message. */
export type SynapseContentBlock = SynapseTextBlock | SynapseImageBlock;

/**
 * A single Anthropic-style conversation turn. `content` is a plain string for a
 * text-only turn, or an array of blocks for a multimodal turn (text + inline
 * images, e.g. a render handed to a vision model). Both forms are passed through
 * to `/v1/messages` unchanged
 */
export interface SynapseMessage {
  role: "user" | "assistant";
  content: string | SynapseContentBlock[];
}

/** Spend rate for a model in US cents per million tokens. */
export interface SynapseModelRate {
  inputCentsPerMTok: number;
  outputCentsPerMTok: number;
}

/** Token usage for a call, with cost in US cents when it can be determined. */
export interface SynapseUsage {
  inputTokens: number;
  outputTokens: number;
  /**
   * Real (pre-markup) model spend for this call in US cents, possibly
   * fractional: the gateway's reported provider cost when present, else
   * estimated from tokens when a rate is configured, else null (unknown).
   * Feeds real-cents spend breakers, never billing
   */
  costCents: number | null;
  /**
   * Retail amount the gateway charged for this call in US dollars (after the
   * product margin), or null when the gateway reported none (e.g. no billing
   * identity). Zero for a BYOK call
   */
  chargedUsd: number | null;
  /** {@link chargedUsd} in display credits ($0.01 each), or null */
  credits: number | null;
}

/**
 * Response headers carrying the gateway's per-call cost (non-streaming calls).
 * Amounts are decimal strings in US dollars, except credits
 */
export const SYNAPSE_COST_HEADERS = {
  /** Retail amount charged, after the product margin */
  chargedUsd: "x-synapse-cost-usd",
  /** {@link SYNAPSE_COST_HEADERS.chargedUsd} in credits ($0.01 each) */
  credits: "x-synapse-credits",
  /** Upstream provider cost before the margin (real spend) */
  providerCostUsd: "x-synapse-provider-cost-usd",
} as const;

/** A finite, non-negative number from a cost header, else null */
const costHeader = (headers: Headers, name: string): number | null => {
  const raw = headers.get(name);
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

/** The result of a messages call: concatenated text plus usage. */
export interface SynapseResult {
  text: string;
  usage: SynapseUsage;
}

export interface SynapseClientConfig {
  /** Synapse gateway base URL (e.g. https://gateway.synapse.omni.dev), no trailing slash required. */
  baseUrl: string;
  /** Default (managed/server) key, used when a call carries no per-request key. */
  apiKey?: string;
  /** Model id passed through to Synapse (provider-prefixed, e.g. anthropic/claude-sonnet-4-5-20250929). */
  model: string;
  /** Rate for the active model, used to estimate cost when Synapse does not report one. */
  rate?: SynapseModelRate;
  /** Anthropic API version header, defaults to 2023-06-01. */
  anthropicVersion?: string;
  /** Request timeout in milliseconds; no timeout when unset. */
  timeoutMs?: number;
  /** Injectable fetch, defaults to the global. */
  fetchImpl?: typeof fetch;
}

/** Input for a single messages call. */
export interface SynapseMessagesInput {
  /** System prompt. */
  system: string;
  /** Conversation turns. */
  messages: SynapseMessage[];
  /** Output token ceiling for this call. */
  maxTokens: number;
  /** Per-request key (BYOK), used instead of the configured key when present. */
  apiKey?: string;
}

export interface SynapseClient {
  /** Call `/v1/messages`; returns the concatenated text and usage. */
  messages(input: SynapseMessagesInput): Promise<SynapseResult>;
}

/** Only the response fields read here (Anthropic-compatible). */
interface AnthropicResponseBody {
  content?: { type?: string; text?: string }[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

/** Estimate spend in US cents from token counts and a per-model rate. */
export const estimateSynapseCostCents = (
  inputTokens: number,
  outputTokens: number,
  rate: SynapseModelRate,
): number =>
  (inputTokens / 1_000_000) * rate.inputCentsPerMTok +
  (outputTokens / 1_000_000) * rate.outputCentsPerMTok;

/**
 * Create a Synapse client bound to a base URL, model, and optional default key.
 * The returned client's `messages` call accepts a per-request BYOK key override
 */
export const createSynapseClient = (
  config: SynapseClientConfig,
): SynapseClient => {
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const doFetch = config.fetchImpl ?? fetch;
  const anthropicVersion = config.anthropicVersion ?? "2023-06-01";

  return {
    async messages(input: SynapseMessagesInput): Promise<SynapseResult> {
      const key = input.apiKey ?? config.apiKey;
      if (!key) {
        // the managed path must be gated before here, this guards misuse
        throw new SynapseRequestError(
          "synapse request failed: no api key available",
        );
      }

      const controller = new AbortController();
      const timeout = config.timeoutMs
        ? setTimeout(() => controller.abort(), config.timeoutMs)
        : undefined;

      let res: Response;
      try {
        res = await doFetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": key,
            authorization: `Bearer ${key}`,
            "anthropic-version": anthropicVersion,
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: input.maxTokens,
            system: input.system,
            messages: input.messages,
          }),
          signal: controller.signal,
        });
      } catch (err) {
        const reason = err instanceof Error ? err.message : "transport error";
        throw new SynapseRequestError(`synapse request failed: ${reason}`);
      } finally {
        if (timeout) clearTimeout(timeout);
      }

      if (!res.ok) {
        throw new SynapseRequestError(
          `synapse request failed: status ${res.status}`,
          res.status,
        );
      }

      const data = (await res.json()) as AnthropicResponseBody;

      const text = (data.content ?? [])
        .filter(
          (block) => block.type === "text" && typeof block.text === "string",
        )
        .map((block) => block.text)
        .join("");

      const inputTokens = data.usage?.input_tokens ?? 0;
      const outputTokens = data.usage?.output_tokens ?? 0;

      // The gateway reports what the call actually cost, including any model
      // it failed over or escalated to, so a reported cost always wins over
      // the list-rate estimate
      const providerCostUsd = costHeader(
        res.headers,
        SYNAPSE_COST_HEADERS.providerCostUsd,
      );
      const costCents =
        providerCostUsd !== null
          ? providerCostUsd * 100
          : config.rate
            ? estimateSynapseCostCents(inputTokens, outputTokens, config.rate)
            : null;
      const chargedUsd = costHeader(
        res.headers,
        SYNAPSE_COST_HEADERS.chargedUsd,
      );
      const credits = costHeader(res.headers, SYNAPSE_COST_HEADERS.credits);

      return {
        text,
        usage: { inputTokens, outputTokens, costCents, chargedUsd, credits },
      };
    },
  };
};
