---
"@omnidotdev/providers": minor
---

The Prism analytics client accepts an optional `sanitizePath(pathname)` hook that rewrites the path before it is sent (e.g. `/c/abc123` to `/c/:id`) so ids and capability tokens in URLs never reach analytics storage; returning null drops the event.
