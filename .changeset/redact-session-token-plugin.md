---
"@omnidotdev/providers": minor
---

Add `redactSessionToken()` (from `@omnidotdev/providers/auth`), a Better Auth plugin that drops the session token from `/get-session` responses so page scripts can never read it. `better-auth` is now an optional peer of the auth entry
