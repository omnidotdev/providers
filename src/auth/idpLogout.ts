/**
 * Build the IDP (Gatekeeper) OIDC end-session URL for federated logout.
 *
 * Returns null unless every part is present, INCLUDING `idTokenHint`:
 * Gatekeeper's end-session endpoint requires `id_token_hint` and rejects a
 * request without it, so a caller that lacks the id token must fall back to a
 * local-only sign-out rather than redirect the browser into a validation error.
 */
export interface IdpLogoutConfig {
  /** IDP base URL, e.g. https://identity.omni.dev */
  authBaseUrl?: string;
  /** OAuth client id */
  clientId?: string;
  /** Post-logout redirect target (the app's own base URL) */
  redirectUri?: string;
  /** The user's id token; required by the end-session endpoint */
  idTokenHint?: string;
  /**
   * Which accounts on the browser to sign out of when more than one is signed
   * in: only the app's account (`"current"`; the others stay signed in and the
   * next becomes active) or every one (`"all"`). Unset, the identity provider
   * asks when it needs to
   */
  accounts?: "current" | "all";
}

export const buildIdpLogoutUrl = ({
  authBaseUrl,
  clientId,
  redirectUri,
  idTokenHint,
  accounts,
}: IdpLogoutConfig): string | null => {
  if (!authBaseUrl || !clientId || !redirectUri || !idTokenHint) return null;

  const url = new URL(`${authBaseUrl}/oauth2/end-session`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("post_logout_redirect_uri", redirectUri);
  url.searchParams.set("id_token_hint", idTokenHint);
  if (accounts) url.searchParams.set("accounts", accounts);

  return url.toString();
};
