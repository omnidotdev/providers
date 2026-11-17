---
"@omnidotdev/providers": patch
---

fix(db): apply migrations skipped behind a later-stamped tracker row

`runMigrations` now applies journal migrations that drizzle's migrator would
skip forever. drizzle only runs entries newer than the tracker's newest
`created_at`, so a tracker row stamped later than pending migrations (for
example a ledger rebaseline that recorded `now()`) left them unapplied on every
boot with no error. Such "shadowed" migrations are now applied before `migrate`
runs, each in its own transaction with its tracker row stamped from the journal,
under an advisory lock so replicas booting together do not double-apply. A
shadowed migration whose objects already exist is recorded as applied, matching
the existing reconcile path. `findShadowedMigrations` is exported for callers
that want to detect the drift without applying anything.
