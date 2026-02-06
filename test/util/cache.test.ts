import { beforeEach, describe, expect, it } from "bun:test";

import { TtlCache } from "../../src/util/cache";

describe("TtlCache", () => {
  let cache: TtlCache<string>;

  beforeEach(() => {
    cache = new TtlCache({ defaultTtlMs: 1000 });
  });

  it("should store and retrieve values", () => {
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("should return null for missing keys", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("should expire entries after TTL", async () => {
    cache = new TtlCache({ defaultTtlMs: 50 });
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");

    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("key")).toBeNull();
  });

  it("should respect custom TTL per entry", async () => {
    cache.set("short", "value", 50);
    cache.set("long", "value", 5000);

    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("short")).toBeNull();
    expect(cache.get("long")).toBe("value");
  });

  it("should invalidate by substring pattern", () => {
    cache.set("user:123:org:456", "a");
    cache.set("user:123:org:789", "b");
    cache.set("user:456:org:456", "c");

    cache.invalidate("user:123");
    expect(cache.get("user:123:org:456")).toBeNull();
    expect(cache.get("user:123:org:789")).toBeNull();
    expect(cache.get("user:456:org:456")).toBe("c");
  });

  it("should invalidate by prefix", () => {
    cache.set("org:123:feature1", "a");
    cache.set("org:123:feature2", "b");
    cache.set("org:456:feature1", "c");

    cache.invalidateByPrefix("org:123:");
    expect(cache.get("org:123:feature1")).toBeNull();
    expect(cache.get("org:123:feature2")).toBeNull();
    expect(cache.get("org:456:feature1")).toBe("c");
  });

  it("should clear all entries", () => {
    cache.set("a", "1");
    cache.set("b", "2");
    cache.clear();
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeNull();
    expect(cache.size).toBe(0);
  });

  it("should support version-aware invalidation", () => {
    cache.set("key", "value", undefined, 1);
    expect(cache.get("key", 1)).toBe("value");
    expect(cache.get("key", 2)).toBeNull();
  });

  it("should report has correctly", () => {
    cache.set("exists", "value");
    expect(cache.has("exists")).toBe(true);
    expect(cache.has("missing")).toBe(false);
  });

  it("should delete specific entries", () => {
    cache.set("key", "value");
    cache.delete("key");
    expect(cache.get("key")).toBeNull();
  });
});
