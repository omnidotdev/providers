---
"@omnidotdev/providers": patch
---

fix(events): paginate `listSubscriptions` so it returns every subscription

The HTTP events provider's `listSubscriptions` fetched only the first page of the
`/api/v1/subscriptions` endpoint (default page size 20), so in an org with more
than 20 subscriptions it silently omitted the rest. Existence checks against the
result (e.g. boot-time self-registration) then failed to find an existing
subscription and tried to recreate it. It now pages through all results.
