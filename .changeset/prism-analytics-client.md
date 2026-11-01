---
"@omnidotdev/providers": minor
---

Add `@omnidotdev/providers/analytics`: a small, dependency-free Prism
event-tracking client plus a React pageview hook. `createPrismClient({
collectorUrl, product })` enqueues events in memory and flushes them in batches
to the Prism collector (`POST {collectorUrl}/collect`), using
`navigator.sendBeacon` on page teardown and a keepalive fetch otherwise. It is a
graceful no-op when `collectorUrl` is unset and SSR-safe (no-op outside a
browser), and never sends an ip, cookie, or visitor identifier (the collector
derives those server-side). `usePageview(client, pathname)` tracks a pageview on
mount and on pathname change without coupling to any router.
