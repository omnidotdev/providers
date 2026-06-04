import { describe, expect, it } from "bun:test";

import { createFlagProvider } from "../../src/flags";
import { FractalFlagProvider } from "../../src/flags/fractal";
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

  it("should fall back to noop when unleash url is missing", () => {
    const provider = createFlagProvider({
      provider: "unleash",
      apiKey: "key",
      appName: "app",
    });

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });

  it("should fall back to noop when unleash apiKey is missing", () => {
    const provider = createFlagProvider({
      provider: "unleash",
      url: "http://localhost:4242/api",
      appName: "app",
    });

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });

  it("should fall back to noop when unleash appName is missing", () => {
    const provider = createFlagProvider({
      provider: "unleash",
      url: "http://localhost:4242/api",
      apiKey: "key",
    });

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });

  it("should create fractal provider with valid config", () => {
    const provider = createFlagProvider({
      provider: "fractal",
      url: "https://api.fractal.omni.dev/graphql",
      project: "thrivestream",
    });

    expect(provider).toBeInstanceOf(FractalFlagProvider);
  });

  it("should fall back to noop when fractal url is missing", () => {
    const provider = createFlagProvider({
      provider: "fractal",
      project: "thrivestream",
    });

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });

  it("should fall back to noop when fractal project is missing", () => {
    const provider = createFlagProvider({
      provider: "fractal",
      url: "https://api.fractal.omni.dev/graphql",
    });

    expect(provider).toBeInstanceOf(NoopFlagProvider);
  });
});
