/**
 * Configuration for the Omni/Gatekeeper OAuth provider.
 */
type OmniOAuthConfig = {
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** External auth base URL (browser-facing, e.g. https://auth.omni.dev) */
  authBaseUrl: string;
  /** Internal auth URL for server-to-server communication (e.g. http://gatekeeper:3001) */
  authInternalUrl: string;
  /** OAuth scopes (defaults to openid, profile, email, offline_access, organization) */
  scopes?: string[];
};

/**
 * Create a genericOAuth config for the Omni/Gatekeeper provider.
 *
 * Uses explicit URLs instead of `discoveryUrl` to avoid a Better Auth
 * issue where token exchange uses the discovery doc's external URL,
 * which is unreachable from inside Docker containers.
 *
 * `authorizationUrl` uses the external URL (user's browser hits it).
 * `tokenUrl` and `userInfoUrl` use the internal URL (server-to-server).
 * @param config - OAuth provider configuration
 * @returns Config object for Better Auth's `genericOAuth({ config: [result] })`
 */
function createOmniOAuthConfig(config: OmniOAuthConfig) {
  return {
    providerId: "omni" as const,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorizationUrl: `${config.authBaseUrl}/oauth2/authorize`,
    tokenUrl: `${config.authInternalUrl}/oauth2/token`,
    userInfoUrl: `${config.authInternalUrl}/userinfo`,
    scopes: config.scopes ?? [
      "openid",
      "profile",
      "email",
      "offline_access",
      "organization",
    ],
    accessType: "offline" as const,
    pkce: true,
    mapProfileToUser: (profile: Record<string, unknown>) => ({
      name: profile.name as string,
      email: profile.email as string,
      emailVerified: profile.email_verified as boolean,
      image: profile.picture as string,
    }),
  };
}

export { createOmniOAuthConfig };

export type { OmniOAuthConfig };
