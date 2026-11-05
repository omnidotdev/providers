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

import {
  OAUTH_SCOPE,
  buildAuthorizeUrl,
  buildTokenRequestBody,
  codeChallengeS256,
  parseCallbackParams,
  parseTokenResponse,
  randomBase64Url,
} from "./pkce";

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

interface StoredToken {
  accessToken: string;
  /** Epoch ms, or null when the endpoint reported no lifetime. */
  expiresAt: number | null;
}

interface FlowState {
  verifier: string;
  state: string;
  /** Where to send the user back after a successful exchange. */
  returnTo: string;
}

/** The outcome of completing the OAuth redirect. */
export type CallbackResult =
  | { ok: true; returnTo: string }
  | { ok: false; error: string };

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

/** Treat a token as expired this many ms early, so an in-flight request does not race expiry. */
const EXPIRY_SKEW_MS = 5_000;

/** Read + parse a JSON value from a store, tolerating private mode or bad data. */
const readJson = <T>(store: KeyValueStore, key: string): T | null => {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const writeJson = (store: KeyValueStore, key: string, value: unknown): void => {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or storage disabled; the flow still works in-memory for this
    // navigation on platforms that allow it, and simply cannot persist here
  }
};

const removeKey = (store: KeyValueStore, key: string): void => {
  try {
    store.removeItem(key);
  } catch {
    // Nothing to do if storage is unavailable
  }
};

/**
 * Create a managed-AI auth session bound to a product's Gatekeeper client and
 * storage. Shared by every product's web callback route and optional desktop flow
 */
export const createManagedAiAuth = (
  config: ManagedAiAuthConfig,
): ManagedAiAuth => {
  const tokenKey = config.tokenKey ?? "omni:ai-auth-token:v1";
  const flowKey = config.flowKey ?? "omni:ai-auth-flow:v1";
  const scope = config.scope ?? OAUTH_SCOPE;
  const prompt = config.prompt ?? "login";
  const doFetch = config.fetchImpl ?? fetch;
  const now = config.now ?? (() => Date.now());

  const listeners = new Set<() => void>();
  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  const readToken = (): StoredToken | null => {
    const token = readJson<StoredToken>(config.tokenStore, tokenKey);
    if (!token?.accessToken) return null;
    if (token.expiresAt !== null && now() >= token.expiresAt - EXPIRY_SKEW_MS) {
      removeKey(config.tokenStore, tokenKey);
      return null;
    }
    return token;
  };

  const exchangeAndStore = async (
    code: string,
    codeVerifier: string,
    redirect: string,
  ): Promise<boolean> => {
    let parsed: ReturnType<typeof parseTokenResponse>;
    try {
      const response = await doFetch(
        `${(config.authBaseUrl as string).replace(/\/+$/, "")}/oauth2/token`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: buildTokenRequestBody({
            clientId: config.clientId,
            redirectUri: redirect,
            code,
            codeVerifier,
          }),
        },
      );
      if (!response.ok) return false;
      parsed = parseTokenResponse(await response.json());
    } catch {
      return false;
    }
    if (!parsed) return false;

    const stored: StoredToken = {
      accessToken: parsed.accessToken,
      expiresAt:
        parsed.expiresIn !== null ? now() + parsed.expiresIn * 1_000 : null,
    };
    writeJson(config.tokenStore, tokenKey, stored);
    notify();
    return true;
  };

  return {
    isConfigured: () => Boolean(config.authBaseUrl),

    isSignedIn: () => readToken() !== null,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async signIn() {
      if (!config.authBaseUrl) return;

      const verifier = randomBase64Url(32);
      const state = randomBase64Url(16);
      const codeChallenge = await codeChallengeS256(verifier);

      if (config.native?.isNative()) {
        const authorizeUrl = buildAuthorizeUrl({
          authBaseUrl: config.authBaseUrl,
          clientId: config.clientId,
          redirectUri: config.native.redirectUri,
          scope,
          state,
          codeChallenge,
          prompt,
        });
        try {
          const query = await config.native.invokeLoopback(authorizeUrl);
          const params = parseCallbackParams(query);
          if (params.ok && params.state === state) {
            await exchangeAndStore(
              params.code,
              verifier,
              config.native.redirectUri,
            );
          }
        } catch {
          // Login aborted, timed out, or the port was busy; stay signed out
        }
        return;
      }

      const redirectUri = config.resolveRedirectUri();
      const flow: FlowState = {
        verifier,
        state,
        returnTo: config.resolveReturnTo?.() ?? "/",
      };
      writeJson(config.flowStore, flowKey, flow);

      config.navigate(
        buildAuthorizeUrl({
          authBaseUrl: config.authBaseUrl,
          clientId: config.clientId,
          redirectUri,
          scope,
          state,
          codeChallenge,
          prompt,
        }),
      );
    },

    async completeCallback(search) {
      if (!config.authBaseUrl) return { ok: false, error: "not_configured" };

      const params = parseCallbackParams(search);
      if (!params.ok) return { ok: false, error: params.error };

      const flow = readJson<FlowState>(config.flowStore, flowKey);
      removeKey(config.flowStore, flowKey);
      if (!flow || flow.state !== params.state) {
        return { ok: false, error: "state_mismatch" };
      }

      const ok = await exchangeAndStore(
        params.code,
        flow.verifier,
        config.resolveRedirectUri(),
      );
      return ok
        ? { ok: true, returnTo: flow.returnTo || "/" }
        : { ok: false, error: "token_exchange_failed" };
    },

    async signOut() {
      removeKey(config.tokenStore, tokenKey);
      notify();
    },

    async getAccessToken() {
      return readToken()?.accessToken ?? null;
    },
  };
};
