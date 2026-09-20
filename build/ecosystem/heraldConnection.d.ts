import type { GraphqlRequest } from "./haloConnection";
export interface HeraldSubscribeInput {
    audienceId: string;
    email: string;
    attributes?: Record<string, unknown>;
}
export interface HeraldConfig {
    apiUrl?: string;
    apiKey?: string;
    request?: GraphqlRequest;
}
export interface HeraldConnection {
    configured: boolean;
    subscribe(input: HeraldSubscribeInput): Promise<{
        ok: boolean;
    }>;
}
/**
 * Herald (email) connection. Unlike buy/support there is no anonymous subscribe
 * endpoint and no meaningful link-out, so email capture is only functional when
 * configured with a tenant API key. When unconfigured `subscribe` returns
 * `{ ok: false }` so the block reports honestly rather than silently dropping an
 * address (never a silent data loss).
 */
export declare const createHeraldConnection: (config: HeraldConfig) => HeraldConnection;
