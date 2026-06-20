import { describe, expect, it } from "bun:test";

import { DEFAULT_MEDIA_LIMITS } from "./config";
import {
  acceptString,
  formatBytes,
  kindFromMimeType,
  validateFile,
} from "./validation";

import type { MediaLimits } from "./types";

const MB = 1024 * 1024;

describe("kindFromMimeType", () => {
  it("resolves image, video, and file kinds", () => {
    expect(kindFromMimeType("image/png")).toBe("image");
    expect(kindFromMimeType("video/mp4")).toBe("video");
    expect(kindFromMimeType("application/pdf")).toBe("file");
  });

  it("returns null for unsupported MIME types", () => {
    expect(kindFromMimeType("application/x-executable")).toBeNull();
    expect(kindFromMimeType("")).toBeNull();
  });

  it("respects a custom config", () => {
    const limits: MediaLimits = {
      image: { maxBytes: MB, mimeTypes: ["image/png"] },
      video: { maxBytes: MB, mimeTypes: [] },
      file: { maxBytes: MB, mimeTypes: [] },
    };

    expect(kindFromMimeType("image/png", limits)).toBe("image");
    // jpeg is in the default config but not the custom one
    expect(kindFromMimeType("image/jpeg", limits)).toBeNull();
  });
});

describe("validateFile", () => {
  it("accepts a valid image", () => {
    const result = validateFile({
      type: "image/png",
      size: 2 * MB,
      name: "a.png",
    });

    expect(result).toEqual({ ok: true, kind: "image" });
  });

  it("rejects an oversize file", () => {
    const result = validateFile({
      type: "image/png",
      size: 21 * MB,
      name: "big.png",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("20MB");
  });

  it("rejects a disallowed MIME type", () => {
    const result = validateFile({ type: "application/x-msdownload", size: 1 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("unsupported");
  });

  it("rejects an empty file", () => {
    const result = validateFile({ type: "image/png", size: 0 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("empty");
  });

  it("respects a custom config", () => {
    const limits: MediaLimits = {
      ...DEFAULT_MEDIA_LIMITS,
      image: { maxBytes: 1 * MB, mimeTypes: ["image/png"] },
    };

    // Within default limit (20MB) but over the custom 1MB cap
    const result = validateFile({ type: "image/png", size: 2 * MB }, limits);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("1MB");
  });

  it("does not shrink either app's documented limits", () => {
    expect(DEFAULT_MEDIA_LIMITS.image.maxBytes).toBe(20 * MB);
    expect(DEFAULT_MEDIA_LIMITS.video.maxBytes).toBe(50 * MB);
    expect(DEFAULT_MEDIA_LIMITS.file.maxBytes).toBe(25 * MB);
  });
});

describe("formatBytes", () => {
  it("formats across unit boundaries", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2 * 1024)).toBe("2.0 KB");
    expect(formatBytes(3.2 * MB)).toBe("3.2 MB");
    expect(formatBytes(15 * MB)).toBe("15 MB");
    expect(formatBytes(2 * 1024 * MB)).toBe("2.0 GB");
  });
});

describe("acceptString", () => {
  it("includes every configured MIME type", () => {
    const accept = acceptString();

    expect(accept).toContain("image/png");
    expect(accept).toContain("video/mp4");
    expect(accept).toContain("application/pdf");
  });

  it("respects a custom config", () => {
    const limits: MediaLimits = {
      image: { maxBytes: MB, mimeTypes: ["image/png"] },
      video: { maxBytes: MB, mimeTypes: [] },
      file: { maxBytes: MB, mimeTypes: [] },
    };

    expect(acceptString(limits)).toBe("image/png");
  });
});
