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
export interface RunMigrationsOptions {
    /** Postgres connection string. Defaults to `process.env.DATABASE_URL`. */
    databaseUrl?: string;
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
