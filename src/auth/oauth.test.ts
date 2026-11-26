import { describe, expect, it } from "bun:test";

import { createOmniOAuthConfig } from "./oauth";

describe("createOmniOAuthConfig", () => {
  const config = createOmniOAuthConfig({
    clientId: "app",
    clientSecret: "secret",
    authBaseUrl: "https://identity.test",
    authInternalUrl: "http://gatekeeper.internal",
  });

  it("points at the endpoints Gatekeeper's discovery document advertises", () => {
    expect(config.authorizationUrl).toBe(
      "https://identity.test/oauth2/authorize",
    );
    expect(config.tokenUrl).toBe("http://gatekeeper.internal/oauth2/token");
    expect(config.userInfoUrl).toBe(
      "http://gatekeeper.internal/oauth2/userinfo",
    );
  });
});
