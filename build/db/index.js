var __require = typeof require !== "undefined" ? require : (await import("node:module")).createRequire(import.meta.url);
// src/db/index.ts
var { createHash } = __require("node:crypto");
var { readFileSync } = __require("node:fs");
var { join } = __require("node:path");
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
var DEFAULT_LOCK_TIMEOUT_MS = 1e4;
var buildMigrationPoolConfig = (databaseUrl, lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS) => {
  const config = { connectionString: databaseUrl };
  if (lockTimeoutMs > 0)
    config.options = `-c lock_timeout=${lockTimeoutMs}`;
  return config;
};
var ALREADY_EXISTS = new Set([
  "42710",
  "42P07",
  "42P06",
  "42701",
  "42P04",
  "42723"
]);
var isAlreadyExists = (err) => {
  let current = err;
  while (current && typeof current === "object") {
    const code = current.code;
    if (typeof code === "string" && ALREADY_EXISTS.has(code))
      return true;
    current = current.cause;
  }
  return false;
};
var reconcileTracker = async (pool, migrationsFolder, log) => {
  const journal = JSON.parse(readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf-8"));
  await pool.query('CREATE SCHEMA IF NOT EXISTS "drizzle"');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL,
      created_at BIGINT
    )
  `);
  const { rows } = await pool.query('SELECT hash FROM "drizzle"."__drizzle_migrations"');
  const trackedHashes = new Set(rows.map((r) => r.hash));
  let backfilled = 0;
  for (const entry of journal.entries) {
    const sql = readFileSync(join(migrationsFolder, `${entry.tag}.sql`), "utf-8");
    const hash = createHash("sha256").update(sql).digest("hex");
    if (trackedHashes.has(hash))
      continue;
    const statements = sql.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
    const client = await pool.connect();
    let alreadyApplied = false;
    try {
      await client.query("BEGIN");
      for (const statement of statements)
        await client.query(statement);
      await client.query("ROLLBACK");
      break;
    } catch (probeError) {
      await client.query("ROLLBACK").catch(() => {});
      if (!isAlreadyExists(probeError))
        throw probeError;
      alreadyApplied = true;
    } finally {
      client.release();
    }
    if (alreadyApplied) {
      await pool.query('INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)', [hash, entry.when]);
      log(`[Migrate] Reconciled already-applied migration ${entry.tag} into the tracker`);
      backfilled++;
    }
  }
  return backfilled;
};
var runMigrations = async (options = {}) => {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  const migrationsFolder = options.migrationsFolder ?? "src/generated/drizzle";
  const casing = options.casing ?? "snake_case";
  const log = options.log ?? ((message) => console.info(message));
  if (!databaseUrl) {
    throw new Error("runMigrations: DATABASE_URL is not set");
  }
  const pool = new Pool(buildMigrationPoolConfig(databaseUrl, options.lockTimeoutMs));
  try {
    const db = drizzle({ client: pool, casing });
    log("[Migrate] Applying migrations...");
    try {
      await migrate(db, { migrationsFolder });
    } catch (error) {
      if (!isAlreadyExists(error))
        throw error;
      log("[Migrate] Migration re-applied over existing objects; reconciling tracker");
      const backfilled = await reconcileTracker(pool, migrationsFolder, log);
      if (backfilled === 0)
        throw error;
      await migrate(db, { migrationsFolder });
    }
    log("[Migrate] Migrations applied successfully");
    if (options.afterMigrate)
      await options.afterMigrate(pool);
  } finally {
    await pool.end();
  }
};
export {
  DEFAULT_LOCK_TIMEOUT_MS,
  buildMigrationPoolConfig,
  runMigrations
};
