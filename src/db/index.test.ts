import { describe, expect, it } from "bun:test";

import {
  DEFAULT_LOCK_TIMEOUT_MS,
  buildMigrationPoolConfig,
  findShadowedMigrations,
} from "./index";

/**
 * The migration pool sets a Postgres `lock_timeout` on every connection so a
 * migration that must wait for a lock (e.g. an `ALTER TABLE` queued behind a
 * long-running transaction holding the table) fails fast instead of queuing an
 * `ACCESS EXCLUSIVE` request that head-of-line-blocks reads on a hot table.
 */
describe("buildMigrationPoolConfig", () => {
  it("applies the default lock_timeout as a per-connection server option", () => {
    const config = buildMigrationPoolConfig("postgres://localhost/app");

    expect(config.connectionString).toBe("postgres://localhost/app");
    expect(config.options).toBe(`-c lock_timeout=${DEFAULT_LOCK_TIMEOUT_MS}`);
  });

  it("honors an explicit lock_timeout override", () => {
    const config = buildMigrationPoolConfig("postgres://localhost/app", 5000);

    expect(config.options).toBe("-c lock_timeout=5000");
  });

  it("omits the lock_timeout option when disabled with 0", () => {
    const config = buildMigrationPoolConfig("postgres://localhost/app", 0);

    expect(config.options).toBeUndefined();
    expect(config.connectionString).toBe("postgres://localhost/app");
  });

  it("treats a negative timeout as disabled", () => {
    const config = buildMigrationPoolConfig("postgres://localhost/app", -1);

    expect(config.options).toBeUndefined();
  });
});

/**
 * drizzle-orm only runs journal entries newer than the tracker's newest
 * `created_at`, so a tracker row stamped later than pending migrations makes
 * drizzle skip them silently on every boot
 */
describe("findShadowedMigrations", () => {
  const journal = [
    { tag: "0000_init", when: 1000, hash: "h0" },
    { tag: "0001_add_column", when: 2000, hash: "h1" },
    { tag: "0002_add_column", when: 3000, hash: "h2" },
    { tag: "0003_add_column", when: 4000, hash: "h3" },
  ];

  it("finds untracked migrations at or below a later-stamped tracker row", () => {
    // 0000 recorded with a `now()` timestamp newer than every journal entry
    const shadowed = findShadowedMigrations(journal, new Set(["h0"]), 9999);

    expect(shadowed.map((m) => m.tag)).toEqual([
      "0001_add_column",
      "0002_add_column",
      "0003_add_column",
    ]);
  });

  it("treats an entry stamped exactly at the high-water mark as shadowed", () => {
    // drizzle runs a migration only when created_at < when
    const shadowed = findShadowedMigrations(journal, new Set(["h0"]), 2000);

    expect(shadowed.map((m) => m.tag)).toEqual(["0001_add_column"]);
  });

  it("returns nothing for a healthy tracker with pending migrations", () => {
    // Tracker stamped with 0000's own `when`: drizzle applies the rest itself
    expect(findShadowedMigrations(journal, new Set(["h0"]), 1000)).toEqual([]);
  });

  it("returns nothing when every migration is tracked", () => {
    expect(
      findShadowedMigrations(journal, new Set(["h0", "h1", "h2", "h3"]), 9999),
    ).toEqual([]);
  });

  it("leaves an untracked entry that precedes a tracked one alone", () => {
    // 0001 edited after it was applied: its new hash is untracked, but later
    // migrations are tracked, so it is not pending and must not re-run
    const shadowed = findShadowedMigrations(
      journal,
      new Set(["h0", "h2", "h3"]),
      4000,
    );

    expect(shadowed).toEqual([]);
  });

  it("only returns the tail after the last tracked migration", () => {
    const shadowed = findShadowedMigrations(
      journal,
      new Set(["h0", "h2"]),
      9999,
    );

    expect(shadowed.map((m) => m.tag)).toEqual(["0003_add_column"]);
  });

  it("returns nothing for an empty tracker", () => {
    expect(findShadowedMigrations(journal, new Set(), undefined)).toEqual([]);
  });

  it("returns nothing when the newest row has no usable timestamp", () => {
    // drizzle reads a NULL created_at as 0 and runs everything itself
    expect(
      findShadowedMigrations(journal, new Set(["h0"]), Number.NaN),
    ).toEqual([]);
  });
});
