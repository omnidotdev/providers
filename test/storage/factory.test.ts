import { describe, expect, it } from "bun:test";

import { createStorageProvider } from "../../src/storage";
import { NoopStorageProvider } from "../../src/storage/noop";
import { S3StorageProvider } from "../../src/storage/s3";

describe("createStorageProvider", () => {
  it("should create noop provider by default", () => {
    const provider = createStorageProvider({});

    expect(provider).toBeInstanceOf(NoopStorageProvider);
  });

  it("should create noop provider explicitly", () => {
    const provider = createStorageProvider({ provider: "noop" });

    expect(provider).toBeInstanceOf(NoopStorageProvider);
  });

  it("should create s3 provider with valid config", () => {
    const provider = createStorageProvider({
      provider: "s3",
      bucket: "my-bucket",
      region: "us-west-2",
    });

    expect(provider).toBeInstanceOf(S3StorageProvider);
  });

  it("should throw on missing bucket for s3", () => {
    expect(() =>
      createStorageProvider({
        provider: "s3",
      }),
    ).toThrow("S3StorageProvider requires bucket in config");
  });
});
