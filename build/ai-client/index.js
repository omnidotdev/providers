// src/ai-client/errors.ts
class GatewayError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
  }
}
var classifyGatewayError = (status) => {
  switch (status) {
    case 401:
      return "signIn";
    case 402:
      return "outOfCredits";
    case 403:
      return "notAllowed";
    case 429:
      return "rateLimited";
    default:
      return "generic";
  }
};
// src/ai-client/gateway.ts
var NOT_CONFIGURED = "AI generation is not configured.";
var GENERIC_FAILURE = "AI generation failed. Please try again.";
var SIGN_IN_REQUIRED = "Sign in to generate, or add your own Synapse key.";
var readErrorMessage = async (response) => {
  try {
    const data = await response.json();
    if (typeof data.error === "string" && data.error.length > 0) {
      return data.error;
    }
  } catch {}
  return GENERIC_FAILURE;
};
var createGatewayClient = (config) => {
  const doFetch = config.fetchImpl ?? fetch;
  return {
    async post(path, body, opts = {}) {
      if (!config.baseUrl)
        throw new GatewayError(NOT_CONFIGURED);
      const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
      const headers = {
        "content-type": "application/json"
      };
      const payload = { ...body };
      if (opts.byokKey) {
        payload.byokKey = opts.byokKey;
      } else {
        const token = await config.getAccessToken?.() ?? null;
        if (!token)
          throw new GatewayError(SIGN_IN_REQUIRED, 401);
        headers.authorization = `Bearer ${token}`;
      }
      let response;
      try {
        response = await doFetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });
      } catch {
        throw new GatewayError(GENERIC_FAILURE);
      }
      if (!response.ok) {
        throw new GatewayError(await readErrorMessage(response), response.status);
      }
      return await response.json();
    }
  };
};
// src/ai-client/pkce.ts
var OAUTH_SCOPE = "openid profile email";
var base64UrlEncode = (bytes) => {
  let binary = "";
  for (const byte of bytes)
    binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
var randomBase64Url = (byteLength) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};
var codeChallengeS256 = async (verifier) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
};
var buildAuthorizeUrl = ({
  authBaseUrl,
  clientId,
  redirectUri,
  scope,
  state,
  codeChallenge,
  prompt
}) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });
  if (prompt)
    params.set("prompt", prompt);
  return `${authBaseUrl.replace(/\/+$/, "")}/oauth2/authorize?${params.toString()}`;
};
var parseCallbackParams = (search) => {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const error = params.get("error");
  if (error)
    return { ok: false, error };
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state)
    return { ok: false, error: "missing_code_or_state" };
  return { ok: true, code, state };
};
var buildTokenRequestBody = ({
  clientId,
  redirectUri,
  code,
  codeVerifier
}) => new URLSearchParams({
  grant_type: "authorization_code",
  code,
  redirect_uri: redirectUri,
  client_id: clientId,
  code_verifier: codeVerifier
}).toString();
var parseTokenResponse = (body) => {
  if (!body || typeof body !== "object")
    return null;
  const record = body;
  const accessToken = record.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0)
    return null;
  const expiresIn = record.expires_in;
  return {
    accessToken,
    expiresIn: typeof expiresIn === "number" ? expiresIn : null
  };
};
// src/ai-client/session.ts
var EXPIRY_SKEW_MS = 5000;
var readJson = (store, key) => {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
var writeJson = (store, key, value) => {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {}
};
var removeKey = (store, key) => {
  try {
    store.removeItem(key);
  } catch {}
};
var createManagedAiAuth = (config) => {
  const tokenKey = config.tokenKey ?? "omni:ai-auth-token:v1";
  const flowKey = config.flowKey ?? "omni:ai-auth-flow:v1";
  const scope = config.scope ?? OAUTH_SCOPE;
  const prompt = config.prompt ?? "login";
  const doFetch = config.fetchImpl ?? fetch;
  const now = config.now ?? (() => Date.now());
  const listeners = new Set;
  const notify = () => {
    for (const listener of listeners)
      listener();
  };
  const readToken = () => {
    const token = readJson(config.tokenStore, tokenKey);
    if (!token?.accessToken)
      return null;
    if (token.expiresAt !== null && now() >= token.expiresAt - EXPIRY_SKEW_MS) {
      removeKey(config.tokenStore, tokenKey);
      return null;
    }
    return token;
  };
  const exchangeAndStore = async (code, codeVerifier, redirect) => {
    let parsed;
    try {
      const response = await doFetch(`${config.authBaseUrl.replace(/\/+$/, "")}/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: buildTokenRequestBody({
          clientId: config.clientId,
          redirectUri: redirect,
          code,
          codeVerifier
        })
      });
      if (!response.ok)
        return false;
      parsed = parseTokenResponse(await response.json());
    } catch {
      return false;
    }
    if (!parsed)
      return false;
    const stored = {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresIn !== null ? now() + parsed.expiresIn * 1000 : null
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
      if (!config.authBaseUrl)
        return;
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
          prompt
        });
        try {
          const query = await config.native.invokeLoopback(authorizeUrl);
          const params = parseCallbackParams(query);
          if (params.ok && params.state === state) {
            await exchangeAndStore(params.code, verifier, config.native.redirectUri);
          }
        } catch {}
        return;
      }
      const redirectUri = config.resolveRedirectUri();
      const flow = {
        verifier,
        state,
        returnTo: config.resolveReturnTo?.() ?? "/"
      };
      writeJson(config.flowStore, flowKey, flow);
      config.navigate(buildAuthorizeUrl({
        authBaseUrl: config.authBaseUrl,
        clientId: config.clientId,
        redirectUri,
        scope,
        state,
        codeChallenge,
        prompt
      }));
    },
    async completeCallback(search) {
      if (!config.authBaseUrl)
        return { ok: false, error: "not_configured" };
      const params = parseCallbackParams(search);
      if (!params.ok)
        return { ok: false, error: params.error };
      const flow = readJson(config.flowStore, flowKey);
      removeKey(config.flowStore, flowKey);
      if (!flow || flow.state !== params.state) {
        return { ok: false, error: "state_mismatch" };
      }
      const ok = await exchangeAndStore(params.code, flow.verifier, config.resolveRedirectUri());
      return ok ? { ok: true, returnTo: flow.returnTo || "/" } : { ok: false, error: "token_exchange_failed" };
    },
    async signOut() {
      removeKey(config.tokenStore, tokenKey);
      notify();
    },
    async getAccessToken() {
      return readToken()?.accessToken ?? null;
    }
  };
};
// src/ai-client/useManagedAiAuth.ts
import { useCallback, useSyncExternalStore } from "react";
var useManagedAiAuth = (auth) => {
  const subscribe = useCallback((onChange) => auth.subscribe(onChange), [auth]);
  const isSignedIn = useSyncExternalStore(subscribe, () => auth.isSignedIn(), () => false);
  return {
    isConfigured: auth.isConfigured(),
    isSignedIn,
    signIn: auth.signIn,
    signOut: auth.signOut
  };
};
export {
  GatewayError,
  OAUTH_SCOPE,
  base64UrlEncode,
  buildAuthorizeUrl,
  buildTokenRequestBody,
  classifyGatewayError,
  codeChallengeS256,
  createGatewayClient,
  createManagedAiAuth,
  parseCallbackParams,
  parseTokenResponse,
  randomBase64Url,
  useManagedAiAuth
};
