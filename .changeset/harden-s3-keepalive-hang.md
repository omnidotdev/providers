---
"@omnidotdev/providers": patch
---

fix(storage): harden the S3 storage provider against stale keep-alive socket hangs

`S3StorageProvider` built its client with the default `@aws-sdk/client-s3` request handler, which pools keep-alive sockets and sets no aborting request timeout. Against an S3 store reached over a NAT/edge that silently idle-drops connections (Garage at `s3.omni.dev`), the pool fills with zombie sockets and every reuse hangs ~30s until the upstream gives up. This is the failure that took down halo-api media serving on 2026-09-01.

The client is now built through `createResilientS3Client` (also exported for direct use): `keepAlive: false` so a socket is never reused, plus `throwOnRequestTimeout: true` with a `requestTimeout` (a plain `requestTimeout` on `@smithy/node-http-handler` v4 only warns and keeps hanging on Bun) and a `connectionTimeout`. Consumers pick up the fix on their next dependency bump.
