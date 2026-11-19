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
var readJournalMigrations = (migrationsFolder) => {
  const journal = JSON.parse(readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf-8"));
  return journal.entries.map((entry) => {
    const sql = readFileSync(join(migrationsFolder, `${entry.tag}.sql`), "utf-8");
    return {
      ...entry,
      hash: createHash("sha256").update(sql).digest("hex"),
      statements: sql.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean)
    };
  });
};
var isMigrationTracked = (migration, trackedKeys) => trackedKeys.has(migration.hash) || migration.tag !== undefined && trackedKeys.has(migration.tag);
var findShadowedMigrations = (migrations, trackedKeys, highWaterMark) => {
  if (highWaterMark === undefined || !Number.isFinite(highWaterMark)) {
    return [];
  }
  let lastTracked = -1;
  migrations.forEach((migration, index) => {
    if (isMigrationTracked(migration, trackedKeys))
      lastTracked = index;
  });
  return migrations.slice(lastTracked + 1).filter((migration) => migration.when <= highWaterMark);
};
var SHADOWED_MIGRATION_LOCK_KEY = 7204311906;
var applyShadowedMigrations = async (pool, migrationsFolder, log) => {
  const { rows: trackerExists } = await pool.query(`SELECT to_regclass('"drizzle"."__drizzle_migrations"') IS NOT NULL AS exists`);
  if (!trackerExists[0]?.exists)
    return 0;
  const loadTracker = async (client) => {
    const { rows } = await client.query('SELECT hash, created_at FROM "drizzle"."__drizzle_migrations"');
    const { rows: newest } = await client.query('SELECT created_at FROM "drizzle"."__drizzle_migrations" ORDER BY created_at DESC LIMIT 1');
    const newestRow = newest[0];
    return {
      hashes: new Set(rows.map((row) => row.hash)),
      highWaterMark: newestRow ? Number(newestRow.created_at) : undefined
    };
  };
  const initial = await loadTracker(pool);
  const migrations = readJournalMigrations(migrationsFolder);
  const shadowed = findShadowedMigrations(migrations, initial.hashes, initial.highWaterMark);
  if (shadowed.length === 0)
    return 0;
  log(`[Migrate] ${shadowed.length} migration(s) predate the tracker's newest entry and would be skipped; applying them`);
  let applied = 0;
  for (const migration of shadowed) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [
        SHADOWED_MIGRATION_LOCK_KEY
      ]);
      const current = await loadTracker(client);
      if (isMigrationTracked(migration, current.hashes)) {
        await client.query("ROLLBACK");
        continue;
      }
      await client.query("SAVEPOINT shadowed_migration");
      let alreadyApplied = false;
      try {
        for (const statement of migration.statements) {
          await client.query(statement);
        }
      } catch (error) {
        if (!isAlreadyExists(error))
          throw error;
        await client.query("ROLLBACK TO SAVEPOINT shadowed_migration");
        alreadyApplied = true;
      }
      await client.query('INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)', [migration.hash, migration.when]);
      await client.query("COMMIT");
      log(alreadyApplied ? `[Migrate] Reconciled already-applied migration ${migration.tag} into the tracker` : `[Migrate] Applied skipped migration ${migration.tag}`);
      applied++;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  return applied;
};
var reconcileTracker = async (pool, migrationsFolder, log) => {
  const migrations = readJournalMigrations(migrationsFolder);
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
  for (const entry of migrations) {
    const { hash, statements } = entry;
    if (isMigrationTracked(entry, trackedHashes))
      continue;
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
    await applyShadowedMigrations(pool, migrationsFolder, log);
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
  findShadowedMigrations,
  isMigrationTracked,
  runMigrations
};
