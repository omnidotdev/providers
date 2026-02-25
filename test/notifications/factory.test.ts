import { describe, expect, it } from "bun:test";

import { createNotificationProvider } from "../../src/notifications";
import { NoopNotificationProvider } from "../../src/notifications/noop";
import { ResendNotificationProvider } from "../../src/notifications/resend";

describe("createNotificationProvider", () => {
  it("should create noop provider by default", () => {
    const provider = createNotificationProvider({});

    expect(provider).toBeInstanceOf(NoopNotificationProvider);
  });

  it("should create noop provider explicitly", () => {
    const provider = createNotificationProvider({ provider: "noop" });

    expect(provider).toBeInstanceOf(NoopNotificationProvider);
  });

  it("should create resend provider with valid config", () => {
    const provider = createNotificationProvider({
      provider: "resend",
      apiKey: "re_test_123",
      defaultFrom: "noreply@example.com",
    });

    expect(provider).toBeInstanceOf(ResendNotificationProvider);
  });

  it("should throw on missing apiKey for resend", () => {
    expect(() =>
      createNotificationProvider({
        provider: "resend",
        defaultFrom: "noreply@example.com",
      }),
    ).toThrow("ResendNotificationProvider requires apiKey in config");
  });

  it("should throw on missing defaultFrom for resend", () => {
    expect(() =>
      createNotificationProvider({
        provider: "resend",
        apiKey: "re_test_123",
      }),
    ).toThrow("ResendNotificationProvider requires defaultFrom in config");
  });
});
