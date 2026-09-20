import { describe, expect, it } from "bun:test";

import { createCoalescer } from "./coalesce";
import { createTtlCache } from "./ttlCache";

describe("createTtlCache", () => {
  it("returns a set value within its ttl", () => {
    const cache = createTtlCache<number>(1000, () => 0);
    cache.set("a", 42);

    expect(cache.get("a")).toBe(42);
  });

  it("expires a value after its ttl", () => {
    let clock = 0;
    const cache = createTtlCache<number>(1000, () => clock);
    cache.set("a", 42);
    clock = 1001;

    expect(cache.get("a")).toBeUndefined();
  });
});

describe("createCoalescer", () => {
  it("shares one in-flight promise per key", async () => {
    const coalesce = createCoalescer<number>();
    let calls = 0;

    const fn = () =>
      new Promise<number>((resolve) => {
        calls += 1;
        setTimeout(() => resolve(1), 5);
      });

    const [a, b] = await Promise.all([coalesce("k", fn), coalesce("k", fn)]);

    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(calls).toBe(1);
  });

  it("runs again after the first settles", async () => {
    const coalesce = createCoalescer<number>();
    let calls = 0;
    const fn = async () => {
      calls += 1;

      return calls;
    };

    await coalesce("k", fn);
    await coalesce("k", fn);

    expect(calls).toBe(2);
  });
});
