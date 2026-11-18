---
"@omnidotdev/providers": patch
---

fix(auth): forward the rotated session cookie with `appendResponseHeader`

`getAuth` forwarded Better Auth's rotated account cookie with `getResponseHeaders().append`, but current TanStack Start returns a read-only snapshot from `getResponseHeaders()`, so the cookie never reached the response and the browser kept replaying the old refresh token. It now uses `appendResponseHeader`, falling back to the live headers only on older hosts without it. Apps that wired `forwardSetCookie: (raw) => getResponseHeaders().append(...)` themselves have the same bug: drop the override and let the default forward it.
