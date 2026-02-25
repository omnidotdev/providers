import { describe, expect, it } from "bun:test";

import { createFlagProvider } from "../../src/flags";
import { NoopFlagProvider } from "../../src/flags/noop";
import { UnleashFlagProvider } from "../../src/flags/unleash";

describe("createFlagProvider", () => {
  it("should create noop provider by default", () => {
    const provider = createFlagProvider({});

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });

  it("should create noop provider explicitly", () => {
    const provider = createFlagProvider({ provider: "noop" });

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });

  it("should create unleash provider with valid config", () => {
    const provider = createFlagProvider({
      provider: "unleash",
      url: "http://localhost:4242/api",
      apiKey: "test-key",
      appName: "test-app",
    });

    expect(provider).toBeInstanceOf(UnleashFlagProvider);
  });

  it("should throw when unleash url is missing", () => {
    expect(() =>
      createFlagProvider({
        provider: "unleash",
        apiKey: "key",
        appName: "app",
      }),
    ).toThrow("UnleashFlagProvider requires url in config");
  });

  it("should throw when unleash apiKey is missing", () => {
    expect(() =>
      createFlagProvider({
        provider: "unleash",
        url: "http://localhost:4242/api",
        appName: "app",
      }),
    ).toThrow("UnleashFlagProvider requires apiKey in config");
  });

  it("should throw when unleash appName is missing", () => {
    expect(() =>
      createFlagProvider({
        provider: "unleash",
        url: "http://localhost:4242/api",
        apiKey: "key",
      }),
    ).toThrow("UnleashFlagProvider requires appName in config");
  });
});
