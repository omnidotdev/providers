/**
 * Shared, resilient database migration runner for Omni services.
 *
 * Every Elysia API service runs drizzle migrations on boot. A plain
 * `migrate()` hard-fails if the migration tracker (`drizzle.__drizzle_migrations`)
 * falls behind the database - after a migration regen/squash, a partial run, or
 * a restore - because it re-applies an already-applied migration and aborts on a
 * non-idempotent statement (`CREATE POLICY ... already exists`, and other
 * `duplicate_*` errors), bricking every boot.
 *
 * `runMigrations` wraps `migrate` so that, on such an error, it reconciles the
 * tracker to the database (probing each untracked migration in a rolled-back,
 * side-effect-free transaction and recording the ones already applied) and
 * retries once. A genuinely pending migration still applies; a real error still
 * surfaces. This lives here so the whole fleet shares one implementation instead
 * of copying a migrate script per service.
 *
 * `drizzle-orm` and `pg` are optional peer dependencies: only services that call
 * `runMigrations` need them (they already do), so non-database consumers of
 * `@omnidotdev/providers` are unaffected.
 */
import { Pool } from "pg";
import type { PoolConfig } from "pg";
/**
 * Default `lock_timeout` (milliseconds) applied to migration connections. A
 * migration that cannot acquire a lock within this window fails fast instead of
 * queuing a lock request that blocks other sessions on the same table.
 */
export declare const DEFAULT_LOCK_TIMEOUT_MS = 10000;
/**
 * Build the `pg.Pool` config for the migration connection, setting a Postgres
 * `lock_timeout` as a per-connection server option (`-c lock_timeout=<ms>`) so
 * every statement a migration runs gives up waiting for a lock after the
 * window rather than queuing.
 *
 * Why this matters: a plain `ALTER TABLE` takes an `ACCESS EXCLUSIVE` lock. If a
 * long-running transaction holds any lock on the table (e.g. an abandoned
 * `pg_dump` holding `ACCESS SHARE`), the `ALTER` queues, and because a pending
 * `ACCESS EXCLUSIVE` request blocks every lock request behind it, new reads of
 * that hot table head-of-line-block too. A short `lock_timeout` turns that
 * silent, open-ended read outage into a fast, visible migration failure.
 *
 * A non-positive `lockTimeoutMs` disables the option (Postgres default: wait
 * forever).
 */
export declare const buildMigrationPoolConfig: (databaseUrl: string, lockTimeoutMs?: number) => PoolConfig;
export interface RunMigrationsOptions {
    /** Postgres connection string. Defaults to `process.env.DATABASE_URL`. */
    databaseUrl?: string;
    /**
     * Postgres `lock_timeout` in milliseconds for the migration connection, so a
     * migration waiting on a lock fails fast instead of queuing a lock request
     * that blocks reads on the table. Defaults to {@link DEFAULT_LOCK_TIMEOUT_MS};
     * pass `0` to disable (wait forever).
     */
    lockTimeoutMs?: number;
    /**
     * Folder holding the generated drizzle migrations and `meta/_journal.json`,
     * resolved from the current working directory. Defaults to
     * `"src/generated/drizzle"` (the Omni convention).
     */
    migrationsFolder?: string;
    /** Column casing passed to drizzle. Defaults to `"snake_case"`. */
    casing?: "snake_case" | "camelCase";
    /**
     * Hook run once after migrations succeed, receiving the live pool. Use it for
     * post-migration DDL drizzle-kit cannot emit (e.g. `FORCE ROW LEVEL SECURITY`).
     */
    afterMigrate?: (pool: Pool) => Promise<void> | void;
    /** Status-line sink. Defaults to `console.info`. */
    log?: (message: string) => void;
}
/**
 * Apply drizzle migrations, self-healing migration-tracker drift.
 *
 * Throws on unrecoverable failure (callers decide the exit behavior). Note: a
 * migration with a statement that cannot run inside a transaction (e.g.
 * `CREATE INDEX CONCURRENTLY`) is not reconcilable by the probe and surfaces its
 * error rather than self-healing.
 */
export declare const runMigrations: (options?: RunMigrationsOptions) => Promise<void>;
