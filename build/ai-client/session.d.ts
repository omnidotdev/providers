/**
 * Managed AI-generation sign-in for a browser client, shared across products.
 *
 * A product app has no server of its own for the AI path, so it authenticates to
 * Omni's Gatekeeper as a public, secretless OAuth client via in-browser
 * Authorization Code + PKCE (the aspen-editor pattern), stores the resulting
 * access token, and sends it as a bearer to the product API, which resolves it
 * against Gatekeeper's userinfo exactly like the rest of the fleet. Only the
 * managed path needs this; BYOK and local work stay anonymous and never touch it.
 *
 * Everything product-specific is injected through `ManagedAiAuthConfig`: the
 * Gatekeeper base URL and client id, where to redirect, storage keys, and an
 * optional native (desktop) flow. The core is framework-agnostic and the pure
 * request shaping lives in `pkce.ts`.
 */
/** A minimal synchronous key-value store (localStorage/sessionStorage shape). */
export interface KeyValueStore {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
/** Optional native (desktop) login flow, e.g. a Tauri loopback. */
export interface NativeAuthAdapter {
    /** Whether the client is running in the native shell right now. */
    isNative(): boolean;
    /** The loopback redirect URI registered for the native client. */
    redirectUri: string;
    /** Open the system browser at `authorizeUrl` and resolve the callback query string. */
    invokeLoopback(authorizeUrl: string): Promise<string>;
}
export interface ManagedAiAuthConfig {
    /** Gatekeeper base URL. When absent, auth is "not configured" and sign-in is a no-op. */
    authBaseUrl: string | undefined;
    /** The product's public OAuth client id (registered with Gatekeeper as a PKCE client). */
    clientId: string;
    /** Resolve the web redirect URI (e.g. `${origin}/auth/callback`). Called at sign-in time. */
    resolveRedirectUri: () => string;
    /** Remember where to return after a successful exchange. Called at sign-in time. */
    resolveReturnTo?: () => string;
    /** Navigate the page to the authorize URL (web flow). */
    navigate: (url: string) => void;
    /** Persistent token store (survives reloads), e.g. localStorage. */
    tokenStore: KeyValueStore;
    /** In-flight flow store (verifier/state), e.g. sessionStorage. */
    flowStore: KeyValueStore;
    /** Storage key for the token. */
    tokenKey?: string;
    /** Storage key for the in-flight flow. */
    flowKey?: string;
    /** OAuth scope; defaults to `OAUTH_SCOPE`. */
    scope?: string;
    /** OIDC prompt; defaults to "login" so the account chooser/login screen always shows. */
    prompt?: string;
    /** Optional native desktop flow. When present and active, used instead of a page redirect. */
    native?: NativeAuthAdapter;
    /** Injectable fetch, defaults to the global. */
    fetchImpl?: typeof fetch;
    /** Injectable clock (epoch ms), defaults to Date.now. */
    now?: () => number;
}
/** The outcome of completing the OAuth redirect. */
export type CallbackResult = {
    ok: true;
    returnTo: string;
} | {
    ok: false;
    error: string;
};
export interface ManagedAiAuth {
    /** Whether Omni sign-in is configured for this deployment (base URL present). */
    isConfigured(): boolean;
    /** Whether a valid (unexpired) access token is present. */
    isSignedIn(): boolean;
    /** Subscribe to auth-state changes; returns an unsubscribe. For useSyncExternalStore. */
    subscribe(listener: () => void): () => void;
    /** Start the PKCE login (web redirect, or the native flow when active). */
    signIn(): Promise<void>;
    /** Complete the OAuth redirect on the callback route. */
    completeCallback(search: string): Promise<CallbackResult>;
    /** Forget the stored token. */
    signOut(): Promise<void>;
    /** The current access token for a managed call, or null when signed out or expired. */
    getAccessToken(): Promise<string | null>;
}
/**
 * Create a managed-AI auth session bound to a product's Gatekeeper client and
 * storage. Shared by every product's web callback route and optional desktop flow
 */
export declare const createManagedAiAuth: (config: ManagedAiAuthConfig) => ManagedAiAuth;
