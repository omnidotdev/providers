import { describe, expect, it } from "bun:test";

import { createApiKeyProvider } from "../../src/apiKey";
import { GatekeeperApiKeyProvider } from "../../src/apiKey/gatekeeper";
import { NoopApiKeyProvider } from "../../src/apiKey/noop";

describe("createApiKeyProvider", () => {
  it("should create noop provider by default", () => {
    const provider = createApiKeyProvider({});

    expect(provider).toBeInstanceOf(NoopApiKeyProvider);
  });

  it("should create noop provider explicitly", () => {
    const provider = createApiKeyProvider({ provider: "noop" });

    expect(provider).toBeInstanceOf(NoopApiKeyProvider);
  });

  it("should create gatekeeper provider with valid config", () => {
    const provider = createApiKeyProvider({
      provider: "gatekeeper",
      authBaseUrl: "http://localhost:3000",
    });

    expect(provider).toBeInstanceOf(GatekeeperApiKeyProvider);
  });

  it("should throw when gatekeeper authBaseUrl is missing", () => {
    expect(() =>
      createApiKeyProvider({
        provider: "gatekeeper",
      }),
    ).toThrow("GatekeeperApiKeyProvider requires authBaseUrl in config");
  });
});
