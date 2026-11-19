---
"@omnidotdev/providers": patch
---

`runMigrations` no longer re-runs migrations recorded by a legacy tracker. Some services' `drizzle.__drizzle_migrations` tables hold the migration tag (`0000_boring_rocket_racer`) in the `hash` column instead of the file's sha256. drizzle's own migrator never reads that column, so those services booted fine, but `runMigrations` matched on sha256 only, treated every such migration as untracked and shadowed, and re-ran it on boot (re-running `ENABLE ROW LEVEL SECURITY` over live tables hit the lock timeout and crash-looped the service). A tracker row holding either the sha256 or the tag now counts as tracked, in the shadowed-migration and reconcile paths alike. `isMigrationTracked` is exported for services that check their own tracker.
