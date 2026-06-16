import { describe, expect, it } from "bun:test";

import { createNotificationProvider } from "../../src/notifications";
import { HeraldNotificationProvider } from "../../src/notifications/herald";
import { NoopNotificationProvider } from "../../src/notifications/noop";

describe("createNotificationProvider", () => {
  it("should create noop provider by default", () => {
    const provider = createNotificationProvider({});

    expect(provider).toBeInstanceOf(NoopNotificationProvider);
  });

  it("should create noop provider explicitly", () => {
    const provider = createNotificationProvider({ provider: "noop" });

    expect(provider).toBeInstanceOf(NoopNotificationProvider);
  });

  it("should create herald provider with valid config", () => {
    const provider = createNotificationProvider({
      provider: "herald",
      apiKey: "hk_test_123",
      apiUrl: "https://herald.example.com",
      defaultFrom: "noreply@example.com",
    });

    expect(provider).toBeInstanceOf(HeraldNotificationProvider);
  });

  it("should throw on missing apiKey for herald", () => {
    expect(() =>
      createNotificationProvider({
        provider: "herald",
        apiUrl: "https://herald.example.com",
        defaultFrom: "noreply@example.com",
      }),
    ).toThrow("HeraldNotificationProvider requires apiKey in config");
  });

  it("should throw on missing defaultFrom for herald", () => {
    expect(() =>
      createNotificationProvider({
        provider: "herald",
        apiKey: "hk_test_123",
        apiUrl: "https://herald.example.com",
      }),
    ).toThrow("HeraldNotificationProvider requires defaultFrom in config");
  });
});
