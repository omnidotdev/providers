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
 * failure throws a generic Error for the caller to log server-side and surface
 * as a safe message. A per-request key (BYOK) overrides the configured key and
 * is the only path a caller's own key ever takes
 */
/** A single Anthropic-style conversation turn. */
export interface SynapseMessage {
    role: "user" | "assistant";
    content: string;
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
     * Spend for this call in US cents: Synapse's reported cost when present, else
     * estimated from tokens when a rate is configured, else null (unknown)
     */
    costCents: number | null;
}
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
/** Estimate spend in US cents from token counts and a per-model rate. */
export declare const estimateSynapseCostCents: (inputTokens: number, outputTokens: number, rate: SynapseModelRate) => number;
/**
 * Create a Synapse client bound to a base URL, model, and optional default key.
 * The returned client's `messages` call accepts a per-request BYOK key override
 */
export declare const createSynapseClient: (config: SynapseClientConfig) => SynapseClient;
