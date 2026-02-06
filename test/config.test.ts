import { afterEach, describe, expect, it } from "bun:test";

import { isSelfHosted, resolveProvider } from "../src/config";

describe("resolveProvider", () => {
  it("should return explicit value when provided", () => {
    expect(resolveProvider("custom", "warden")).toBe("custom");
  });

  it("should return SaaS default when not self-hosted", () => {
    delete process.env.SELF_HOSTED;
    expect(resolveProvider(undefined, "warden")).toBe("warden");
  });

  it("should return self-hosted default when self-hosted", () => {
    process.env.SELF_HOSTED = "true";
    expect(resolveProvider(undefined, "warden")).toBe("local");
  });

  it("should support custom self-hosted default", () => {
    process.env.SELF_HOSTED = "true";
    expect(resolveProvider(undefined, "warden", "custom-local")).toBe(
      "custom-local",
    );
  });

  afterEach(() => {
    delete process.env.SELF_HOSTED;
  });
});

describe("isSelfHosted", () => {
  it("should return true when SELF_HOSTED is 'true'", () => {
    process.env.SELF_HOSTED = "true";
    expect(isSelfHosted()).toBe(true);
  });

  it("should return false when SELF_HOSTED is unset", () => {
    delete process.env.SELF_HOSTED;
    expect(isSelfHosted()).toBe(false);
  });

  it("should return false when SELF_HOSTED is 'false'", () => {
    process.env.SELF_HOSTED = "false";
    expect(isSelfHosted()).toBe(false);
  });

  afterEach(() => {
    delete process.env.SELF_HOSTED;
  });
});
