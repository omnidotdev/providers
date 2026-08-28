---
"@omnidotdev/providers": patch
---

fix(auth): forward the rotated refresh-token cookie automatically in getAuth

`getAuth` now forwards Better Auth's rotated (chunked) account cookie by default
via TanStack Start's `getResponseHeaders().append`, instead of requiring every
app to wire the `forwardSetCookie` hook. When the hook was omitted the browser
kept replaying the pre-rotation refresh token; past the issuer's theft-detection
grace window that tore down the token family, so token-derived data (e.g.
`organizations`) came back empty until a full re-login. This is the exact
"logged in long enough and the dashboard goes empty" bug, and it was silently
present in every app that forgot the hook.

`forwardSetCookie` is retained as an optional override (non-TanStack hosts,
custom behavior); when supplied it wins, so apps that already wire it are
unaffected and there is no double-forward. The TanStack import is a lazy,
optional runtime peer: a consumer without it that supplies no override keeps the
prior no-op rather than crashing.
