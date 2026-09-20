import { describe, expect, it, mock } from "bun:test";

import {
  ECOSYSTEM_READ_NEGATIVE_TTL_MS,
  ECOSYSTEM_READ_TTL_MS,
  createTtlReadCache,
} from "./ttlReadCache";

/**
 * Behavior test for the short-TTL in-memory read cache that fronts the ecosystem
 * upstream reads. A controllable clock is injected so expiry is deterministic
 * without real timers: `read` must serve a live hit without re-running the
 * loader, refetch once an entry is past its TTL, cache null/fail-soft results
 * under a shorter negative TTL, and bound its own memory.
 */

/** A clock whose value the test advances by hand. */
const fakeClock = (start = 1_000_000) => {
  let current = start;

  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
};

describe("createTtlReadCache", () => {
  it("serves a second call within the TTL from cache without re-running the loader", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now });
    const load = mock(async () => "value");

    expect(await cache.read("k", load)).toBe("value");
    clock.advance(ECOSYSTEM_READ_TTL_MS - 1);
    expect(await cache.read("k", load)).toBe("value");

    expect(load).toHaveBeenCalledTimes(1);
  });

  it("re-runs the loader once an entry is past its TTL", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now });
    const load = mock(async () => "value");

    await cache.read("k", load);
    clock.advance(ECOSYSTEM_READ_TTL_MS + 1);
    await cache.read("k", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("caches a null result under the shorter negative TTL, then refetches", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now });
    const load = mock(async () => null);

    // First miss caches the null result
    expect(await cache.read("k", load)).toBeNull();

    // Still within the negative window: served from cache, loader not re-run
    clock.advance(ECOSYSTEM_READ_NEGATIVE_TTL_MS - 1);
    expect(await cache.read("k", load)).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);

    // Past the negative window (but still within the positive TTL): refetch
    clock.advance(2);
    await cache.read("k", load);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("keeps a positive entry alive past the negative TTL", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now });
    const load = mock(async () => "value");

    await cache.read("k", load);
    // Well past the negative window but under the positive TTL
    clock.advance(ECOSYSTEM_READ_NEGATIVE_TTL_MS + 1);
    expect(await cache.read("k", load)).toBe("value");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("caches per key, not globally", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now });
    const loadA = mock(async () => "a");
    const loadB = mock(async () => "b");

    expect(await cache.read("a", loadA)).toBe("a");
    expect(await cache.read("b", loadB)).toBe("b");
    expect(await cache.read("a", loadA)).toBe("a");

    expect(loadA).toHaveBeenCalledTimes(1);
    expect(loadB).toHaveBeenCalledTimes(1);
  });

  it("clear() drops every entry so the next read re-runs the loader", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now });
    const load = mock(async () => "value");

    await cache.read("k", load);
    cache.clear();
    await cache.read("k", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("bounds memory by evicting once the max entry cap is exceeded", async () => {
    const clock = fakeClock();
    const cache = createTtlReadCache<string>({ now: clock.now, maxEntries: 2 });

    await cache.read("a", async () => "a");
    await cache.read("b", async () => "b");
    // Third distinct key exceeds the cap and forces eviction of the oldest
    await cache.read("c", async () => "c");

    const loadA = mock(async () => "a");
    // "a" was the oldest and should have been evicted, so it re-runs the loader
    await cache.read("a", loadA);
    expect(loadA).toHaveBeenCalledTimes(1);
  });
});
