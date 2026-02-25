import { describe, expect, it } from "bun:test";

import { NoopStorageProvider } from "../../src/storage/noop";

describe("NoopStorageProvider", () => {
  it("should return key and url on upload", async () => {
    const provider = new NoopStorageProvider();

    const result = await provider.upload({
      key: "images/photo.jpg",
      body: "fake-body",
    });

    expect(result.key).toBe("images/photo.jpg");
    expect(result.url).toBe("https://noop.example.com/images/photo.jpg");
  });

  it("should resolve delete without error", async () => {
    const provider = new NoopStorageProvider();

    await expect(provider.delete("images/photo.jpg")).resolves.toBeUndefined();
  });

  it("should return a valid presigned upload URL result", async () => {
    const provider = new NoopStorageProvider();

    const result = await provider.getPresignedUploadUrl({
      key: "uploads/file.pdf",
      expiresIn: 600,
    });

    expect(result.url).toBe("https://noop.example.com/upload/uploads/file.pdf");
    expect(result.key).toBe("uploads/file.pdf");
    expect(result.expiresIn).toBe(600);
  });

  it("should default presigned URL expiry to 3600", async () => {
    const provider = new NoopStorageProvider();

    const result = await provider.getPresignedUploadUrl({
      key: "uploads/file.pdf",
    });

    expect(result.expiresIn).toBe(3600);
  });

  it("should return a predictable public URL", () => {
    const provider = new NoopStorageProvider();

    const url = provider.getPublicUrl("assets/logo.png");

    expect(url).toBe("https://noop.example.com/assets/logo.png");
  });

  it("should report healthy", async () => {
    const provider = new NoopStorageProvider();
    const health = await provider.healthCheck();

    expect(health.healthy).toBe(true);
    expect(health.message).toBe("noop");
  });

  it("should close without error", async () => {
    const provider = new NoopStorageProvider();
    await expect(provider.close()).resolves.toBeUndefined();
  });
});
