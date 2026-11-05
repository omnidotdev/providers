---
"@omnidotdev/providers": minor
---

feat(db): shared resilient migration runner

Add a `@omnidotdev/providers/db` module exporting `runMigrations`: a drop-in
replacement for the per-service drizzle migrate-on-boot script that self-heals
migration-tracker drift. On an "already exists" error (a migration re-applied
because `drizzle.__drizzle_migrations` fell behind the database, e.g. after a
regen/squash, partial run, or restore) it reconciles the tracker to reality -
probing each untracked migration in a rolled-back, side-effect-free transaction
and recording the ones already applied - then retries once. A genuinely pending
migration still applies; a real error still surfaces.

This replaces a migrate script that every Elysia API service copied, where a
plain `migrate()` hard-failed on re-apply and bricked boot (it took a service's
deploys down for days). `drizzle-orm` and `pg` are optional peer dependencies,
so non-database consumers are unaffected. An optional `afterMigrate` hook covers
post-migration DDL drizzle-kit cannot emit (e.g. `FORCE ROW LEVEL SECURITY`).
