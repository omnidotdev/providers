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

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

import type { PoolConfig } from "pg";

/**
 * Default `lock_timeout` (milliseconds) applied to migration connections. A
 * migration that cannot acquire a lock within this window fails fast instead of
 * queuing a lock request that blocks other sessions on the same table.
 */
export const DEFAULT_LOCK_TIMEOUT_MS = 10_000;

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
export const buildMigrationPoolConfig = (
  databaseUrl: string,
  lockTimeoutMs: number = DEFAULT_LOCK_TIMEOUT_MS,
): PoolConfig => {
  const config: PoolConfig = { connectionString: databaseUrl };
  if (lockTimeoutMs > 0) config.options = `-c lock_timeout=${lockTimeoutMs}`;
  return config;
};

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

interface JournalEntry {
  idx: number;
  tag: string;
  when: number;
}

/** Postgres SQLSTATEs that mean "this object already exists" (duplicate_*). */
const ALREADY_EXISTS = new Set([
  "42710", // duplicate_object (policy, trigger, ...)
  "42P07", // duplicate_table
  "42P06", // duplicate_schema
  "42701", // duplicate_column
  "42P04", // duplicate_database
  "42723", // duplicate_function
]);

/**
 * True when an error (or anything in its `cause` chain) is a Postgres
 * "already exists" error, i.e. a migration re-applied over existing objects.
 */
const isAlreadyExists = (err: unknown): boolean => {
  let current: unknown = err;
  while (current && typeof current === "object") {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && ALREADY_EXISTS.has(code)) return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
};

/**
 * Reconcile the migration tracker with the database after a re-apply error.
 * Returns the number of migrations backfilled (retry the migrate if > 0).
 */
const reconcileTracker = async (
  pool: Pool,
  migrationsFolder: string,
  log: (message: string) => void,
): Promise<number> => {
  const journal = JSON.parse(
    readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf-8"),
  ) as { entries: JournalEntry[] };

  await pool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `);

  const { rows } = await pool.query<{ hash: string }>(
    'SELECT hash FROM "drizzle"."__drizzle_migrations"',
  );
  const trackedHashes = new Set(rows.map((r) => r.hash));

  let backfilled = 0;

  for (const entry of journal.entries) {
    const sql = readFileSync(
      join(migrationsFolder, `${entry.tag}.sql`),
      "utf-8",
    );
    // drizzle-orm records the sha256 of a migration file's contents as `hash`.
    const hash = createHash("sha256").update(sql).digest("hex");
    if (trackedHashes.has(hash)) continue;

    const statements = sql
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim())
      .filter(Boolean);

    const client = await pool.connect();
    let alreadyApplied = false;
    try {
      await client.query("BEGIN");
      for (const statement of statements) await client.query(statement);
      // Applied cleanly in the probe => genuinely pending; leave for migrate().
      await client.query("ROLLBACK");
      break;
    } catch (probeError) {
      await client.query("ROLLBACK").catch(() => {});
      if (!isAlreadyExists(probeError)) throw probeError;
      alreadyApplied = true;
    } finally {
      client.release();
    }

    if (alreadyApplied) {
      await pool.query(
        'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [hash, entry.when],
      );
      log(
        `[Migrate] Reconciled already-applied migration ${entry.tag} into the tracker`,
      );
      backfilled++;
    }
  }

  return backfilled;
};

/**
 * Apply drizzle migrations, self-healing migration-tracker drift.
 *
 * Throws on unrecoverable failure (callers decide the exit behavior). Note: a
 * migration with a statement that cannot run inside a transaction (e.g.
 * `CREATE INDEX CONCURRENTLY`) is not reconcilable by the probe and surfaces its
 * error rather than self-healing.
 */
export const runMigrations = async (
  options: RunMigrationsOptions = {},
): Promise<void> => {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  const migrationsFolder = options.migrationsFolder ?? "src/generated/drizzle";
  const casing = options.casing ?? "snake_case";
  const log = options.log ?? ((message: string) => console.info(message));

  if (!databaseUrl) {
    throw new Error("runMigrations: DATABASE_URL is not set");
  }

  const pool = new Pool(
    buildMigrationPoolConfig(databaseUrl, options.lockTimeoutMs),
  );

  try {
    const db = drizzle({ client: pool, casing });

    log("[Migrate] Applying migrations...");
    try {
      await migrate(db, { migrationsFolder });
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      log(
        "[Migrate] Migration re-applied over existing objects; reconciling tracker",
      );
      const backfilled = await reconcileTracker(pool, migrationsFolder, log);
      if (backfilled === 0) throw error;
      await migrate(db, { migrationsFolder });
    }
    log("[Migrate] Migrations applied successfully");

    if (options.afterMigrate) await options.afterMigrate(pool);
  } finally {
    await pool.end();
  }
};
