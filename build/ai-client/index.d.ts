/**
 * `@omnidotdev/providers/ai-client` - the browser-side AI layer shared across
 * products: managed-AI sign-in (OAuth PKCE public client) and its pure request
 * shaping, the one-shot gateway client, and the error-to-action mapping. The
 * server-side Synapse `/v1/messages` client lives in `./ai`; streaming chat and
 * the agentic tool loop run through TanStack AI (`@tanstack/ai-react`), whose
 * adapter points at Synapse.
 */
export { GatewayError, classifyGatewayError } from "./errors";
export { createGatewayClient } from "./gateway";
export { OAUTH_SCOPE, base64UrlEncode, buildAuthorizeUrl, buildTokenRequestBody, codeChallengeS256, parseCallbackParams, parseTokenResponse, randomBase64Url, } from "./pkce";
export { createManagedAiAuth } from "./session";
export { useManagedAiAuth } from "./useManagedAiAuth";
export type { GatewayErrorAction } from "./errors";
export type { GatewayClient, GatewayClientConfig, GatewayRequestOptions, } from "./gateway";
export type { CallbackParams, ParsedTokenResponse } from "./pkce";
export type { CallbackResult, KeyValueStore, ManagedAiAuth, ManagedAiAuthConfig, NativeAuthAdapter, } from "./session";
export type { ManagedAiAuthState } from "./useManagedAiAuth";
