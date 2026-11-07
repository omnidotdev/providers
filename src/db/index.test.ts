import { describe, expect, it } from "bun:test";

import { DEFAULT_LOCK_TIMEOUT_MS, buildMigrationPoolConfig } from "./index";

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
