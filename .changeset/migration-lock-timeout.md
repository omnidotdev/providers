---
"@omnidotdev/providers": minor
---

`runMigrations` now sets a Postgres `lock_timeout` (default 10s) on the migration connection, so a migration that must wait for a lock fails fast instead of queuing a lock request that head-of-line-blocks reads on the table. This guards against the failure mode where an `ALTER TABLE` queues its `ACCESS EXCLUSIVE` lock behind a long-running transaction (e.g. an abandoned `pg_dump` holding `ACCESS SHARE`) and silently blocks every read of that hot table until the holder clears. Configurable via the new `lockTimeoutMs` option (`0` disables it); the pure `buildMigrationPoolConfig` helper and `DEFAULT_LOCK_TIMEOUT_MS` are exported from `@omnidotdev/providers/db`.
